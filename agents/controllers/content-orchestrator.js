#!/usr/bin/env node

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

/**
 * ContentOrchestrator - Master controller for content generation workflow
 * Coordinates execution of sub-agents and manages the overall content creation process
 */
class ContentOrchestrator {
    constructor() {
        this.agentId = 'content-orchestrator';
        this.state = 'IDLE';
        this.sessionId = this.generateSessionId();
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.subAgents = {
            'content-strategist': null,
            'fatigue-checker': null,
            'compliance-validator': null,
            'advisor-manager': null,
            'content-generator': null,
            'image-creator': null,
            'approval-guardian': null,
            'revision-handler': null,
            'distribution-manager': null
        };
    }

    /**
     * Generates a unique session ID for tracking agent operations
     * @returns {string} Unique session identifier
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initializes the orchestrator with required dependencies
     * @returns {Promise<boolean>} True if initialization successful, false otherwise
     */
    async initialize() {
        try {
            this.setState('PROCESSING');
            
            const Communication = require('../utils/communication');
            const ErrorHandler = require('../utils/error-handler');
            const Logger = require('../utils/logger');
            
            this.communication = new Communication();
            this.errorHandler = new ErrorHandler();
            this.logger = new Logger(this.agentId);
            
            this.logger.info('Content Orchestrator initialized', {
                sessionId: this.sessionId,
                timestamp: new Date().toISOString()
            });
            
            this.setState('IDLE');
            return true;
        } catch (error) {
            this.setState('ERROR');
            console.error('Failed to initialize orchestrator:', error);
            return false;
        }
    }

    /**
     * Updates the agent's state with validation
     * @param {string} newState - The new state (IDLE, PROCESSING, WAITING, COMPLETED, ERROR, RETRY)
     */
    setState(newState) {
        const validStates = ['IDLE', 'PROCESSING', 'WAITING', 'COMPLETED', 'ERROR', 'RETRY'];
        if (validStates.includes(newState)) {
            this.state = newState;
            if (this.logger) {
                this.logger.debug(`State transition: ${this.state} -> ${newState}`, {
                    sessionId: this.sessionId
                });
            }
        }
    }

    /**
     * Reads active advisors from Google Sheets via advisor-manager agent
     * @returns {Promise<Array>} Array of active advisor objects
     * @throws {Error} If unable to fetch advisors
     */
    async readActiveAdvisors() {
        try {
            this.logger.info('Reading active advisors from Google Sheets');
            
            const message = this.communication.createMessage({
                agentId: 'advisor-manager',
                action: 'GET_ACTIVE_ADVISORS',
                payload: {
                    filters: {
                        subscription_status: 'active'
                    }
                },
                context: {
                    sessionId: this.sessionId,
                    parentAgent: this.agentId,
                    priority: 1
                },
                responseRequired: true
            });
            
            const response = await this.sendToSubAgent('advisor-manager', message);
            
            if (response && response.payload && response.payload.advisors) {
                this.logger.info(`Found ${response.payload.advisors.length} active advisors`);
                return response.payload.advisors;
            }
            
            return [];
        } catch (error) {
            this.logger.error('Failed to read active advisors', error);
            throw error;
        }
    }

    async orchestrateContentGeneration(advisorArn) {
        try {
            this.setState('PROCESSING');
            this.logger.info(`Starting content generation for advisor: ${advisorArn}`);
            
            const strategistMessage = this.communication.createMessage({
                agentId: 'content-strategist',
                action: 'GENERATE_TOPIC',
                payload: {
                    advisorArn: advisorArn
                },
                context: {
                    sessionId: this.sessionId,
                    parentAgent: this.agentId,
                    priority: 1
                },
                responseRequired: true
            });
            
            this.setState('WAITING');
            const topicResponse = await this.sendToSubAgent('content-strategist', strategistMessage);
            
            if (!topicResponse || !topicResponse.payload) {
                throw new Error('Content strategist failed to generate topic');
            }
            
            const fatigueMessage = this.communication.createMessage({
                agentId: 'fatigue-checker',
                action: 'CHECK_FATIGUE',
                payload: {
                    advisorArn: advisorArn,
                    topic: topicResponse.payload.topic
                },
                context: {
                    sessionId: this.sessionId,
                    parentAgent: this.agentId,
                    priority: 1
                },
                responseRequired: true
            });
            
            const fatigueResponse = await this.sendToSubAgent('fatigue-checker', fatigueMessage);
            
            if (fatigueResponse && fatigueResponse.payload && fatigueResponse.payload.fatigueScore > 0.7) {
                this.logger.warn(`High fatigue score detected for advisor ${advisorArn}: ${fatigueResponse.payload.fatigueScore}`);
            }
            
            const complianceMessage = this.communication.createMessage({
                agentId: 'compliance-validator',
                action: 'VALIDATE_CONTENT',
                payload: {
                    content: topicResponse.payload.content || topicResponse.payload.topic,
                    advisorArn: advisorArn
                },
                context: {
                    sessionId: this.sessionId,
                    parentAgent: this.agentId,
                    priority: 1
                },
                responseRequired: true
            });
            
            const complianceResponse = await this.sendToSubAgent('compliance-validator', complianceMessage);
            
            this.setState('COMPLETED');
            
            return {
                success: true,
                advisorArn: advisorArn,
                topic: topicResponse.payload,
                fatigueCheck: fatigueResponse ? fatigueResponse.payload : null,
                complianceCheck: complianceResponse ? complianceResponse.payload : null,
                sessionId: this.sessionId
            };
            
        } catch (error) {
            this.setState('ERROR');
            this.logger.error(`Orchestration failed for advisor ${advisorArn}`, error);
            
            const handled = await this.errorHandler.handleError(error, {
                advisorArn: advisorArn,
                sessionId: this.sessionId
            });
            
            if (handled && handled.retry) {
                this.setState('RETRY');
                return await this.orchestrateContentGeneration(advisorArn);
            }
            
            throw error;
        }
    }

    async sendToSubAgent(agentName, message) {
        try {
            const AgentClass = this.loadSubAgent(agentName);
            if (!AgentClass) {
                throw new Error(`Sub-agent ${agentName} not found`);
            }
            
            const agent = new AgentClass();
            await agent.initialize();
            
            const response = await agent.processMessage(message);
            
            return response;
        } catch (error) {
            this.logger.error(`Failed to communicate with ${agentName}`, error);
            
            for (let i = 0; i < this.maxRetries; i++) {
                await this.delay(this.retryDelay * Math.pow(2, i));
                
                try {
                    const retryResponse = await this.retrySubAgentCall(agentName, message);
                    if (retryResponse) {
                        return retryResponse;
                    }
                } catch (retryError) {
                    this.logger.warn(`Retry ${i + 1} failed for ${agentName}`);
                }
            }
            
            throw error;
        }
    }

    loadSubAgent(agentName) {
        try {
            const agentPaths = {
                'advisor-manager': '../managers/advisor-manager',
                'content-strategist': '../generators/content-strategist',
                'fatigue-checker': '../validators/fatigue-checker',
                'compliance-validator': '../validators/compliance-validator'
            };
            
            if (agentPaths[agentName]) {
                return require(agentPaths[agentName]);
            }
            
            return null;
        } catch (error) {
            this.logger.error(`Failed to load sub-agent ${agentName}`, error);
            return null;
        }
    }

    async retrySubAgentCall(agentName, message) {
        try {
            const AgentClass = this.loadSubAgent(agentName);
            if (!AgentClass) {
                return null;
            }
            
            const agent = new AgentClass();
            await agent.initialize();
            
            return await agent.processMessage(message);
        } catch (error) {
            return null;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async test() {
        console.log('=== Content Orchestrator Test Mode ===');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize orchestrator');
            return;
        }
        
        console.log(`Session ID: ${this.sessionId}`);
        console.log(`Current State: ${this.state}`);
        console.log('Sub-agents configured:', Object.keys(this.subAgents));
        
        const testMessage = this.communication.createMessage({
            agentId: this.agentId,
            action: 'TEST',
            payload: {
                test: true
            },
            context: {
                sessionId: this.sessionId,
                parentAgent: 'test',
                priority: 1
            },
            responseRequired: false
        });
        
        console.log('Test message structure:', JSON.stringify(testMessage, null, 2));
        console.log('=== Test Complete ===');
    }

    async processMessage(message) {
        try {
            if (!this.communication.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            const { action, payload } = message;
            
            switch (action) {
                case 'ORCHESTRATE_CONTENT':
                    return await this.orchestrateContentGeneration(payload.advisorArn);
                
                case 'GET_ACTIVE_ADVISORS':
                    const advisors = await this.readActiveAdvisors();
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'ACTIVE_ADVISORS_RESPONSE',
                        payload: { advisors },
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GET_STATUS':
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'STATUS_RESPONSE',
                        payload: {
                            state: this.state,
                            sessionId: this.sessionId
                        },
                        context: message.context,
                        responseRequired: false
                    });
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Failed to process message', error);
            return this.communication.createMessage({
                agentId: this.agentId,
                action: 'ERROR_RESPONSE',
                payload: {
                    error: error.message
                },
                context: message.context,
                responseRequired: false
            });
        }
    }

    /**
     * Health check endpoint for monitoring agent status
     * @returns {Promise<Object>} Health status including state, uptime, and sub-agent statuses
     */
    async getHealthStatus() {
        const healthData = {
            agentId: this.agentId,
            status: 'healthy',
            state: this.state,
            sessionId: this.sessionId,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            subAgents: {},
            dependencies: {
                communication: !!this.communication,
                errorHandler: !!this.errorHandler,
                logger: !!this.logger
            }
        };

        // Check sub-agent connectivity
        for (const agentName of Object.keys(this.subAgents)) {
            try {
                const message = this.communication.createMessage({
                    agentId: this.agentId,
                    action: 'HEALTH_CHECK',
                    payload: {},
                    context: {
                        sessionId: this.sessionId,
                        parentAgent: this.agentId
                    }
                });
                
                // For now, mark as available if we can create a message
                healthData.subAgents[agentName] = 'available';
            } catch (error) {
                healthData.subAgents[agentName] = 'unavailable';
                healthData.status = 'degraded';
            }
        }

        // Check if in error state
        if (this.state === 'ERROR') {
            healthData.status = 'unhealthy';
        }

        return healthData;
    }

    /**
     * HTTP health check handler for integration with monitoring systems
     * @param {Object} req - HTTP request object
     * @param {Object} res - HTTP response object
     */
    async handleHealthCheck(req, res) {
        try {
            const health = await this.getHealthStatus();
            const statusCode = health.status === 'healthy' ? 200 : 
                              health.status === 'degraded' ? 206 : 503;
            
            if (res && typeof res.status === 'function') {
                res.status(statusCode).json(health);
            } else {
                return { statusCode, body: health };
            }
        } catch (error) {
            const errorResponse = {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            if (res && typeof res.status === 'function') {
                res.status(500).json(errorResponse);
            } else {
                return { statusCode: 500, body: errorResponse };
            }
        }
    }
}

if (require.main === module) {
    const orchestrator = new ContentOrchestrator();
    
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        orchestrator.test();
    } else {
        orchestrator.initialize().then(() => {
            console.log('Content Orchestrator running...');
        });
    }
}

module.exports = ContentOrchestrator;