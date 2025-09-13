/**
 * Test Helper Utilities for E2E Testing
 * Common functions used across test suites
 */

const { expect } = require('@playwright/test');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TestHelpers {
  constructor() {
    this.testDataPath = path.join(__dirname, 'test-data.json');
    this.testData = this.loadTestData();
  }

  loadTestData() {
    if (fs.existsSync(this.testDataPath)) {
      return JSON.parse(fs.readFileSync(this.testDataPath, 'utf-8'));
    }
    return {};
  }

  /**
   * Generate WhatsApp webhook signature
   */
  generateWebhookSignature(payload, secret = process.env.WEBHOOK_SECRET) {
    return crypto
      .createHmac('sha256', secret || 'test-secret')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Create mock WhatsApp message payload
   */
  createWhatsAppPayload(options = {}) {
    const defaults = {
      from: '+919999999001',
      text: 'Test message',
      type: 'text',
      messageId: `wamid.${Date.now()}`,
      timestamp: Date.now()
    };

    const config = { ...defaults, ...options };

    return {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'TEST_WABA_ID',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550555000',
              phone_number_id: 'TEST_PHONE_ID'
            },
            messages: [{
              from: config.from,
              id: config.messageId,
              timestamp: config.timestamp,
              text: config.type === 'text' ? { body: config.text } : undefined,
              button: config.type === 'button' ? { 
                text: config.buttonText,
                payload: config.buttonPayload 
              } : undefined,
              type: config.type
            }]
          }
        }]
      }]
    };
  }

  /**
   * Wait for condition with timeout
   */
  async waitForCondition(conditionFn, timeout = 30000, interval = 1000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await conditionFn();
        if (result) return result;
      } catch (error) {
        // Continue waiting
      }
      await this.sleep(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request with retry logic
   */
  async apiRequest(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          url,
          method: options.method || 'GET',
          data: options.data,
          headers: options.headers || {},
          timeout: options.timeout || 10000,
          validateStatus: () => true
        });
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.sleep(1000 * (i + 1)); // Exponential backoff
      }
    }
  }

  /**
   * Check PM2 process status
   */
  async checkPM2Process(processName, host = '143.110.191.97') {
    const { execSync } = require('child_process');
    
    try {
      const result = execSync(
        `ssh mvp@${host} "pm2 jlist"`,
        { encoding: 'utf-8', timeout: 10000 }
      );
      
      const processes = JSON.parse(result);
      return processes.find(p => p.name === processName);
    } catch (error) {
      console.error(`Failed to check PM2 process ${processName}:`, error);
      return null;
    }
  }

  /**
   * Generate test advisor data
   */
  generateTestAdvisor(index = 1) {
    return {
      id: `TEST_${String(index).padStart(3, '0')}`,
      name: `Test Advisor ${index}`,
      phone: `+91999999${String(9000 + index).padStart(4, '0')}`,
      email: `test${index}@finadvise.com`,
      whatsappNumber: `91999999${String(9000 + index).padStart(4, '0')}`,
      active: true,
      preferences: {
        contentType: ['Educational', 'Market Updates'],
        language: 'English',
        frequency: 'Daily'
      }
    };
  }

  /**
   * Generate SEBI compliant content
   */
  generateCompliantContent() {
    const templates = [
      'Mutual fund investments are subject to market risks. Read all scheme related documents carefully.',
      'Past performance may or may not be sustained in future.',
      'The information provided is for educational purposes only.',
      'Investment in securities market are subject to market risks.',
      'Please consult your financial advisor before making any investment decision.'
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate non-compliant content for testing
   */
  generateNonCompliantContent() {
    const templates = [
      'Guaranteed returns of 50% per annum!',
      'This fund will definitely double your money.',
      'No risk investment opportunity.',
      'Assured profits with zero loss.',
      'Beat the market every time with this strategy.'
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Verify webhook response format
   */
  verifyWebhookResponse(response) {
    expect(response.status).toBeLessThan(400);
    
    if (response.data) {
      // Check for standard webhook response structure
      if (response.data.status) {
        expect(['received', 'processed', 'queued']).toContain(response.data.status);
      }
      
      if (response.data.messageId) {
        expect(response.data.messageId).toBeTruthy();
      }
    }
    
    return true;
  }

  /**
   * Create performance metrics tracker
   */
  createPerformanceTracker() {
    const metrics = {
      startTime: Date.now(),
      measurements: [],
      
      mark(label) {
        this.measurements.push({
          label,
          timestamp: Date.now(),
          elapsed: Date.now() - this.startTime
        });
      },
      
      getMetrics() {
        return {
          totalDuration: Date.now() - this.startTime,
          measurements: this.measurements,
          average: this.measurements.length > 0 
            ? this.measurements.reduce((sum, m) => sum + m.elapsed, 0) / this.measurements.length
            : 0
        };
      }
    };
    
    return metrics;
  }

  /**
   * Mock Google Sheets data
   */
  mockGoogleSheetsData() {
    return {
      advisors: Array.from({ length: 10 }, (_, i) => this.generateTestAdvisor(i + 1)),
      content: Array.from({ length: 5 }, (_, i) => ({
        id: `CONTENT_${i + 1}`,
        date: new Date().toISOString(),
        type: 'Educational',
        content: this.generateCompliantContent(),
        status: 'approved',
        advisorId: `TEST_${String(i + 1).padStart(3, '0')}`
      })),
      metrics: {
        totalAdvisors: 10,
        activeAdvisors: 8,
        contentGenerated: 50,
        messagesDelivered: 45,
        successRate: 0.9
      }
    };
  }

  /**
   * Validate API response time
   */
  validateResponseTime(startTime, maxDuration = 3000) {
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(maxDuration);
    return duration;
  }

  /**
   * Generate batch of test messages
   */
  generateTestMessages(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: `MSG_${Date.now()}_${i}`,
      from: `+91999999${String(9000 + i).padStart(4, '0')}`,
      text: `Test message ${i + 1}`,
      timestamp: Date.now() + (i * 1000)
    }));
  }

  /**
   * Check service health
   */
  async checkServiceHealth(serviceUrl) {
    try {
      const response = await this.apiRequest(`${serviceUrl}/health`, {
        timeout: 5000
      });
      
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up test artifacts
   */
  async cleanupTestArtifacts() {
    const artifacts = [
      'tests/e2e/playwright/downloads/*',
      'tests/e2e/playwright/screenshots/*.png',
      'tests/e2e/playwright/videos/*.webm'
    ];
    
    const { execSync } = require('child_process');
    artifacts.forEach(pattern => {
      try {
        execSync(`rm -f ${pattern}`, { stdio: 'ignore' });
      } catch (error) {
        // Ignore errors
      }
    });
  }

  /**
   * Format test report data
   */
  formatTestReport(results) {
    return {
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        successRate: `${((results.filter(r => r.status === 'passed').length / results.length) * 100).toFixed(2)}%`
      },
      details: results,
      timestamp: new Date().toISOString(),
      environment: process.env.TEST_ENV || 'production'
    };
  }
}

module.exports = new TestHelpers();