/**
 * Click-to-Unlock Content Delivery Strategy
 * Implements a sophisticated content delivery system using UTILITY templates
 * with button callbacks to unlock daily content
 */

const { whatsAppService } = require('./whatsapp.service');
const { Logger } = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const logger = new Logger({ name: 'ClickToUnlock' });

/**
 * Content Queue Management
 * Stores pending content for each advisor with timestamps
 */
class ContentQueue {
    constructor() {
        this.queueFile = path.join(__dirname, '../../data/content-queue.json');
        this.queue = {};
        this.loadQueue();
    }
    
    async loadQueue() {
        try {
            const data = await fs.readFile(this.queueFile, 'utf8');
            this.queue = JSON.parse(data);
        } catch (error) {
            this.queue = {};
            logger.info('Initialized new content queue');
        }
    }
    
    async saveQueue() {
        await fs.writeFile(this.queueFile, JSON.stringify(this.queue, null, 2));
    }
    
    /**
     * Add content to advisor's queue
     * @param {string} advisorPhone - Advisor's phone number
     * @param {Object} content - Content object with date and data
     */
    async addContent(advisorPhone, content) {
        if (!this.queue[advisorPhone]) {
            this.queue[advisorPhone] = {
                pending: [],
                delivered: [],
                lastActivity: null
            };
        }
        
        // Add content with unique ID and timestamp
        const contentEntry = {
            id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            date: content.date || new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            content: content.data,
            status: 'pending',
            templateMessageId: null
        };
        
        this.queue[advisorPhone].pending.push(contentEntry);
        await this.saveQueue();
        
        logger.info(`Content queued for ${advisorPhone}`, {
            contentId: contentEntry.id,
            date: contentEntry.date
        });
        
        return contentEntry;
    }
    
    /**
     * Get all pending content for an advisor
     * @param {string} advisorPhone - Advisor's phone number
     * @param {string} contentId - Optional specific content ID
     */
    async getPendingContent(advisorPhone, contentId = null) {
        const advisorQueue = this.queue[advisorPhone];
        if (!advisorQueue) return [];
        
        if (contentId) {
            // Return specific content
            return advisorQueue.pending.filter(c => c.id === contentId);
        }
        
        // Return all pending content
        return advisorQueue.pending;
    }
    
    /**
     * Mark content as delivered
     * @param {string} advisorPhone - Advisor's phone number
     * @param {string} contentId - Content ID
     */
    async markDelivered(advisorPhone, contentId) {
        const advisorQueue = this.queue[advisorPhone];
        if (!advisorQueue) return;
        
        const contentIndex = advisorQueue.pending.findIndex(c => c.id === contentId);
        if (contentIndex !== -1) {
            const content = advisorQueue.pending.splice(contentIndex, 1)[0];
            content.status = 'delivered';
            content.deliveredAt = new Date().toISOString();
            advisorQueue.delivered.push(content);
            advisorQueue.lastActivity = new Date().toISOString();
            await this.saveQueue();
            
            logger.info(`Content marked as delivered`, {
                advisorPhone,
                contentId
            });
        }
    }
    
    /**
     * Link template message to content
     * @param {string} advisorPhone - Advisor's phone number
     * @param {string} contentId - Content ID
     * @param {string} messageId - WhatsApp message ID
     */
    async linkTemplateMessage(advisorPhone, contentId, messageId) {
        const advisorQueue = this.queue[advisorPhone];
        if (!advisorQueue) return;
        
        const content = advisorQueue.pending.find(c => c.id === contentId);
        if (content) {
            content.templateMessageId = messageId;
            await this.saveQueue();
        }
    }
}

/**
 * Main Click-to-Unlock Service
 */
class ClickToUnlockService {
    constructor() {
        this.contentQueue = new ContentQueue();
        this.templates = {
            daily_content_ready: 'finadvise_daily_unlock_v1',
            content_delivery: 'finadvise_content_batch_v1'
        };
    }
    
    /**
     * Send daily UTILITY template with unlock button
     * @param {Object} advisor - Advisor object
     * @param {Object} dailyContent - Content for the day
     */
    async sendDailyUnlockTemplate(advisor, dailyContent) {
        const timer = logger.startTimer(`Send unlock template to ${advisor.name}`);
        
        try {
            // Queue the content first
            const queuedContent = await this.contentQueue.addContent(
                advisor.phone,
                {
                    date: dailyContent.date,
                    data: dailyContent
                }
            );
            
            // Prepare the UTILITY template message
            const message = {
                type: 'template',
                template: {
                    name: this.templates.daily_content_ready,
                    language: { code: 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: advisor.name },
                                { type: 'text', text: dailyContent.date },
                                { type: 'text', text: dailyContent.platforms.join(', ') },
                                { type: 'text', text: String(dailyContent.contentCount) },
                                { type: 'text', text: queuedContent.id } // Hidden content ID
                            ]
                        },
                        {
                            type: 'button',
                            sub_type: 'quick_reply',
                            index: '0',
                            parameters: [
                                {
                                    type: 'payload',
                                    payload: `UNLOCK_CONTENT_${queuedContent.id}`
                                }
                            ]
                        }
                    ]
                }
            };
            
            // Send the message
            const result = await whatsAppService.sendMessage(advisor.phone, message);
            
            // Link the message ID to the content
            await this.contentQueue.linkTemplateMessage(
                advisor.phone,
                queuedContent.id,
                result.messageId
            );
            
            logger.info(`Unlock template sent successfully`, {
                advisor: advisor.name,
                messageId: result.messageId,
                contentId: queuedContent.id
            });
            
            timer({ success: true });
            
            return {
                success: true,
                messageId: result.messageId,
                contentId: queuedContent.id
            };
            
        } catch (error) {
            logger.error(`Failed to send unlock template`, error);
            timer({ success: false });
            throw error;
        }
    }
    
    /**
     * Handle button click webhook and deliver content
     * @param {Object} webhookData - Webhook payload from WhatsApp
     */
    async handleUnlockRequest(webhookData) {
        const timer = logger.startTimer('Handle unlock request');
        
        try {
            // Extract button payload
            const buttonPayload = webhookData.interactive?.button_reply?.id;
            
            if (!buttonPayload || !buttonPayload.startsWith('UNLOCK_CONTENT_')) {
                logger.debug('Not an unlock request', { payload: buttonPayload });
                return;
            }
            
            const contentId = buttonPayload.replace('UNLOCK_CONTENT_', '');
            const advisorPhone = webhookData.from;
            
            logger.info(`Unlock request received`, {
                advisorPhone,
                contentId
            });
            
            // Get the specific content or all pending content
            let contentToDeliver;
            if (contentId === 'ALL') {
                // Advisor clicked "Get All Content" - deliver everything pending
                contentToDeliver = await this.contentQueue.getPendingContent(advisorPhone);
            } else {
                // Advisor clicked on specific day's content
                contentToDeliver = await this.contentQueue.getPendingContent(advisorPhone, contentId);
            }
            
            if (contentToDeliver.length === 0) {
                await this.sendNoContentMessage(advisorPhone);
                return;
            }
            
            // Now we have 24-hour window open! Send all content
            await this.deliverContent(advisorPhone, contentToDeliver);
            
            timer({ success: true, contentCount: contentToDeliver.length });
            
        } catch (error) {
            logger.error('Error handling unlock request', error);
            timer({ success: false });
            throw error;
        }
    }
    
    /**
     * Deliver actual content after unlock
     * @param {string} advisorPhone - Advisor's phone number
     * @param {Array} contentItems - Array of content to deliver
     */
    async deliverContent(advisorPhone, contentItems) {
        logger.info(`Delivering ${contentItems.length} content items to ${advisorPhone}`);
        
        for (const item of contentItems) {
            const content = item.content;
            
            // Send introduction message
            await whatsAppService.sendText(
                advisorPhone,
                `📅 *Content for ${item.date}*\n\n${content.introduction}`
            );
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Send each piece of content
            for (const post of content.posts) {
                // Send the copyable content
                const copyableMessage = `*${post.platform}* Content:\n\n` +
                    `${post.text}\n\n` +
                    `Hashtags: ${post.hashtags.join(' ')}\n\n` +
                    `_💡 Tip: Long press to copy this entire message_`;
                
                await whatsAppService.sendText(advisorPhone, copyableMessage);
                
                // If there's an image, send it
                if (post.imageUrl) {
                    await whatsAppService.sendImage(
                        advisorPhone,
                        post.imageUrl,
                        `Visual for ${post.platform} post`
                    );
                }
                
                // Delay between posts
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Mark as delivered
            await this.contentQueue.markDelivered(advisorPhone, item.id);
        }
        
        // Send completion message with forward instructions
        const completionMessage = `✅ *All content delivered!*\n\n` +
            `*How to use:*\n` +
            `1️⃣ Long press each message to copy\n` +
            `2️⃣ Paste in respective platforms\n` +
            `3️⃣ Or forward directly to clients\n\n` +
            `💡 *Pro Tip:* Save these messages for quick access throughout the day`;
        
        await whatsAppService.sendText(advisorPhone, completionMessage);
    }
    
    /**
     * Send message when no content is available
     * @param {string} advisorPhone - Advisor's phone number
     */
    async sendNoContentMessage(advisorPhone) {
        await whatsAppService.sendText(
            advisorPhone,
            `📭 No pending content available.\n\n` +
            `Your content is delivered daily at 5 AM. ` +
            `Please check back after the next delivery.`
        );
    }
    
    /**
     * Send batch unlock template for multiple days
     * @param {Object} advisor - Advisor object
     */
    async sendBatchUnlockTemplate(advisor) {
        const pendingContent = await this.contentQueue.getPendingContent(advisor.phone);
        
        if (pendingContent.length === 0) {
            logger.info(`No pending content for ${advisor.name}`);
            return;
        }
        
        // Create summary of pending content
        const contentSummary = pendingContent
            .slice(0, 5) // Show last 5 days
            .map(c => `• ${c.date}: ${c.content.contentCount} posts`)
            .join('\n');
        
        const message = {
            type: 'interactive',
            interactive: {
                type: 'button',
                header: {
                    type: 'text',
                    text: '📚 Your Pending Content'
                },
                body: {
                    text: `Hi ${advisor.name},\n\n` +
                          `You have ${pendingContent.length} days of content ready:\n\n` +
                          `${contentSummary}\n\n` +
                          `Click below to receive all content:`
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'UNLOCK_CONTENT_ALL',
                                title: 'Get All Content'
                            }
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'UNLOCK_LATEST',
                                title: "Today's Content"
                            }
                        }
                    ]
                }
            }
        };
        
        return whatsAppService.sendMessage(advisor.phone, message);
    }
}

// Export service
const clickToUnlockService = new ClickToUnlockService();

module.exports = {
    clickToUnlockService,
    ClickToUnlockService,
    ContentQueue
};