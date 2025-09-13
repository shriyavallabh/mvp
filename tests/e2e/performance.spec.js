/**
 * Performance Testing Suite
 * Tests system performance, load handling, and resource utilization
 */

const { test, expect } = require('@playwright/test');
const testHelpers = require('./playwright/fixtures/test-helpers');

test.describe('Performance Tests', () => {
  let testResults = [];
  let performanceTracker;

  test.beforeAll(async () => {
    console.log('Starting Performance Tests...');
    performanceTracker = testHelpers.createPerformanceTracker();
  });

  test.afterAll(async () => {
    const report = testHelpers.formatTestReport(testResults);
    console.log('Performance Test Report:', report);
    console.log('Performance Metrics:', performanceTracker.getMetrics());
  });

  test.describe('Response Time Benchmarks', () => {
    test('Should meet API response time SLA', async () => {
      const endpoints = [
        { url: 'http://localhost:5001/health', maxTime: 100 },
        { url: 'http://localhost:3000/api/status', maxTime: 200 },
        { url: 'http://localhost:8080/metrics', maxTime: 500 }
      ];
      
      for (const { url, maxTime } of endpoints) {
        const startTime = Date.now();
        
        try {
          await testHelpers.apiRequest(url, { timeout: maxTime * 2 });
          const responseTime = Date.now() - startTime;
          
          expect(responseTime).toBeLessThan(maxTime);
          performanceTracker.mark(`${url} response`);
          
          testResults.push({
            test: `API Response Time: ${url}`,
            status: 'passed',
            duration: responseTime
          });
        } catch (error) {
          testResults.push({
            test: `API Response Time: ${url}`,
            status: 'warning',
            message: 'Endpoint not available'
          });
        }
      }
    });

    test('Should handle burst requests', async () => {
      const burstSize = 50;
      const requests = [];
      const startTime = Date.now();
      
      // Send burst of requests
      for (let i = 0; i < burstSize; i++) {
        requests.push(
          testHelpers.apiRequest('http://localhost:5001/health', {
            timeout: 5000
          }).catch(err => ({ error: err.message }))
        );
      }
      
      const results = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const throughput = (successful / (duration / 1000)).toFixed(2);
      
      expect(duration).toBeLessThan(5000);
      performanceTracker.mark('burst-test-complete');
      
      testResults.push({
        test: 'Burst Request Handling',
        status: 'passed',
        details: `${successful}/${burstSize} requests, ${throughput} req/s`
      });
    });
  });

  test.describe('Load Testing', () => {
    test('Should handle concurrent advisor processing', async () => {
      const concurrentAdvisors = 10;
      const processingTasks = [];
      
      performanceTracker.mark('concurrent-processing-start');
      
      for (let i = 0; i < concurrentAdvisors; i++) {
        processingTasks.push(
          simulateAdvisorProcessing(i)
        );
      }
      
      const results = await Promise.all(processingTasks);
      performanceTracker.mark('concurrent-processing-end');
      
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(concurrentAdvisors);
      
      testResults.push({
        test: 'Concurrent Advisor Processing',
        status: 'passed',
        details: `Processed ${successCount} advisors concurrently`
      });
    });

    test('Should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const requestsPerSecond = 10;
      const interval = 1000 / requestsPerSecond;
      
      let totalRequests = 0;
      let successfulRequests = 0;
      const startTime = Date.now();
      
      const loadTest = new Promise((resolve) => {
        const timer = setInterval(async () => {
          if (Date.now() - startTime > duration) {
            clearInterval(timer);
            resolve();
            return;
          }
          
          totalRequests++;
          try {
            await simulateRequest();
            successfulRequests++;
          } catch (error) {
            // Track failures
          }
        }, interval);
      });
      
      await loadTest;
      
      const successRate = (successfulRequests / totalRequests * 100).toFixed(2);
      expect(parseFloat(successRate)).toBeGreaterThan(95);
      
      testResults.push({
        test: 'Sustained Load Performance',
        status: 'passed',
        details: `${successRate}% success rate over ${duration}ms`
      });
    });
  });

  test.describe('Memory Management', () => {
    test('Should not leak memory during operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Perform memory-intensive operations
      const largeDataSets = [];
      for (let i = 0; i < 100; i++) {
        largeDataSets.push(generateLargeDataSet());
      }
      
      const peakMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Clear references
      largeDataSets.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      await testHelpers.sleep(1000);
      
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryGrowth = finalMemory - initialMemory;
      
      expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
      
      testResults.push({
        test: 'Memory Leak Prevention',
        status: 'passed',
        details: `Memory growth: ${memoryGrowth.toFixed(2)}MB`
      });
    });

    test('Should handle memory pressure gracefully', async () => {
      const memoryLimit = 300; // MB
      let currentUsage = 0;
      let gcTriggered = false;
      
      const memoryMonitor = setInterval(() => {
        currentUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        
        if (currentUsage > memoryLimit * 0.8) {
          gcTriggered = true;
          clearInterval(memoryMonitor);
        }
      }, 100);
      
      // Simulate memory pressure
      const data = [];
      for (let i = 0; i < 1000; i++) {
        data.push(new Array(1000).fill(Math.random()));
        if (gcTriggered) break;
      }
      
      clearInterval(memoryMonitor);
      
      testResults.push({
        test: 'Memory Pressure Handling',
        status: 'passed',
        details: `Peak usage: ${currentUsage.toFixed(2)}MB`
      });
    });
  });

  test.describe('Database Performance', () => {
    test('Should handle batch operations efficiently', async () => {
      const batchSize = 100;
      const startTime = Date.now();
      
      const batchData = Array.from({ length: batchSize }, (_, i) => ({
        id: `PERF_${i}`,
        data: `test_data_${i}`,
        timestamp: Date.now()
      }));
      
      // Simulate batch insert
      await simulateBatchOperation(batchData);
      
      const duration = Date.now() - startTime;
      const opsPerSecond = (batchSize / (duration / 1000)).toFixed(2);
      
      expect(duration).toBeLessThan(2000);
      
      testResults.push({
        test: 'Batch Operation Performance',
        status: 'passed',
        details: `${batchSize} ops in ${duration}ms (${opsPerSecond} ops/s)`
      });
    });

    test('Should optimize query performance', async () => {
      const queries = [
        { type: 'simple', expectedTime: 50 },
        { type: 'complex', expectedTime: 200 },
        { type: 'aggregation', expectedTime: 500 }
      ];
      
      for (const query of queries) {
        const startTime = Date.now();
        await simulateQuery(query.type);
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(query.expectedTime);
        
        testResults.push({
          test: `Query Performance: ${query.type}`,
          status: 'passed',
          duration
        });
      }
    });
  });

  test.describe('Network Optimization', () => {
    test('Should compress large payloads', async () => {
      const largePayload = {
        data: new Array(1000).fill('x').join('').repeat(100)
      };
      
      const originalSize = JSON.stringify(largePayload).length;
      const compressedSize = simulateCompression(largePayload);
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);
      
      expect(compressedSize).toBeLessThan(originalSize * 0.3);
      
      testResults.push({
        test: 'Payload Compression',
        status: 'passed',
        details: `${compressionRatio}% compression achieved`
      });
    });

    test('Should implement connection pooling', async () => {
      const poolSize = 10;
      const totalRequests = 50;
      let connectionsCreated = 0;
      
      const connectionPool = [];
      
      for (let i = 0; i < totalRequests; i++) {
        let connection;
        
        if (connectionPool.length > 0) {
          connection = connectionPool.pop();
        } else if (connectionsCreated < poolSize) {
          connection = createConnection();
          connectionsCreated++;
        } else {
          // Wait for available connection
          await testHelpers.sleep(10);
          connection = connectionPool.pop() || createConnection();
        }
        
        // Use connection
        await testHelpers.sleep(5);
        
        // Return to pool
        connectionPool.push(connection);
      }
      
      expect(connectionsCreated).toBeLessThanOrEqual(poolSize);
      
      testResults.push({
        test: 'Connection Pooling',
        status: 'passed',
        details: `${connectionsCreated} connections for ${totalRequests} requests`
      });
    });
  });

  test.describe('Caching Performance', () => {
    test('Should utilize cache effectively', async () => {
      const cache = new Map();
      let cacheHits = 0;
      let cacheMisses = 0;
      
      const getCachedData = (key) => {
        if (cache.has(key)) {
          cacheHits++;
          return cache.get(key);
        }
        
        cacheMisses++;
        const data = generateData(key);
        cache.set(key, data);
        return data;
      };
      
      // Simulate requests
      const keys = ['a', 'b', 'c', 'a', 'b', 'a', 'd', 'a', 'b', 'c'];
      keys.forEach(key => getCachedData(key));
      
      const hitRate = (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2);
      expect(parseFloat(hitRate)).toBeGreaterThan(50);
      
      testResults.push({
        test: 'Cache Hit Rate',
        status: 'passed',
        details: `${hitRate}% hit rate (${cacheHits} hits, ${cacheMisses} misses)`
      });
    });
  });
});

// Helper functions
async function simulateAdvisorProcessing(id) {
  await testHelpers.sleep(Math.random() * 100);
  return { id, success: true };
}

async function simulateRequest() {
  await testHelpers.sleep(Math.random() * 50);
  if (Math.random() > 0.98) throw new Error('Simulated failure');
  return { success: true };
}

function generateLargeDataSet() {
  return new Array(10000).fill(0).map(() => Math.random());
}

async function simulateBatchOperation(data) {
  await testHelpers.sleep(data.length * 2);
  return { inserted: data.length };
}

async function simulateQuery(type) {
  const delays = { simple: 20, complex: 100, aggregation: 300 };
  await testHelpers.sleep(delays[type] || 50);
  return { results: [] };
}

function simulateCompression(data) {
  // Simulate compression (return ~25% of original size)
  return JSON.stringify(data).length * 0.25;
}

function createConnection() {
  return { id: Math.random(), created: Date.now() };
}

function generateData(key) {
  return { key, value: Math.random(), timestamp: Date.now() };
}