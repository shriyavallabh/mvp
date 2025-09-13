#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const schedulerState = require('../services/scheduler-state');
const logger = require('../agents/utils/logger');

class MorningDistributionScheduler {
  constructor() {
    this.jobName = 'morning-distribution';
    this.projectRoot = path.join(__dirname, '..');
    this.distributionPath = path.join(this.projectRoot, 'agents/controllers/distribution-manager.js');
  }

  async run() {
    let sessionId;
    const startTime = Date.now();
    
    try {
      logger.info(`[${this.jobName}] Starting morning distribution at ${new Date().toISOString()}`);
      
      sessionId = await schedulerState.acquireLock(this.jobName);
      logger.info(`[${this.jobName}] Acquired lock with session ID: ${sessionId}`);

      const result = await this.triggerDistribution();
      
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

  async triggerDistribution() {
    return new Promise((resolve, reject) => {
      logger.info(`[${this.jobName}] Triggering distribution manager`);
      
      const child = spawn('node', [this.distributionPath, '--morning-batch', '--approved-content'], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          DISTRIBUTION_MODE: 'morning_batch',
          TRIGGER_SOURCE: 'morning-scheduler'
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.info(`[${this.jobName}] Distribution stdout: ${output.trim()}`);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logger.error(`[${this.jobName}] Distribution stderr: ${output.trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.info(`[${this.jobName}] Distribution manager completed successfully`);
          resolve({
            exitCode: code,
            stdout: stdout,
            distributionExecuted: true,
            advisorsReached: this.parseAdvisorCount(stdout),
            messagesDelivered: this.parseMessageCount(stdout)
          });
        } else {
          logger.error(`[${this.jobName}] Distribution manager failed with exit code ${code}`);
          reject(new Error(`Distribution manager failed with exit code ${code}. stderr: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        logger.error(`[${this.jobName}] Failed to spawn distribution manager:`, error);
        reject(error);
      });

      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Distribution timeout after 15 minutes'));
      }, 15 * 60 * 1000);
    });
  }

  parseAdvisorCount(stdout) {
    const match = stdout.match(/Delivered to (\d+) advisors/);
    return match ? parseInt(match[1]) : 0;
  }

  parseMessageCount(stdout) {
    const match = stdout.match(/(\d+) messages delivered/);
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
    next.setHours(5, 0, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
}

if (require.main === module) {
  const scheduler = new MorningDistributionScheduler();
  scheduler.run().catch(error => {
    console.error('Scheduler failed:', error);
    process.exit(1);
  });
}

module.exports = MorningDistributionScheduler;