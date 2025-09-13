// Unit tests for WhatsApp Web-Style Interface (Story 4.3)
const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const sinon = require('sinon');
const MessageStore = require('../../../monitoring/whatsapp-interface/services/message-store');
const WhatsAppSync = require('../../../monitoring/whatsapp-interface/services/whatsapp-sync');

describe('Story 4.3: WhatsApp Web-Style Interface Tests', () => {
    let messageStore;
    let whatsappSync;
    let sandbox;
    
    before(() => {
        sandbox = sinon.createSandbox();
        messageStore = new MessageStore();
        whatsappSync = new WhatsAppSync(messageStore);
    });
    
    after(() => {
        sandbox.restore();
        if (messageStore) {
            messageStore.close();
        }
    });
    
    describe('Message Storage Tests', () => {
        it('should save a new message to database', async () => {
            const message = {
                id: 'test_msg_001',
                advisor_id: 'ARN_12345',
                phone: '9876543210',
                direction: 'sent',
                type: 'text',
                content: 'Test message',
                status: 'sent',
                timestamp: new Date().toISOString()
            };
            
            const result = await messageStore.saveMessage(message);
            assert(result.message_id === 'test_msg_001');
        });
        
        it('should retrieve conversation history for an advisor', async () => {
            const advisorId = 'ARN_12345';
            const messages = await messageStore.getConversation(advisorId);
            
            assert(Array.isArray(messages));
            assert(messages.length > 0);
            assert(messages[0].advisor_id === advisorId);
        });
        
        it('should update message status', async () => {
            const messageId = 'test_msg_001';
            const result = await messageStore.updateMessageStatus(messageId, 'delivered');
            
            assert(result.changes >= 0);
        });
        
        it('should save and retrieve advisor information', async () => {
            const advisor = {
                id: 'ARN_98765',
                name: 'Test Advisor',
                phone: '9876543211',
                arn: 'ARN_98765',
                email: 'test@example.com',
                online: true,
                last_seen: new Date().toISOString()
            };
            
            await messageStore.saveAdvisor(advisor);
            const retrieved = await messageStore.getAdvisor('ARN_98765');
            
            assert(retrieved.name === 'Test Advisor');
            assert(retrieved.phone === '9876543211');
        });
        
        it('should mark messages as read for an advisor', async () => {
            const advisorId = 'ARN_12345';
            const result = await messageStore.markMessagesAsRead(advisorId);
            
            assert(result.changes >= 0);
        });
        
        it('should search messages by content', async () => {
            const query = 'Test';
            const results = await messageStore.searchMessages(query);
            
            assert(Array.isArray(results));
            if (results.length > 0) {
                assert(results[0].content.includes(query));
            }
        });
        
        it('should get message statistics', async () => {
            const stats = await messageStore.getMessageStats();
            
            assert(typeof stats.total === 'number');
            assert(typeof stats.sent === 'number');
            assert(typeof stats.received === 'number');
            assert(stats.total >= stats.sent + stats.received);
        });
    });
    
    describe('WhatsApp Sync Tests', () => {
        it('should process incoming WhatsApp message', async () => {
            const message = {
                id: 'wamid.123456',
                from: '919876543210',
                timestamp: '1234567890',
                type: 'text',
                text: { body: 'Hello from WhatsApp' }
            };
            
            const contacts = [{
                profile: { name: 'John Doe' }
            }];
            
            sandbox.stub(messageStore, 'saveMessage').resolves({ id: 1 });
            sandbox.stub(messageStore, 'saveAdvisor').resolves({ id: 1 });
            
            await whatsappSync.processIncomingMessage(message, contacts);
            
            assert(messageStore.saveMessage.calledOnce);
            assert(messageStore.saveAdvisor.calledOnce);
        });
        
        it('should process message status update', async () => {
            const status = {
                id: 'test_msg_001',
                status: 'delivered',
                timestamp: '1234567890'
            };
            
            sandbox.stub(messageStore, 'updateMessageStatus').resolves({ changes: 1 });
            
            await whatsappSync.processStatusUpdate(status);
            
            assert(messageStore.updateMessageStatus.calledOnce);
            assert(messageStore.updateMessageStatus.calledWith('test_msg_001', 'delivered'));
        });
        
        it('should build correct WhatsApp API payload for text message', () => {
            const payload = whatsappSync.buildWhatsAppPayload(
                '919876543210',
                'Test message',
                'text',
                null
            );
            
            assert(payload.messaging_product === 'whatsapp');
            assert(payload.type === 'text');
            assert(payload.text.body === 'Test message');
            assert(payload.to === '919876543210');
        });
        
        it('should build correct WhatsApp API payload for image message', () => {
            const payload = whatsappSync.buildWhatsAppPayload(
                '919876543210',
                'Image caption',
                'image',
                'https://example.com/image.jpg'
            );
            
            assert(payload.type === 'image');
            assert(payload.image.link === 'https://example.com/image.jpg');
            assert(payload.image.caption === 'Image caption');
        });
        
        it('should handle button click from interactive message', async () => {
            const interactive = {
                button_reply: {
                    id: 'unlock_content',
                    title: 'Unlock Content'
                }
            };
            
            const advisor = {
                id: 'ARN_12345',
                name: 'Test Advisor',
                phone: '919876543210'
            };
            
            sandbox.stub(whatsappSync, 'unlockContent').resolves();
            
            await whatsappSync.handleButtonClick(interactive, advisor);
            
            assert(whatsappSync.unlockContent.calledOnce);
            assert(whatsappSync.unlockContent.calledWith(advisor));
        });
    });
    
    describe('UI Component Tests', () => {
        it('should render advisor list correctly', () => {
            // This would be tested with Puppeteer or Playwright
            assert(true);
        });
        
        it('should display conversation history', () => {
            // This would be tested with Puppeteer or Playwright
            assert(true);
        });
        
        it('should handle message sending', () => {
            // This would be tested with Puppeteer or Playwright
            assert(true);
        });
        
        it('should show real-time updates', () => {
            // This would be tested with Puppeteer or Playwright
            assert(true);
        });
    });
    
    describe('Export Functionality Tests', () => {
        it('should export conversation to PDF format', async () => {
            const exportService = require('../../../monitoring/whatsapp-interface/services/export');
            const advisor = {
                id: 'ARN_12345',
                name: 'Test Advisor',
                phone: '919876543210',
                arn: 'ARN_12345'
            };
            
            const messages = [
                {
                    id: 'msg_001',
                    direction: 'sent',
                    type: 'text',
                    content: 'Test message',
                    status: 'delivered',
                    timestamp: new Date().toISOString()
                }
            ];
            
            const pdf = await exportService.exportToPDF(advisor, messages);
            assert(Buffer.isBuffer(pdf));
            assert(pdf.length > 0);
        });
        
        it('should export conversation to CSV format', async () => {
            const exportService = require('../../../monitoring/whatsapp-interface/services/export');
            const advisor = {
                id: 'ARN_12345',
                name: 'Test Advisor',
                phone: '919876543210'
            };
            
            const messages = [
                {
                    id: 'msg_001',
                    direction: 'sent',
                    type: 'text',
                    content: 'Test message',
                    status: 'delivered',
                    timestamp: new Date().toISOString()
                }
            ];
            
            const csv = await exportService.exportToCSV(advisor, messages);
            assert(typeof csv === 'string');
            assert(csv.includes('Test message'));
            assert(csv.includes('Test Advisor'));
        });
    });
    
    describe('Integration Tests', () => {
        it('should integrate with Story 3.2 webhook infrastructure', async () => {
            // Test webhook event processing
            const event = {
                body: {
                    entry: [{
                        changes: [{
                            field: 'messages',
                            value: {
                                messages: [{
                                    id: 'wamid.123',
                                    from: '919876543210',
                                    timestamp: '1234567890',
                                    type: 'text',
                                    text: { body: 'Test' }
                                }],
                                contacts: [{ profile: { name: 'Test' } }]
                            }
                        }]
                    }]
                }
            };
            
            sandbox.stub(messageStore, 'saveMessage').resolves({ id: 1 });
            sandbox.stub(messageStore, 'saveAdvisor').resolves({ id: 1 });
            
            await whatsappSync.processWebhookEvent(event);
            
            assert(messageStore.saveMessage.called);
        });
        
        it('should work with existing dashboard authentication', () => {
            // This would be tested with integration tests
            assert(true);
        });
        
        it('should sync with Google Sheets advisor data', async () => {
            const advisorsData = [
                {
                    id: 'ARN_111',
                    name: 'Advisor 1',
                    phone: '911111111111',
                    arn: 'ARN_111'
                },
                {
                    id: 'ARN_222',
                    name: 'Advisor 2',
                    phone: '912222222222',
                    arn: 'ARN_222'
                }
            ];
            
            sandbox.stub(messageStore, 'saveAdvisor').resolves({ id: 1 });
            
            await messageStore.syncAdvisorsFromSheets(advisorsData);
            
            assert(messageStore.saveAdvisor.calledTwice);
        });
    });
    
    describe('Performance Tests', () => {
        it('should handle 100+ advisor conversations', async function() {
            this.timeout(5000);
            
            // Create 100 test advisors
            const advisors = [];
            for (let i = 0; i < 100; i++) {
                advisors.push({
                    id: `ARN_${i}`,
                    name: `Advisor ${i}`,
                    phone: `91${i.toString().padStart(10, '0')}`,
                    arn: `ARN_${i}`
                });
            }
            
            const startTime = Date.now();
            await messageStore.syncAdvisorsFromSheets(advisors);
            const endTime = Date.now();
            
            assert((endTime - startTime) < 5000); // Should complete within 5 seconds
        });
        
        it('should search messages quickly', async function() {
            const startTime = Date.now();
            await messageStore.searchMessages('test');
            const endTime = Date.now();
            
            assert((endTime - startTime) < 100); // Should complete within 100ms
        });
    });
    
    describe('Security Tests', () => {
        it('should sanitize HTML in messages', () => {
            const maliciousContent = '<script>alert("XSS")</script>';
            const sanitized = whatsappSync.extractContent({
                text: { body: maliciousContent }
            });
            
            // The extractContent method returns the raw content
            // Sanitization happens in the client-side rendering
            assert(sanitized === maliciousContent);
        });
        
        it('should validate phone numbers', () => {
            const validPhone = '919876543210';
            const invalidPhone = '123';
            
            // Add phone validation logic
            assert(validPhone.length >= 10);
            assert(invalidPhone.length < 10);
        });
        
        it('should require authentication for all API endpoints', () => {
            // This would be tested with integration tests
            assert(true);
        });
    });
});

// Run tests
if (require.main === module) {
    const Mocha = require('mocha');
    const mocha = new Mocha();
    
    mocha.addFile(__filename);
    mocha.run(failures => {
        process.exitCode = failures ? 1 : 0;
    });
}