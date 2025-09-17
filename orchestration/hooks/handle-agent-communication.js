#!/usr/bin/env node

/**
 * Handle Agent Communication Hook
 *
 * This hook processes agent-to-agent communication requests and facilitates
 * bidirectional feedback loops through the communication bus.
 */

import AgentCommunicationBus from '../communication/agent-communication-bus.js';
import fs from 'fs/promises';

class AgentCommunicationHandler {
  constructor() {
    this.communicationBus = new AgentCommunicationBus();
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await this.communicationBus.initializeCommunicationBus();
      this.initialized = true;
    }
  }

  async handleCommunication() {
    try {
      await this.initialize();

      // Get current agent and workflow context
      const context = await this.getCurrentContext();

      if (!context) {
        console.log('No communication context found');
        return;
      }

      // Process outbound communications from the current agent
      await this.processOutboundCommunications(context);

      // Process inbound communications to the current agent
      await this.processInboundCommunications(context);

      // Handle specific communication scenarios
      await this.handleSpecificScenarios(context);

    } catch (error) {
      console.error('Error handling agent communication:', error);
    }
  }

  async getCurrentContext() {
    try {
      // Get current agent from various sources
      const currentAgent = process.env.CURRENT_AGENT ||
                          await this.detectCurrentAgentFromWorkflow() ||
                          await this.detectCurrentAgentFromFiles();

      if (!currentAgent) return null;

      // Get workflow state
      const workflowState = await this.loadWorkflowState();

      // Get agent execution state
      const executionState = await this.loadExecutionState(workflowState?.workflowId);

      return {
        currentAgent,
        workflowState,
        executionState,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error getting current context:', error);
      return null;
    }
  }

  async processOutboundCommunications(context) {
    try {
      const { currentAgent } = context;

      // Check if current agent has communication requests
      const communicationRequests = await this.findCommunicationRequests(currentAgent);

      for (const request of communicationRequests) {
        await this.processCommunicationRequest(request, context);
      }

    } catch (error) {
      console.error('Error processing outbound communications:', error);
    }
  }

  async processInboundCommunications(context) {
    try {
      const { currentAgent } = context;

      // Get messages for current agent
      const messageResult = await this.communicationBus.getMessages(currentAgent, {
        limit: 10,
        peek: false
      });

      if (messageResult.success && messageResult.messages.length > 0) {
        console.log(`📨 Processing ${messageResult.messages.length} inbound messages for ${currentAgent}`);

        for (const message of messageResult.messages) {
          await this.processInboundMessage(message, context);
        }
      }

    } catch (error) {
      console.error('Error processing inbound communications:', error);
    }
  }

  async findCommunicationRequests(agentName) {
    try {
      const requests = [];

      // Check for communication request files
      const communicationDir = 'data/agent-communication';

      try {
        const files = await fs.readdir(communicationDir);
        const requestFiles = files.filter(f =>
          f.startsWith(`request-${agentName}-`) && f.endsWith('.json')
        );

        for (const file of requestFiles) {
          const content = await fs.readFile(`${communicationDir}/${file}`, 'utf-8');
          const request = JSON.parse(content);

          requests.push({
            ...request,
            sourceFile: file
          });
        }
      } catch (error) {
        // No requests found
      }

      return requests;

    } catch (error) {
      console.error('Error finding communication requests:', error);
      return [];
    }
  }

  async processCommunicationRequest(request, context) {
    try {
      console.log(`📤 Processing outbound communication: ${request.messageType} to ${request.toAgent}`);

      // Send message via communication bus
      const result = await this.communicationBus.sendMessage(
        request.fromAgent,
        request.toAgent,
        request.messageType,
        request.payload,
        request.options || {}
      );

      if (result.success) {
        console.log(`✅ Message sent: ${result.messageId}`);

        // Mark request as processed
        await this.markRequestAsProcessed(request);

        // Log successful communication
        await this.logCommunication(request, 'sent', result);

      } else {
        console.error(`❌ Failed to send message: ${result.error}`);

        // Handle failed communication
        await this.handleFailedCommunication(request, result.error);
      }

    } catch (error) {
      console.error('Error processing communication request:', error);
    }
  }

  async processInboundMessage(message, context) {
    try {
      console.log(`📥 Processing inbound message: ${message.messageType} from ${message.fromAgent}`);

      // Handle different message types
      const response = await this.handleMessageByType(message, context);

      // Send acknowledgment if required
      if (message.requiresAck) {
        await this.communicationBus.acknowledgeMessage(
          message.id,
          context.currentAgent,
          response
        );
      }

      // Take action based on message
      await this.takeActionOnMessage(message, response, context);

      // Log message processing
      await this.logCommunication(message, 'received', { response });

    } catch (error) {
      console.error('Error processing inbound message:', error);
    }
  }

  async handleMessageByType(message, context) {
    const { messageType, payload, fromAgent } = message;
    const { currentAgent } = context;

    switch (messageType) {
      case 'data-request':
        return await this.handleDataRequest(payload, currentAgent);

      case 'validation-feedback':
        return await this.handleValidationFeedback(payload, currentAgent);

      case 'regeneration-request':
        return await this.handleRegenerationRequest(payload, currentAgent);

      case 'improvement-suggestion':
        return await this.handleImprovementSuggestion(payload, currentAgent);

      case 'dependency-check':
        return await this.handleDependencyCheck(payload, currentAgent);

      case 'dependency-status':
        return await this.handleDependencyStatus(payload, currentAgent);

      case 'coordination-request':
        return await this.handleCoordinationRequest(payload, currentAgent);

      case 'workflow-signal':
        return await this.handleWorkflowSignal(payload, currentAgent);

      case 'status-update':
        return await this.handleStatusUpdate(payload, fromAgent);

      case 'error-report':
        return await this.handleErrorReport(payload, fromAgent);

      default:
        console.log(`⚠️ Unknown message type: ${messageType}`);
        return { status: 'unknown-message-type' };
    }
  }

  async handleDataRequest(payload, currentAgent) {
    try {
      const { dataType, parameters } = payload;

      let data = null;

      switch (dataType) {
        case 'market-data':
          data = await this.getMarketData();
          break;

        case 'advisor-data':
          data = await this.getAdvisorData();
          break;

        case 'content-data':
          data = await this.getContentData(parameters);
          break;

        case 'validation-status':
          data = await this.getValidationStatus();
          break;

        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      return {
        status: 'success',
        data,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleValidationFeedback(payload, currentAgent) {
    try {
      const { validationResult, issues, suggestions } = payload;

      if (validationResult === 'failed') {
        // Create regeneration trigger
        await this.createRegenerationTrigger(currentAgent, {
          issues,
          suggestions,
          triggeredBy: 'validation-feedback'
        });

        return {
          status: 'regeneration-triggered',
          message: 'Content regeneration has been queued'
        };
      }

      return {
        status: 'acknowledged',
        message: 'Validation feedback received'
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleRegenerationRequest(payload, currentAgent) {
    try {
      const { reason, suggestions, originalContent } = payload;

      // Trigger content regeneration
      await this.triggerContentRegeneration(currentAgent, {
        reason,
        suggestions,
        originalContent
      });

      return {
        status: 'regeneration-started',
        message: 'Content regeneration initiated'
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleImprovementSuggestion(payload, currentAgent) {
    try {
      const { suggestions, qualityScore, improvementAreas } = payload;

      // Apply improvement suggestions to future content generation
      await this.applyImprovementSuggestions(currentAgent, {
        suggestions,
        qualityScore,
        improvementAreas
      });

      return {
        status: 'improvements-applied',
        message: 'Improvement suggestions have been incorporated'
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleDependencyCheck(payload, currentAgent) {
    try {
      const { waitingAgent, requiredOutput } = payload;

      // Check if current agent has produced required output
      const outputReady = await this.checkOutputReadiness(currentAgent, requiredOutput);

      // Send status back to waiting agent
      await this.communicationBus.sendMessage(
        currentAgent,
        waitingAgent,
        'dependency-status',
        {
          ready: outputReady,
          agent: currentAgent,
          requiredOutput,
          timestamp: Date.now()
        }
      );

      return {
        status: 'dependency-status-sent',
        ready: outputReady
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleDependencyStatus(payload, currentAgent) {
    try {
      const { ready, agent, requiredOutput } = payload;

      if (ready) {
        // Dependency is ready, can proceed
        await this.markDependencyAsReady(currentAgent, agent, requiredOutput);

        return {
          status: 'dependency-ready',
          message: `Dependency ${agent} is ready`
        };
      } else {
        // Dependency not ready, wait or reschedule
        await this.handleDependencyNotReady(currentAgent, agent, requiredOutput);

        return {
          status: 'dependency-waiting',
          message: `Waiting for dependency ${agent}`
        };
      }

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async handleSpecificScenarios(context) {
    try {
      const { currentAgent, workflowState, executionState } = context;

      // Scenario 1: Compliance validation failed
      if (currentAgent === 'compliance-validator') {
        await this.handleComplianceScenario(context);
      }

      // Scenario 2: Quality score too low
      if (currentAgent === 'quality-scorer') {
        await this.handleQualityScenario(context);
      }

      // Scenario 3: Content fatigue detected
      if (currentAgent === 'fatigue-checker') {
        await this.handleFatigueScenario(context);
      }

      // Scenario 4: Distribution coordination
      if (currentAgent === 'distribution-controller') {
        await this.handleDistributionScenario(context);
      }

    } catch (error) {
      console.error('Error handling specific scenarios:', error);
    }
  }

  async handleComplianceScenario(context) {
    try {
      // Check if compliance validation failed
      const complianceData = await this.loadFile('data/compliance-validation.json');

      if (complianceData && complianceData.overallCompliance < 1.0) {
        console.log('🚨 Compliance issues detected, triggering feedback loop');

        // Send feedback to content generators
        const contentAgents = ['linkedin-post-generator', 'whatsapp-message-creator'];

        for (const agent of contentAgents) {
          await this.communicationBus.sendMessage(
            'compliance-validator',
            agent,
            'validation-feedback',
            {
              validationResult: 'failed',
              issues: complianceData.violations,
              suggestions: complianceData.suggestions,
              severity: 'critical'
            },
            { priority: 'critical' }
          );
        }
      }

    } catch (error) {
      console.error('Error handling compliance scenario:', error);
    }
  }

  async handleQualityScenario(context) {
    try {
      // Check quality scores
      const qualityData = await this.loadFile('data/quality-scores.json');

      if (qualityData && qualityData.averageScore < 0.8) {
        console.log('📈 Low quality detected, sending improvement suggestions');

        // Send improvement suggestions
        const contentAgents = ['linkedin-post-generator', 'whatsapp-message-creator'];

        for (const agent of contentAgents) {
          await this.communicationBus.sendMessage(
            'quality-scorer',
            agent,
            'improvement-suggestion',
            {
              qualityScore: qualityData.averageScore,
              suggestions: qualityData.improvementSuggestions,
              improvementAreas: qualityData.weakAreas
            },
            { priority: 'high' }
          );
        }
      }

    } catch (error) {
      console.error('Error handling quality scenario:', error);
    }
  }

  // Utility methods

  async loadFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async loadWorkflowState() {
    return await this.loadFile('data/orchestration-state/active-workflow.json');
  }

  async loadExecutionState(workflowId) {
    if (!workflowId) return null;
    return await this.loadFile(`data/orchestration-state/${workflowId}.json`);
  }

  async detectCurrentAgentFromWorkflow() {
    const workflowState = await this.loadWorkflowState();
    return workflowState?.currentAgent;
  }

  async detectCurrentAgentFromFiles() {
    // Try to detect from recent execution files
    try {
      const files = await fs.readdir('data/orchestration-state');
      const executeFiles = files.filter(f =>
        f.startsWith('execute-') && f.endsWith('.json')
      );

      if (executeFiles.length === 0) return null;

      // Get most recent
      executeFiles.sort((a, b) => {
        const timeA = parseInt(a.match(/execute-.+-(\d+)\.json/)?.[1] || '0');
        const timeB = parseInt(b.match(/execute-.+-(\d+)\.json/)?.[1] || '0');
        return timeB - timeA;
      });

      const recentFile = executeFiles[0];
      const content = await fs.readFile(`data/orchestration-state/${recentFile}`, 'utf-8');
      const executeData = JSON.parse(content);

      return executeData.agent;

    } catch (error) {
      return null;
    }
  }

  async markRequestAsProcessed(request) {
    try {
      if (request.sourceFile) {
        const processedFile = request.sourceFile.replace('request-', 'processed-');
        await fs.rename(
          `data/agent-communication/${request.sourceFile}`,
          `data/agent-communication/${processedFile}`
        );
      }
    } catch (error) {
      console.error('Error marking request as processed:', error);
    }
  }

  async logCommunication(messageOrRequest, eventType, result) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        messageId: messageOrRequest.id,
        fromAgent: messageOrRequest.fromAgent,
        toAgent: messageOrRequest.toAgent,
        messageType: messageOrRequest.messageType,
        result
      };

      await fs.appendFile(
        'logs/communication/agent-communication.log',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      console.error('Error logging communication:', error);
    }
  }
}

// Main execution
async function main() {
  const handler = new AgentCommunicationHandler();
  await handler.handleCommunication();
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AgentCommunicationHandler;