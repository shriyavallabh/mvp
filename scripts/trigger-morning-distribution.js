#!/usr/bin/env node

/**
 * Manual trigger for morning distribution
 * Executes the same workflow as the scheduled 5:00 AM job
 */

const path = require('path');
const { spawn } = require('child_process');
const schedulerState = require('../services/scheduler-state');
const Logger = require('../agents/utils/logger');

class ManualDistributionTrigger {
    constructor() {
        this.logger = new Logger('manual-distribution-trigger');
        this.jobName = 'manual-morning-distribution';
        this.projectRoot = path.join(__dirname, '..');
    }

    async run(options = {}) {
        const { advisorIds = null, contentPath = null, testMode = false, dryRun = false } = options;
        
        try {
            this.logger.info('Manual morning distribution triggered', { 
                advisorIds,
                contentPath,
                testMode,
                dryRun,
                triggeredBy: 'manual',
                timestamp: new Date().toISOString()
            });

            if (dryRun) {
                return this.dryRun(advisorIds, contentPath);
            }

            // Check if scheduled job is already running
            const isRunning = await schedulerState.isJobRunning('morning-distribution');
            if (isRunning && !options.force) {
                throw new Error('Scheduled morning distribution is already running. Use --force to override.');
            }

            const sessionId = await schedulerState.acquireLock(this.jobName);
            this.logger.info(`Acquired lock with session ID: ${sessionId}`);

            const result = await this.executeDistribution(options);

            await schedulerState.releaseLock(this.jobName, {
                success: true,
                manual: true,
                result: result,
                timestamp: new Date().toISOString()
            });

            this.logger.info('Manual morning distribution completed successfully', result);
            return result;

        } catch (error) {
            this.logger.error('Manual morning distribution failed:', error);
            
            try {
                await schedulerState.releaseLock(this.jobName, {
                    success: false,
                    manual: true,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            } catch (lockError) {
                this.logger.error('Failed to release lock:', lockError);
            }
            
            throw error;
        }
    }

    async dryRun(advisorIds, contentPath) {
        this.logger.info('Performing dry run for morning distribution');
        
        try {
            const AdvisorManager = require('../agents/managers/advisor-manager');
            const advisorManager = new AdvisorManager();
            const fs = require('fs').promises;
            
            let advisors;
            if (advisorIds) {
                advisors = await Promise.all(
                    advisorIds.map(id => advisorManager.getAdvisorById(id))
                );
                advisors = advisors.filter(Boolean);
            } else {
                advisors = await advisorManager.getAllActiveAdvisors();
            }

            // Count approved content
            let approvedContent = 0;
            const approvedPath = contentPath || path.join(this.projectRoot, 'data', 'approved-content');
            
            try {
                const files = await fs.readdir(approvedPath);
                approvedContent = files.filter(f => f.endsWith('.json')).length;
            } catch (error) {
                this.logger.warn('Could not read approved content directory:', error);
            }
            
            return {
                dryRun: true,
                advisorsToContact: advisors.length,
                advisors: advisors.map(a => ({ id: a.id, name: a.name, whatsapp: a.whatsapp })),
                approvedContentItems: approvedContent,
                estimatedMessages: advisors.length * approvedContent,
                estimatedDuration: advisors.length * 30 * 1000, // 30 seconds per advisor
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // In dry run mode, if Google Sheets is not accessible, use mock data
            this.logger.warn('Could not access Google Sheets, using mock data for dry run:', error.message);
            
            const mockAdvisors = [
                { id: 'ARN-001', name: 'Mock Advisor 1', whatsapp: '+919999999001' },
                { id: 'ARN-002', name: 'Mock Advisor 2', whatsapp: '+919999999002' },
                { id: 'ARN-003', name: 'Mock Advisor 3', whatsapp: '+919999999003' }
            ];
            
            const advisorsToProcess = advisorIds ? 
                mockAdvisors.filter(a => advisorIds.includes(a.id)) : 
                mockAdvisors;
            
            return {
                dryRun: true,
                advisorsToContact: advisorsToProcess.length,
                advisors: advisorsToProcess,
                approvedContentItems: 3, // Mock content
                estimatedMessages: advisorsToProcess.length * 3,
                estimatedDuration: advisorsToProcess.length * 30 * 1000,
                timestamp: new Date().toISOString(),
                mockData: true
            };
        }
    }

    async executeDistribution(options) {
        return new Promise((resolve, reject) => {
            const distributionPath = path.join(this.projectRoot, 'agents/controllers/distribution-manager.js');
            const args = ['--morning-batch', '--approved-content'];
            
            if (options.advisorIds) {
                args.push('--advisors', options.advisorIds.join(','));
            }
            
            if (options.contentPath) {
                args.push('--content-path', options.contentPath);
            }
            
            if (options.testMode) {
                args.push('--test-mode');
            }
            
            if (options.force) {
                args.push('--force');
            }

            this.logger.info('Starting distribution manager', { args });

            const child = spawn('node', [distributionPath, ...args], {
                cwd: this.projectRoot,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    DISTRIBUTION_MODE: 'morning_batch',
                    MANUAL_TRIGGER: 'true',
                    TRIGGER_SOURCE: 'manual-distribution-trigger'
                }
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                this.logger.info(`Distribution: ${output.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                this.logger.error(`Distribution error: ${output.trim()}`);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.logger.info('Distribution manager completed successfully');
                    resolve({
                        exitCode: code,
                        stdout: stdout,
                        advisorsContacted: this.parseAdvisorCount(stdout),
                        messagesDelivered: this.parseMessageCount(stdout),
                        deliveryRate: this.parseDeliveryRate(stdout),
                        manual: true
                    });
                } else {
                    this.logger.error(`Distribution manager failed with exit code ${code}`);
                    reject(new Error(`Distribution manager failed with exit code ${code}. stderr: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                this.logger.error('Failed to spawn distribution manager:', error);
                reject(error);
            });

            // Timeout after 20 minutes for manual trigger
            setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error('Manual distribution timeout after 20 minutes'));
            }, 20 * 60 * 1000);
        });
    }

    parseAdvisorCount(stdout) {
        const match = stdout.match(/Contacted (\d+) advisors/);
        return match ? parseInt(match[1]) : 0;
    }

    parseMessageCount(stdout) {
        const match = stdout.match(/(\d+) messages delivered/);
        return match ? parseInt(match[1]) : 0;
    }

    parseDeliveryRate(stdout) {
        const match = stdout.match(/Delivery rate: ([\d.]+)%/);
        return match ? parseFloat(match[1]) : 0;
    }
}

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);
    const trigger = new ManualDistributionTrigger();
    
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--advisors':
                options.advisorIds = args[++i].split(',');
                break;
            case '--content-path':
                options.contentPath = args[++i];
                break;
            case '--test-mode':
                options.testMode = true;
                break;
            case '--force':
                options.force = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
                console.log(`
Usage: node trigger-morning-distribution.js [options]

Options:
  --advisors <id1,id2>  Only distribute to specific advisor IDs
  --content-path <path> Specify custom approved content directory
  --test-mode          Run in test mode (no actual WhatsApp messages)
  --force              Force execution even if scheduled job is running
  --dry-run            Simulate the run without actually executing
  --help               Show this help message

Examples:
  node trigger-morning-distribution.js
  node trigger-morning-distribution.js --dry-run
  node trigger-morning-distribution.js --test-mode
  node trigger-morning-distribution.js --advisors advisor1,advisor2
  node trigger-morning-distribution.js --content-path /custom/path
                `);
                process.exit(0);
                break;
        }
    }
    
    trigger.run(options)
        .then(result => {
            console.log('\n✅ Manual morning distribution completed:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Manual morning distribution failed:', error.message);
            process.exit(1);
        });
}

module.exports = ManualDistributionTrigger;