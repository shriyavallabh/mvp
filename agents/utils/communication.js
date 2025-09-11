#!/usr/bin/env node

class Communication {
    constructor() {
        this.messageSchema = {
            agent_id: { type: 'string', required: true },
            timestamp: { type: 'string', required: true },
            action: { type: 'string', required: true },
            payload: { type: 'object', required: true },
            context: { type: 'object', required: true },
            response_required: { type: 'boolean', required: false, default: false }
        };
        
        this.contextSchema = {
            sessionId: { type: 'string', required: true },
            parentAgent: { type: 'string', required: true },
            priority: { type: 'number', required: false, default: 1 }
        };
    }

    createMessage(options) {
        const {
            agentId,
            action,
            payload = {},
            context = {},
            responseRequired = false
        } = options;
        
        if (!agentId || !action) {
            throw new Error('agentId and action are required for message creation');
        }
        
        if (!context.sessionId) {
            context.sessionId = this.generateSessionId();
        }
        
        if (!context.parentAgent) {
            context.parentAgent = agentId;
        }
        
        if (context.priority === undefined) {
            context.priority = 1;
        }
        
        const message = {
            agent_id: agentId,
            timestamp: new Date().toISOString(),
            action: action,
            payload: payload,
            context: context,
            response_required: responseRequired
        };
        
        return message;
    }

    validateMessage(message) {
        if (!message || typeof message !== 'object') {
            return false;
        }
        
        // Check required fields
        for (const [field, schema] of Object.entries(this.messageSchema)) {
            if (schema.required && !message.hasOwnProperty(field)) {
                console.error(`Missing required field: ${field}`);
                return false;
            }
            
            if (message[field] !== undefined) {
                const expectedType = schema.type;
                const actualType = Array.isArray(message[field]) ? 'array' : typeof message[field];
                
                if (expectedType !== actualType) {
                    console.error(`Invalid type for field ${field}: expected ${expectedType}, got ${actualType}`);
                    return false;
                }
            }
        }
        
        // Validate context if present
        if (message.context) {
            for (const [field, schema] of Object.entries(this.contextSchema)) {
                if (schema.required && !message.context.hasOwnProperty(field)) {
                    console.error(`Missing required context field: ${field}`);
                    return false;
                }
            }
        }
        
        // Validate timestamp format
        if (message.timestamp && !this.isValidTimestamp(message.timestamp)) {
            console.error('Invalid timestamp format');
            return false;
        }
        
        return true;
    }

    isValidTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date instanceof Date && !isNaN(date);
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async sendMessage(targetAgent, message, timeout = 30000) {
        try {
            // Validate message before sending
            if (!this.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            // In production, this would use actual inter-process communication
            // For now, we'll simulate the communication
            console.log(`[${message.agent_id}] Sending message to ${targetAgent}:`, {
                action: message.action,
                sessionId: message.context.session_id
            });
            
            // Simulate network delay
            await this.delay(100);
            
            // Create a promise that will timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Message timeout')), timeout);
            });
            
            // Simulate message processing
            const responsePromise = this.simulateResponse(targetAgent, message);
            
            // Race between response and timeout
            const response = await Promise.race([responsePromise, timeoutPromise]);
            
            return response;
            
        } catch (error) {
            console.error(`Failed to send message to ${targetAgent}:`, error);
            throw error;
        }
    }

    async simulateResponse(targetAgent, message) {
        // Simulate processing time
        await this.delay(Math.random() * 500 + 200);
        
        // Create mock response
        const response = this.createMessage({
            agentId: targetAgent,
            action: `${message.action}_RESPONSE`,
            payload: {
                original_action: message.action,
                status: 'success',
                data: {}
            },
            context: {
                ...message.context,
                parentAgent: message.agent_id
            },
            responseRequired: false
        });
        
        return response;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    preserveContext(originalMessage, newContext = {}) {
        return {
            ...originalMessage.context,
            ...newContext,
            chain: [
                ...(originalMessage.context.chain || []),
                {
                    agent_id: originalMessage.agent_id,
                    action: originalMessage.action,
                    timestamp: originalMessage.timestamp
                }
            ]
        };
    }

    extractChain(message) {
        if (!message.context || !message.context.chain) {
            return [];
        }
        
        return message.context.chain.map(item => ({
            agent: item.agent_id,
            action: item.action,
            timestamp: item.timestamp
        }));
    }

    createErrorResponse(originalMessage, error) {
        return this.createMessage({
            agentId: originalMessage.agent_id,
            action: 'ERROR',
            payload: {
                error: error.message || 'Unknown error',
                originalAction: originalMessage.action,
                stack: error.stack
            },
            context: this.preserveContext(originalMessage),
            responseRequired: false
        });
    }

    createSuccessResponse(originalMessage, data) {
        return this.createMessage({
            agentId: originalMessage.agent_id,
            action: `${originalMessage.action}_SUCCESS`,
            payload: {
                status: 'success',
                data: data
            },
            context: this.preserveContext(originalMessage),
            responseRequired: false
        });
    }

    async broadcast(message, targetAgents) {
        const results = [];
        
        for (const agent of targetAgents) {
            try {
                const response = await this.sendMessage(agent, message);
                results.push({
                    agent: agent,
                    success: true,
                    response: response
                });
            } catch (error) {
                results.push({
                    agent: agent,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Message queue management for async processing
    createMessageQueue(maxSize = 100) {
        return {
            messages: [],
            maxSize: maxSize,
            
            enqueue: function(message) {
                if (this.messages.length >= this.maxSize) {
                    throw new Error('Message queue is full');
                }
                this.messages.push(message);
                return true;
            },
            
            dequeue: function() {
                return this.messages.shift();
            },
            
            peek: function() {
                return this.messages[0];
            },
            
            size: function() {
                return this.messages.length;
            },
            
            isEmpty: function() {
                return this.messages.length === 0;
            },
            
            clear: function() {
                this.messages = [];
            }
        };
    }

    // Priority queue for message prioritization
    createPriorityQueue() {
        return {
            messages: [],
            
            enqueue: function(message) {
                const priority = message.context.priority || 1;
                const item = { message, priority };
                
                // Find correct position based on priority
                let added = false;
                for (let i = 0; i < this.messages.length; i++) {
                    if (priority > this.messages[i].priority) {
                        this.messages.splice(i, 0, item);
                        added = true;
                        break;
                    }
                }
                
                if (!added) {
                    this.messages.push(item);
                }
                
                return true;
            },
            
            dequeue: function() {
                const item = this.messages.shift();
                return item ? item.message : null;
            },
            
            size: function() {
                return this.messages.length;
            }
        };
    }

    // Test method for communication protocol
    async test() {
        console.log('=== Communication Protocol Test ===\n');
        
        console.log('1. Testing message creation...');
        const message = this.createMessage({
            agentId: 'test-agent',
            action: 'TEST_ACTION',
            payload: { test: true },
            context: {
                sessionId: 'test-session',
                parentAgent: 'parent',
                priority: 2
            },
            responseRequired: true
        });
        console.log('Created message:', JSON.stringify(message, null, 2));
        
        console.log('\n2. Testing message validation...');
        const isValid = this.validateMessage(message);
        console.log(`Message is valid: ${isValid}`);
        
        console.log('\n3. Testing invalid message validation...');
        const invalidMessage = { action: 'TEST' };
        const isInvalid = this.validateMessage(invalidMessage);
        console.log(`Invalid message validation result: ${!isInvalid ? 'PASSED' : 'FAILED'}`);
        
        console.log('\n4. Testing context preservation...');
        const newContext = this.preserveContext(message, { newField: 'value' });
        console.log('Preserved context:', JSON.stringify(newContext, null, 2));
        
        console.log('\n5. Testing error response creation...');
        const errorResponse = this.createErrorResponse(message, new Error('Test error'));
        console.log('Error response:', JSON.stringify(errorResponse, null, 2));
        
        console.log('\n6. Testing success response creation...');
        const successResponse = this.createSuccessResponse(message, { result: 'success' });
        console.log('Success response:', JSON.stringify(successResponse, null, 2));
        
        console.log('\n7. Testing message queue...');
        const queue = this.createMessageQueue(5);
        queue.enqueue(message);
        console.log(`Queue size after enqueue: ${queue.size()}`);
        const dequeued = queue.dequeue();
        console.log(`Queue size after dequeue: ${queue.size()}`);
        console.log(`Dequeued message action: ${dequeued.action}`);
        
        console.log('\n8. Testing priority queue...');
        const priorityQueue = this.createPriorityQueue();
        
        priorityQueue.enqueue(this.createMessage({
            agentId: 'agent1',
            action: 'LOW_PRIORITY',
            payload: {},
            context: { sessionId: 's1', parentAgent: 'p1', priority: 1 }
        }));
        
        priorityQueue.enqueue(this.createMessage({
            agentId: 'agent2',
            action: 'HIGH_PRIORITY',
            payload: {},
            context: { sessionId: 's2', parentAgent: 'p2', priority: 3 }
        }));
        
        priorityQueue.enqueue(this.createMessage({
            agentId: 'agent3',
            action: 'MEDIUM_PRIORITY',
            payload: {},
            context: { sessionId: 's3', parentAgent: 'p3', priority: 2 }
        }));
        
        console.log('Dequeuing messages by priority:');
        while (priorityQueue.size() > 0) {
            const msg = priorityQueue.dequeue();
            console.log(`  - ${msg.action} (priority: ${msg.context.priority})`);
        }
        
        console.log('\n=== Test Complete ===');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Communication;
}

// Test execution
if (require.main === module) {
    const comm = new Communication();
    comm.test();
}