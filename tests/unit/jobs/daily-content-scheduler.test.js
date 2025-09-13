const DailyContentScheduler = require('../../../jobs/daily-content-scheduler');
const schedulerState = require('../../../services/scheduler-state');
const { spawn } = require('child_process');
const EventEmitter = require('events');

jest.mock('../../../services/scheduler-state');
jest.mock('child_process');

describe('DailyContentScheduler', () => {
    let scheduler;
    let mockChild;

    beforeEach(() => {
        scheduler = new DailyContentScheduler();
        
        // Mock child process
        mockChild = new EventEmitter();
        mockChild.stdout = new EventEmitter();
        mockChild.stderr = new EventEmitter();
        mockChild.kill = jest.fn();
        
        spawn.mockReturnValue(mockChild);
        
        // Mock scheduler state
        schedulerState.acquireLock.mockResolvedValue('test-session-123');
        schedulerState.releaseLock.mockResolvedValue();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should initialize with correct job name and paths', () => {
            expect(scheduler.jobName).toBe('daily-content-generation');
            expect(scheduler.orchestratorPath).toContain('content-orchestrator.js');
        });
    });

    describe('run method', () => {
        test('should successfully run content generation', async () => {
            const runPromise = scheduler.run();
            
            // Simulate successful process execution
            setTimeout(() => {
                mockChild.stdout.emit('data', 'Processed 5 advisors\n');
                mockChild.stdout.emit('data', 'Content generation complete\n');
                mockChild.emit('close', 0);
            }, 10);
            
            const result = await runPromise;
            
            expect(schedulerState.acquireLock).toHaveBeenCalledWith('daily-content-generation');
            expect(spawn).toHaveBeenCalledWith('node', expect.arrayContaining([
                expect.stringContaining('content-orchestrator.js'),
                '--batch',
                '--evening-trigger'
            ]), expect.any(Object));
            
            expect(schedulerState.releaseLock).toHaveBeenCalledWith(
                'daily-content-generation', 
                expect.objectContaining({
                    success: true,
                    result: expect.objectContaining({
                        exitCode: 0,
                        advisorsProcessed: 5
                    })
                })
            );
        });

        test('should handle process failure', async () => {
            const runPromise = scheduler.run();
            
            // Simulate process failure
            setTimeout(() => {
                mockChild.stderr.emit('data', 'Error occurred\n');
                mockChild.emit('close', 1);
            }, 10);
            
            await expect(runPromise).rejects.toThrow('Content orchestrator failed with exit code 1');
            
            expect(schedulerState.releaseLock).toHaveBeenCalledWith(
                'daily-content-generation',
                expect.objectContaining({
                    success: false,
                    error: expect.stringContaining('exit code 1')
                })
            );
        });

        test('should handle timeout', async () => {
            // Mock shorter timeout for testing
            const originalTimeout = setTimeout;
            const mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
                if (delay === 30 * 60 * 1000) { // 30 minutes
                    return originalTimeout(fn, 10); // 10ms for testing
                }
                return originalTimeout(fn, delay);
            });

            const runPromise = scheduler.run();
            
            await expect(runPromise).rejects.toThrow('Content generation timeout after 30 minutes');
            
            expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
            
            mockSetTimeout.mockRestore();
        });
    });

    describe('parseAdvisorCount', () => {
        test('should extract advisor count from stdout', () => {
            const stdout = 'Starting process...\nProcessed 15 advisors successfully\nComplete.';
            const count = scheduler.parseAdvisorCount(stdout);
            expect(count).toBe(15);
        });

        test('should return 0 if no match found', () => {
            const stdout = 'No advisor count mentioned';
            const count = scheduler.parseAdvisorCount(stdout);
            expect(count).toBe(0);
        });
    });

    describe('healthCheck', () => {
        beforeEach(() => {
            schedulerState.getLastExecution.mockResolvedValue('2023-01-01T12:00:00Z');
            schedulerState.isJobRunning.mockResolvedValue(false);
        });

        test('should return health status', async () => {
            const health = await scheduler.healthCheck();
            
            expect(health).toMatchObject({
                jobName: 'daily-content-generation',
                lastExecution: '2023-01-01T12:00:00Z',
                isRunning: false,
                healthy: true,
                nextScheduled: expect.any(String)
            });
        });

        test('should handle errors in health check', async () => {
            schedulerState.getLastExecution.mockRejectedValue(new Error('State error'));
            
            const health = await scheduler.healthCheck();
            
            expect(health).toMatchObject({
                jobName: 'daily-content-generation',
                healthy: false,
                error: 'State error'
            });
        });
    });

    describe('getNextScheduledTime', () => {
        test('should calculate next 8:30 PM', () => {
            // Mock current time to be 6 PM
            const mockDate = new Date('2023-01-01T18:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
            
            const nextTime = scheduler.getNextScheduledTime();
            const next = new Date(nextTime);
            
            expect(next.getHours()).toBe(20); // 8 PM
            expect(next.getMinutes()).toBe(30);
            
            Date.mockRestore();
        });

        test('should schedule for next day if current time is past 8:30 PM', () => {
            // Mock current time to be 10 PM
            const mockDate = new Date('2023-01-01T22:00:00Z');
            jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
            
            const nextTime = scheduler.getNextScheduledTime();
            const next = new Date(nextTime);
            
            expect(next.getDate()).toBe(mockDate.getDate() + 1);
            expect(next.getHours()).toBe(20);
            expect(next.getMinutes()).toBe(30);
            
            Date.mockRestore();
        });
    });
});