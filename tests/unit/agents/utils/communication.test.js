#!/usr/bin/env node

const Communication = require('../../../../agents/utils/communication');

describe('Communication', () => {
    let comm;

    beforeEach(() => {
        comm = new Communication();
    });

    describe('createMessage', () => {
        it('should create valid message with all required fields', () => {
            const message = comm.createMessage({
                agentId: 'test-agent',
                action: 'TEST_ACTION',
                payload: { data: 'test' },
                context: {
                    sessionId: 'session-123',
                    parentAgent: 'parent',
                    priority: 2
                },
                responseRequired: true
            });

            expect(message.agent_id).toBe('test-agent');
            expect(message.action).toBe('TEST_ACTION');
            expect(message.payload).toEqual({ data: 'test' });
            expect(message.context.sessionId).toBe('session-123');
            expect(message.context.parentAgent).toBe('parent');
            expect(message.context.priority).toBe(2);
            expect(message.response_required).toBe(true);
            expect(message.timestamp).toBeDefined();
        });

        it('should auto-generate sessionId if not provided', () => {
            const message = comm.createMessage({
                agentId: 'test-agent',
                action: 'TEST_ACTION'
            });

            expect(message.context.sessionId).toBeDefined();
            expect(message.context.sessionId).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });

        it('should set default parentAgent if not provided', () => {
            const message = comm.createMessage({
                agentId: 'test-agent',
                action: 'TEST_ACTION'
            });

            expect(message.context.parentAgent).toBe('test-agent');
        });

        it('should set default priority if not provided', () => {
            const message = comm.createMessage({
                agentId: 'test-agent',
                action: 'TEST_ACTION'
            });

            expect(message.context.priority).toBe(1);
        });

        it('should throw error if agentId is missing', () => {
            expect(() => {
                comm.createMessage({ action: 'TEST_ACTION' });
            }).toThrow('agentId and action are required');
        });

        it('should throw error if action is missing', () => {
            expect(() => {
                comm.createMessage({ agentId: 'test-agent' });
            }).toThrow('agentId and action are required');
        });
    });

    describe('validateMessage', () => {
        it('should validate correct message', () => {
            const message = comm.createMessage({
                agentId: 'test-agent',
                action: 'TEST_ACTION',
                payload: {},
                context: {
                    sessionId: 'test-session',
                    parentAgent: 'parent'
                }
            });

            expect(comm.validateMessage(message)).toBe(true);
        });

        it('should reject message without required fields', () => {
            const invalidMessage = {
                action: 'TEST_ACTION',
                payload: {}
            };

            expect(comm.validateMessage(invalidMessage)).toBe(false);
        });

        it('should reject message with wrong field types', () => {
            const invalidMessage = {
                agent_id: 123, // Should be string
                timestamp: new Date().toISOString(),
                action: 'TEST_ACTION',
                payload: {},
                context: {}
            };

            expect(comm.validateMessage(invalidMessage)).toBe(false);
        });

        it('should validate context fields', () => {
            const message = {
                agent_id: 'test',
                timestamp: new Date().toISOString(),
                action: 'TEST',
                payload: {},
                context: {
                    // Missing required sessionId and parentAgent
                    priority: 1
                }
            };

            expect(comm.validateMessage(message)).toBe(false);
        });

        it('should validate timestamp format', () => {
            const message = {
                agent_id: 'test',
                timestamp: 'invalid-timestamp',
                action: 'TEST',
                payload: {},
                context: {
                    sessionId: 'session',
                    parentAgent: 'parent'
                }
            };

            expect(comm.validateMessage(message)).toBe(false);
        });
    });

    describe('isValidTimestamp', () => {
        it('should accept valid ISO timestamps', () => {
            expect(comm.isValidTimestamp(new Date().toISOString())).toBe(true);
            expect(comm.isValidTimestamp('2025-01-15T20:30:00Z')).toBe(true);
        });

        it('should reject invalid timestamps', () => {
            expect(comm.isValidTimestamp('not-a-date')).toBe(false);
            expect(comm.isValidTimestamp('2025-13-45')).toBe(false);
        });
    });

    describe('generateSessionId', () => {
        it('should generate unique session IDs', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(comm.generateSessionId());
            }
            expect(ids.size).toBe(100);
        });

        it('should follow expected format', () => {
            const id = comm.generateSessionId();
            expect(id).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });
    });

    describe('preserveContext', () => {
        it('should preserve original context and add chain', () => {
            const message = comm.createMessage({
                agentId: 'agent1',
                action: 'ACTION1',
                context: {
                    sessionId: 'session1',
                    parentAgent: 'parent1'
                }
            });

            const newContext = comm.preserveContext(message, { newField: 'value' });

            expect(newContext.sessionId).toBe('session1');
            expect(newContext.parentAgent).toBe('parent1');
            expect(newContext.newField).toBe('value');
            expect(newContext.chain).toHaveLength(1);
            expect(newContext.chain[0].agent_id).toBe('agent1');
        });

        it('should append to existing chain', () => {
            const message = {
                agent_id: 'agent2',
                action: 'ACTION2',
                timestamp: new Date().toISOString(),
                context: {
                    chain: [{
                        agent_id: 'agent1',
                        action: 'ACTION1',
                        timestamp: new Date().toISOString()
                    }]
                }
            };

            const newContext = comm.preserveContext(message);
            expect(newContext.chain).toHaveLength(2);
        });
    });

    describe('Message Queue', () => {
        it('should enqueue and dequeue messages', () => {
            const queue = comm.createMessageQueue(5);
            const message = comm.createMessage({
                agentId: 'test',
                action: 'TEST'
            });

            expect(queue.isEmpty()).toBe(true);
            queue.enqueue(message);
            expect(queue.size()).toBe(1);
            expect(queue.isEmpty()).toBe(false);

            const dequeued = queue.dequeue();
            expect(dequeued.action).toBe('TEST');
            expect(queue.isEmpty()).toBe(true);
        });

        it('should respect max size', () => {
            const queue = comm.createMessageQueue(2);
            const msg1 = comm.createMessage({ agentId: 'a1', action: 'A1' });
            const msg2 = comm.createMessage({ agentId: 'a2', action: 'A2' });
            const msg3 = comm.createMessage({ agentId: 'a3', action: 'A3' });

            queue.enqueue(msg1);
            queue.enqueue(msg2);
            
            expect(() => {
                queue.enqueue(msg3);
            }).toThrow('Message queue is full');
        });
    });

    describe('Priority Queue', () => {
        it('should dequeue by priority', () => {
            const pq = comm.createPriorityQueue();
            
            const lowPriority = comm.createMessage({
                agentId: 'low',
                action: 'LOW',
                context: { sessionId: 's1', parentAgent: 'p', priority: 1 }
            });
            
            const highPriority = comm.createMessage({
                agentId: 'high',
                action: 'HIGH',
                context: { sessionId: 's2', parentAgent: 'p', priority: 3 }
            });
            
            const medPriority = comm.createMessage({
                agentId: 'med',
                action: 'MED',
                context: { sessionId: 's3', parentAgent: 'p', priority: 2 }
            });

            pq.enqueue(lowPriority);
            pq.enqueue(highPriority);
            pq.enqueue(medPriority);

            expect(pq.dequeue().action).toBe('HIGH');
            expect(pq.dequeue().action).toBe('MED');
            expect(pq.dequeue().action).toBe('LOW');
        });
    });

    describe('Error and Success Responses', () => {
        it('should create error response', () => {
            const original = comm.createMessage({
                agentId: 'test',
                action: 'TEST_ACTION'
            });

            const error = new Error('Test error');
            const errorResponse = comm.createErrorResponse(original, error);

            expect(errorResponse.action).toBe('ERROR');
            expect(errorResponse.payload.error).toBe('Test error');
            expect(errorResponse.payload.originalAction).toBe('TEST_ACTION');
        });

        it('should create success response', () => {
            const original = comm.createMessage({
                agentId: 'test',
                action: 'TEST_ACTION'
            });

            const successResponse = comm.createSuccessResponse(original, { result: 'data' });

            expect(successResponse.action).toBe('TEST_ACTION_SUCCESS');
            expect(successResponse.payload.status).toBe('success');
            expect(successResponse.payload.data).toEqual({ result: 'data' });
        });
    });
});

// Mock test runner if jest is not available
if (typeof describe === 'undefined') {
    console.log('Unit tests for Communication defined successfully');
    console.log('Run with Jest or another test runner to execute tests');
}