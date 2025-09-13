#!/usr/bin/env node

/**
 * Manual trigger for auto-approval process
 * Executes the same workflow as the scheduled 11:00 PM job
 */

const path = require('path');
const { spawn } = require('child_process');
const schedulerState = require('../services/scheduler-state');
const Logger = require('../agents/utils/logger');

class ManualApprovalTrigger {
    constructor() {
        this.logger = new Logger('manual-approval-trigger');
        this.jobName = 'manual-auto-approval';
        this.projectRoot = path.join(__dirname, '..');
    }

    async run(options = {}) {
        const { force = false, reviewQueuePath = null, dryRun = false } = options;
        
        try {
            this.logger.info('Manual auto-approval triggered', { 
                force, 
                reviewQueuePath,
                dryRun,
                triggeredBy: 'manual',
                timestamp: new Date().toISOString()
            });

            if (dryRun) {
                return this.dryRun(reviewQueuePath);
            }

            // Check if scheduled job is already running
            const isRunning = await schedulerState.isJobRunning('auto-approval-guardian');
            if (isRunning && !force) {
                throw new Error('Scheduled auto-approval is already running. Use --force to override.');
            }

            const sessionId = await schedulerState.acquireLock(this.jobName);
            this.logger.info(`Acquired lock with session ID: ${sessionId}`);

            const result = await this.executeAutoApproval(options);

            await schedulerState.releaseLock(this.jobName, {
                success: true,
                manual: true,
                result: result,
                timestamp: new Date().toISOString()
            });

            this.logger.info('Manual auto-approval completed successfully', result);
            return result;

        } catch (error) {
            this.logger.error('Manual auto-approval failed:', error);
            
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

    async dryRun(reviewQueuePath) {
        this.logger.info('Performing dry run for auto-approval');
        
        const fs = require('fs').promises;
        const path = require('path');
        
        const queuePath = reviewQueuePath || path.join(this.projectRoot, 'data', 'review-queue');
        
        let pendingFiles = [];
        try {
            const files = await fs.readdir(queuePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(queuePath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(content);
                    if (data.status === 'pending_review') {
                        pendingFiles.push({
                            file,
                            advisorId: data.advisorId,
                            generatedAt: data.generatedAt,
                            contentType: data.content?.type
                        });
                    }
                }
            }
        } catch (error) {
            this.logger.warn('Could not read review queue:', error);
        }
        
        return {
            dryRun: true,
            pendingReviews: pendingFiles.length,
            files: pendingFiles,
            estimatedDuration: pendingFiles.length * 30 * 1000, // 30 seconds per item
            timestamp: new Date().toISOString()
        };
    }

    async executeAutoApproval(options) {
        return new Promise((resolve, reject) => {
            const guardianPath = path.join(this.projectRoot, 'agents/controllers/approval-guardian.js');
            const args = ['--auto-approve', '--scheduled'];
            
            if (options.reviewQueuePath) {
                args.push('--queue-path', options.reviewQueuePath);
            }
            
            if (options.force) {
                args.push('--force');
            }

            this.logger.info('Starting approval guardian', { args });

            const child = spawn('node', [guardianPath, ...args], {
                cwd: this.projectRoot,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    AUTO_APPROVE: 'true',
                    MANUAL_TRIGGER: 'true',
                    TRIGGER_SOURCE: 'manual-approval-trigger'
                }
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                this.logger.info(`Guardian: ${output.trim()}`);
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                this.logger.error(`Guardian error: ${output.trim()}`);
            });

            child.on('close', (code) => {
                if (code === 0) {
                    this.logger.info('Approval guardian completed successfully');
                    resolve({
                        exitCode: code,
                        stdout: stdout,
                        approvalDecision: this.parseApprovalDecision(stdout),
                        itemsProcessed: this.parseItemsProcessed(stdout),
                        itemsApproved: this.parseItemsApproved(stdout),
                        manual: true
                    });
                } else {
                    this.logger.error(`Approval guardian failed with exit code ${code}`);
                    reject(new Error(`Approval guardian failed with exit code ${code}. stderr: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                this.logger.error('Failed to spawn approval guardian:', error);
                reject(error);
            });

            // Timeout after 15 minutes for manual trigger
            setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error('Manual auto-approval timeout after 15 minutes'));
            }, 15 * 60 * 1000);
        });
    }

    parseApprovalDecision(stdout) {
        if (stdout.includes('All content approved automatically')) return 'all_approved';
        if (stdout.includes('Content approved with conditions')) return 'conditional_approval';
        if (stdout.includes('Manual review required')) return 'manual_review_required';
        if (stdout.includes('Content regeneration triggered')) return 'regeneration_required';
        return 'unknown';
    }

    parseItemsProcessed(stdout) {
        const match = stdout.match(/Processed (\d+) items/);
        return match ? parseInt(match[1]) : 0;
    }

    parseItemsApproved(stdout) {
        const match = stdout.match(/(\d+) items approved/);
        return match ? parseInt(match[1]) : 0;
    }
}

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);
    const trigger = new ManualApprovalTrigger();
    
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--queue-path':
                options.reviewQueuePath = args[++i];
                break;
            case '--force':
                options.force = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
                console.log(`
Usage: node trigger-auto-approval.js [options]

Options:
  --queue-path <path>   Specify custom review queue directory
  --force              Force execution even if scheduled job is running
  --dry-run            Simulate the run without actually executing
  --help               Show this help message

Examples:
  node trigger-auto-approval.js
  node trigger-auto-approval.js --dry-run
  node trigger-auto-approval.js --force
  node trigger-auto-approval.js --queue-path /custom/path
                `);
                process.exit(0);
                break;
        }
    }
    
    trigger.run(options)
        .then(result => {
            console.log('\n✅ Manual auto-approval completed:');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Manual auto-approval failed:', error.message);
            process.exit(1);
        });
}

module.exports = ManualApprovalTrigger;