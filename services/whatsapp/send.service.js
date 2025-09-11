/**
 * WhatsApp Sending Service
 * Handles sending media templates and text fallbacks
 */

const axios = require('axios');
const config = require('../../config/whatsapp.config');
const logger = require('../logger');
const db = require('../database');

class SendService {
    constructor() {
        this.phoneNumberId = config.waba.phoneNumberId;
        this.accessToken = config.waba.accessToken;
        this.baseUrl = config.api.baseUrl;
    }

    /**
     * Send a media template with IMAGE header
     */
    async sendMediaTemplate({ to, templateName, imageUrl, bodyParams = [], language = 'en' }) {
        try {
            const components = [
                {
                    type: 'header',
                    parameters: [{
                        type: 'image',
                        image: { link: imageUrl }
                    }]
                }
            ];

            // Add body parameters if template has body with variables
            if (bodyParams.length > 0) {
                components.push({
                    type: 'body',
                    parameters: bodyParams.map(text => ({
                        type: 'text',
                        text: String(text)
                    }))
                });
            }

            const payload = {
                messaging_product: 'whatsapp',
                to: this.normalizePhoneNumber(to),
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    components
                }
            };

            const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
            
            logger.debug('Sending media template:', JSON.stringify(payload, null, 2));
            
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const wamid = response.data.messages?.[0]?.id;
            
            logger.info(`Media template sent to ${to}: ${wamid}`);
            
            // Record the send
            await this.recordSend({
                to,
                wamid,
                channel: 'media_template',
                templateName,
                status: 'accepted'
            });

            return { success: true, wamid, channel: 'media_template' };
        } catch (error) {
            logger.error(`Failed to send media template to ${to}:`, error.response?.data || error.message);
            
            // Record the failure
            await this.recordSend({
                to,
                channel: 'media_template',
                templateName,
                status: 'failed',
                error: error.response?.data?.error || error.message
            });

            return { 
                success: false, 
                error: error.response?.data?.error || error.message,
                channel: 'media_template'
            };
        }
    }

    /**
     * Send a text template with URL for OG preview
     */
    async sendTextTemplateWithLink({ to, templateName, linkUrl, bodyParams = [], language = 'en' }) {
        try {
            // Include link URL as first parameter if not already included
            const params = linkUrl ? [linkUrl, ...bodyParams] : bodyParams;

            const payload = {
                messaging_product: 'whatsapp',
                to: this.normalizePhoneNumber(to),
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: language },
                    components: params.length > 0 ? [{
                        type: 'body',
                        parameters: params.map(text => ({
                            type: 'text',
                            text: String(text)
                        }))
                    }] : []
                }
            };

            const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
            
            logger.debug('Sending text template with link:', JSON.stringify(payload, null, 2));
            
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const wamid = response.data.messages?.[0]?.id;
            
            logger.info(`Text template sent to ${to}: ${wamid}`);
            
            // Record the send
            await this.recordSend({
                to,
                wamid,
                channel: 'text_template',
                templateName,
                status: 'accepted'
            });

            return { success: true, wamid, channel: 'text_template' };
        } catch (error) {
            logger.error(`Failed to send text template to ${to}:`, error.response?.data || error.message);
            
            // Record the failure
            await this.recordSend({
                to,
                channel: 'text_template',
                templateName,
                status: 'failed',
                error: error.response?.data?.error || error.message
            });

            return { 
                success: false, 
                error: error.response?.data?.error || error.message,
                channel: 'text_template'
            };
        }
    }

    /**
     * Send with automatic fallback
     */
    async sendWithFallback({ to, imageUrl, bodyParams, ogPageUrl }) {
        const contact = await db.getContact(to);
        
        // Check if contact is in cool-off period
        if (contact?.cooloff_until && new Date(contact.cooloff_until) > new Date()) {
            logger.info(`Contact ${to} is in cool-off until ${contact.cooloff_until}`);
            return { success: false, reason: 'cooloff', channel: 'none' };
        }

        // Try media template first
        const mediaResult = await this.sendMediaTemplate({
            to,
            templateName: config.templates.media.dailyUpdate,
            imageUrl,
            bodyParams
        });

        if (mediaResult.success) {
            // Set up fallback timer
            if (config.features.enableFallback) {
                this.scheduleFallbackCheck(mediaResult.wamid, to, ogPageUrl, bodyParams);
            }
            return mediaResult;
        }

        // Immediate fallback to text template with OG link
        if (config.features.enableFallback) {
            logger.info(`Immediate fallback for ${to} due to media template failure`);
            
            const textResult = await this.sendTextTemplateWithLink({
                to,
                templateName: config.templates.text.fallback,
                linkUrl: ogPageUrl,
                bodyParams
            });

            return textResult;
        }

        return mediaResult;
    }

    /**
     * Schedule a fallback check based on webhook timeout
     */
    scheduleFallbackCheck(wamid, to, ogPageUrl, bodyParams) {
        setTimeout(async () => {
            const send = await db.getSendByWamid(wamid);
            
            // If not delivered within timeout, trigger fallback
            if (!send || send.status === 'accepted' || send.status === 'sent') {
                logger.info(`Triggering fallback for ${to} - no delivery confirmation for ${wamid}`);
                
                await this.sendTextTemplateWithLink({
                    to,
                    templateName: config.templates.text.fallback,
                    linkUrl: ogPageUrl,
                    bodyParams
                });

                // Mark original as timed out
                await db.updateSendStatus(wamid, 'timeout');
            }
        }, config.delivery.timeouts.fallbackTrigger);
    }

    /**
     * Normalize phone number to E.164 format without +
     */
    normalizePhoneNumber(phone) {
        // Remove all non-digits
        let cleaned = phone.replace(/\D/g, '');
        
        // Add country code if missing (assuming India for now)
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Record send attempt in database
     */
    async recordSend({ to, wamid, channel, templateName, status, error }) {
        try {
            await db.createSend({
                contact_id: to,
                wamid,
                channel,
                template_name: templateName,
                status,
                error_message: error,
                created_at: new Date()
            });
        } catch (dbError) {
            logger.error('Failed to record send:', dbError);
        }
    }

    /**
     * Send to cohort with rate limiting
     */
    async sendToCohort(contacts, campaignData) {
        const results = {
            sent: 0,
            failed: 0,
            cooledOff: 0,
            details: []
        };

        const { concurrentWorkers } = config.delivery.pacing;
        const batchSize = Math.ceil(contacts.length / concurrentWorkers);

        // Process in parallel batches
        const batches = [];
        for (let i = 0; i < contacts.length; i += batchSize) {
            batches.push(contacts.slice(i, i + batchSize));
        }

        await Promise.all(batches.map(async (batch) => {
            for (const contact of batch) {
                const result = await this.sendWithFallback({
                    to: contact.wa_id,
                    imageUrl: campaignData.imageUrl,
                    bodyParams: [contact.first_name, campaignData.summary],
                    ogPageUrl: `${config.cdn.ogPageUrl}/${campaignData.date}?u=${contact.id}`
                });

                if (result.success) {
                    results.sent++;
                } else if (result.reason === 'cooloff') {
                    results.cooledOff++;
                } else {
                    results.failed++;
                }

                results.details.push({
                    contact: contact.wa_id,
                    ...result
                });

                // Small delay between sends in same batch
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }));

        return results;
    }
}

module.exports = new SendService();