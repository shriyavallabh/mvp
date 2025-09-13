#!/usr/bin/env node

/**
 * Manual trigger for evening content generation
 * Executes the same workflow as the scheduled 8:30 PM job
 */

const path = require('path');
const { spawn } = require('child_process');
const schedulerState = require('../services/scheduler-state');
const Logger = require('../agents/utils/logger');

class ManualEveningTrigger {
    constructor() {
        this.logger = new Logger('manual-evening-trigger');
        this.jobName = 'manual-evening-generation';
        this.projectRoot = path.join(__dirname, '..');
    }

    async run(options = {}) {
        const { advisorIds = null, dryRun = false } = options;
        
        try {
            this.logger.info('Manual evening generation triggered', { 
                advisorIds, 
                dryRun,
                triggeredBy: 'manual',
                timestamp: new Date().toISOString()
            });

            if (dryRun) {
                return this.dryRun(advisorIds);
            }

            // Check if scheduled job is already running
            const isRunning = await schedulerState.isJobRunning('daily-content-generation');
            if (isRunning) {
                throw new Error('Scheduled content generation is already running. Cannot start manual trigger.');
            }

            const sessionId = await schedulerState.acquireLock(this.jobName);
            this.logger.info(`Acquired lock with session ID: ${sessionId}`);

            const result = await this.executeContentGeneration(advisorIds);

            await schedulerState.releaseLock(this.jobName, {
                success: true,
                manual: true,
                result: result,
                timestamp: new Date().toISOString()
            });

            this.logger.info('Manual evening generation completed successfully', result);
            return result;

        } catch (error) {
            this.logger.error('Manual evening generation failed:', error);
            
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

    async dryRun(advisorIds) {
        this.logger.info('Performing dry run for evening generation');
        
        try {
            const AdvisorManager = require('../agents/managers/advisor-manager');
            const advisorManager = new AdvisorManager();
            
            let advisors;
            if (advisorIds) {
                advisors = await Promise.all(
                    advisorIds.map(id => advisorManager.getAdvisorById(id))
                );
                advisors = advisors.filter(Boolean); // Remove null values
            } else {
                advisors = await advisorManager.getAllActiveAdvisors();
            }
            
            return {
                dryRun: true,
                advisorsToProcess: advisors.length,
                advisors: advisors.map(a => ({ id: a.id, name: a.name })),
                estimatedDuration: advisors.length * 2 * 60 * 1000, // 2 minutes per advisor
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // In dry run mode, if Google Sheets is not accessible, use mock data
            this.logger.warn('Could not access Google Sheets, using mock data for dry run:', error.message);
            
            const mockAdvisors = [
                { id: 'ARN-001', name: 'Mock Advisor 1' },
                { id: 'ARN-002', name: 'Mock Advisor 2' },
                { id: 'ARN-003', name: 'Mock Advisor 3' }
            ];
            
            const advisorsToProcess = advisorIds ? 
                mockAdvisors.filter(a => advisorIds.includes(a.id)) : 
                mockAdvisors;
            
            return {
                dryRun: true,
                advisorsToProcess: advisorsToProcess.length,
                advisors: advisorsToProcess,
                estimatedDuration: advisorsToProcess.length * 2 * 60 * 1000,
                timestamp: new Date().toISOString(),
                mockData: true
            };
        }
    }

    async executeContentGeneration(advisorIds) {
        return new Promise((resolve, reject) => {
            const orchestratorPath = path.join(this.projectRoot, 'agents/controllers/content-orchestrator.js');
            const args = ['--batch', '--evening-trigger'];
            
            if (advisorIds) {
                args.push('--advisors', advisorIds.join(','));
            }

            this.logger.info('Starting content orchestrator', { args });

            const child = spawn('node', [orchestratorPath, ...args], {
                cwd: this.projectRoot,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    BATCH_MODE: 'true',
                    MANUAL_TRIGGER: 'true',
                    TRIGGER_SOURCE: 'manual-evening-trigger'
                }
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                this.logger.info(`Orchestrator: ${output.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                this.logger.error(`Orchestrator error: ${output.trim()}`);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.logger.info('Content orchestrator completed successfully');
                    resolve({
                        exitCode: code,
                        stdout: stdout,
                        advisorsProcessed: this.parseAdvisorCount(stdout),
                        contentGenerated: this.parseContentCount(stdout),
                        manual: true
                    });
                } else {
                    this.logger.error(`Content orchestrator failed with exit code ${code}`);
                    reject(new Error(`Content orchestrator failed with exit code ${code}. stderr: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                this.logger.error('Failed to spawn content orchestrator:', error);
                reject(error);
            });

            // Timeout after 45 minutes for manual trigger
            setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error('Manual content generation timeout after 45 minutes'));
            }, 45 * 60 * 1000);
        });
    }

    parseAdvisorCount(stdout) {
        const match = stdout.match(/Processed (\d+) advisors/);
        return match ? parseInt(match[1]) : 0;
    }

    parseContentCount(stdout) {
        const match = stdout.match(/(\d+) content items generated/);
        return match ? parseInt(match[1]) : 0;
    }
}

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);
    const trigger = new ManualEveningTrigger();
    
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--advisors':
                options.advisorIds = args[++i].split(',');
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
                console.log(`
Usage: node trigger-evening-generation.js [options]

Options:
  --advisors <id1,id2>  Only process specific advisor IDs
  --dry-run            Simulate the run without actually executing
  --help               Show this help message

Examples:
  node trigger-evening-generation.js
  node trigger-evening-generation.js --dry-run
  node trigger-evening-generation.js --advisors advisor1,advisor2
                `);
                process.exit(0);
                break;
        }
    }
    
    trigger.run(options)
        .then(result => {
            console.log('\n✅ Manual evening generation completed:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Manual evening generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ManualEveningTrigger;