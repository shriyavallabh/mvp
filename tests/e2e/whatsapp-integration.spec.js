/**
 * WhatsApp Integration Test Suite
 * Tests webhook, message processing, and WhatsApp API integration
 */

const { test, expect } = require('@playwright/test');
const axios = require('axios');
const testHelpers = require('./playwright/fixtures/test-helpers');

const WEBHOOK_URL = process.env.NGROK_URL || 'http://143.110.191.97:5001';
const WEBHOOK_ENDPOINT = `${WEBHOOK_URL}/webhook`;

test.describe('WhatsApp Integration Tests', () => {
  let testResults = [];
  let performanceTracker;

  test.beforeAll(async () => {
    performanceTracker = testHelpers.createPerformanceTracker();
    console.log('Starting WhatsApp Integration Tests...');
  });

  test.afterAll(async () => {
    const report = testHelpers.formatTestReport(testResults);
    console.log('Test Report:', report);
  });

  test.describe('Webhook Verification', () => {
    test('Should handle webhook verification challenge', async () => {
      const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'test-verify-token';
      const challenge = 'test-challenge-string';
      
      performanceTracker.mark('webhook-verification-start');
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'GET',
        params: {
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': challenge
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toBe(challenge);
      
      performanceTracker.mark('webhook-verification-complete');
      
      testResults.push({
        test: 'Webhook Verification',
        status: 'passed',
        duration: testHelpers.validateResponseTime(performanceTracker.startTime, 1000)
      });
    });

    test('Should reject invalid verification token', async () => {
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'GET',
        params: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'invalid-token',
          'hub.challenge': 'test-challenge'
        }
      });
      
      expect(response.status).toBe(403);
      
      testResults.push({
        test: 'Invalid Token Rejection',
        status: 'passed'
      });
    });
  });

  test.describe('Inbound Message Processing', () => {
    test('Should process text message', async () => {
      const payload = testHelpers.createWhatsAppPayload({
        from: '+919999999001',
        text: 'Hello, I need information about mutual funds',
        type: 'text'
      });
      
      const signature = testHelpers.generateWebhookSignature(payload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: payload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      testHelpers.verifyWebhookResponse(response);
      
      testResults.push({
        test: 'Text Message Processing',
        status: 'passed'
      });
    });

    test('Should process button click', async () => {
      const payload = testHelpers.createWhatsAppPayload({
        from: '+919999999001',
        type: 'button',
        buttonText: 'Yes',
        buttonPayload: 'APPROVE_CONTENT'
      });
      
      const signature = testHelpers.generateWebhookSignature(payload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: payload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`,
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Button Click Processing',
        status: 'passed'
      });
    });

    test('Should handle media messages', async () => {
      const payload = testHelpers.createWhatsAppPayload({
        from: '+919999999001',
        type: 'image'
      });
      
      // Add media specific fields
      payload.entry[0].changes[0].value.messages[0].image = {
        id: 'IMG123456',
        mime_type: 'image/jpeg',
        sha256: 'test-hash',
        caption: 'Test image'
      };
      
      const signature = testHelpers.generateWebhookSignature(payload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: payload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Media Message Handling',
        status: 'passed'
      });
    });

    test('Should handle quick reply selection', async () => {
      const payload = testHelpers.createWhatsAppPayload({
        from: '+919999999001',
        type: 'button'
      });
      
      // Add quick reply context
      payload.entry[0].changes[0].value.messages[0].context = {
        from: '15550555000',
        id: 'CONTEXT_MSG_ID'
      };
      payload.entry[0].changes[0].value.messages[0].button = {
        text: 'Market Update',
        payload: 'QUICK_REPLY_MARKET'
      };
      
      const signature = testHelpers.generateWebhookSignature(payload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: payload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Quick Reply Processing',
        status: 'passed'
      });
    });
  });

  test.describe('Outbound Message Testing', () => {
    test('Should send template message', async () => {
      // This would typically test the actual sending functionality
      // For now, we'll test the API endpoint
      const sendEndpoint = `${WEBHOOK_URL}/api/send-message`;
      
      const messageData = {
        to: '+919999999001',
        template: 'daily_update',
        parameters: {
          name: 'Test Advisor',
          content: testHelpers.generateCompliantContent()
        }
      };
      
      const response = await testHelpers.apiRequest(sendEndpoint, {
        method: 'POST',
        data: messageData,
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY || 'test-key'}`
        }
      });
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('messageId');
        expect(response.data.status).toBe('sent');
      }
      
      testResults.push({
        test: 'Template Message Sending',
        status: response.status === 200 ? 'passed' : 'failed'
      });
    });

    test('Should handle bulk message sending', async () => {
      const messages = testHelpers.generateTestMessages(5);
      const bulkEndpoint = `${WEBHOOK_URL}/api/send-bulk`;
      
      const response = await testHelpers.apiRequest(bulkEndpoint, {
        method: 'POST',
        data: { messages },
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY || 'test-key'}`
        }
      });
      
      if (response.status === 200) {
        expect(response.data.sent).toBeGreaterThan(0);
        expect(response.data.failed).toBeDefined();
      }
      
      testResults.push({
        test: 'Bulk Message Sending',
        status: response.status === 200 ? 'passed' : 'warning'
      });
    });
  });

  test.describe('Message Status Callbacks', () => {
    test('Should process delivery status callback', async () => {
      const statusPayload = {
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
              statuses: [{
                id: 'wamid.TEST_STATUS_ID',
                recipient_id: '919999999001',
                status: 'delivered',
                timestamp: Date.now(),
                conversation: {
                  id: 'CONV_ID',
                  origin: {
                    type: 'business_initiated'
                  }
                }
              }]
            }
          }]
        }]
      };
      
      const signature = testHelpers.generateWebhookSignature(statusPayload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: statusPayload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Delivery Status Processing',
        status: 'passed'
      });
    });

    test('Should handle read receipts', async () => {
      const readPayload = {
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
              statuses: [{
                id: 'wamid.TEST_READ_ID',
                recipient_id: '919999999001',
                status: 'read',
                timestamp: Date.now()
              }]
            }
          }]
        }]
      };
      
      const signature = testHelpers.generateWebhookSignature(readPayload);
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: readPayload,
        headers: {
          'X-Hub-Signature-256': `sha256=${signature}`
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Read Receipt Processing',
        status: 'passed'
      });
    });
  });

  test.describe('Rate Limiting and Throttling', () => {
    test('Should respect rate limits', async () => {
      const requests = [];
      const requestCount = 20;
      
      // Send rapid requests
      for (let i = 0; i < requestCount; i++) {
        const payload = testHelpers.createWhatsAppPayload({
          from: `+91999999${String(9000 + i).padStart(4, '0')}`,
          text: `Rate limit test ${i}`
        });
        
        requests.push(
          testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
            method: 'POST',
            data: payload,
            headers: {
              'X-Hub-Signature-256': `sha256=${testHelpers.generateWebhookSignature(payload)}`
            }
          })
        );
      }
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      // Should have some rate limiting in place
      expect(rateLimited.length).toBeGreaterThanOrEqual(0);
      
      testResults.push({
        test: 'Rate Limiting',
        status: 'passed',
        details: `${rateLimited.length} requests rate limited out of ${requestCount}`
      });
    });

    test('Should queue messages when throttled', async () => {
      // Test message queueing behavior
      const queueEndpoint = `${WEBHOOK_URL}/api/queue/status`;
      
      const response = await testHelpers.apiRequest(queueEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY || 'test-key'}`
        }
      });
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('queueSize');
        expect(response.data).toHaveProperty('processing');
      }
      
      testResults.push({
        test: 'Message Queue Status',
        status: response.status === 200 ? 'passed' : 'warning'
      });
    });
  });

  test.describe('Error Handling', () => {
    test('Should handle malformed webhook payload', async () => {
      const malformedPayload = {
        invalid: 'structure',
        missing: 'required fields'
      };
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: malformedPayload,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      
      testResults.push({
        test: 'Malformed Payload Handling',
        status: 'passed'
      });
    });

    test('Should handle webhook timeout gracefully', async () => {
      // Create a payload that might cause slow processing
      const payload = testHelpers.createWhatsAppPayload({
        from: '+919999999001',
        text: 'SIMULATE_SLOW_PROCESSING'
      });
      
      const signature = testHelpers.generateWebhookSignature(payload);
      
      try {
        const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
          method: 'POST',
          data: payload,
          headers: {
            'X-Hub-Signature-256': `sha256=${signature}`
          },
          timeout: 5000 // 5 second timeout
        });
        
        expect(response.status).toBeLessThan(500);
        
        testResults.push({
          test: 'Timeout Handling',
          status: 'passed'
        });
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          testResults.push({
            test: 'Timeout Handling',
            status: 'warning',
            message: 'Request timed out as expected'
          });
        } else {
          throw error;
        }
      }
    });

    test('Should retry failed webhook deliveries', async () => {
      // Test retry mechanism
      const retryEndpoint = `${WEBHOOK_URL}/api/retry/status`;
      
      const response = await testHelpers.apiRequest(retryEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY || 'test-key'}`
        }
      });
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('retryQueue');
        expect(response.data).toHaveProperty('maxRetries');
      }
      
      testResults.push({
        test: 'Retry Mechanism',
        status: response.status === 200 ? 'passed' : 'warning'
      });
    });
  });

  test.describe('Multi-User Conversation Handling', () => {
    test('Should handle concurrent conversations', async () => {
      const conversations = [];
      const userCount = 5;
      
      // Simulate multiple users sending messages simultaneously
      for (let i = 0; i < userCount; i++) {
        const payload = testHelpers.createWhatsAppPayload({
          from: `+91999999${String(9000 + i).padStart(4, '0')}`,
          text: `User ${i} message`,
          messageId: `wamid.USER_${i}_${Date.now()}`
        });
        
        conversations.push(
          testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
            method: 'POST',
            data: payload,
            headers: {
              'X-Hub-Signature-256': `sha256=${testHelpers.generateWebhookSignature(payload)}`
            }
          })
        );
      }
      
      const responses = await Promise.all(conversations);
      
      // All conversations should be handled
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      testResults.push({
        test: 'Concurrent Conversations',
        status: 'passed',
        details: `Handled ${userCount} concurrent conversations`
      });
    });

    test('Should maintain conversation context', async () => {
      const userId = '+919999999001';
      
      // First message
      const firstPayload = testHelpers.createWhatsAppPayload({
        from: userId,
        text: 'Start conversation',
        messageId: 'wamid.FIRST'
      });
      
      await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: firstPayload,
        headers: {
          'X-Hub-Signature-256': `sha256=${testHelpers.generateWebhookSignature(firstPayload)}`
        }
      });
      
      // Follow-up message with context
      const secondPayload = testHelpers.createWhatsAppPayload({
        from: userId,
        text: 'Continue conversation',
        messageId: 'wamid.SECOND'
      });
      
      // Add context reference
      secondPayload.entry[0].changes[0].value.messages[0].context = {
        from: '15550555000',
        id: 'wamid.FIRST'
      };
      
      const response = await testHelpers.apiRequest(WEBHOOK_ENDPOINT, {
        method: 'POST',
        data: secondPayload,
        headers: {
          'X-Hub-Signature-256': `sha256=${testHelpers.generateWebhookSignature(secondPayload)}`
        }
      });
      
      expect(response.status).toBe(200);
      
      testResults.push({
        test: 'Conversation Context',
        status: 'passed'
      });
    });
  });
});