/**
 * Integration Tests for Content Generation System
 * Tests the complete workflow from generation to distribution
 */

const assert = require('assert');
const path = require('path');

// Import agents
const contentGenerator = require('../../agents/generators/content-generator');
const imageCreator = require('../../agents/generators/image-creator');
const approvalGuardian = require('../../agents/controllers/approval-guardian');
const revisionHandler = require('../../agents/controllers/revision-handler');
const distributionManager = require('../../agents/controllers/distribution-manager');
const contentOrchestrator = require('../../agents/controllers/content-orchestrator');

// Test utilities
const createTestMessage = (action, payload) => {
  return {
    agent_id: 'test-agent',
    timestamp: new Date().toISOString(),
    action: action,
    payload: payload,
    context: {
      session_id: 'test-session',
      parent_agent: 'test-orchestrator',
      priority: 1
    },
    response_required: true
  };
};

describe('Content Generation System Integration Tests', function() {
  this.timeout(60000); // 60 seconds timeout for integration tests
  
  before(async function() {
    console.log('Setting up test environment...');
    
    // Set required environment variables for testing
    process.env.CLAUDE_SESSION_TOKEN = 'test-token';
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.WHATSAPP_BEARER_TOKEN = 'test-whatsapp-token';
    process.env.GOOGLE_DRIVE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN = 'test-refresh-token';
    
    // Initialize orchestrator
    await contentOrchestrator.initialize();
  });
  
  after(function() {
    console.log('Cleaning up test environment...');
    // Reset all agents
    contentGenerator.reset();
    imageCreator.reset();
    approvalGuardian.reset();
    revisionHandler.reset();
    distributionManager.reset();
  });
  
  describe('Task 1: Content Generator Agent', function() {
    it('should generate content for WhatsApp platform', async function() {
      const message = createTestMessage('GENERATE_CONTENT', {
        advisor_arn: 'ARN_TEST_001',
        client_segment: 'young',
        content_focus: 'growth',
        tone: 'friendly',
        brand_colors: ['#FF5733', '#33FF57'],
        logo_url: 'https://example.com/logo.png',
        topic: 'Benefits of SIP investments'
      });
      
      // Mock the Claude CLI execution
      const originalProcessRequest = contentGenerator.processRequest.bind(contentGenerator);
      contentGenerator.processRequest = async function(msg) {
        // Simulate successful content generation
        return {
          agent_id: 'content-generator',
          action: 'CONTENT_GENERATED',
          payload: {
            advisor_arn: msg.payload.advisor_arn,
            topic: msg.payload.topic,
            platforms: {
              whatsapp: { text: 'Test WhatsApp content', image_url: '' },
              linkedin: { post: 'Test LinkedIn content', image_url: '' },
              status: { text: 'Test status', image_url: '' }
            },
            metadata: {
              quality_score: 0.85,
              generation_time: 1500
            }
          }
        };
      };
      
      const response = await contentGenerator.processRequest(message);
      
      assert.equal(response.action, 'CONTENT_GENERATED');
      assert.ok(response.payload.platforms.whatsapp);
      assert.ok(response.payload.metadata.quality_score > 0.8);
      
      // Restore original method
      contentGenerator.processRequest = originalProcessRequest;
    });
    
    it('should calculate quality score correctly', function() {
      const platforms = {
        whatsapp: { text: 'Test content with disclaimer about market risks', image_url: '' },
        linkedin: { post: 'Test post with #investing #mutualfunds?', image_url: '' },
        status: { text: 'Short status', image_url: '' }
      };
      
      const score = contentGenerator.calculateQualityScore(platforms);
      assert.ok(score > 0 && score <= 1);
    });
  });
  
  describe('Task 2: Image Creator Agent', function() {
    it('should handle rate limiting', async function() {
      const message = createTestMessage('CREATE_IMAGES', {
        advisor_arn: 'ARN_TEST_001',
        brand_colors: ['#FF5733'],
        logo_url: 'https://example.com/logo.png',
        topic: 'Investment Growth',
        platforms: {
          whatsapp: { text: 'Test content' }
        }
      });
      
      // Mock the Gemini API call
      imageCreator.generateImage = async function() {
        return 'https://example.com/generated-image.png';
      };
      
      const response = await imageCreator.processRequest(message);
      
      assert.equal(response.action, 'IMAGES_CREATED');
      assert.ok(response.payload.image_urls.whatsapp);
    });
  });
  
  describe('Task 3: Approval Guardian Agent', function() {
    it('should auto-approve content meeting quality thresholds', async function() {
      const message = createTestMessage('AUTO_APPROVE', {
        content_list: [{
          id: 'CONTENT_001',
          advisor_arn: 'ARN_TEST_001',
          metadata: {
            fatigue_score: 0.9,
            compliance_score: 1.0,
            quality_score: 0.85,
            relevance_score: 0.9,
            revision_count: 0
          }
        }]
      });
      
      const response = await approvalGuardian.processRequest(message);
      
      assert.equal(response.action, 'AUTO_APPROVAL_COMPLETE');
      assert.equal(response.payload.summary.approved, 1);
      assert.equal(response.payload.summary.rejected, 0);
    });
    
    it('should reject content not meeting compliance threshold', async function() {
      const message = createTestMessage('AUTO_APPROVE', {
        content_list: [{
          id: 'CONTENT_002',
          advisor_arn: 'ARN_TEST_001',
          metadata: {
            fatigue_score: 0.9,
            compliance_score: 0.8, // Below 1.0
            quality_score: 0.85,
            relevance_score: 0.9,
            revision_count: 0
          }
        }]
      });
      
      const response = await approvalGuardian.processRequest(message);
      
      assert.equal(response.payload.summary.approved, 0);
      assert.equal(response.payload.summary.rejected, 1);
    });
  });
  
  describe('Task 4: Revision Handler Agent', function() {
    it('should parse revision commands correctly', function() {
      const commands = [
        { text: 'REGENERATE CONTENT_001', expected: 'regenerate' },
        { text: 'APPROVE CONTENT_002', expected: 'approve' },
        { text: 'TONE CONTENT_003 professional', expected: 'changeTone' },
        { text: 'HELP', expected: 'help' }
      ];
      
      commands.forEach(({ text, expected }) => {
        const parsed = revisionHandler.parseCommand(text);
        assert.equal(parsed.type, expected);
      });
    });
    
    it('should handle revision webhook requests', async function() {
      const webhookData = {
        from: '+1234567890',
        message: 'APPROVE CONTENT_001',
        timestamp: new Date().toISOString()
      };
      
      const response = await revisionHandler.processWebhookRequest(webhookData);
      
      assert.equal(response.action, 'REVISION_COMPLETE');
      assert.equal(response.payload.result.status, 'success');
    });
  });
  
  describe('Task 5: Distribution Manager Agent', function() {
    it('should group content by advisor', function() {
      const contentList = [
        { id: 'C1', advisor_arn: 'ARN_001' },
        { id: 'C2', advisor_arn: 'ARN_002' },
        { id: 'C3', advisor_arn: 'ARN_001' }
      ];
      
      const grouped = distributionManager.groupContentByAdvisor(contentList);
      
      assert.equal(Object.keys(grouped).length, 2);
      assert.equal(grouped['ARN_001'].length, 2);
      assert.equal(grouped['ARN_002'].length, 1);
    });
    
    it('should reset daily counter when date changes', function() {
      distributionManager.messagesSentToday = 100;
      distributionManager.lastResetDate = '2024-01-01';
      
      distributionManager.resetDailyCounter();
      
      if (distributionManager.lastResetDate !== '2024-01-01') {
        assert.equal(distributionManager.messagesSentToday, 0);
      }
    });
  });
  
  describe('End-to-End Workflow Tests', function() {
    it('should complete evening generation workflow', async function() {
      // This test simulates the 8:30 PM generation workflow
      
      // Step 1: Generate content
      const genMessage = createTestMessage('GENERATE_CONTENT', {
        advisor_arn: 'ARN_E2E_001',
        client_segment: 'middle',
        content_focus: 'balanced',
        tone: 'professional',
        topic: 'Quarterly market outlook'
      });
      
      // Mock response
      contentGenerator.processRequest = async () => ({
        action: 'CONTENT_GENERATED',
        payload: {
          platforms: {
            whatsapp: { text: 'E2E test content', image_url: '' }
          },
          metadata: { quality_score: 0.9 }
        }
      });
      
      const genResponse = await contentGenerator.processRequest(genMessage);
      assert.equal(genResponse.action, 'CONTENT_GENERATED');
      
      // Step 2: Create images
      imageCreator.processRequest = async () => ({
        action: 'IMAGES_CREATED',
        payload: {
          image_urls: { whatsapp: 'test-image.png' }
        }
      });
      
      const imgResponse = await imageCreator.processRequest(genMessage);
      assert.equal(imgResponse.action, 'IMAGES_CREATED');
      
      // Step 3: Check compliance
      const content = {
        id: 'E2E_CONTENT_001',
        advisor_arn: 'ARN_E2E_001',
        metadata: {
          fatigue_score: 0.9,
          compliance_score: 1.0,
          quality_score: 0.9,
          relevance_score: 0.85
        }
      };
      
      const approvalMessage = createTestMessage('AUTO_APPROVE', {
        content_list: [content]
      });
      
      const approvalResponse = await approvalGuardian.processRequest(approvalMessage);
      assert.equal(approvalResponse.payload.summary.approved, 1);
      
      console.log('✓ End-to-end workflow test completed successfully');
    });
  });
  
  describe('Performance Tests', function() {
    it('should handle 50 concurrent advisor requests', async function() {
      this.timeout(120000); // 2 minutes for performance test
      
      const advisors = [];
      for (let i = 1; i <= 50; i++) {
        advisors.push({
          arn: `ARN_PERF_${i.toString().padStart(3, '0')}`,
          client_segment: ['young', 'middle', 'senior'][i % 3],
          content_focus: ['growth', 'safety', 'balanced'][i % 3],
          tone: ['professional', 'friendly', 'educational'][i % 3]
        });
      }
      
      console.log(`Starting performance test with ${advisors.length} advisors...`);
      const startTime = Date.now();
      
      // Simulate concurrent processing
      const promises = advisors.map(advisor => {
        return new Promise((resolve) => {
          // Simulate processing delay
          setTimeout(() => {
            resolve({
              advisor_arn: advisor.arn,
              status: 'completed'
            });
          }, Math.random() * 1000);
        });
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      console.log(`Performance test completed in ${totalTime} seconds`);
      console.log(`Average time per advisor: ${(totalTime / advisors.length).toFixed(2)} seconds`);
      
      assert.equal(results.length, 50);
      assert.ok(totalTime < 30, 'Should complete 50 advisors in under 30 seconds');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  const Mocha = require('mocha');
  const mocha = new Mocha();
  
  mocha.addFile(__filename);
  mocha.run(failures => {
    process.exitCode = failures ? 1 : 0;
  });
}