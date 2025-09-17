#!/usr/bin/env node

/**
 * Agent Communication Bus
 *
 * This system provides sophisticated inter-agent communication capabilities including:
 * - Message queuing and routing
 * - Bidirectional communication protocols
 * - Message persistence and reliability
 * - Real-time event broadcasting
 * - Communication analytics and monitoring
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

class AgentCommunicationBus extends EventEmitter {
  constructor() {
    super();

    this.messageQueue = new Map(); // Map<agentName, Message[]>
    this.pendingMessages = new Map(); // Map<messageId, Message>
    this.messageHistory = [];
    this.subscribers = new Map(); // Map<eventType, Set<callback>>
    this.routingTable = new Map(); // Map<agentName, RoutingConfig>
    this.communicationStats = {
      totalMessages: 0,
      messagesByType: {},
      messagesByAgent: {},
      averageResponseTime: 0,
      failedMessages: 0
    };

    // Agent communication protocols
    this.protocols = {
      'data-request': this.handleDataRequest.bind(this),
      'validation-feedback': this.handleValidationFeedback.bind(this),
      'status-update': this.handleStatusUpdate.bind(this),
      'error-report': this.handleErrorReport.bind(this),
      'coordination-request': this.handleCoordinationRequest.bind(this),
      'content-improvement': this.handleContentImprovement.bind(this),
      'dependency-check': this.handleDependencyCheck.bind(this),
      'workflow-signal': this.handleWorkflowSignal.bind(this)
    };

    // Initialize communication bus
    this.initializeCommunicationBus();
  }

  async initializeCommunicationBus() {
    try {
      // Create necessary directories
      await fs.mkdir('data/agent-communication', { recursive: true });
      await fs.mkdir('data/message-queue', { recursive: true });
      await fs.mkdir('logs/communication', { recursive: true });

      // Load persisted messages
      await this.loadPersistedMessages();

      // Start message processing
      this.startMessageProcessor();

      console.log('🔄 Agent Communication Bus initialized');

    } catch (error) {
      console.error('Failed to initialize communication bus:', error);
    }
  }

  async sendMessage(fromAgent, toAgent, messageType, payload, options = {}) {
    try {
      const message = {
        id: this.generateMessageId(),
        fromAgent,
        toAgent,
        messageType,
        payload,
        timestamp: Date.now(),
        priority: options.priority || 'medium',
        ttl: options.ttl || 300000, // 5 minutes default TTL
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        status: 'pending',
        route: options.route || 'direct',
        requiresAck: options.requiresAck !== false,
        tags: options.tags || []
      };

      // Validate message
      const validation = await this.validateMessage(message);
      if (!validation.valid) {
        throw new Error(`Message validation failed: ${validation.reason}`);
      }

      // Route message
      await this.routeMessage(message);

      // Update statistics
      this.updateCommunicationStats(message);

      // Log message
      await this.logMessage(message, 'sent');

      // Emit event for real-time monitoring
      this.emit('message-sent', message);

      return {
        success: true,
        messageId: message.id,
        message: `Message sent from ${fromAgent} to ${toAgent}`
      };

    } catch (error) {
      console.error('Error sending message:', error);
      this.communicationStats.failedMessages++;

      return {
        success: false,
        error: error.message
      };
    }
  }

  async routeMessage(message) {
    const routingConfig = this.routingTable.get(message.toAgent);

    if (routingConfig && routingConfig.customHandler) {
      // Custom routing logic
      await routingConfig.customHandler(message);
    } else {
      // Default routing: add to recipient's queue
      await this.addToQueue(message.toAgent, message);
    }

    // Handle message broadcasting if needed
    if (message.route === 'broadcast') {
      await this.broadcastMessage(message);
    }

    // Store pending message for acknowledgment tracking
    if (message.requiresAck) {
      this.pendingMessages.set(message.id, message);
    }
  }

  async addToQueue(agentName, message) {
    if (!this.messageQueue.has(agentName)) {
      this.messageQueue.set(agentName, []);
    }

    const queue = this.messageQueue.get(agentName);

    // Insert message based on priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const messagePriority = priorityOrder[message.priority] || 2;

    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      const queuedPriority = priorityOrder[queue[i].priority] || 2;
      if (messagePriority < queuedPriority) {
        insertIndex = i;
        break;
      }
    }

    queue.splice(insertIndex, 0, message);

    // Persist queue to disk
    await this.persistQueue(agentName);

    // Notify agent of new message
    await this.notifyAgent(agentName, message);
  }

  async getMessages(agentName, options = {}) {
    try {
      const queue = this.messageQueue.get(agentName) || [];

      let messages = [...queue];

      // Filter by message type if specified
      if (options.messageType) {
        messages = messages.filter(m => m.messageType === options.messageType);
      }

      // Filter by priority if specified
      if (options.priority) {
        messages = messages.filter(m => m.priority === options.priority);
      }

      // Limit number of messages
      if (options.limit) {
        messages = messages.slice(0, options.limit);
      }

      // Mark messages as delivered if not peek mode
      if (!options.peek) {
        for (const message of messages) {
          message.status = 'delivered';
          message.deliveredAt = Date.now();

          await this.logMessage(message, 'delivered');
        }

        // Remove delivered messages from queue
        if (!options.keepInQueue) {
          const remainingMessages = queue.filter(m => !messages.includes(m));
          this.messageQueue.set(agentName, remainingMessages);
          await this.persistQueue(agentName);
        }
      }

      return {
        success: true,
        messages,
        queueSize: queue.length,
        agent: agentName
      };

    } catch (error) {
      console.error(`Error getting messages for ${agentName}:`, error);
      return {
        success: false,
        error: error.message,
        messages: []
      };
    }
  }

  async acknowledgeMessage(messageId, agentName, response = null) {
    try {
      const message = this.pendingMessages.get(messageId);

      if (!message) {
        throw new Error('Message not found or already acknowledged');
      }

      if (message.toAgent !== agentName) {
        throw new Error('Agent not authorized to acknowledge this message');
      }

      // Update message status
      message.status = 'acknowledged';
      message.acknowledgedAt = Date.now();
      message.responseTime = message.acknowledgedAt - message.timestamp;
      message.response = response;

      // Remove from pending messages
      this.pendingMessages.delete(messageId);

      // Update statistics
      this.updateResponseTimeStats(message.responseTime);

      // Log acknowledgment
      await this.logMessage(message, 'acknowledged');

      // Emit event
      this.emit('message-acknowledged', message);

      // Handle protocol-specific response
      if (this.protocols[message.messageType]) {
        await this.protocols[message.messageType](message, response);
      }

      return {
        success: true,
        message: 'Message acknowledged successfully'
      };

    } catch (error) {
      console.error('Error acknowledging message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async broadcastMessage(message) {
    const allAgents = [
      'advisor-data-manager',
      'market-intelligence',
      'segment-analyzer',
      'linkedin-post-generator',
      'whatsapp-message-creator',
      'status-image-designer',
      'gemini-image-generator',
      'brand-customizer',
      'compliance-validator',
      'quality-scorer',
      'fatigue-checker',
      'distribution-controller',
      'analytics-tracker',
      'feedback-processor'
    ];

    for (const agent of allAgents) {
      if (agent !== message.fromAgent) {
        const broadcastMessage = {
          ...message,
          id: this.generateMessageId(),
          toAgent: agent,
          route: 'broadcast-copy'
        };

        await this.addToQueue(agent, broadcastMessage);
      }
    }
  }

  // Protocol Handlers

  async handleDataRequest(message, response) {
    // Handle data request protocol
    if (response && response.data) {
      const dataMessage = {
        fromAgent: message.toAgent,
        toAgent: message.fromAgent,
        messageType: 'data-response',
        payload: response.data,
        correlationId: message.id
      };

      await this.routeMessage(dataMessage);
    }
  }

  async handleValidationFeedback(message, response) {
    // Handle validation feedback protocol
    if (message.payload.validationResult === 'failed') {
      // Trigger content regeneration
      const regenerationMessage = {
        fromAgent: message.fromAgent,
        toAgent: message.payload.originalAgent,
        messageType: 'regeneration-request',
        payload: {
          reason: message.payload.reason,
          suggestions: message.payload.suggestions,
          originalContent: message.payload.originalContent
        }
      };

      await this.routeMessage(regenerationMessage);
    }
  }

  async handleStatusUpdate(message, response) {
    // Broadcast status updates to interested agents
    if (message.payload.broadcastStatus) {
      const statusMessage = {
        ...message,
        route: 'broadcast',
        messageType: 'agent-status-broadcast'
      };

      await this.broadcastMessage(statusMessage);
    }
  }

  async handleErrorReport(message, response) {
    // Handle error reporting and escalation
    if (message.payload.severity === 'critical') {
      // Escalate to system administrators
      const escalationMessage = {
        fromAgent: 'communication-bus',
        toAgent: 'system-administrator',
        messageType: 'critical-error-escalation',
        payload: {
          originalError: message.payload,
          sourceAgent: message.fromAgent,
          timestamp: Date.now()
        },
        priority: 'critical'
      };

      await this.routeMessage(escalationMessage);
    }
  }

  async handleCoordinationRequest(message, response) {
    // Handle agent coordination requests
    if (message.payload.requestType === 'dependency-wait') {
      // Coordinate with dependencies
      const dependencyAgents = message.payload.dependencies || [];

      for (const depAgent of dependencyAgents) {
        const coordMessage = {
          fromAgent: message.fromAgent,
          toAgent: depAgent,
          messageType: 'dependency-check',
          payload: {
            waitingAgent: message.fromAgent,
            requiredOutput: message.payload.requiredOutput
          }
        };

        await this.routeMessage(coordMessage);
      }
    }
  }

  async handleContentImprovement(message, response) {
    // Handle content improvement suggestions
    const targetAgent = message.payload.targetAgent;

    const improvementMessage = {
      fromAgent: message.fromAgent,
      toAgent: targetAgent,
      messageType: 'improvement-suggestion',
      payload: {
        suggestions: message.payload.suggestions,
        qualityScore: message.payload.qualityScore,
        improvementAreas: message.payload.improvementAreas
      }
    };

    await this.routeMessage(improvementMessage);
  }

  async handleDependencyCheck(message, response) {
    // Check if dependencies are ready
    const waitingAgent = message.payload.waitingAgent;
    const requiredOutput = message.payload.requiredOutput;

    const dependencyReady = await this.checkDependencyReadiness(
      message.toAgent,
      requiredOutput
    );

    const responseMessage = {
      fromAgent: message.toAgent,
      toAgent: waitingAgent,
      messageType: 'dependency-status',
      payload: {
        ready: dependencyReady,
        agent: message.toAgent,
        output: requiredOutput
      }
    };

    await this.routeMessage(responseMessage);
  }

  async handleWorkflowSignal(message, response) {
    // Handle workflow control signals
    const signal = message.payload.signal;

    switch (signal) {
      case 'pause':
        await this.pauseWorkflow(message.payload.workflowId);
        break;
      case 'resume':
        await this.resumeWorkflow(message.payload.workflowId);
        break;
      case 'abort':
        await this.abortWorkflow(message.payload.workflowId);
        break;
    }
  }

  // Utility Methods

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async validateMessage(message) {
    // Basic validation
    if (!message.fromAgent || !message.toAgent || !message.messageType) {
      return { valid: false, reason: 'Missing required fields' };
    }

    // Check if agents exist
    const validAgents = [
      'advisor-data-manager', 'market-intelligence', 'segment-analyzer',
      'linkedin-post-generator', 'whatsapp-message-creator', 'status-image-designer',
      'gemini-image-generator', 'brand-customizer', 'compliance-validator',
      'quality-scorer', 'fatigue-checker', 'distribution-controller',
      'analytics-tracker', 'feedback-processor', 'system-administrator',
      'communication-bus'
    ];

    if (!validAgents.includes(message.fromAgent) || !validAgents.includes(message.toAgent)) {
      return { valid: false, reason: 'Invalid agent names' };
    }

    // Check message type
    const validMessageTypes = Object.keys(this.protocols).concat([
      'data-response', 'regeneration-request', 'agent-status-broadcast',
      'critical-error-escalation', 'improvement-suggestion', 'dependency-status'
    ]);

    if (!validMessageTypes.includes(message.messageType)) {
      return { valid: false, reason: 'Invalid message type' };
    }

    return { valid: true };
  }

  async checkDependencyReadiness(agentName, requiredOutput) {
    try {
      // Check if agent has completed and produced required output
      const outputMappings = {
        'advisor-data-manager': ['data/advisor-data.json'],
        'market-intelligence': ['data/market-intelligence.json'],
        'segment-analyzer': ['data/segment-analysis.json'],
        'linkedin-post-generator': ['data/linkedin-posts.json'],
        'whatsapp-message-creator': ['data/whatsapp-messages.json'],
        'compliance-validator': ['data/compliance-validation.json'],
        'quality-scorer': ['data/quality-scores.json']
      };

      const expectedFiles = outputMappings[agentName] || [];

      for (const file of expectedFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          return false;
        }
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  async notifyAgent(agentName, message) {
    try {
      // Create notification file for agent
      const notificationData = {
        agentName,
        messageId: message.id,
        messageType: message.messageType,
        fromAgent: message.fromAgent,
        priority: message.priority,
        timestamp: message.timestamp,
        hasNewMessages: true
      };

      await fs.writeFile(
        `data/agent-communication/notification-${agentName}-${Date.now()}.json`,
        JSON.stringify(notificationData, null, 2)
      );

    } catch (error) {
      console.error(`Failed to notify agent ${agentName}:`, error);
    }
  }

  async persistQueue(agentName) {
    try {
      const queue = this.messageQueue.get(agentName) || [];
      await fs.writeFile(
        `data/message-queue/${agentName}-queue.json`,
        JSON.stringify(queue, null, 2)
      );
    } catch (error) {
      console.error(`Failed to persist queue for ${agentName}:`, error);
    }
  }

  async loadPersistedMessages() {
    try {
      const files = await fs.readdir('data/message-queue');

      for (const file of files) {
        if (file.endsWith('-queue.json')) {
          const agentName = file.replace('-queue.json', '');
          const content = await fs.readFile(`data/message-queue/${file}`, 'utf-8');
          const queue = JSON.parse(content);

          this.messageQueue.set(agentName, queue);
        }
      }

      console.log(`Loaded message queues for ${this.messageQueue.size} agents`);

    } catch (error) {
      console.log('No persisted messages found, starting fresh');
    }
  }

  async logMessage(message, eventType) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        messageId: message.id,
        fromAgent: message.fromAgent,
        toAgent: message.toAgent,
        messageType: message.messageType,
        priority: message.priority,
        status: message.status,
        responseTime: message.responseTime
      };

      await fs.appendFile(
        'logs/communication/message-log.jsonl',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  updateCommunicationStats(message) {
    this.communicationStats.totalMessages++;

    this.communicationStats.messagesByType[message.messageType] =
      (this.communicationStats.messagesByType[message.messageType] || 0) + 1;

    this.communicationStats.messagesByAgent[message.fromAgent] =
      (this.communicationStats.messagesByAgent[message.fromAgent] || 0) + 1;
  }

  updateResponseTimeStats(responseTime) {
    const currentAvg = this.communicationStats.averageResponseTime;
    const totalMessages = this.communicationStats.totalMessages;

    this.communicationStats.averageResponseTime =
      ((currentAvg * (totalMessages - 1)) + responseTime) / totalMessages;
  }

  startMessageProcessor() {
    // Process expired messages every 30 seconds
    setInterval(async () => {
      await this.processExpiredMessages();
    }, 30000);

    // Process retry queue every 10 seconds
    setInterval(async () => {
      await this.processRetryQueue();
    }, 10000);
  }

  async processExpiredMessages() {
    const now = Date.now();

    for (const [messageId, message] of this.pendingMessages) {
      if (now - message.timestamp > message.ttl) {
        message.status = 'expired';
        await this.logMessage(message, 'expired');
        this.pendingMessages.delete(messageId);

        this.emit('message-expired', message);
      }
    }
  }

  async processRetryQueue() {
    // Implementation for retry logic
    // This would handle failed message retries
  }

  async getQueueStatus() {
    const status = {};

    for (const [agentName, queue] of this.messageQueue) {
      status[agentName] = {
        queueSize: queue.length,
        priorityBreakdown: this.getQueuePriorityBreakdown(queue),
        oldestMessage: queue.length > 0 ? queue[queue.length - 1].timestamp : null
      };
    }

    return {
      agents: status,
      pendingAcknowledgments: this.pendingMessages.size,
      statistics: this.communicationStats
    };
  }

  getQueuePriorityBreakdown(queue) {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const message of queue) {
      breakdown[message.priority] = (breakdown[message.priority] || 0) + 1;
    }

    return breakdown;
  }
}

// Export for use as module
export default AgentCommunicationBus;

// CLI interface
async function main() {
  const bus = new AgentCommunicationBus();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'send':
      const [fromAgent, toAgent, messageType] = args.slice(1);
      const payload = { message: args[4] || 'Test message' };

      const result = await bus.sendMessage(fromAgent, toAgent, messageType, payload);
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'get':
      const [agentName] = args.slice(1);
      const messages = await bus.getMessages(agentName);
      console.log(JSON.stringify(messages, null, 2));
      break;

    case 'status':
      const status = await bus.getQueueStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  node agent-communication-bus.js send <from> <to> <type> [message]');
      console.log('  node agent-communication-bus.js get <agent-name>');
      console.log('  node agent-communication-bus.js status');
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}