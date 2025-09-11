/**
 * WhatsApp Service - Permanent Solution
 * Handles all WhatsApp message sending with multiple fallback methods
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppService {
    constructor() {
        this.config = {
            // Primary method: Direct WhatsApp Business API
            whatsapp: {
                baseUrl: 'https://graph.facebook.com/v17.0',
                phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '382785434604662',
                accessToken: process.env.WHATSAPP_BEARER_TOKEN || null
            },
            // Secondary method: Twilio (backup)
            twilio: {
                accountSid: process.env.TWILIO_ACCOUNT_SID || null,
                authToken: process.env.TWILIO_AUTH_TOKEN || null,
                fromNumber: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
            },
            // Tertiary method: Local webhook
            webhook: {
                url: 'http://localhost:5001/send',
                secret: process.env.WEBHOOK_SECRET || 'finadvise-secret-2024'
            },
            // Rate limiting
            rateLimit: {
                messagesPerMinute: 30,
                delayBetweenMessages: 2000 // 2 seconds
            }
        };
        
        this.messageQueue = [];
        this.processing = false;
        this.stats = {
            sent: 0,
            failed: 0,
            queued: 0
        };
        
        this.initializeService();
    }
    
    async initializeService() {
        // Check which services are available
        this.availableServices = {
            whatsapp: !!this.config.whatsapp.accessToken,
            twilio: !!(this.config.twilio.accountSid && this.config.twilio.authToken),
            webhook: true // Always available as fallback
        };
        
        console.log('WhatsApp Service initialized with available methods:', 
            Object.keys(this.availableServices).filter(k => this.availableServices[k]));
        
        // Start queue processor
        this.startQueueProcessor();
    }
    
    /**
     * Send WhatsApp message - main public method
     */
    async sendMessage(recipient, message, options = {}) {
        // Format phone number
        const formattedPhone = this.formatPhoneNumber(recipient);
        
        // Add to queue
        const messageData = {
            id: Date.now() + Math.random(),
            phone: formattedPhone,
            message: message,
            options: options,
            attempts: 0,
            maxAttempts: 3,
            status: 'queued',
            timestamp: new Date().toISOString()
        };
        
        this.messageQueue.push(messageData);
        this.stats.queued++;
        
        // Process queue if not already processing
        if (!this.processing) {
            this.processQueue();
        }
        
        return {
            success: true,
            messageId: messageData.id,
            status: 'queued',
            queuePosition: this.messageQueue.length
        };
    }
    
    /**
     * Process message queue
     */
    async processQueue() {
        if (this.processing || this.messageQueue.length === 0) {
            return;
        }
        
        this.processing = true;
        
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.stats.queued--;
            
            try {
                // Try sending with available methods
                const result = await this.attemptSend(message);
                
                if (result.success) {
                    message.status = 'sent';
                    message.sentAt = new Date().toISOString();
                    message.method = result.method;
                    this.stats.sent++;
                    
                    await this.logMessage(message, 'success');
                    console.log(`✅ Message sent to ${message.phone} via ${result.method}`);
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
                
            } catch (error) {
                message.attempts++;
                message.lastError = error.message;
                
                if (message.attempts < message.maxAttempts) {
                    // Retry with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, message.attempts), 30000);
                    console.log(`⚠️ Retrying message to ${message.phone} in ${delay}ms...`);
                    
                    setTimeout(() => {
                        this.messageQueue.push(message);
                        this.stats.queued++;
                        if (!this.processing) {
                            this.processQueue();
                        }
                    }, delay);
                } else {
                    // Max attempts reached
                    message.status = 'failed';
                    this.stats.failed++;
                    
                    await this.logMessage(message, 'failed');
                    console.error(`❌ Failed to send message to ${message.phone} after ${message.attempts} attempts`);
                }
            }
            
            // Rate limiting
            await this.delay(this.config.rateLimit.delayBetweenMessages);
        }
        
        this.processing = false;
    }
    
    /**
     * Attempt to send message with available methods
     */
    async attemptSend(message) {
        // Method 1: WhatsApp Business API (Meta)
        if (this.availableServices.whatsapp) {
            try {
                const result = await this.sendViaWhatsAppAPI(message);
                if (result.success) {
                    return { success: true, method: 'whatsapp_api', ...result };
                }
            } catch (error) {
                console.log(`WhatsApp API error: ${error.message}`);
            }
        }
        
        // Method 2: Twilio
        if (this.availableServices.twilio) {
            try {
                const result = await this.sendViaTwilio(message);
                if (result.success) {
                    return { success: true, method: 'twilio', ...result };
                }
            } catch (error) {
                console.log(`Twilio error: ${error.message}`);
            }
        }
        
        // Method 3: Local webhook
        try {
            const result = await this.sendViaWebhook(message);
            if (result.success) {
                return { success: true, method: 'webhook', ...result };
            }
        } catch (error) {
            console.log(`Webhook error: ${error.message}`);
        }
        
        // Method 4: Mock send (for testing)
        if (process.env.NODE_ENV === 'development' || process.env.WHATSAPP_TEST_MODE === 'true') {
            return await this.mockSend(message);
        }
        
        return { success: false, error: 'No available sending methods' };
    }
    
    /**
     * Send via WhatsApp Business API
     */
    async sendViaWhatsAppAPI(message) {
        const url = `${this.config.whatsapp.baseUrl}/${this.config.whatsapp.phoneNumberId}/messages`;
        
        const payload = {
            messaging_product: 'whatsapp',
            to: message.phone,
            type: 'text',
            text: {
                body: message.message
            }
        };
        
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${this.config.whatsapp.accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        return {
            success: true,
            messageId: response.data.messages[0].id,
            response: response.data
        };
    }
    
    /**
     * Send via Twilio
     */
    async sendViaTwilio(message) {
        const accountSid = this.config.twilio.accountSid;
        const authToken = this.config.twilio.authToken;
        
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const params = new URLSearchParams({
            From: this.config.twilio.fromNumber,
            To: `whatsapp:+${message.phone}`,
            Body: message.message
        });
        
        const response = await axios.post(url, params, {
            auth: {
                username: accountSid,
                password: authToken
            },
            timeout: 10000
        });
        
        return {
            success: true,
            messageId: response.data.sid,
            response: response.data
        };
    }
    
    /**
     * Send via local webhook
     */
    async sendViaWebhook(message) {
        const response = await axios.post(this.config.webhook.url, {
            phone: message.phone,
            message: message.message,
            ...message.options
        }, {
            headers: {
                'X-Webhook-Secret': this.config.webhook.secret,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        return {
            success: true,
            response: response.data
        };
    }
    
    /**
     * Mock send for testing
     */
    async mockSend(message) {
        console.log('📱 Mock WhatsApp Message:');
        console.log(`To: ${message.phone}`);
        console.log(`Message: ${message.message.substring(0, 100)}...`);
        
        return {
            success: true,
            method: 'mock',
            messageId: `mock_${Date.now()}`
        };
    }
    
    /**
     * Format phone number to international format
     */
    formatPhoneNumber(phone) {
        // Remove all non-digits
        let cleaned = phone.replace(/\D/g, '');
        
        // Add country code if missing
        if (cleaned.length === 10) {
            cleaned = '91' + cleaned; // Default to India
        }
        
        // Remove leading + if present
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }
        
        return cleaned;
    }
    
    /**
     * Log message for audit
     */
    async logMessage(message, status) {
        const logDir = path.join(process.cwd(), 'logs', 'whatsapp');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `messages-${new Date().toISOString().split('T')[0]}.json`);
        
        let logs = [];
        try {
            const existing = await fs.readFile(logFile, 'utf8');
            logs = JSON.parse(existing);
        } catch (e) {
            // File doesn't exist yet
        }
        
        logs.push({
            ...message,
            loggedAt: new Date().toISOString(),
            status: status
        });
        
        await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    }
    
    /**
     * Start queue processor
     */
    startQueueProcessor() {
        setInterval(() => {
            if (!this.processing && this.messageQueue.length > 0) {
                this.processQueue();
            }
        }, 5000); // Check every 5 seconds
    }
    
    /**
     * Get service status
     */
    getStatus() {
        return {
            available: this.availableServices,
            stats: this.stats,
            queueLength: this.messageQueue.length,
            processing: this.processing
        };
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Singleton instance
let instance = null;

module.exports = {
    WhatsAppService,
    getInstance: () => {
        if (!instance) {
            instance = new WhatsAppService();
        }
        return instance;
    }
};