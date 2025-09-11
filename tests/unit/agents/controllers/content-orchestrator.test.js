#!/usr/bin/env node

const ContentOrchestrator = require('../../../../agents/controllers/content-orchestrator');

describe('ContentOrchestrator', () => {
    let orchestrator;

    beforeEach(() => {
        orchestrator = new ContentOrchestrator();
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(orchestrator.agentId).toBe('content-orchestrator');
            expect(orchestrator.state).toBe('IDLE');
            expect(orchestrator.maxRetries).toBe(3);
            expect(orchestrator.retryDelay).toBe(1000);
            expect(orchestrator.sessionId).toBeDefined();
            expect(orchestrator.subAgents).toEqual({
                'content-strategist': null,
                'fatigue-checker': null,
                'compliance-validator': null,
                'advisor-manager': null
            });
        });
    });

    describe('generateSessionId', () => {
        it('should generate unique session IDs', () => {
            const id1 = orchestrator.generateSessionId();
            const id2 = orchestrator.generateSessionId();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^session_\d+_[a-z0-9]{9}$/);
        });
    });

    describe('setState', () => {
        it('should set valid states', () => {
            const validStates = ['IDLE', 'PROCESSING', 'WAITING', 'COMPLETED', 'ERROR', 'RETRY'];
            validStates.forEach(state => {
                orchestrator.setState(state);
                expect(orchestrator.state).toBe(state);
            });
        });

        it('should not set invalid states', () => {
            orchestrator.setState('INVALID_STATE');
            expect(orchestrator.state).toBe('IDLE');
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const result = await orchestrator.initialize();
            expect(result).toBe(true);
            expect(orchestrator.communication).toBeDefined();
            expect(orchestrator.errorHandler).toBeDefined();
            expect(orchestrator.logger).toBeDefined();
            expect(orchestrator.state).toBe('IDLE');
        });

        it('should handle initialization errors', async () => {
            // Mock a failure scenario
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const badOrchestrator = new ContentOrchestrator();
            // Force an error by making require fail
            const originalRequire = require;
            require = jest.fn(() => { throw new Error('Module not found'); });
            
            const result = await badOrchestrator.initialize();
            expect(result).toBe(false);
            expect(badOrchestrator.state).toBe('ERROR');
            
            require = originalRequire;
            console.error.mockRestore();
        });
    });

    describe('retryWithBackoff', () => {
        it('should retry operation on failure', async () => {
            await orchestrator.initialize();
            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            };

            const result = await orchestrator.retryWithBackoff(operation, 3, 100);
            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        it('should throw after max retries', async () => {
            await orchestrator.initialize();
            const operation = async () => {
                throw new Error('Permanent failure');
            };

            await expect(orchestrator.retryWithBackoff(operation, 3, 100))
                .rejects.toThrow('Permanent failure');
        });
    });
});

// Mock test runner if jest is not available
if (typeof describe === 'undefined') {
    console.log('Unit tests for ContentOrchestrator defined successfully');
    console.log('Run with Jest or another test runner to execute tests');
}