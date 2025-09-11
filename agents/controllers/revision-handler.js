/**
 * Revision Handler Agent
 * Processes real-time revision requests from advisors via WhatsApp
 */

const logger = require('../utils/logger');
const errorHandler = require('../utils/error-handler');
const communication = require('../utils/communication');

class RevisionHandler {
  constructor() {
    this.agentId = 'revision-handler';
    this.state = 'IDLE';
    
    // Revision command patterns
    this.commandPatterns = {
      regenerate: /^REGENERATE\s+(.+)$/i,
      modify: /^MODIFY\s+(.+)\s+(.+)$/i,
      approve: /^APPROVE\s+(.+)$/i,
      reject: /^REJECT\s+(.+)$/i,
      changeTone: /^TONE\s+(.+)\s+(professional|friendly|educational)$/i,
      addEmoji: /^ADD_EMOJI\s+(.+)$/i,
      removeEmoji: /^REMOVE_EMOJI\s+(.+)$/i,
      shorten: /^SHORTEN\s+(.+)$/i,
      expand: /^EXPAND\s+(.+)$/i
    };
    
    // Track revision history
    this.revisionHistory = new Map();
  }

  /**
   * Process revision request from webhook
   */
  async processWebhookRequest(webhookData) {
    this.state = 'PROCESSING';
    const startTime = Date.now();

    try {
      const { from, message, timestamp } = webhookData;
      
      logger.info(`[${this.agentId}] Processing revision request from ${from}`);

      // Parse the command from message
      const command = this.parseCommand(message);
      
      if (!command) {
        return this.sendErrorResponse(from, 'Invalid command format. Use HELP for available commands.');
      }

      // Execute the revision command
      const result = await this.executeRevision(command, from);

      // Update revision history
      this.updateRevisionHistory(command.contentId, {
        timestamp,
        from,
        command: command.type,
        params: command.params,
        result: result.status
      });

      // Send confirmation via WhatsApp
      await this.sendConfirmation(from, result);

      const processingTime = Date.now() - startTime;

      // Prepare response
      const response = communication.createMessage({
        agentId: this.agentId,
        action: 'REVISION_COMPLETE',
        payload: {
          command,
          result,
          processing_time: processingTime
        }
      });

      this.state = 'COMPLETED';
      logger.info(`[${this.agentId}] Revision completed in ${processingTime}ms`);

      return response;

    } catch (error) {
      this.state = 'ERROR';
      logger.error(`[${this.agentId}] Revision failed:`, error);
      
      return errorHandler.handleError(error, {
        agentId: this.agentId,
        action: 'REVISION_FAILED'
      });
    }
  }

  /**
   * Parse command from WhatsApp message
   */
  parseCommand(message) {
    const trimmedMessage = message.trim();
    
    // Check each command pattern
    for (const [type, pattern] of Object.entries(this.commandPatterns)) {
      const match = trimmedMessage.match(pattern);
      
      if (match) {
        return {
          type,
          contentId: match[1],
          params: match.slice(2),
          rawMessage: message
        };
      }
    }
    
    // Check for HELP command
    if (trimmedMessage.toUpperCase() === 'HELP') {
      return {
        type: 'help',
        contentId: null,
        params: [],
        rawMessage: message
      };
    }
    
    return null;
  }

  /**
   * Execute revision based on command type
   */
  async executeRevision(command, requesterPhone) {
    const { type, contentId, params } = command;
    
    switch (type) {
      case 'regenerate':
        return await this.handleRegenerate(contentId, requesterPhone);
        
      case 'modify':
        return await this.handleModify(contentId, params[0], requesterPhone);
        
      case 'approve':
        return await this.handleApprove(contentId, requesterPhone);
        
      case 'reject':
        return await this.handleReject(contentId, requesterPhone);
        
      case 'changeTone':
        return await this.handleToneChange(contentId, params[0], requesterPhone);
        
      case 'addEmoji':
        return await this.handleAddEmoji(contentId, requesterPhone);
        
      case 'removeEmoji':
        return await this.handleRemoveEmoji(contentId, requesterPhone);
        
      case 'shorten':
        return await this.handleShorten(contentId, requesterPhone);
        
      case 'expand':
        return await this.handleExpand(contentId, requesterPhone);
        
      case 'help':
        return await this.handleHelp(requesterPhone);
        
      default:
        return {
          status: 'error',
          message: 'Unknown command type'
        };
    }
  }

  /**
   * Handle content regeneration
   */
  async handleRegenerate(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Regenerating content ${contentId}`);
    
    // Send regeneration request to content-orchestrator
    const regenerationMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'REGENERATE_CONTENT',
      payload: {
        content_id: contentId,
        requested_by: requesterPhone,
        full_regeneration: true
      }
    });
    
    // Simulate orchestrator response (would be actual call in production)
    const orchestratorResponse = await this.sendToOrchestrator(regenerationMessage);
    
    // Update content in Google Sheets
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Content ${contentId} regenerated successfully`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle content modification
   */
  async handleModify(contentId, modification, requesterPhone) {
    logger.info(`[${this.agentId}] Modifying content ${contentId}: ${modification}`);
    
    // Send modification request to content-orchestrator
    const modificationMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'MODIFY_CONTENT',
      payload: {
        content_id: contentId,
        modification,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(modificationMessage);
    
    // Update content in Google Sheets
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Content ${contentId} modified successfully`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle content approval
   */
  async handleApprove(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Approving content ${contentId}`);
    
    await this.updateContentStatus(contentId, 'approved', 'manual', requesterPhone);
    
    return {
      status: 'success',
      message: `Content ${contentId} approved`
    };
  }

  /**
   * Handle content rejection
   */
  async handleReject(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Rejecting content ${contentId}`);
    
    await this.updateContentStatus(contentId, 'rejected', 'manual', requesterPhone);
    
    return {
      status: 'success',
      message: `Content ${contentId} rejected`
    };
  }

  /**
   * Handle tone change
   */
  async handleToneChange(contentId, newTone, requesterPhone) {
    logger.info(`[${this.agentId}] Changing tone of content ${contentId} to ${newTone}`);
    
    const toneChangeMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'CHANGE_TONE',
      payload: {
        content_id: contentId,
        new_tone: newTone,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(toneChangeMessage);
    
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Tone changed to ${newTone} for content ${contentId}`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle adding emojis
   */
  async handleAddEmoji(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Adding emojis to content ${contentId}`);
    
    const emojiMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'ADD_EMOJI',
      payload: {
        content_id: contentId,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(emojiMessage);
    
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Emojis added to content ${contentId}`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle removing emojis
   */
  async handleRemoveEmoji(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Removing emojis from content ${contentId}`);
    
    const removeEmojiMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'REMOVE_EMOJI',
      payload: {
        content_id: contentId,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(removeEmojiMessage);
    
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Emojis removed from content ${contentId}`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle content shortening
   */
  async handleShorten(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Shortening content ${contentId}`);
    
    const shortenMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'SHORTEN_CONTENT',
      payload: {
        content_id: contentId,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(shortenMessage);
    
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Content ${contentId} shortened`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle content expansion
   */
  async handleExpand(contentId, requesterPhone) {
    logger.info(`[${this.agentId}] Expanding content ${contentId}`);
    
    const expandMessage = communication.createMessage({
      agentId: this.agentId,
      action: 'EXPAND_CONTENT',
      payload: {
        content_id: contentId,
        requested_by: requesterPhone
      }
    });
    
    const orchestratorResponse = await this.sendToOrchestrator(expandMessage);
    
    await this.updateContentInSheets(contentId, orchestratorResponse.payload.content);
    
    return {
      status: 'success',
      message: `Content ${contentId} expanded`,
      new_content: orchestratorResponse.payload.content
    };
  }

  /**
   * Handle help command
   */
  async handleHelp(requesterPhone) {
    const helpText = `
📋 REVISION COMMANDS:

REGENERATE <content_id> - Regenerate entire content
MODIFY <content_id> <changes> - Modify specific parts
APPROVE <content_id> - Approve content
REJECT <content_id> - Reject content
TONE <content_id> <professional|friendly|educational> - Change tone
ADD_EMOJI <content_id> - Add emojis
REMOVE_EMOJI <content_id> - Remove emojis
SHORTEN <content_id> - Make content shorter
EXPAND <content_id> - Make content longer

Example: REGENERATE CNT_12345
`;
    
    return {
      status: 'success',
      message: helpText
    };
  }

  /**
   * Update revision history
   */
  updateRevisionHistory(contentId, revision) {
    if (!this.revisionHistory.has(contentId)) {
      this.revisionHistory.set(contentId, []);
    }
    
    const history = this.revisionHistory.get(contentId);
    history.push(revision);
    
    // Keep only last 10 revisions per content
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Send confirmation via WhatsApp
   */
  async sendConfirmation(phoneNumber, result) {
    const message = `✅ ${result.message}`;
    
    // Placeholder for actual WhatsApp API integration
    logger.info(`[${this.agentId}] Would send WhatsApp to ${phoneNumber}: ${message}`);
  }

  /**
   * Send error response
   */
  async sendErrorResponse(phoneNumber, errorMessage) {
    const message = `❌ Error: ${errorMessage}`;
    
    // Placeholder for actual WhatsApp API integration
    logger.info(`[${this.agentId}] Would send WhatsApp to ${phoneNumber}: ${message}`);
    
    return {
      status: 'error',
      message: errorMessage
    };
  }

  /**
   * Update content in Google Sheets
   */
  async updateContentInSheets(contentId, newContent) {
    // Placeholder for Google Sheets API integration
    logger.info(`[${this.agentId}] Updating content ${contentId} in Google Sheets`);
    
    // Increment revision count
    if (newContent.metadata) {
      newContent.metadata.revision_count = (newContent.metadata.revision_count || 0) + 1;
    }
  }

  /**
   * Update content status
   */
  async updateContentStatus(contentId, status, method, requesterPhone) {
    // Placeholder for Google Sheets API integration
    logger.info(`[${this.agentId}] Updating status of ${contentId} to ${status} (${method}) by ${requesterPhone}`);
  }

  /**
   * Send message to content-orchestrator
   */
  async sendToOrchestrator(message) {
    // Placeholder for actual orchestrator communication
    logger.info(`[${this.agentId}] Sending to orchestrator:`, message.action);
    
    // Simulate orchestrator response
    return {
      payload: {
        content: {
          id: message.payload.content_id,
          platforms: {
            whatsapp: { text: 'Revised content for WhatsApp', image_url: '' },
            linkedin: { post: 'Revised content for LinkedIn', image_url: '' },
            status: { text: 'Revised status', image_url: '' }
          },
          metadata: {
            fatigue_score: 0.9,
            compliance_score: 1.0,
            quality_score: 0.85,
            relevance_score: 0.9,
            revision_count: 1
          }
        }
      }
    };
  }

  /**
   * Get revision history for content
   */
  getRevisionHistory(contentId) {
    return this.revisionHistory.get(contentId) || [];
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
    this.revisionHistory.clear();
  }
}

// Export singleton instance
module.exports = new RevisionHandler();

// Also export class for testing
module.exports.RevisionHandler = RevisionHandler;