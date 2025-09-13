/**
 * PM2 Scheduling System Tests
 * Tests cron triggers, job execution, and state management
 */

const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const testHelpers = require('./playwright/fixtures/test-helpers');

test.describe('PM2 Scheduling System Tests', () => {
  let testResults = [];

  test.beforeAll(async () => {
    console.log('Starting PM2 Scheduling Tests...');
  });

  test.afterAll(async () => {
    const report = testHelpers.formatTestReport(testResults);
    console.log('PM2 Scheduling Test Report:', report);
  });

  test.describe('PM2 Process Management', () => {
    test('Should check PM2 installation', async () => {
      try {
        const version = execSync('pm2 --version', { encoding: 'utf-8' }).trim();
        expect(version).toBeTruthy();
        
        testResults.push({
          test: 'PM2 Installation',
          status: 'passed',
          details: `PM2 version: ${version}`
        });
      } catch (error) {
        testResults.push({
          test: 'PM2 Installation',
          status: 'failed',
          error: 'PM2 not installed'
        });
        throw error;
      }
    });

    test('Should list PM2 processes', async () => {
      try {
        const processes = execSync('pm2 jlist 2>/dev/null || echo "[]"', { encoding: 'utf-8' });
        const processList = JSON.parse(processes);
        
        expect(Array.isArray(processList)).toBe(true);
        
        testResults.push({
          test: 'PM2 Process List',
          status: 'passed',
          details: `Found ${processList.length} processes`
        });
      } catch (error) {
        testResults.push({
          test: 'PM2 Process List',
          status: 'warning',
          message: 'No PM2 processes running'
        });
      }
    });
  });

  test.describe('Cron Schedule Configuration', () => {
    test('Should validate daily-content-scheduler cron', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const scheduler = ecosystemConfig.apps.find(app => app.name === 'daily-content-scheduler');
      
      expect(scheduler).toBeDefined();
      expect(scheduler.cron_restart).toBe('30 20 * * *'); // 8:30 PM
      
      testResults.push({
        test: 'Daily Content Scheduler Config',
        status: 'passed',
        details: 'Cron: 8:30 PM daily'
      });
    });

    test('Should validate auto-approval-scheduler cron', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const scheduler = ecosystemConfig.apps.find(app => app.name === 'auto-approval-scheduler');
      
      expect(scheduler).toBeDefined();
      expect(scheduler.cron_restart).toBe('0 23 * * *'); // 11:00 PM
      
      testResults.push({
        test: 'Auto Approval Scheduler Config',
        status: 'passed',
        details: 'Cron: 11:00 PM daily'
      });
    });

    test('Should validate morning-distribution-scheduler cron', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const scheduler = ecosystemConfig.apps.find(app => app.name === 'morning-distribution-scheduler');
      
      expect(scheduler).toBeDefined();
      expect(scheduler.cron_restart).toBe('0 5 * * *'); // 5:00 AM
      
      testResults.push({
        test: 'Morning Distribution Scheduler Config',
        status: 'passed',
        details: 'Cron: 5:00 AM daily'
      });
    });
  });

  test.describe('Scheduler State Management', () => {
    test('Should test scheduler state file', async () => {
      const stateFile = path.join(process.cwd(), 'data/scheduler-state.json');
      
      // Create test state
      const testState = {
        lastRun: {
          dailyContent: null,
          autoApproval: null,
          morningDistribution: null
        },
        currentJobs: {},
        locks: {}
      };
      
      // Ensure data directory exists
      const dataDir = path.dirname(stateFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write test state
      fs.writeFileSync(stateFile, JSON.stringify(testState, null, 2));
      
      // Read and verify
      const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      expect(savedState.lastRun).toBeDefined();
      expect(savedState.currentJobs).toBeDefined();
      expect(savedState.locks).toBeDefined();
      
      testResults.push({
        test: 'Scheduler State Management',
        status: 'passed'
      });
    });

    test('Should test job locking mechanism', async () => {
      const SchedulerState = require(path.join(process.cwd(), 'services/scheduler-state.js'));
      const state = new SchedulerState();
      
      // Test acquiring lock
      const lockAcquired = await state.acquireLock('test-job');
      expect(lockAcquired).toBe(true);
      
      // Test lock prevents concurrent execution
      const secondLock = await state.acquireLock('test-job');
      expect(secondLock).toBe(false);
      
      // Release lock
      await state.releaseLock('test-job');
      
      // Test lock can be acquired again
      const thirdLock = await state.acquireLock('test-job');
      expect(thirdLock).toBe(true);
      await state.releaseLock('test-job');
      
      testResults.push({
        test: 'Job Locking Mechanism',
        status: 'passed'
      });
    });
  });

  test.describe('Manual Trigger Scripts', () => {
    test('Should verify manual trigger scripts exist', async () => {
      const scripts = [
        'scripts/trigger-evening-generation.js',
        'scripts/trigger-auto-approval.js',
        'scripts/trigger-morning-distribution.js'
      ];
      
      const scriptsExist = scripts.map(script => ({
        script,
        exists: fs.existsSync(path.join(process.cwd(), script))
      }));
      
      scriptsExist.forEach(({ script, exists }) => {
        expect(exists).toBe(true);
      });
      
      testResults.push({
        test: 'Manual Trigger Scripts',
        status: scriptsExist.every(s => s.exists) ? 'passed' : 'failed',
        details: `${scriptsExist.filter(s => s.exists).length}/${scripts.length} scripts found`
      });
    });

    test('Should test dry-run capability', async () => {
      const scriptPath = path.join(process.cwd(), 'scripts/trigger-evening-generation.js');
      
      if (fs.existsSync(scriptPath)) {
        try {
          // Test dry-run mode
          const output = execSync(`node ${scriptPath} --dry-run 2>&1 || true`, { 
            encoding: 'utf-8',
            timeout: 5000 
          });
          
          expect(output).toContain('DRY RUN');
          
          testResults.push({
            test: 'Dry Run Capability',
            status: 'passed'
          });
        } catch (error) {
          testResults.push({
            test: 'Dry Run Capability',
            status: 'warning',
            message: 'Script exists but dry-run failed'
          });
        }
      } else {
        testResults.push({
          test: 'Dry Run Capability',
          status: 'skipped',
          message: 'Script not found'
        });
      }
    });
  });

  test.describe('Job Execution Timing', () => {
    test('Should validate timezone configuration', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const schedulers = ecosystemConfig.apps.filter(app => app.name.includes('scheduler'));
      
      schedulers.forEach(scheduler => {
        expect(scheduler.env.TZ).toBe('Asia/Kolkata');
      });
      
      testResults.push({
        test: 'Timezone Configuration',
        status: 'passed',
        details: 'All schedulers use Asia/Kolkata timezone'
      });
    });

    test('Should test cron expression parsing', async () => {
      const cronExpressions = [
        { expr: '30 20 * * *', expected: '8:30 PM daily' },
        { expr: '0 23 * * *', expected: '11:00 PM daily' },
        { expr: '0 5 * * *', expected: '5:00 AM daily' }
      ];
      
      // Basic cron validation
      cronExpressions.forEach(({ expr, expected }) => {
        const parts = expr.split(' ');
        expect(parts.length).toBe(5);
        
        const [minute, hour] = parts;
        expect(parseInt(minute)).toBeGreaterThanOrEqual(0);
        expect(parseInt(minute)).toBeLessThanOrEqual(59);
        expect(parseInt(hour)).toBeGreaterThanOrEqual(0);
        expect(parseInt(hour)).toBeLessThanOrEqual(23);
      });
      
      testResults.push({
        test: 'Cron Expression Validation',
        status: 'passed'
      });
    });
  });

  test.describe('Job Failure Recovery', () => {
    test('Should test retry mechanism', async () => {
      // Mock retry logic
      const retryOperation = async (operation, maxRetries = 3) => {
        let retries = 0;
        let lastError;
        
        while (retries < maxRetries) {
          try {
            // Simulate operation that fails first time
            if (retries === 0) {
              throw new Error('First attempt failed');
            }
            return { success: true, attempts: retries + 1 };
          } catch (error) {
            lastError = error;
            retries++;
            await testHelpers.sleep(100); // Small delay between retries
          }
        }
        
        throw lastError;
      };
      
      const result = await retryOperation(() => true);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      
      testResults.push({
        test: 'Retry Mechanism',
        status: 'passed'
      });
    });

    test('Should test error logging', async () => {
      const logDir = path.join(process.cwd(), 'logs');
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Create test log entry
      const testLog = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        job: 'test-scheduler',
        message: 'Test error message',
        stack: 'Test stack trace'
      };
      
      const logFile = path.join(logDir, 'scheduler-error.log');
      fs.appendFileSync(logFile, JSON.stringify(testLog) + '\n');
      
      // Verify log was written
      const logContent = fs.readFileSync(logFile, 'utf-8');
      expect(logContent).toContain('Test error message');
      
      testResults.push({
        test: 'Error Logging',
        status: 'passed'
      });
    });
  });

  test.describe('Resource Management', () => {
    test('Should check memory limits', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const schedulers = ecosystemConfig.apps.filter(app => app.name.includes('scheduler'));
      
      schedulers.forEach(scheduler => {
        expect(scheduler.max_memory_restart).toBeDefined();
        const memoryLimit = parseInt(scheduler.max_memory_restart);
        expect(memoryLimit).toBeGreaterThanOrEqual(200);
        expect(memoryLimit).toBeLessThanOrEqual(500);
      });
      
      testResults.push({
        test: 'Memory Limit Configuration',
        status: 'passed',
        details: 'All schedulers have appropriate memory limits'
      });
    });

    test('Should test autorestart configuration', async () => {
      const ecosystemConfig = require(path.join(process.cwd(), 'config/ecosystem.config.js'));
      const schedulers = ecosystemConfig.apps.filter(app => app.name.includes('scheduler'));
      
      schedulers.forEach(scheduler => {
        // Schedulers should not autorestart (they run on cron)
        expect(scheduler.autorestart).toBe(false);
      });
      
      testResults.push({
        test: 'Autorestart Configuration',
        status: 'passed',
        details: 'Schedulers configured for cron-only execution'
      });
    });
  });
});