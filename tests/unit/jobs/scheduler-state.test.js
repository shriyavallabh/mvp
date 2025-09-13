const SchedulerState = require('../../../services/scheduler-state');
const fs = require('fs').promises;
const path = require('path');

describe('SchedulerState', () => {
    let schedulerState;
    let testStateFile;

    beforeEach(async () => {
        // Use a test-specific state file
        testStateFile = path.join(__dirname, '..', '..', 'temp', 'test-scheduler-state.json');
        
        // Create temp directory
        await fs.mkdir(path.dirname(testStateFile), { recursive: true });
        
        // Mock the state file path
        schedulerState = new SchedulerState();
        schedulerState.stateFile = testStateFile;
        schedulerState.initialized = false;
    });

    afterEach(async () => {
        // Clean up test files
        try {
            await fs.unlink(testStateFile);
        } catch (error) {
            // File might not exist, which is fine
        }
    });

    describe('initialization', () => {
        test('should initialize with empty state when no file exists', async () => {
            await schedulerState.init();
            
            expect(schedulerState.initialized).toBe(true);
            expect(schedulerState.state.jobs).toEqual({});
            expect(schedulerState.state.activeJobs).toEqual(new Set());
        });

        test('should load existing state from file', async () => {
            const existingState = {
                jobs: { 'test-job': { status: 'COMPLETED' } },
                activeJobs: [],
                lastExecution: { 'test-job': '2023-01-01T00:00:00.000Z' }
            };
            
            await fs.writeFile(testStateFile, JSON.stringify(existingState));
            
            await schedulerState.init();
            
            expect(schedulerState.state.jobs['test-job']).toEqual({ status: 'COMPLETED' });
            expect(schedulerState.state.lastExecution['test-job']).toBe('2023-01-01T00:00:00.000Z');
        });
    });

    describe('lock management', () => {
        beforeEach(async () => {
            await schedulerState.init();
        });

        test('should acquire lock for new job', async () => {
            const sessionId = await schedulerState.acquireLock('test-job');
            
            expect(sessionId).toMatch(/^test-job-\d+$/);
            expect(schedulerState.state.activeJobs.has('test-job')).toBe(true);
            expect(schedulerState.state.jobs['test-job'].status).toBe('RUNNING');
        });

        test('should prevent double-locking same job', async () => {
            await schedulerState.acquireLock('test-job');
            
            await expect(schedulerState.acquireLock('test-job'))
                .rejects.toThrow('Job test-job is already running');
        });

        test('should release lock and update status', async () => {
            await schedulerState.acquireLock('test-job');
            
            await schedulerState.releaseLock('test-job', { 
                success: true, 
                duration: 1000 
            });
            
            expect(schedulerState.state.activeJobs.has('test-job')).toBe(false);
            expect(schedulerState.state.jobs['test-job'].status).toBe('COMPLETED');
        });
    });

    describe('job status queries', () => {
        beforeEach(async () => {
            await schedulerState.init();
        });

        test('should check if job is running', async () => {
            expect(await schedulerState.isJobRunning('test-job')).toBe(false);
            
            await schedulerState.acquireLock('test-job');
            expect(await schedulerState.isJobRunning('test-job')).toBe(true);
            
            await schedulerState.releaseLock('test-job', { success: true });
            expect(await schedulerState.isJobRunning('test-job')).toBe(false);
        });

        test('should return job status', async () => {
            expect(await schedulerState.getJobStatus('nonexistent')).toBeNull();
            
            await schedulerState.acquireLock('test-job');
            const status = await schedulerState.getJobStatus('test-job');
            
            expect(status).toMatchObject({
                status: 'RUNNING',
                sessionId: expect.stringMatching(/^test-job-\d+$/)
            });
        });

        test('should return last execution time', async () => {
            expect(await schedulerState.getLastExecution('test-job')).toBeNull();
            
            await schedulerState.acquireLock('test-job');
            await schedulerState.releaseLock('test-job', { success: true });
            
            const lastExecution = await schedulerState.getLastExecution('test-job');
            expect(lastExecution).toBeTruthy();
            expect(new Date(lastExecution)).toBeInstanceOf(Date);
        });
    });

    describe('cleanup', () => {
        beforeEach(async () => {
            await schedulerState.init();
        });

        test('should clean up old completed jobs', async () => {
            const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
            
            schedulerState.state.jobs['old-job'] = {
                status: 'COMPLETED',
                endTime: oldDate.toISOString()
            };
            
            schedulerState.state.jobs['recent-job'] = {
                status: 'COMPLETED', 
                endTime: new Date().toISOString()
            };
            
            await schedulerState.cleanup();
            
            expect(schedulerState.state.jobs['old-job']).toBeUndefined();
            expect(schedulerState.state.jobs['recent-job']).toBeDefined();
        });
    });
});