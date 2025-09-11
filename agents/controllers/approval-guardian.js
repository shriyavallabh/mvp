/**
 * Approval Guardian Agent
 * Automatically approves content at 11 PM based on quality metrics
 */

const logger = require('../utils/logger');
const errorHandler = require('../utils/error-handler');
const communication = require('../utils/communication');
const advisorManager = require('../managers/advisor-manager');

class ApprovalGuardian {
  constructor() {
    this.agentId = 'approval-guardian';
    this.state = 'IDLE';
    
    // Quality thresholds for auto-approval
    this.thresholds = {
      fatigue_score: 0.8,      // Must be > 0.8
      compliance_score: 1.0,   // Must be exactly 1.0
      quality_score: 0.8,      // Must be > 0.8
      relevance_score: 0.8     // Must be > 0.8
    };
    
    this.maxRegenerationAttempts = 3;
    this.activationTime = '23:00'; // 11:00 PM
  }

  /**
   * Process auto-approval request
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
      
      logger.info(`[${this.agentId}] Starting auto-approval process for ${content_list.length} items`);

      const results = {
        approved: [],
        rejected: [],
        regenerated: []
      };

      // Process each content item
      for (const content of content_list) {
        const result = await this.evaluateContent(content);
        
        if (result.status === 'approved') {
          results.approved.push(result);
          await this.updateContentStatus(content.id, 'approved', 'auto');
        } else if (result.status === 'rejected') {
          results.rejected.push(result);
          await this.handleRejection(content, result.reasons);
        } else if (result.status === 'regenerate') {
          const regenerationResult = await this.attemptRegeneration(content, result.reasons);
          results.regenerated.push(regenerationResult);
        }
      }

      const processingTime = Date.now() - startTime;

      // Send notifications for manual review if needed
      if (results.rejected.length > 0) {
        await this.sendManualReviewNotifications(results.rejected);
      }

      // Prepare response
      const response = communication.createMessage({
        agentId: this.agentId,
        action: 'AUTO_APPROVAL_COMPLETE',
        payload: {
          results,
          summary: {
            total: content_list.length,
            approved: results.approved.length,
            rejected: results.rejected.length,
            regenerated: results.regenerated.length
          },
          processing_time: processingTime
        },
        context: message.context
      });

      this.state = 'COMPLETED';
      logger.info(`[${this.agentId}] Auto-approval completed in ${processingTime}ms`);

      return response;

    } catch (error) {
      this.state = 'ERROR';
      logger.error(`[${this.agentId}] Auto-approval failed:`, error);
      
      return errorHandler.handleError(error, {
        agentId: this.agentId,
        action: 'AUTO_APPROVAL_FAILED',
        context: message.context
      });
    }
  }

  /**
   * Evaluate content against quality thresholds
   */
  async evaluateContent(content) {
    const { metadata } = content;
    const reasons = [];
    
    // Check fatigue score
    if (!metadata.fatigue_score || metadata.fatigue_score <= this.thresholds.fatigue_score) {
      reasons.push(`Fatigue score (${metadata.fatigue_score || 0}) <= ${this.thresholds.fatigue_score}`);
    }
    
    // Check compliance score - must be exactly 1.0
    if (metadata.compliance_score !== this.thresholds.compliance_score) {
      reasons.push(`Compliance score (${metadata.compliance_score}) must be exactly ${this.thresholds.compliance_score}`);
    }
    
    // Check quality score
    if (!metadata.quality_score || metadata.quality_score <= this.thresholds.quality_score) {
      reasons.push(`Quality score (${metadata.quality_score || 0}) <= ${this.thresholds.quality_score}`);
    }
    
    // Check relevance score
    if (!metadata.relevance_score || metadata.relevance_score <= this.thresholds.relevance_score) {
      reasons.push(`Relevance score (${metadata.relevance_score || 0}) <= ${this.thresholds.relevance_score}`);
    }
    
    // Determine status
    if (reasons.length === 0) {
      return {
        status: 'approved',
        content_id: content.id,
        advisor_arn: content.advisor_arn,
        scores: metadata
      };
    }
    
    // Check if regeneration might help
    if (metadata.compliance_score !== 1.0 || metadata.revision_count >= this.maxRegenerationAttempts) {
      return {
        status: 'rejected',
        content_id: content.id,
        advisor_arn: content.advisor_arn,
        reasons,
        scores: metadata
      };
    }
    
    return {
      status: 'regenerate',
      content_id: content.id,
      advisor_arn: content.advisor_arn,
      reasons,
      scores: metadata
    };
  }

  /**
   * Attempt to regenerate content
   */
  async attemptRegeneration(content, reasons) {
    logger.info(`[${this.agentId}] Attempting regeneration for content ${content.id}`);
    
    let attempts = 0;
    let lastResult = null;
    
    while (attempts < this.maxRegenerationAttempts) {
      attempts++;
      
      // Request regeneration from content-orchestrator
      const regenerationMessage = communication.createMessage({
        agentId: this.agentId,
        action: 'REGENERATE_CONTENT',
        payload: {
          content_id: content.id,
          advisor_arn: content.advisor_arn,
          reasons,
          attempt: attempts
        }
      });
      
      // Send to content-orchestrator for regeneration
      const regenerationResult = await this.sendToOrchestrator(regenerationMessage);
      
      // Re-evaluate the regenerated content
      const evaluation = await this.evaluateContent(regenerationResult.payload.content);
      
      if (evaluation.status === 'approved') {
        await this.updateContentStatus(content.id, 'approved', 'auto');
        return {
          status: 'regenerated_and_approved',
          content_id: content.id,
          attempts,
          final_scores: evaluation.scores
        };
      }
      
      lastResult = evaluation;
    }
    
    // Max attempts reached, reject the content
    await this.updateContentStatus(content.id, 'rejected', 'auto');
    
    return {
      status: 'regeneration_failed',
      content_id: content.id,
      attempts,
      final_reasons: lastResult.reasons,
      final_scores: lastResult.scores
    };
  }

  /**
   * Handle rejected content
   */
  async handleRejection(content, reasons) {
    logger.warn(`[${this.agentId}] Content ${content.id} rejected: ${reasons.join(', ')}`);
    
    await this.updateContentStatus(content.id, 'rejected', 'auto');
    
    // Log rejection details for analysis
    await this.logRejection(content, reasons);
  }

  /**
   * Send notifications for manual review
   */
  async sendManualReviewNotifications(rejectedContent) {
    logger.info(`[${this.agentId}] Sending manual review notifications for ${rejectedContent.length} items`);
    
    // Group by advisor
    const byAdvisor = {};
    rejectedContent.forEach(item => {
      if (!byAdvisor[item.advisor_arn]) {
        byAdvisor[item.advisor_arn] = [];
      }
      byAdvisor[item.advisor_arn].push(item);
    });
    
    // Send WhatsApp notifications
    for (const [advisorArn, items] of Object.entries(byAdvisor)) {
      const advisor = await advisorManager.getAdvisor(advisorArn);
      
      if (advisor && advisor.whatsapp) {
        const message = this.buildReviewNotification(advisor, items);
        
        // Send via WhatsApp (placeholder - actual implementation would use WhatsApp API)
        logger.info(`[${this.agentId}] Would send WhatsApp to ${advisor.whatsapp}: ${message}`);
      }
    }
  }

  /**
   * Build review notification message
   */
  buildReviewNotification(advisor, rejectedItems) {
    return `Hi ${advisor.name},\n\n` +
           `${rejectedItems.length} content item(s) require manual review:\n` +
           rejectedItems.map(item => `- ${item.content_id}: ${item.reasons.join(', ')}`).join('\n') +
           `\n\nPlease review and approve/reject at your earliest convenience.\n` +
           `Reply with 'APPROVE <content_id>' or 'REJECT <content_id>'`;
  }

  /**
   * Update content status in Google Sheets
   */
  async updateContentStatus(contentId, status, method) {
    // This would integrate with Google Sheets API
    // Placeholder for now
    logger.info(`[${this.agentId}] Updating content ${contentId} status to ${status} (${method})`);
  }

  /**
   * Log rejection for analysis
   */
  async logRejection(content, reasons) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      content_id: content.id,
      advisor_arn: content.advisor_arn,
      reasons,
      scores: content.metadata
    };
    
    logger.warn(`[${this.agentId}] Rejection logged:`, logEntry);
  }

  /**
   * Send message to content-orchestrator
   */
  async sendToOrchestrator(message) {
    // Placeholder for actual orchestrator communication
    // In production, this would use the communication protocol
    logger.info(`[${this.agentId}] Sending to orchestrator:`, message.action);
    
    // Simulate regeneration response
    return {
      payload: {
        content: {
          ...message.payload,
          metadata: {
            fatigue_score: 0.9,
            compliance_score: 1.0,
            quality_score: 0.85,
            relevance_score: 0.9,
            revision_count: (message.payload.attempt || 0)
          }
        }
      }
    };
  }

  /**
   * Check if current time is activation time
   */
  isActivationTime() {
    const now = new Date();
    const [hours, minutes] = this.activationTime.split(':').map(Number);
    return now.getHours() === hours && now.getMinutes() === minutes;
  }

  /**
   * Get agent state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = 'IDLE';
  }
}

// Export singleton instance
module.exports = new ApprovalGuardian();

// Also export class for testing
module.exports.ApprovalGuardian = ApprovalGuardian;