#!/usr/bin/env node

/**
 * Integration Test Suite for Agent Infrastructure
 * Tests the complete workflow with content-orchestrator coordinating sub-agents
 */

const ContentOrchestrator = require('../../agents/controllers/content-orchestrator');
const AdvisorManager = require('../../agents/managers/advisor-manager');
const ContentStrategist = require('../../agents/generators/content-strategist');
const FatigueChecker = require('../../agents/validators/fatigue-checker');
const ComplianceValidator = require('../../agents/validators/compliance-validator');
const Communication = require('../../agents/utils/communication');
const ErrorHandler = require('../../agents/utils/error-handler');
const Logger = require('../../agents/utils/logger');

class IntegrationTestSuite {
    constructor() {
        this.testResults = [];
        this.logger = new Logger('integration-test');
    }

    async runAllTests() {
        console.log('=================================');
        console.log('AGENT INTEGRATION TEST SUITE');
        console.log('=================================\n');

        await this.testAgentInitialization();
        await this.testInterAgentCommunication();
        await this.testContentGenerationWorkflow();
        await this.testErrorHandlingAndRecovery();
        await this.testStateManagement();
        await this.testComplianceWorkflow();
        await this.testPerformanceMetrics();
        await this.testEndToEndScenarios();

        this.printTestSummary();
    }

    async testAgentInitialization() {
        console.log('TEST 1: Agent Initialization');
        console.log('-----------------------------');
        
        try {
            // Test orchestrator initialization
            const orchestrator = new ContentOrchestrator();
            const orchInit = await orchestrator.initialize();
            this.recordTest('Orchestrator initialization', orchInit);
            
            // Test advisor manager initialization
            const advisorManager = new AdvisorManager();
            const advisorInit = await advisorManager.initialize();
            this.recordTest('Advisor Manager initialization', advisorInit);
            
            // Test content strategist initialization
            const strategist = new ContentStrategist();
            const strategistInit = await strategist.initialize();
            this.recordTest('Content Strategist initialization', strategistInit);
            
            // Test fatigue checker initialization
            const fatigueChecker = new FatigueChecker();
            const fatigueInit = await fatigueChecker.initialize();
            this.recordTest('Fatigue Checker initialization', fatigueInit);
            
            // Test compliance validator initialization
            const complianceValidator = new ComplianceValidator();
            const complianceInit = await complianceValidator.initialize();
            this.recordTest('Compliance Validator initialization', complianceInit);
            
            console.log('✓ All agents initialized successfully\n');
            
        } catch (error) {
            console.error('✗ Agent initialization failed:', error.message);
            this.recordTest('Agent initialization', false, error.message);
        }
    }

    async testInterAgentCommunication() {
        console.log('TEST 2: Inter-Agent Communication');
        console.log('----------------------------------');
        
        try {
            const communication = new Communication();
            
            // Test message creation
            const testMessage = communication.createMessage({
                agentId: 'test-sender',
                action: 'TEST_ACTION',
                payload: { test: true },
                context: {
                    sessionId: 'test-session',
                    parentAgent: 'test-parent',
                    priority: 1
                },
                responseRequired: true
            });
            
            this.recordTest('Message creation', testMessage !== null);
            
            // Test message validation
            const isValid = communication.validateMessage(testMessage);
            this.recordTest('Message validation', isValid);
            
            // Test context preservation
            const preservedContext = communication.preserveContext(testMessage, { 
                newField: 'value' 
            });
            this.recordTest('Context preservation', preservedContext.chain !== undefined);
            
            // Test message queue
            const queue = communication.createMessageQueue(10);
            queue.enqueue(testMessage);
            const dequeued = queue.dequeue();
            this.recordTest('Message queuing', dequeued.action === 'TEST_ACTION');
            
            console.log('✓ Communication protocol working correctly\n');
            
        } catch (error) {
            console.error('✗ Communication test failed:', error.message);
            this.recordTest('Inter-agent communication', false, error.message);
        }
    }

    async testContentGenerationWorkflow() {
        console.log('TEST 3: Content Generation Workflow');
        console.log('------------------------------------');
        
        try {
            // Initialize agents
            const orchestrator = new ContentOrchestrator();
            await orchestrator.initialize();
            
            const advisorManager = new AdvisorManager();
            await advisorManager.initialize();
            
            // Test getting active advisors (using mock data)
            const advisors = await advisorManager.getActiveAdvisors({
                subscription_status: 'active'
            });
            this.recordTest('Get active advisors', advisors.length > 0);
            console.log(`  Found ${advisors.length} active advisors`);
            
            // Test topic generation for first advisor
            if (advisors.length > 0) {
                const strategist = new ContentStrategist();
                await strategist.initialize();
                
                const topic = await strategist.generateTopic({
                    advisorArn: advisors[0].arn,
                    content_focus: advisors[0].content_focus,
                    client_segment: advisors[0].client_segment
                });
                
                this.recordTest('Topic generation', topic !== null && topic.topic !== undefined);
                console.log(`  Generated topic: ${topic.topic}`);
            }
            
            console.log('✓ Content generation workflow operational\n');
            
        } catch (error) {
            console.error('✗ Content generation test failed:', error.message);
            this.recordTest('Content generation workflow', false, error.message);
        }
    }

    async testErrorHandlingAndRecovery() {
        console.log('TEST 4: Error Handling and Recovery');
        console.log('------------------------------------');
        
        try {
            const errorHandler = new ErrorHandler();
            
            // Test error categorization
            const transientError = new Error('ECONNREFUSED');
            const errorInfo = errorHandler.categorizeError(transientError);
            this.recordTest('Error categorization', errorInfo.category === 'TRANSIENT');
            
            // Test retry logic
            let retryCount = 0;
            const retryContext = {
                retryCount: retryCount,
                maxRetries: 3
            };
            
            const retryResult = await errorHandler.handleError(transientError, retryContext);
            this.recordTest('Retry mechanism', retryResult.retry === true);
            
            // Test circuit breaker
            const circuitKey = 'test-service';
            for (let i = 0; i < 3; i++) {
                await errorHandler.handleCircuitBreak(
                    new Error('Service unavailable'), 
                    { circuitKey }
                );
            }
            
            const circuitStatus = errorHandler.getCircuitBreakerStatus(circuitKey);
            this.recordTest('Circuit breaker', circuitStatus.failures > 0);
            
            // Test error recovery plan
            const plan = errorHandler.createErrorRecoveryPlan(transientError);
            this.recordTest('Recovery plan generation', plan.steps.length > 0);
            
            console.log('✓ Error handling mechanisms working\n');
            
        } catch (error) {
            console.error('✗ Error handling test failed:', error.message);
            this.recordTest('Error handling', false, error.message);
        }
    }

    async testStateManagement() {
        console.log('TEST 5: Agent State Management');
        console.log('-------------------------------');
        
        try {
            const orchestrator = new ContentOrchestrator();
            await orchestrator.initialize();
            
            // Test state transitions
            const initialState = orchestrator.state;
            this.recordTest('Initial state', initialState === 'IDLE');
            
            orchestrator.setState('PROCESSING');
            this.recordTest('State transition to PROCESSING', orchestrator.state === 'PROCESSING');
            
            orchestrator.setState('WAITING');
            this.recordTest('State transition to WAITING', orchestrator.state === 'WAITING');
            
            orchestrator.setState('COMPLETED');
            this.recordTest('State transition to COMPLETED', orchestrator.state === 'COMPLETED');
            
            orchestrator.setState('ERROR');
            this.recordTest('State transition to ERROR', orchestrator.state === 'ERROR');
            
            orchestrator.setState('RETRY');
            this.recordTest('State transition to RETRY', orchestrator.state === 'RETRY');
            
            console.log('✓ State management working correctly\n');
            
        } catch (error) {
            console.error('✗ State management test failed:', error.message);
            this.recordTest('State management', false, error.message);
        }
    }

    async testComplianceWorkflow() {
        console.log('TEST 6: Compliance Validation Workflow');
        console.log('---------------------------------------');
        
        try {
            const validator = new ComplianceValidator();
            await validator.initialize();
            
            // Test compliant content
            const compliantContent = `
                Investment Opportunities in Mutual Funds (ARN-12345)
                
                Historical data shows varied returns, though past performance 
                is not indicative of future returns.
                
                Mutual Fund investments are subject to market risks, 
                read all scheme related documents carefully.
            `;
            
            const compliantResult = validator.validateContent(compliantContent, 'ARN-12345');
            this.recordTest('Compliant content validation', compliantResult.isCompliant === true);
            console.log(`  Compliance score: ${compliantResult.complianceScore}`);
            
            // Test non-compliant content
            const nonCompliantContent = `
                Guaranteed returns of 20% annually!
                This is a risk-free investment opportunity.
            `;
            
            const nonCompliantResult = validator.validateContent(nonCompliantContent, 'ARN-12345');
            this.recordTest('Non-compliant content detection', nonCompliantResult.isCompliant === false);
            console.log(`  Violations found: ${nonCompliantResult.violations.length}`);
            
            // Test fatigue checking
            const fatigueChecker = new FatigueChecker();
            await fatigueChecker.initialize();
            
            const contentHistory = await fatigueChecker.getContentHistory('ARN-12345');
            const fatigueResult = fatigueChecker.calculateFatigueScore(
                'Understanding Mutual Funds',
                contentHistory
            );
            
            this.recordTest('Fatigue score calculation', fatigueResult.fatigueScore !== undefined);
            console.log(`  Fatigue score: ${fatigueResult.fatigueScore}`);
            
            console.log('✓ Compliance workflow operational\n');
            
        } catch (error) {
            console.error('✗ Compliance workflow test failed:', error.message);
            this.recordTest('Compliance workflow', false, error.message);
        }
    }

    async testPerformanceMetrics() {
        console.log('TEST 7: Performance Metrics and Logging');
        console.log('----------------------------------------');
        
        try {
            const logger = new Logger('test-metrics');
            
            // Test performance metric tracking
            logger.startMetric('testOperation');
            await new Promise(resolve => setTimeout(resolve, 50));
            const duration = logger.endMetric('testOperation');
            
            this.recordTest('Performance metric tracking', duration > 0);
            console.log(`  Operation duration: ${duration.toFixed(2)}ms`);
            
            // Test logging levels
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            // Test log statistics
            const stats = logger.getStatistics();
            this.recordTest('Log statistics', stats.total > 0);
            console.log(`  Total log entries: ${stats.total}`);
            
            console.log('✓ Performance metrics and logging working\n');
            
        } catch (error) {
            console.error('✗ Performance metrics test failed:', error.message);
            this.recordTest('Performance metrics', false, error.message);
        }
    }

    async testEndToEndScenarios() {
        console.log('TEST 8: End-to-End Scenarios');
        console.log('-----------------------------');
        
        try {
            // Scenario 1: Complete content generation for 3 advisors
            console.log('\n  Scenario 1: Processing 3 sample advisors...');
            
            const advisorManager = new AdvisorManager();
            await advisorManager.initialize();
            
            const mockAdvisors = await advisorManager.getActiveAdvisors();
            const testAdvisors = mockAdvisors.slice(0, 3);
            
            for (const advisor of testAdvisors) {
                console.log(`\n  Processing advisor: ${advisor.arn}`);
                
                // Generate topic
                const strategist = new ContentStrategist();
                await strategist.initialize();
                const topic = await strategist.generateTopic({
                    advisorArn: advisor.arn,
                    content_focus: advisor.content_focus,
                    client_segment: advisor.client_segment
                });
                
                // Check fatigue
                const fatigueChecker = new FatigueChecker();
                await fatigueChecker.initialize();
                const contentHistory = await fatigueChecker.getContentHistory(advisor.arn);
                const fatigueResult = fatigueChecker.calculateFatigueScore(
                    topic.topic,
                    contentHistory
                );
                
                // Validate compliance
                const validator = new ComplianceValidator();
                await validator.initialize();
                const complianceResult = validator.validateContent(
                    topic.topic,
                    advisor.arn
                );
                
                console.log(`    Topic: ${topic.topic.substring(0, 50)}...`);
                console.log(`    Fatigue Score: ${fatigueResult.fatigueScore}`);
                console.log(`    Compliance Score: ${complianceResult.complianceScore}`);
                console.log(`    Ready for Review: ${complianceResult.isCompliant && fatigueResult.fatigueScore < 0.7}`);
            }
            
            this.recordTest('End-to-end scenario', true);
            console.log('\n✓ End-to-end scenarios completed successfully\n');
            
        } catch (error) {
            console.error('✗ End-to-end scenario failed:', error.message);
            this.recordTest('End-to-end scenario', false, error.message);
        }
    }

    recordTest(testName, passed, error = null) {
        this.testResults.push({
            name: testName,
            passed: passed,
            error: error
        });
    }

    printTestSummary() {
        console.log('\n=================================');
        console.log('TEST SUMMARY');
        console.log('=================================\n');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✓`);
        console.log(`Failed: ${failed} ✗`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);
        
        if (failed > 0) {
            console.log('Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`  ✗ ${test.name}: ${test.error || 'Unknown error'}`);
            });
        }
        
        console.log('\n=================================');
        console.log(failed === 0 ? 'ALL TESTS PASSED! ✓' : 'SOME TESTS FAILED ✗');
        console.log('=================================');
        
        // Log results to file
        this.logger.info('Integration test completed', {
            total: total,
            passed: passed,
            failed: failed,
            successRate: `${((passed/total) * 100).toFixed(1)}%`
        });
    }
}

// Run tests if executed directly
if (require.main === module) {
    const testSuite = new IntegrationTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTestSuite;