#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const schedulerState = require('../services/scheduler-state');
const logger = require('../agents/utils/logger');

class DailyContentScheduler {
  constructor() {
    this.jobName = 'daily-content-generation';
    this.projectRoot = path.join(__dirname, '..');
    this.orchestratorPath = path.join(this.projectRoot, 'agents/controllers/content-orchestrator.js');
  }

  async run() {
    let sessionId;
    const startTime = Date.now();
    
    try {
      logger.info(`[${this.jobName}] Starting evening content generation at ${new Date().toISOString()}`);
      
      sessionId = await schedulerState.acquireLock(this.jobName);
      logger.info(`[${this.jobName}] Acquired lock with session ID: ${sessionId}`);

      const result = await this.triggerContentGeneration();
      
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

  async triggerContentGeneration() {
    return new Promise((resolve, reject) => {
      logger.info(`[${this.jobName}] Triggering content orchestrator`);
      
      const child = spawn('node', [this.orchestratorPath, '--batch', '--evening-trigger'], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          BATCH_MODE: 'true',
          TRIGGER_SOURCE: 'evening-scheduler'
        }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logger.info(`[${this.jobName}] Orchestrator stdout: ${output.trim()}`);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logger.error(`[${this.jobName}] Orchestrator stderr: ${output.trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.info(`[${this.jobName}] Content orchestrator completed successfully`);
          resolve({
            exitCode: code,
            stdout: stdout,
            contentGenerated: true,
            advisorsProcessed: this.parseAdvisorCount(stdout)
          });
        } else {
          logger.error(`[${this.jobName}] Content orchestrator failed with exit code ${code}`);
          reject(new Error(`Content orchestrator failed with exit code ${code}. stderr: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        logger.error(`[${this.jobName}] Failed to spawn content orchestrator:`, error);
        reject(error);
      });

      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Content generation timeout after 30 minutes'));
      }, 30 * 60 * 1000);
    });
  }

  parseAdvisorCount(stdout) {
    const match = stdout.match(/Processed (\d+) advisors/);
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
    next.setHours(20, 30, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
}

if (require.main === module) {
  const scheduler = new DailyContentScheduler();
  scheduler.run().catch(error => {
    console.error('Scheduler failed:', error);
    process.exit(1);
  });
}

module.exports = DailyContentScheduler;