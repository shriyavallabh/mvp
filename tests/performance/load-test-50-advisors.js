#!/usr/bin/env node

/**
 * Load Test for 50+ Advisors
 * Performance target: Complete in under 30 minutes
 */

const path = require('path');
const fs = require('fs').promises;
const { performance } = require('perf_hooks');

// Import agents
const ContentOrchestrator = require('../../agents/controllers/content-orchestrator');
const AdvisorManager = require('../../agents/managers/advisor-manager');
const { logger } = require('../../agents/utils/logger');

// Test configuration
const TEST_CONFIG = {
    NUM_ADVISORS: 50,
    BATCH_SIZE: 10,
    DELAY_BETWEEN_BATCHES: 1000, // 1 second
    MAX_EXECUTION_TIME: 30 * 60 * 1000, // 30 minutes in milliseconds
    MEMORY_LIMIT: 500 * 1024 * 1024, // 500MB in bytes
    CONNECTION_POOL_SIZE: 5
};

// Performance metrics
const metrics = {
    startTime: null,
    endTime: null,
    totalAdvisors: 0,
    successfulAdvisors: 0,
    failedAdvisors: 0,
    avgProcessingTime: 0,
    peakMemoryUsage: 0,
    batchMetrics: [],
    apiMetrics: {
        claude: { calls: 0, avgTime: 0, errors: 0 },
        gemini: { calls: 0, avgTime: 0, errors: 0 },
        whatsapp: { calls: 0, avgTime: 0, errors: 0 },
        googleDrive: { calls: 0, avgTime: 0, errors: 0 }
    }
};

// Connection pool for API reuse
class ConnectionPool {
    constructor(size) {
        this.pool = [];
        this.size = size;
        this.activeConnections = 0;
    }

    async getConnection() {
        if (this.activeConnections < this.size) {
            this.activeConnections++;
            return { id: this.activeConnections, active: true };
        }
        // Wait for available connection
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getConnection();
    }

    releaseConnection(connection) {
        connection.active = false;
        this.activeConnections--;
    }
}

const connectionPool = new ConnectionPool(TEST_CONFIG.CONNECTION_POOL_SIZE);

// Generate test advisor profiles
async function generateTestAdvisors(count) {
    const advisors = [];
    const segments = ['young_professionals', 'retirees', 'families', 'entrepreneurs', 'salaried'];
    const tones = ['professional', 'friendly', 'educational', 'motivational'];
    const focuses = ['growth', 'safety', 'balanced', 'income', 'tax_saving'];

    for (let i = 1; i <= count; i++) {
        advisors.push({
            arn: `TEST_ARN_${String(i).padStart(3, '0')}`,
            name: `Test Advisor ${i}`,
            whatsapp: `+9199999${String(i).padStart(5, '0')}`,
            email: `testadvisor${i}@example.com`,
            client_segment: segments[i % segments.length],
            tone: tones[i % tones.length],
            content_focus: focuses[i % focuses.length],
            brand_colors: ['#FF5733', '#33FF57'],
            logo_url: 'https://example.com/logo.png',
            auto_send: true,
            active: true
        });
    }

    return advisors;
}

// Process single advisor with performance tracking
async function processAdvisor(advisor, connection) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        // Track API calls
        const apiTracker = {
            claude: { start: 0, end: 0 },
            gemini: { start: 0, end: 0 }
        };

        // Simulate content generation with connection reuse
        apiTracker.claude.start = performance.now();
        const content = await simulateContentGeneration(advisor, connection);
        apiTracker.claude.end = performance.now();
        metrics.apiMetrics.claude.calls++;
        metrics.apiMetrics.claude.avgTime = 
            (metrics.apiMetrics.claude.avgTime * (metrics.apiMetrics.claude.calls - 1) + 
            (apiTracker.claude.end - apiTracker.claude.start)) / metrics.apiMetrics.claude.calls;

        // Simulate image generation
        apiTracker.gemini.start = performance.now();
        const image = await simulateImageGeneration(advisor, connection);
        apiTracker.gemini.end = performance.now();
        metrics.apiMetrics.gemini.calls++;
        metrics.apiMetrics.gemini.avgTime = 
            (metrics.apiMetrics.gemini.avgTime * (metrics.apiMetrics.gemini.calls - 1) + 
            (apiTracker.gemini.end - apiTracker.gemini.start)) / metrics.apiMetrics.gemini.calls;

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;
        const memoryUsed = (endMemory - startMemory) / 1024 / 1024; // Convert to MB

        // Check memory limit
        if (memoryUsed > TEST_CONFIG.MEMORY_LIMIT / 1024 / 1024) {
            throw new Error(`Memory limit exceeded: ${memoryUsed.toFixed(2)}MB`);
        }

        // Update peak memory usage
        if (memoryUsed > metrics.peakMemoryUsage) {
            metrics.peakMemoryUsage = memoryUsed;
        }

        return {
            success: true,
            advisor: advisor.arn,
            processingTime: endTime - startTime,
            memoryUsed,
            content,
            image
        };
    } catch (error) {
        logger.error(`Failed to process advisor ${advisor.arn}:`, error);
        metrics.failedAdvisors++;
        
        // Track API errors
        if (error.message.includes('Claude')) {
            metrics.apiMetrics.claude.errors++;
        } else if (error.message.includes('Gemini')) {
            metrics.apiMetrics.gemini.errors++;
        }

        return {
            success: false,
            advisor: advisor.arn,
            error: error.message
        };
    }
}

// Simulate content generation (replace with actual implementation)
async function simulateContentGeneration(advisor, connection) {
    // Simulate API call with session reuse
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
        whatsapp: `Test content for ${advisor.name} focusing on ${advisor.content_focus}`,
        linkedin: `Professional update about ${advisor.content_focus} investments`,
        status: 'generated',
        quality_score: 0.85 + Math.random() * 0.15
    };
}

// Simulate image generation (replace with actual implementation)
async function simulateImageGeneration(advisor, connection) {
    // Simulate API call with connection reuse
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    return {
        url: `https://example.com/image_${advisor.arn}.png`,
        cached: Math.random() > 0.3, // 70% cache hit rate simulation
        size: '1080x1080'
    };
}

// Process batch of advisors
async function processBatch(advisors, batchNumber) {
    const batchStart = performance.now();
    logger.info(`Processing batch ${batchNumber} with ${advisors.length} advisors`);

    const promises = advisors.map(async (advisor) => {
        const connection = await connectionPool.getConnection();
        try {
            return await processAdvisor(advisor, connection);
        } finally {
            connectionPool.releaseConnection(connection);
        }
    });

    const results = await Promise.all(promises);
    const batchEnd = performance.now();

    const batchMetric = {
        batchNumber,
        advisorCount: advisors.length,
        duration: batchEnd - batchStart,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        avgProcessingTime: results.reduce((acc, r) => acc + (r.processingTime || 0), 0) / results.length
    };

    metrics.batchMetrics.push(batchMetric);
    logger.info(`Batch ${batchNumber} completed in ${(batchMetric.duration / 1000).toFixed(2)}s`);

    return results;
}

// Request queue implementation for rate limiting
class RequestQueue {
    constructor(rateLimit) {
        this.queue = [];
        this.processing = false;
        this.rateLimit = rateLimit; // requests per second
        this.lastRequestTime = 0;
    }

    async add(request) {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            const minInterval = 1000 / this.rateLimit;

            if (timeSinceLastRequest < minInterval) {
                await new Promise(resolve => 
                    setTimeout(resolve, minInterval - timeSinceLastRequest)
                );
            }

            const { request, resolve, reject } = this.queue.shift();
            this.lastRequestTime = Date.now();

            try {
                const result = await request();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.processing = false;
    }
}

// Gemini API rate limiting queue (60 requests per minute)
const geminiQueue = new RequestQueue(1); // 1 request per second for testing

// Main load test function
async function runLoadTest() {
    console.log('='.repeat(60));
    console.log('LOAD TEST: 50+ ADVISORS PERFORMANCE TEST');
    console.log('='.repeat(60));
    console.log(`Target: Process ${TEST_CONFIG.NUM_ADVISORS} advisors in under 30 minutes`);
    console.log(`Batch size: ${TEST_CONFIG.BATCH_SIZE}`);
    console.log(`Memory limit per agent: ${TEST_CONFIG.MEMORY_LIMIT / 1024 / 1024}MB`);
    console.log('='.repeat(60));

    metrics.startTime = Date.now();
    metrics.totalAdvisors = TEST_CONFIG.NUM_ADVISORS;

    try {
        // Generate test advisors
        logger.info('Generating test advisor profiles...');
        const advisors = await generateTestAdvisors(TEST_CONFIG.NUM_ADVISORS);

        // Process in batches
        const batches = [];
        for (let i = 0; i < advisors.length; i += TEST_CONFIG.BATCH_SIZE) {
            batches.push(advisors.slice(i, i + TEST_CONFIG.BATCH_SIZE));
        }

        logger.info(`Processing ${batches.length} batches...`);

        for (let i = 0; i < batches.length; i++) {
            const results = await processBatch(batches[i], i + 1);
            
            // Update success/failure counts
            metrics.successfulAdvisors += results.filter(r => r.success).length;
            metrics.failedAdvisors += results.filter(r => !r.success).length;

            // Add delay between batches
            if (i < batches.length - 1) {
                await new Promise(resolve => 
                    setTimeout(resolve, TEST_CONFIG.DELAY_BETWEEN_BATCHES)
                );
            }

            // Check if exceeding time limit
            const elapsed = Date.now() - metrics.startTime;
            if (elapsed > TEST_CONFIG.MAX_EXECUTION_TIME) {
                throw new Error('Test exceeded maximum execution time of 30 minutes');
            }
        }

        metrics.endTime = Date.now();
        const totalDuration = (metrics.endTime - metrics.startTime) / 1000 / 60; // minutes

        // Calculate average processing time
        metrics.avgProcessingTime = metrics.batchMetrics.reduce(
            (acc, b) => acc + b.avgProcessingTime, 0
        ) / metrics.batchMetrics.length;

        // Generate performance report
        console.log('\n' + '='.repeat(60));
        console.log('PERFORMANCE TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`Total Duration: ${totalDuration.toFixed(2)} minutes`);
        console.log(`Target Met: ${totalDuration < 30 ? '✅ YES' : '❌ NO'}`);
        console.log(`Advisors Processed: ${metrics.successfulAdvisors}/${metrics.totalAdvisors}`);
        console.log(`Success Rate: ${((metrics.successfulAdvisors / metrics.totalAdvisors) * 100).toFixed(2)}%`);
        console.log(`Average Processing Time: ${(metrics.avgProcessingTime / 1000).toFixed(2)}s per advisor`);
        console.log(`Peak Memory Usage: ${metrics.peakMemoryUsage.toFixed(2)}MB`);
        console.log('\n📊 API Performance Metrics:');
        console.log(`Claude API: ${metrics.apiMetrics.claude.calls} calls, ${(metrics.apiMetrics.claude.avgTime / 1000).toFixed(2)}s avg, ${metrics.apiMetrics.claude.errors} errors`);
        console.log(`Gemini API: ${metrics.apiMetrics.gemini.calls} calls, ${(metrics.apiMetrics.gemini.avgTime / 1000).toFixed(2)}s avg, ${metrics.apiMetrics.gemini.errors} errors`);
        console.log('\n📈 Batch Performance:');
        metrics.batchMetrics.forEach(batch => {
            console.log(`  Batch ${batch.batchNumber}: ${batch.successful}/${batch.advisorCount} successful, ${(batch.duration / 1000).toFixed(2)}s`);
        });

        // Save detailed metrics to file
        const reportPath = path.join(__dirname, `load-test-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(metrics, null, 2));
        console.log(`\n📁 Detailed report saved to: ${reportPath}`);

        // Performance bottleneck analysis
        console.log('\n🔍 Bottleneck Analysis:');
        if (metrics.avgProcessingTime > 2000) {
            console.log('  ⚠️ High average processing time detected');
            console.log('  Recommendation: Optimize Claude CLI session reuse');
        }
        if (metrics.peakMemoryUsage > 400) {
            console.log('  ⚠️ High memory usage detected');
            console.log('  Recommendation: Implement better garbage collection');
        }
        if (metrics.apiMetrics.claude.errors > 0 || metrics.apiMetrics.gemini.errors > 0) {
            console.log('  ⚠️ API errors detected');
            console.log('  Recommendation: Implement better retry logic');
        }

        // Test result
        const testPassed = totalDuration < 30 && metrics.successfulAdvisors === metrics.totalAdvisors;
        console.log('\n' + '='.repeat(60));
        console.log(`LOAD TEST ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log('='.repeat(60));

        process.exit(testPassed ? 0 : 1);

    } catch (error) {
        logger.error('Load test failed:', error);
        console.error('\n❌ LOAD TEST FAILED:', error.message);
        process.exit(1);
    }
}

// Run test if executed directly
if (require.main === module) {
    runLoadTest().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runLoadTest, generateTestAdvisors, TEST_CONFIG };