// WhatsApp Sync Service - Integrates with Story 3.2 webhook infrastructure
const axios = require('axios');
const EventEmitter = require('events');

class WhatsAppSync extends EventEmitter {
    constructor(messageStore) {
        super();
        this.messageStore = messageStore;
        this.webhookPort = 3000; // Story 3.2 webhook port
        this.dashboardApiPort = 3002; // Story 3.2 dashboard API port
        this.initializeSync();
    }
    
    initializeSync() {
        // Connect to existing webhook events from Story 3.2
        this.connectToWebhookEvents();
        console.log('WhatsApp sync service initialized');
    }
    
    // Connect to webhook events database from Story 3.2
    async connectToWebhookEvents() {
        try {
            // Poll the events-logger database for new events
            setInterval(() => {
                this.syncWebhookEvents();
            }, 5000); // Check every 5 seconds
        } catch (error) {
            console.error('Error connecting to webhook events:', error);
        }
    }
    
    // Sync webhook events to message store
    async syncWebhookEvents() {
        try {
            // Query the dashboard API for recent events
            const response = await axios.get(`http://localhost:${this.dashboardApiPort}/api/webhook-events`, {
                params: {
                    since: this.lastSyncTime || new Date(Date.now() - 60000).toISOString()
                }
            });
            
            if (response.data && response.data.events) {
                for (const event of response.data.events) {
                    await this.processWebhookEvent(event);
                }
            }
            
            this.lastSyncTime = new Date().toISOString();
        } catch (error) {
            // Silently handle errors if services not available
            if (error.code !== 'ECONNREFUSED') {
                console.error('Error syncing webhook events:', error.message);
            }
        }
    }
    
    // Process individual webhook event
    async processWebhookEvent(event) {
        try {
            const { entry } = event.body || {};
            if (!entry || !entry[0]) return;
            
            const changes = entry[0].changes || [];
            
            for (const change of changes) {
                if (change.field === 'messages') {
                    const value = change.value || {};
                    
                    // Process incoming messages
                    if (value.messages) {
                        for (const msg of value.messages) {
                            await this.processIncomingMessage(msg, value.contacts);
                        }
                    }
                    
                    // Process status updates
                    if (value.statuses) {
                        for (const status of value.statuses) {
                            await this.processStatusUpdate(status);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error processing webhook event:', error);
        }
    }
    
    // Process incoming WhatsApp message
    async processIncomingMessage(message, contacts) {
        try {
            const contact = contacts ? contacts[0] : {};
            const phone = message.from;
            
            // Find or create advisor
            const advisor = await this.findOrCreateAdvisor(phone, contact);
            
            // Prepare message data
            const messageData = {
                id: message.id,
                advisor_id: advisor.id,
                phone: phone,
                direction: 'received',
                type: this.getMessageType(message),
                content: this.extractContent(message),
                media_url: this.extractMediaUrl(message),
                status: 'received',
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                metadata: {
                    whatsapp_id: message.id,
                    context: message.context,
                    referral: message.referral
                }
            };
            
            // Save to database
            await this.messageStore.saveMessage(messageData);
            
            // Emit event for real-time updates
            this.emit('new_message', {
                advisor_id: advisor.id,
                advisor_name: advisor.name,
                message: messageData
            });
            
            // Handle button clicks
            if (message.type === 'interactive' && message.interactive) {
                await this.handleButtonClick(message.interactive, advisor);
            }
        } catch (error) {
            console.error('Error processing incoming message:', error);
        }
    }
    
    // Process message status update
    async processStatusUpdate(status) {
        try {
            const messageId = status.id;
            const newStatus = this.mapWhatsAppStatus(status.status);
            
            await this.messageStore.updateMessageStatus(messageId, newStatus);
            
            // Emit event for real-time updates
            this.emit('status_update', {
                message_id: messageId,
                status: newStatus,
                timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
            });
        } catch (error) {
            console.error('Error processing status update:', error);
        }
    }
    
    // Find or create advisor from phone number
    async findOrCreateAdvisor(phone, contact) {
        try {
            // First check if advisor exists in Google Sheets data
            const sheetsResponse = await axios.get(`http://localhost:${this.dashboardApiPort}/api/advisor-by-phone/${phone}`);
            
            if (sheetsResponse.data && sheetsResponse.data.advisor) {
                const advisor = sheetsResponse.data.advisor;
                await this.messageStore.saveAdvisor(advisor);
                return advisor;
            }
        } catch (error) {
            // If not found in sheets, create new advisor
        }
        
        // Create new advisor if not found
        const advisor = {
            id: `ARN_${phone}`,
            name: contact.profile?.name || `Advisor ${phone.slice(-4)}`,
            phone: phone,
            arn: `ARN_${phone}`,
            email: null,
            online: true,
            last_seen: new Date().toISOString()
        };
        
        await this.messageStore.saveAdvisor(advisor);
        return advisor;
    }
    
    // Send message via WhatsApp
    async sendMessage(advisorId, phone, content, type = 'text', mediaUrl = null) {
        try {
            // Generate message ID
            const messageId = this.messageStore.generateMessageId();
            
            // Save message with pending status
            const messageData = {
                id: messageId,
                advisor_id: advisorId,
                phone: phone,
                direction: 'sent',
                type: type,
                content: content,
                media_url: mediaUrl,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            
            await this.messageStore.saveMessage(messageData);
            
            // Send via WhatsApp API
            const payload = this.buildWhatsAppPayload(phone, content, type, mediaUrl);
            
            const response = await axios.post(
                'https://graph.facebook.com/v21.0/502428736280703/messages',
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data && response.data.messages) {
                // Update message ID with WhatsApp ID
                const whatsappId = response.data.messages[0].id;
                messageData.metadata = { whatsapp_id: whatsappId };
                await this.messageStore.updateMessageStatus(messageId, 'sent');
            }
            
            return { success: true, message_id: messageId };
        } catch (error) {
            console.error('Error sending message:', error);
            await this.messageStore.updateMessageStatus(messageId, 'failed');
            throw error;
        }
    }
    
    // Build WhatsApp API payload
    buildWhatsAppPayload(phone, content, type, mediaUrl) {
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone
        };
        
        switch (type) {
            case 'text':
                payload.type = 'text';
                payload.text = { body: content };
                break;
                
            case 'image':
                payload.type = 'image';
                payload.image = {
                    link: mediaUrl,
                    caption: content
                };
                break;
                
            case 'document':
                payload.type = 'document';
                payload.document = {
                    link: mediaUrl,
                    caption: content,
                    filename: content || 'document.pdf'
                };
                break;
                
            case 'template':
                payload.type = 'template';
                payload.template = JSON.parse(content); // Assumes content is template JSON
                break;
        }
        
        return payload;
    }
    
    // Handle button click from interactive message
    async handleButtonClick(interactive, advisor) {
        try {
            const buttonReply = interactive.button_reply;
            if (!buttonReply) return;
            
            // Log button click
            console.log(`Button clicked by ${advisor.name}: ${buttonReply.title}`);
            
            // Emit event for button analytics
            this.emit('button_click', {
                advisor_id: advisor.id,
                button_id: buttonReply.id,
                button_title: buttonReply.title,
                timestamp: new Date().toISOString()
            });
            
            // Handle specific button actions
            if (buttonReply.id === 'unlock_content') {
                // Trigger content unlock workflow
                await this.unlockContent(advisor);
            }
        } catch (error) {
            console.error('Error handling button click:', error);
        }
    }
    
    // Unlock content for advisor
    async unlockContent(advisor) {
        try {
            // Call the unlock webhook handler from Story 3.2
            const response = await axios.post(`http://localhost:${this.webhookPort}/unlock`, {
                advisor_id: advisor.id,
                phone: advisor.phone
            });
            
            console.log(`Content unlocked for ${advisor.name}`);
        } catch (error) {
            console.error('Error unlocking content:', error);
        }
    }
    
    // Send broadcast message to multiple advisors
    async sendBroadcast(advisorIds, content, type = 'text', mediaUrl = null) {
        const results = [];
        
        for (const advisorId of advisorIds) {
            try {
                const advisor = await this.messageStore.getAdvisor(advisorId);
                if (advisor && advisor.phone) {
                    const result = await this.sendMessage(
                        advisorId,
                        advisor.phone,
                        content,
                        type,
                        mediaUrl
                    );
                    results.push({ advisor_id: advisorId, success: true, ...result });
                }
            } catch (error) {
                results.push({ advisor_id: advisorId, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    // Helper functions
    getMessageType(message) {
        if (message.type === 'text') return 'text';
        if (message.type === 'image') return 'image';
        if (message.type === 'document') return 'document';
        if (message.type === 'interactive') return 'button';
        return message.type || 'text';
    }
    
    extractContent(message) {
        if (message.text) return message.text.body;
        if (message.interactive) {
            if (message.interactive.button_reply) {
                return `Clicked: ${message.interactive.button_reply.title}`;
            }
            if (message.interactive.list_reply) {
                return `Selected: ${message.interactive.list_reply.title}`;
            }
        }
        if (message.image) return message.image.caption || '[Image]';
        if (message.document) return message.document.caption || '[Document]';
        return null;
    }
    
    extractMediaUrl(message) {
        if (message.image) return message.image.id; // Need to fetch actual URL
        if (message.document) return message.document.id; // Need to fetch actual URL
        return null;
    }
    
    mapWhatsAppStatus(status) {
        switch (status) {
            case 'sent': return 'sent';
            case 'delivered': return 'delivered';
            case 'read': return 'read';
            case 'failed': return 'failed';
            default: return status;
        }
    }
    
    // Load advisors from Google Sheets on startup
    async loadAdvisorsFromSheets() {
        try {
            const response = await axios.get(`http://localhost:${this.dashboardApiPort}/api/advisors`);
            if (response.data && response.data.advisors) {
                await this.messageStore.syncAdvisorsFromSheets(response.data.advisors);
                console.log(`Synced ${response.data.advisors.length} advisors from Google Sheets`);
            }
        } catch (error) {
            console.error('Error loading advisors from sheets:', error.message);
        }
    }
}

module.exports = WhatsAppSync;