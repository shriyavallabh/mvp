/**
 * WhatsApp Service
 * Centralized service for WhatsApp Business API operations
 * Uses environment variables for configuration
 */

const axios = require('axios');
const { whatsAppConfig, validateConfig } = require('../../config/env.config');
const { retryWithBackoff, createResilientClient } = require('../../utils/resilience');
const { validatePhoneNumber, validateWhatsAppMessage, validateTemplateParameters } = require('../../utils/validation');
const { Logger } = require('../../utils/logger');

// Validate WhatsApp configuration on module load
try {
    validateConfig({ whatsapp: true });
} catch (error) {
    console.error('WhatsApp configuration is incomplete. Please check your .env file.');
    process.exit(1);
}

// Create logger for this service
const logger = new Logger({ name: 'WhatsAppService' });

// Create resilient API client
const resilientClient = createResilientClient({
    retry: {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: ({ attempt, maxRetries, delay, error }) => {
            logger.warn(`WhatsApp API retry attempt ${attempt}/${maxRetries}`, {
                delay,
                error: error.message
            });
        },
        shouldRetry: (error) => {
            // Retry on network errors and 5xx status codes
            const status = error.response?.status;
            return !status || status >= 500 || status === 429;
        }
    },
    circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 60000,
        onStateChange: ({ from, to, failures }) => {
            logger.warn(`Circuit breaker state changed: ${from} -> ${to}`, { failures });
        }
    },
    rateLimiter: {
        capacity: 50,      // 50 requests
        refillRate: 1,     // 1 token per interval
        interval: 1200     // 1.2 seconds (50 requests per minute)
    }
});

class WhatsAppService {
    constructor() {
        this.phoneNumberId = whatsAppConfig.phoneNumberId;
        this.accessToken = whatsAppConfig.accessToken;
        this.apiVersion = whatsAppConfig.apiVersion;
        this.baseUrl = whatsAppConfig.baseUrl;
    }
    
    /**
     * Send a WhatsApp message
     * @param {string} to - Recipient phone number
     * @param {Object} message - Message object
     * @returns {Promise<Object>} API response
     */
    async sendMessage(to, message) {
        const timer = logger.startTimer('WhatsApp message send');
        
        try {
            // Validate phone number
            const phoneValidation = validatePhoneNumber(to);
            if (!phoneValidation.isValid) {
                throw new Error(`Invalid phone number: ${phoneValidation.error}`);
            }
            
            // Validate message
            const messageValidation = validateWhatsAppMessage(message);
            if (!messageValidation.isValid) {
                throw new Error(`Invalid message: ${messageValidation.errors.join(', ')}`);
            }
            
            // Prepare request
            const url = whatsAppConfig.getApiUrl(`${this.phoneNumberId}/messages`);
            const headers = whatsAppConfig.getAuthHeaders();
            const body = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneValidation.normalized,
                ...message
            };
            
            logger.debug('Sending WhatsApp message', {
                to: phoneValidation.normalized,
                type: message.type,
                template: message.template?.name
            });
            
            // Send with resilient client
            const response = await resilientClient(
                () => axios.post(url, body, { headers }),
                { maxRetries: 3 }
            );
            
            const messageId = response.data.messages?.[0]?.id;
            
            logger.info('WhatsApp message sent successfully', {
                to: phoneValidation.normalized,
                messageId,
                type: message.type
            });
            
            timer({ messageId });
            
            return {
                success: true,
                messageId,
                to: phoneValidation.normalized,
                response: response.data
            };
            
        } catch (error) {
            logger.error('Failed to send WhatsApp message', {
                to,
                error: error.response?.data || error.message,
                status: error.response?.status
            });
            
            timer({ error: true });
            
            throw {
                message: error.message,
                status: error.response?.status,
                details: error.response?.data?.error
            };
        }
    }
    
    /**
     * Send a template message
     * @param {string} to - Recipient phone number
     * @param {string} templateName - Template name
     * @param {Array} parameters - Template parameters
     * @param {string} languageCode - Language code (default: 'en')
     * @returns {Promise<Object>} API response
     */
    async sendTemplate(to, templateName, parameters = [], languageCode = 'en') {
        // Build template message
        const message = {
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                }
            }
        };
        
        // Add parameters if provided
        if (parameters.length > 0) {
            message.template.components = [{
                type: 'body',
                parameters: parameters.map(param => ({
                    type: 'text',
                    text: String(param)
                }))
            }];
        }
        
        return this.sendMessage(to, message);
    }
    
    /**
     * Send an image message
     * @param {string} to - Recipient phone number
     * @param {string} imageUrl - Image URL or media ID
     * @param {string} caption - Optional caption
     * @returns {Promise<Object>} API response
     */
    async sendImage(to, imageUrl, caption = null) {
        const message = {
            type: 'image',
            image: {
                link: imageUrl
            }
        };
        
        if (caption) {
            message.image.caption = caption;
        }
        
        return this.sendMessage(to, message);
    }
    
    /**
     * Send a text message
     * @param {string} to - Recipient phone number
     * @param {string} text - Message text
     * @returns {Promise<Object>} API response
     */
    async sendText(to, text) {
        const message = {
            type: 'text',
            text: {
                body: text
            }
        };
        
        return this.sendMessage(to, message);
    }
    
    /**
     * Upload media to WhatsApp
     * @param {Buffer|Stream} media - Media data
     * @param {string} mimeType - MIME type
     * @returns {Promise<string>} Media ID
     */
    async uploadMedia(media, mimeType) {
        const timer = logger.startTimer('Media upload');
        
        try {
            const url = whatsAppConfig.getApiUrl(`${this.phoneNumberId}/media`);
            const headers = {
                ...whatsAppConfig.getAuthHeaders(),
                'Content-Type': mimeType
            };
            
            const response = await resilientClient(
                () => axios.post(url, media, { headers }),
                { maxRetries: 2 }
            );
            
            const mediaId = response.data.id;
            
            logger.info('Media uploaded successfully', { mediaId, mimeType });
            timer({ mediaId });
            
            return mediaId;
            
        } catch (error) {
            logger.error('Failed to upload media', error);
            timer({ error: true });
            throw error;
        }
    }
    
    /**
     * Get media URL from media ID
     * @param {string} mediaId - Media ID
     * @returns {Promise<string>} Media URL
     */
    async getMediaUrl(mediaId) {
        try {
            const url = whatsAppConfig.getApiUrl(mediaId);
            const headers = whatsAppConfig.getAuthHeaders();
            
            const response = await axios.get(url, { headers });
            
            return response.data.url;
            
        } catch (error) {
            logger.error('Failed to get media URL', { mediaId, error });
            throw error;
        }
    }
    
    /**
     * Mark message as read
     * @param {string} messageId - Message ID
     * @returns {Promise<Object>} API response
     */
    async markAsRead(messageId) {
        try {
            const url = whatsAppConfig.getApiUrl(`${this.phoneNumberId}/messages`);
            const headers = whatsAppConfig.getAuthHeaders();
            const body = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };
            
            const response = await axios.post(url, body, { headers });
            
            logger.debug('Message marked as read', { messageId });
            
            return response.data;
            
        } catch (error) {
            logger.error('Failed to mark message as read', { messageId, error });
            throw error;
        }
    }
    
    /**
     * Send message to multiple recipients
     * @param {Array<string>} recipients - Array of phone numbers
     * @param {Object} message - Message object
     * @param {Object} options - Send options
     * @returns {Promise<Array>} Results for each recipient
     */
    async sendBulkMessages(recipients, message, options = {}) {
        const { 
            delayBetween = 2000,  // 2 seconds between messages
            continueOnError = true 
        } = options;
        
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendMessage(recipient, message);
                results.push({
                    recipient,
                    success: true,
                    ...result
                });
                
                // Delay between messages to avoid rate limiting
                if (delayBetween > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayBetween));
                }
                
            } catch (error) {
                logger.error(`Failed to send to ${recipient}`, error);
                
                results.push({
                    recipient,
                    success: false,
                    error: error.message
                });
                
                if (!continueOnError) {
                    throw error;
                }
            }
        }
        
        // Log summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        logger.info('Bulk message send completed', {
            total: recipients.length,
            successful,
            failed
        });
        
        return results;
    }
    
    /**
     * Verify webhook signature
     * @param {string} signature - Signature from webhook header
     * @param {string} body - Request body
     * @returns {boolean} True if valid
     */
    verifyWebhookSignature(signature, body) {
        // Implementation depends on Meta's webhook signature method
        // This is a placeholder for the actual verification logic
        return true;
    }
    
    /**
     * Process webhook notification
     * @param {Object} notification - Webhook notification
     * @returns {Object} Processed notification
     */
    processWebhookNotification(notification) {
        logger.debug('Processing webhook notification', {
            object: notification.object,
            entryCount: notification.entry?.length
        });
        
        if (notification.object !== 'whatsapp_business_account') {
            logger.warn('Unknown webhook object type', { object: notification.object });
            return null;
        }
        
        const processed = [];
        
        for (const entry of notification.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field === 'messages') {
                    const value = change.value;
                    
                    // Process messages
                    for (const message of value.messages || []) {
                        processed.push({
                            type: 'message',
                            from: message.from,
                            messageId: message.id,
                            timestamp: message.timestamp,
                            messageType: message.type,
                            text: message.text?.body,
                            media: message.image || message.document || message.video
                        });
                    }
                    
                    // Process statuses
                    for (const status of value.statuses || []) {
                        processed.push({
                            type: 'status',
                            messageId: status.id,
                            recipientId: status.recipient_id,
                            status: status.status,
                            timestamp: status.timestamp,
                            errors: status.errors
                        });
                    }
                }
            }
        }
        
        logger.info('Webhook notification processed', {
            eventCount: processed.length
        });
        
        return processed;
    }
}

// Create singleton instance
const whatsAppService = new WhatsAppService();

module.exports = {
    whatsAppService,
    WhatsAppService
};