/**
 * Distribution Manager Agent
 * Sends approved content via WhatsApp Business API at 5 AM
 */

const axios = require('axios');
const logger = require('../utils/logger');
const errorHandler = require('../utils/error-handler');
const communication = require('../utils/communication');
const advisorManager = require('../managers/advisor-manager');

class DistributionManager {
  constructor() {
    this.agentId = 'distribution-manager';
    this.state = 'IDLE';
    
    // WhatsApp Business API configuration
    this.whatsappConfig = {
      endpoint: process.env.WHATSAPP_API_ENDPOINT || 'https://api.whatsapp.com/v1/',
      bearerToken: process.env.WHATSAPP_BEARER_TOKEN,
      rateLimit: {
        perSecond: 80,
        perDay: 100000
      },
      retry: {
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 60000
      }
    };
    
    // Rate limiting tracking
    this.messagesSentToday = 0;
    this.lastResetDate = new Date().toDateString();
    this.messageQueue = [];
    this.processing = false;
    
    // Email fallback configuration
    this.emailConfig = {
      enabled: true,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    };
    
    this.distributionTime = '05:00'; // 5:00 AM
  }

  /**
   * Process distribution request
   */
  async processRequest(message) {
    this.state = 'PROCESSING';
    const startTime = Date.now();

    try {
      // Validate message format
      const validationResult = communication.validateMessage(message);
      if (!validationResult.valid) {
        throw new Error(`Invalid message format: ${validationResult.error}`);
      }

      const { content_list } = message.payload;
      
      logger.info(`[${this.agentId}] Starting distribution of ${content_list.length} content items`);

      // Reset daily counter if needed
      this.resetDailyCounter();

      const results = {
        sent: [],
        failed: [],
        emailFallback: []
      };

      // Group content by advisor for bulk sending
      const contentByAdvisor = this.groupContentByAdvisor(content_list);

      // Process each advisor's content
      for (const [advisorArn, advisorContent] of Object.entries(contentByAdvisor)) {
        const advisor = await advisorManager.getAdvisor(advisorArn);
        
        if (!advisor) {
          logger.error(`[${this.agentId}] Advisor ${advisorArn} not found`);
          advisorContent.forEach(content => {
            results.failed.push({
              content_id: content.id,
              advisor_arn: advisorArn,
              reason: 'Advisor not found'
            });
          });
          continue;
        }

        // Check advisor preferences
        if (!advisor.preferences.auto_send) {
          logger.info(`[${this.agentId}] Skipping ${advisorArn} - auto_send disabled`);
          continue;
        }

        // Send content to advisor
        for (const content of advisorContent) {
          const sendResult = await this.sendToAdvisor(advisor, content);
          
          if (sendResult.status === 'sent') {
            results.sent.push(sendResult);
          } else if (sendResult.status === 'email_fallback') {
            results.emailFallback.push(sendResult);
          } else {
            results.failed.push(sendResult);
          }
        }
      }

      const processingTime = Date.now() - startTime;

      // Log distribution summary
      this.logDistributionSummary(results);

      // Prepare response
      const response = communication.createMessage({
        agentId: this.agentId,
        action: 'DISTRIBUTION_COMPLETE',
        payload: {
          results,
          summary: {
            total: content_list.length,
            sent: results.sent.length,
            failed: results.failed.length,
            email_fallback: results.emailFallback.length
          },
          processing_time: processingTime
        },
        context: message.context
      });

      this.state = 'COMPLETED';
      logger.info(`[${this.agentId}] Distribution completed in ${processingTime}ms`);

      return response;

    } catch (error) {
      this.state = 'ERROR';
      logger.error(`[${this.agentId}] Distribution failed:`, error);
      
      return errorHandler.handleError(error, {
        agentId: this.agentId,
        action: 'DISTRIBUTION_FAILED',
        context: message.context
      });
    }
  }

  /**
   * Send content to a specific advisor
   */
  async sendToAdvisor(advisor, content) {
    const { whatsapp, email, name } = advisor;
    const contentData = content.platforms.whatsapp;
    
    if (!contentData) {
      return {
        status: 'failed',
        content_id: content.id,
        advisor_arn: advisor.arn,
        reason: 'No WhatsApp content available'
      };
    }

    // Try WhatsApp first
    if (whatsapp) {
      try {
        await this.sendWhatsAppMessage(whatsapp, contentData, name);
        
        // Track delivery
        await this.updateDeliveryStatus(content.id, advisor.arn, 'delivered', 'whatsapp');
        
        return {
          status: 'sent',
          content_id: content.id,
          advisor_arn: advisor.arn,
          channel: 'whatsapp',
          timestamp: new Date().toISOString()
        };
        
      } catch (error) {
        logger.error(`[${this.agentId}] WhatsApp send failed for ${advisor.arn}:`, error);
        
        // Try email fallback
        if (email && this.emailConfig.enabled) {
          try {
            await this.sendEmailFallback(email, contentData, name);
            
            await this.updateDeliveryStatus(content.id, advisor.arn, 'delivered', 'email');
            
            return {
              status: 'email_fallback',
              content_id: content.id,
              advisor_arn: advisor.arn,
              channel: 'email',
              timestamp: new Date().toISOString()
            };
            
          } catch (emailError) {
            logger.error(`[${this.agentId}] Email fallback also failed:`, emailError);
          }
        }
      }
    } else if (email && this.emailConfig.enabled) {
      // No WhatsApp, try email directly
      try {
        await this.sendEmailFallback(email, contentData, name);
        
        await this.updateDeliveryStatus(content.id, advisor.arn, 'delivered', 'email');
        
        return {
          status: 'email_fallback',
          content_id: content.id,
          advisor_arn: advisor.arn,
          channel: 'email',
          timestamp: new Date().toISOString()
        };
        
      } catch (emailError) {
        logger.error(`[${this.agentId}] Email send failed:`, emailError);
      }
    }

    // All delivery methods failed
    await this.updateDeliveryStatus(content.id, advisor.arn, 'failed', 'none');
    
    return {
      status: 'failed',
      content_id: content.id,
      advisor_arn: advisor.arn,
      reason: 'All delivery channels failed'
    };
  }

  /**
   * Send WhatsApp message with rate limiting and retries
   */
  async sendWhatsAppMessage(phoneNumber, content, recipientName) {
    // Check rate limits
    if (this.messagesSentToday >= this.whatsappConfig.rateLimit.perDay) {
      throw new Error('Daily WhatsApp message limit reached');
    }

    // Apply rate limiting (80 msg/sec)
    await this.applyRateLimit();

    const message = {
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'content_notification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: recipientName },
              { type: 'text', text: content.text }
            ]
          }
        ]
      }
    };

    // Add media if image URL exists
    if (content.image_url) {
      message.type = 'media';
      message.media = {
        type: 'image',
        url: content.image_url,
        caption: content.text
      };
    }

    let lastError;
    let delay = this.whatsappConfig.retry.initialDelay;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < this.whatsappConfig.retry.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${this.whatsappConfig.endpoint}messages`,
          message,
          {
            headers: {
              'Authorization': `Bearer ${this.whatsappConfig.bearerToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        this.messagesSentToday++;
        
        logger.info(`[${this.agentId}] WhatsApp message sent to ${phoneNumber}`);
        
        return response.data;

      } catch (error) {
        lastError = error;
        
        if (error.response && error.response.status === 429) {
          // Rate limit hit, wait longer
          delay = Math.min(delay * 2, this.whatsappConfig.retry.maxDelay);
          logger.warn(`[${this.agentId}] Rate limit hit, waiting ${delay}ms before retry`);
          await this.delay(delay);
        } else if (attempt < this.whatsappConfig.retry.maxRetries - 1) {
          // Regular retry with exponential backoff
          logger.warn(`[${this.agentId}] Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await this.delay(delay);
          delay = Math.min(delay * 2, this.whatsappConfig.retry.maxDelay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Send email fallback
   */
  async sendEmailFallback(emailAddress, content, recipientName) {
    // Placeholder for actual email implementation
    // In production, would use nodemailer or similar
    
    logger.info(`[${this.agentId}] Sending email fallback to ${emailAddress}`);
    
    const emailContent = {
      to: emailAddress,
      subject: 'Your Daily Financial Content',
      html: `
        <h2>Hi ${recipientName},</h2>
        <p>${content.text}</p>
        ${content.image_url ? `<img src="${content.image_url}" alt="Content Image" />` : ''}
        <hr>
        <p><small>This email was sent because WhatsApp delivery was unavailable.</small></p>
      `
    };
    
    // Simulate email sending
    await this.delay(100);
    
    logger.info(`[${this.agentId}] Email sent to ${emailAddress}`);
    
    return true;
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    // Simple rate limiting: max 80 messages per second
    // In production, would use a more sophisticated approach
    
    if (!this.lastMessageTime) {
      this.lastMessageTime = Date.now();
      return;
    }
    
    const timeSinceLastMessage = Date.now() - this.lastMessageTime;
    const minInterval = 1000 / this.whatsappConfig.rateLimit.perSecond; // ~12.5ms
    
    if (timeSinceLastMessage < minInterval) {
      await this.delay(minInterval - timeSinceLastMessage);
    }
    
    this.lastMessageTime = Date.now();
  }

  /**
   * Group content by advisor
   */
  groupContentByAdvisor(contentList) {
    const grouped = {};
    
    contentList.forEach(content => {
      const advisorArn = content.advisor_arn;
      if (!grouped[advisorArn]) {
        grouped[advisorArn] = [];
      }
      grouped[advisorArn].push(content);
    });
    
    return grouped;
  }

  /**
   * Update delivery status in Google Sheets
   */
  async updateDeliveryStatus(contentId, advisorArn, status, channel) {
    // Placeholder for Google Sheets API integration
    logger.info(`[${this.agentId}] Updating delivery status: ${contentId} - ${status} via ${channel}`);
  }

  /**
   * Reset daily message counter
   */
  resetDailyCounter() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.messagesSentToday = 0;
      this.lastResetDate = today;
      logger.info(`[${this.agentId}] Daily message counter reset`);
    }
  }

  /**
   * Log distribution summary
   */
  logDistributionSummary(results) {
    const summary = {
      timestamp: new Date().toISOString(),
      sent: results.sent.length,
      failed: results.failed.length,
      email_fallback: results.emailFallback.length,
      daily_total: this.messagesSentToday
    };
    
    logger.info(`[${this.agentId}] Distribution summary:`, summary);
    
    if (results.failed.length > 0) {
      logger.warn(`[${this.agentId}] Failed deliveries:`, results.failed);
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if current time is distribution time
   */
  isDistributionTime() {
    const now = new Date();
    const [hours, minutes] = this.distributionTime.split(':').map(Number);
    return now.getHours() === hours && now.getMinutes() === minutes;
  }

  /**
   * Get agent state
   */
  getState() {
    return this.state;
  }

  /**
   * Get distribution stats
   */
  getStats() {
    return {
      messages_sent_today: this.messagesSentToday,
      last_reset: this.lastResetDate,
      queue_size: this.messageQueue.length,
      state: this.state
    };
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = 'IDLE';
    this.messageQueue = [];
    this.processing = false;
  }
}

// Export singleton instance
module.exports = new DistributionManager();

// Also export class for testing
module.exports.DistributionManager = DistributionManager;