/**
 * WhatsApp Webhook Handler Service
 * Processes incoming webhook events and triggers fallback logic
 */

const crypto = require('crypto');
const config = require('../../config/whatsapp.config');
const logger = require('../logger');
const db = require('../database');
const sendService = require('./send.service');

class WebhookService {
    /**
     * Verify webhook signature from Meta
     */
    verifySignature(payload, signature) {
        if (!config.app.secret) {
            logger.warn('App secret not configured, skipping signature verification');
            return true;
        }

        const expectedSignature = crypto
            .createHmac('sha256', config.app.secret)
            .update(payload)
            .digest('hex');

        return `sha256=${expectedSignature}` === signature;
    }

    /**
     * Handle webhook verification (GET request)
     */
    handleVerification(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === config.webhook.verifyToken) {
            logger.info('Webhook verified successfully');
            res.status(200).send(challenge);
        } else {
            logger.error('Webhook verification failed');
            res.sendStatus(403);
        }
    }

    /**
     * Process webhook events (POST request)
     */
    async processWebhook(req, res) {
        // Verify signature
        const signature = req.headers['x-hub-signature-256'];
        const payload = JSON.stringify(req.body);

        if (!this.verifySignature(payload, signature)) {
            logger.error('Invalid webhook signature');
            return res.sendStatus(401);
        }

        // Acknowledge receipt immediately
        res.sendStatus(200);

        // Process events asynchronously
        try {
            const { entry } = req.body;
            
            for (const item of entry || []) {
                const { changes } = item;
                
                for (const change of changes || []) {
                    await this.processChange(change);
                }
            }
        } catch (error) {
            logger.error('Error processing webhook:', error);
        }
    }

    /**
     * Process individual webhook change event
     */
    async processChange(change) {
        const { field, value } = change;

        if (field === 'messages') {
            // Handle incoming messages (for opt-in/opt-out)
            await this.handleIncomingMessage(value);
        } else if (field === 'statuses') {
            // Handle message status updates
            await this.handleStatusUpdate(value);
        } else if (field === 'message_template_status_update') {
            // Handle template status changes
            await this.handleTemplateStatusUpdate(value);
        }
    }

    /**
     * Handle message status updates
     */
    async handleStatusUpdate(value) {
        const statuses = value.statuses || [];

        for (const status of statuses) {
            const {
                id: wamid,
                status: statusType,
                timestamp,
                recipient_id,
                errors
            } = status;

            logger.info(`Status update for ${wamid}: ${statusType}`);

            // Update send record
            await db.updateSendStatus(wamid, statusType, {
                updated_at: new Date(timestamp * 1000),
                error_code: errors?.[0]?.code,
                error_title: errors?.[0]?.title
            });

            // Handle failures
            if (statusType === 'failed' && config.features.enableFallback) {
                await this.triggerFallback(wamid, recipient_id, errors);
            }

            // Update contact based on status
            if (statusType === 'delivered') {
                await db.updateContact(recipient_id, {
                    last_delivered_at: new Date()
                });
            } else if (statusType === 'failed') {
                await this.handleDeliveryFailure(recipient_id, errors);
            }
        }
    }

    /**
     * Trigger fallback for failed media template
     */
    async triggerFallback(wamid, recipientId, errors) {
        try {
            // Check if this was a media template send
            const send = await db.getSendByWamid(wamid);
            
            if (!send || send.channel !== 'media_template') {
                return;
            }

            // Check if fallback already sent
            if (send.fallback_sent) {
                logger.info(`Fallback already sent for ${wamid}`);
                return;
            }

            // Get campaign data
            const campaign = await db.getCampaign(send.campaign_id);
            if (!campaign) {
                logger.error(`Campaign not found for send ${wamid}`);
                return;
            }

            // Get contact data
            const contact = await db.getContact(recipientId);
            if (!contact) {
                logger.error(`Contact not found: ${recipientId}`);
                return;
            }

            logger.info(`Triggering fallback for ${recipientId} due to media template failure`);

            // Send text template with OG link
            const fallbackResult = await sendService.sendTextTemplateWithLink({
                to: recipientId,
                templateName: config.templates.text.fallback,
                linkUrl: `${config.cdn.ogPageUrl}/${campaign.date}?u=${contact.id}`,
                bodyParams: [contact.first_name || 'Advisor']
            });

            // Mark fallback as sent
            await db.updateSend(wamid, { fallback_sent: true });

            logger.info(`Fallback ${fallbackResult.success ? 'sent' : 'failed'} for ${recipientId}`);
        } catch (error) {
            logger.error(`Error triggering fallback for ${wamid}:`, error);
        }
    }

    /**
     * Handle delivery failures and set cool-off periods
     */
    async handleDeliveryFailure(recipientId, errors) {
        const errorCode = errors?.[0]?.code;
        const errorTitle = errors?.[0]?.title;

        logger.warn(`Delivery failed for ${recipientId}: ${errorCode} - ${errorTitle}`);

        // Determine cool-off period based on error
        let coolOffHours = 0;

        if (errorCode === 131026 || errorTitle?.includes('recipient is not a valid WhatsApp user')) {
            // Not a WhatsApp user - long cool-off
            coolOffHours = 168; // 7 days
        } else if (errorCode === 131047 || errorTitle?.includes('Re-engagement')) {
            // Marketing message cap reached
            coolOffHours = config.delivery.coolOff.policyDrop;
        } else if (errorCode === 131031 || errorTitle?.includes('blocked')) {
            // User blocked business
            coolOffHours = 720; // 30 days
        } else if (errorCode === 131048 || errorTitle?.includes('spam rate limit')) {
            // Spam rate limit
            coolOffHours = config.delivery.coolOff.undeliverable;
        }

        if (coolOffHours > 0) {
            const cooloffUntil = new Date();
            cooloffUntil.setHours(cooloffUntil.getHours() + coolOffHours);

            await db.updateContact(recipientId, {
                last_failure_code: errorCode,
                last_failure_title: errorTitle,
                cooloff_until: cooloffUntil
            });

            logger.info(`Set cool-off for ${recipientId} until ${cooloffUntil}`);
        }
    }

    /**
     * Handle incoming messages (for opt-in/opt-out)
     */
    async handleIncomingMessage(value) {
        const messages = value.messages || [];

        for (const message of messages) {
            const { from, text } = message;
            
            if (!text?.body) continue;

            const messageText = text.body.toLowerCase().trim();

            // Handle opt-out keywords
            if (['stop', 'unsubscribe', 'unsub', 'optout'].includes(messageText)) {
                await db.updateContact(from, { opt_in: false });
                logger.info(`Contact ${from} opted out`);
                
                // Send confirmation
                await sendService.sendTextTemplateWithLink({
                    to: from,
                    templateName: config.templates.text.notification,
                    bodyParams: ['You have been unsubscribed from daily updates.']
                });
            }
            // Handle opt-in keywords
            else if (['start', 'subscribe', 'optin', 'yes'].includes(messageText)) {
                await db.updateContact(from, { opt_in: true });
                logger.info(`Contact ${from} opted in`);
                
                // Send confirmation
                await sendService.sendTextTemplateWithLink({
                    to: from,
                    templateName: config.templates.text.notification,
                    bodyParams: ['Welcome! You will receive daily financial updates.']
                });
            }
        }
    }

    /**
     * Handle template status updates
     */
    async handleTemplateStatusUpdate(value) {
        const { message_template_id, event, reason } = value;

        logger.info(`Template ${message_template_id} status: ${event}`);

        if (event === 'APPROVED') {
            logger.info(`Template ${message_template_id} approved!`);
        } else if (event === 'REJECTED') {
            logger.error(`Template ${message_template_id} rejected: ${reason}`);
        } else if (event === 'PAUSED') {
            logger.warn(`Template ${message_template_id} paused: ${reason}`);
        }
    }

    /**
     * Subscribe app to WABA webhooks (one-time setup)
     */
    async subscribeToWebhooks() {
        try {
            const url = `${config.api.baseUrl}/${config.waba.id}/subscribed_apps`;
            
            const response = await require('axios').post(url, {}, {
                headers: {
                    'Authorization': `Bearer ${config.waba.accessToken}`
                }
            });

            logger.info('Successfully subscribed to WABA webhooks:', response.data);
            return true;
        } catch (error) {
            logger.error('Failed to subscribe to webhooks:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new WebhookService();