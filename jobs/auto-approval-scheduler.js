#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const schedulerState = require('../services/scheduler-state');
const logger = require('../agents/utils/logger');

class AutoApprovalScheduler {
  constructor() {
    this.jobName = 'auto-approval-guardian';
    this.projectRoot = path.join(__dirname, '..');
    this.guardianPath = path.join(this.projectRoot, 'agents/controllers/approval-guardian.js');
  }

  async run() {
    let sessionId;
    const startTime = Date.now();
    
    try {
      logger.info(`[${this.jobName}] Starting auto-approval process at ${new Date().toISOString()}`);
      
      sessionId = await schedulerState.acquireLock(this.jobName);
      logger.info(`[${this.jobName}] Acquired lock with session ID: ${sessionId}`);

      const result = await this.triggerAutoApproval();
      
      await schedulerState.releaseLock(this.jobName, {
        success: true,
        duration: Date.now() - startTime,
        result: result,
        timestamp: new Date().toISOString()
      });

      logger.info(`[${this.jobName}] Completed successfully in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      logger.error(`[${this.jobName}] Failed:`, error);
      
      if (sessionId) {
        await schedulerState.releaseLock(this.jobName, {
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      }
      
      process.exit(1);
    }
  }

  async triggerAutoApproval() {
    return new Promise((resolve, reject) => {
      logger.info(`[${this.jobName}] Triggering approval guardian`);
      
      const child = spawn('node', [this.guardianPath, '--auto-approve', '--scheduled'], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          AUTO_APPROVE: 'true',
          TRIGGER_SOURCE: 'auto-approval-scheduler'
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.info(`[${this.jobName}] Guardian stdout: ${output.trim()}`);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logger.error(`[${this.jobName}] Guardian stderr: ${output.trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.info(`[${this.jobName}] Approval guardian completed successfully`);
          resolve({
            exitCode: code,
            stdout: stdout,
            autoApprovalExecuted: true,
            approvalDecision: this.parseApprovalDecision(stdout),
            contentApproved: this.parseContentApproved(stdout)
          });
        } else {
          logger.error(`[${this.jobName}] Approval guardian failed with exit code ${code}`);
          reject(new Error(`Approval guardian failed with exit code ${code}. stderr: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        logger.error(`[${this.jobName}] Failed to spawn approval guardian:`, error);
        reject(error);
      });

      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Auto-approval timeout after 10 minutes'));
      }, 10 * 60 * 1000);
    });
  }

  parseApprovalDecision(stdout) {
    if (stdout.includes('Content approved automatically')) return 'approved';
    if (stdout.includes('Content requires manual review')) return 'manual_review_required';
    if (stdout.includes('Content regeneration triggered')) return 'regenerated';
    return 'unknown';
  }

  parseContentApproved(stdout) {
    const match = stdout.match(/(\d+) items approved/);
    return match ? parseInt(match[1]) : 0;
  }

  async healthCheck() {
    try {
      const lastExecution = await schedulerState.getLastExecution(this.jobName);
      const isRunning = await schedulerState.isJobRunning(this.jobName);
      
      return {
        jobName: this.jobName,
        lastExecution,
        isRunning,
        nextScheduled: this.getNextScheduledTime(),
        healthy: true
      };
    } catch (error) {
      return {
        jobName: this.jobName,
        healthy: false,
        error: error.message
      };
    }
  }

  getNextScheduledTime() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(23, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
}

if (require.main === module) {
  const scheduler = new AutoApprovalScheduler();
  scheduler.run().catch(error => {
    console.error('Scheduler failed:', error);
    process.exit(1);
  });
}

module.exports = AutoApprovalScheduler;