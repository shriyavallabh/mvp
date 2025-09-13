#!/usr/bin/env node

/**
 * Integration tests for scheduled workflow system
 * Tests the complete workflow from job triggering to completion
 */

const path = require('path');
const fs = require('fs').promises;
const schedulerState = require('../../services/scheduler-state');
const Logger = require('../../agents/utils/logger');

class ScheduledWorkflowIntegrationTest {
    constructor() {
        this.logger = new Logger('integration-test');
        this.testResults = [];
        this.projectRoot = path.join(__dirname, '..', '..');
    }

    async runTests() {
        console.log('🧪 Starting Scheduled Workflow Integration Tests\n');

        try {
            // Test 1: Scheduler State Management
            await this.testSchedulerState();
            
            // Test 2: Manual Job Triggers (Dry Run)
            await this.testManualTriggers();
            
            // Test 3: Job Health Checks
            await this.testJobHealthChecks();
            
            // Test 4: Cron Expression Validation
            await this.testCronValidation();
            
            // Test 5: PM2 Configuration Validation
            await this.testPM2Configuration();

            this.printResults();
            
        } catch (error) {
            console.error('❌ Integration test suite failed:', error);
            process.exit(1);
        }
    }

    async testSchedulerState() {
        console.log('📋 Testing Scheduler State Management...');
        
        const testJobName = 'test-integration-job';
        
        try {
            // Test acquiring lock
            const sessionId = await schedulerState.acquireLock(testJobName);
            this.assert(sessionId, 'Should acquire lock and return session ID');
            this.assert(sessionId.startsWith(testJobName), 'Session ID should contain job name');
            
            // Test job status
            const isRunning = await schedulerState.isJobRunning(testJobName);
            this.assert(isRunning === true, 'Job should be marked as running');
            
            const jobStatus = await schedulerState.getJobStatus(testJobName);
            this.assert(jobStatus.status === 'RUNNING', 'Job status should be RUNNING');
            this.assert(jobStatus.sessionId === sessionId, 'Session ID should match');
            
            // Test preventing double lock
            try {
                await schedulerState.acquireLock(testJobName);
                this.assert(false, 'Should not allow double locking');
            } catch (error) {
                this.assert(error.message.includes('already running'), 'Should throw already running error');
            }
            
            // Test releasing lock
            await schedulerState.releaseLock(testJobName, { success: true, duration: 1000 });
            
            const isRunningAfter = await schedulerState.isJobRunning(testJobName);
            this.assert(isRunningAfter === false, 'Job should no longer be running');
            
            const lastExecution = await schedulerState.getLastExecution(testJobName);
            this.assert(lastExecution, 'Should have last execution timestamp');
            
            this.testResults.push({ test: 'Scheduler State Management', status: 'PASSED' });
            console.log('✅ Scheduler State Management tests passed\n');
            
        } catch (error) {
            this.testResults.push({ test: 'Scheduler State Management', status: 'FAILED', error: error.message });
            console.log(`❌ Scheduler State Management tests failed: ${error.message}\n`);
        }
    }

    async testManualTriggers() {
        console.log('🔧 Testing Manual Job Triggers (Dry Run)...');
        
        const triggers = [
            { name: 'Evening Generation', script: 'trigger-evening-generation.js' },
            { name: 'Auto Approval', script: 'trigger-auto-approval.js' },
            { name: 'Morning Distribution', script: 'trigger-morning-distribution.js' }
        ];
        
        for (const trigger of triggers) {
            try {
                const TriggerClass = require(path.join(this.projectRoot, 'scripts', trigger.script));
                const triggerInstance = new TriggerClass();
                
                // Run dry run test
                const result = await triggerInstance.run({ dryRun: true });
                
                this.assert(result.dryRun === true, 'Should confirm dry run mode');
                this.assert(result.timestamp, 'Should have timestamp');
                this.assert(typeof result.estimatedDuration === 'number', 'Should have estimated duration');
                
                console.log(`✅ ${trigger.name} dry run test passed`);
                
            } catch (error) {
                this.testResults.push({ 
                    test: `Manual Trigger - ${trigger.name}`, 
                    status: 'FAILED', 
                    error: error.message 
                });
                console.log(`❌ ${trigger.name} dry run test failed: ${error.message}`);
                continue;
            }
        }
        
        this.testResults.push({ test: 'Manual Job Triggers', status: 'PASSED' });
        console.log('✅ Manual Job Triggers tests completed\n');
    }

    async testJobHealthChecks() {
        console.log('🏥 Testing Job Health Checks...');
        
        try {
            // Import job classes
            const DailyContentScheduler = require('../../jobs/daily-content-scheduler');
            const AutoApprovalScheduler = require('../../jobs/auto-approval-scheduler');
            const MorningDistributionScheduler = require('../../jobs/morning-distribution-scheduler');
            
            const jobs = [
                { name: 'Daily Content', scheduler: new DailyContentScheduler() },
                { name: 'Auto Approval', scheduler: new AutoApprovalScheduler() },
                { name: 'Morning Distribution', scheduler: new MorningDistributionScheduler() }
            ];
            
            for (const job of jobs) {
                const health = await job.scheduler.healthCheck();
                
                this.assert(health.jobName, 'Should have job name');
                this.assert(health.hasOwnProperty('healthy'), 'Should have healthy status');
                this.assert(health.nextScheduled, 'Should have next scheduled time');
                
                // Validate next scheduled time is in the future
                const nextTime = new Date(health.nextScheduled);
                const now = new Date();
                this.assert(nextTime > now, 'Next scheduled time should be in the future');
                
                console.log(`✅ ${job.name} health check passed`);
            }
            
            this.testResults.push({ test: 'Job Health Checks', status: 'PASSED' });
            console.log('✅ Job Health Checks tests passed\n');
            
        } catch (error) {
            this.testResults.push({ test: 'Job Health Checks', status: 'FAILED', error: error.message });
            console.log(`❌ Job Health Checks tests failed: ${error.message}\n`);
        }
    }

    async testCronValidation() {
        console.log('⏰ Testing Cron Expression Validation...');
        
        try {
            const cron = require('node-cron');
            
            const schedules = {
                'daily-content-generation': '30 20 * * *',  // 8:30 PM
                'auto-approval-guardian': '0 23 * * *',     // 11:00 PM
                'morning-distribution': '0 5 * * *'         // 5:00 AM
            };
            
            for (const [jobName, cronExpression] of Object.entries(schedules)) {
                const isValid = cron.validate(cronExpression);
                this.assert(isValid, `Cron expression for ${jobName} should be valid`);
                
                // Test that expressions represent expected times
                const [minute, hour] = cronExpression.split(' ');
                
                if (jobName === 'daily-content-generation') {
                    this.assert(hour === '20' && minute === '30', 'Evening job should be at 20:30');
                } else if (jobName === 'auto-approval-guardian') {
                    this.assert(hour === '23' && minute === '0', 'Approval job should be at 23:00');
                } else if (jobName === 'morning-distribution') {
                    this.assert(hour === '5' && minute === '0', 'Distribution job should be at 05:00');
                }
                
                console.log(`✅ ${jobName} cron expression valid: ${cronExpression}`);
            }
            
            this.testResults.push({ test: 'Cron Expression Validation', status: 'PASSED' });
            console.log('✅ Cron Expression Validation tests passed\n');
            
        } catch (error) {
            this.testResults.push({ test: 'Cron Expression Validation', status: 'FAILED', error: error.message });
            console.log(`❌ Cron Expression Validation tests failed: ${error.message}\n`);
        }
    }

    async testPM2Configuration() {
        console.log('⚙️ Testing PM2 Configuration...');
        
        try {
            const ecosystemPath = path.join(this.projectRoot, 'config', 'ecosystem.config.js');
            
            // Check if ecosystem config exists
            await fs.access(ecosystemPath);
            
            // Load and validate config
            const config = require(ecosystemPath);
            this.assert(config.apps, 'PM2 config should have apps array');
            
            const expectedJobs = [
                'daily-content-scheduler',
                'auto-approval-scheduler', 
                'morning-distribution-scheduler'
            ];
            
            for (const jobName of expectedJobs) {
                const app = config.apps.find(app => app.name === jobName);
                this.assert(app, `Should have PM2 app configuration for ${jobName}`);
                this.assert(app.script, `${jobName} should have script path`);
                this.assert(app.cron_restart, `${jobName} should have cron_restart setting`);
                this.assert(app.error_file, `${jobName} should have error log file`);
                this.assert(app.out_file, `${jobName} should have output log file`);
                
                // Validate cron expression
                const cron = require('node-cron');
                this.assert(cron.validate(app.cron_restart), `${jobName} cron_restart should be valid`);
                
                console.log(`✅ ${jobName} PM2 configuration valid`);
            }
            
            this.testResults.push({ test: 'PM2 Configuration', status: 'PASSED' });
            console.log('✅ PM2 Configuration tests passed\n');
            
        } catch (error) {
            this.testResults.push({ test: 'PM2 Configuration', status: 'FAILED', error: error.message });
            console.log(`❌ PM2 Configuration tests failed: ${error.message}\n`);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('='.repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED';
            console.log(`${status}: ${result.test}`);
            if (result.error) {
                console.log(`  Error: ${result.error}`);
            }
            
            if (result.status === 'PASSED') passed++;
            else failed++;
        });
        
        console.log('\n' + '='.repeat(50));
        console.log(`Total: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ Some tests failed. Please review the errors above.');
            process.exit(1);
        } else {
            console.log('\n🎉 All tests passed! Scheduled workflow system is ready.');
            process.exit(0);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new ScheduledWorkflowIntegrationTest();
    tester.runTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ScheduledWorkflowIntegrationTest;