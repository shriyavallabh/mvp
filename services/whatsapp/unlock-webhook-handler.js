#!/usr/bin/env node

/**
 * Webhook Handler for Click-to-Unlock Strategy
 * Processes button clicks and delivers queued content
 */

const express = require('express');
const { clickToUnlockService } = require('./click-to-unlock-strategy');
const { whatsAppConfig, webhookConfig } = require('../../config/env.config');
const { Logger } = require('../../utils/logger');
const crypto = require('crypto');

const logger = new Logger({ name: 'UnlockWebhook' });
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Verify webhook signature from Meta
 */
function verifyWebhookSignature(req, res, next) {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        logger.warn('Missing webhook signature');
        return res.status(401).send('Unauthorized');
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', webhookConfig.secret || 'default_secret')
        .update(JSON.stringify(req.body))
        .digest('hex');
    
    if (signature !== `sha256=${expectedSignature}`) {
        logger.warn('Invalid webhook signature');
        return res.status(401).send('Unauthorized');
    }
    
    next();
}

/**
 * Webhook verification endpoint (GET)
 */
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === webhookConfig.verifyToken) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
    } else {
        logger.warn('Webhook verification failed', { mode, token });
        res.status(403).send('Forbidden');
    }
});

/**
 * Main webhook endpoint (POST)
 */
app.post('/webhook', verifyWebhookSignature, async (req, res) => {
    const timer = logger.startTimer('Process webhook');
    
    try {
        // Acknowledge receipt immediately
        res.status(200).send('OK');
        
        const { entry } = req.body;
        
        if (!entry || !Array.isArray(entry)) {
            logger.debug('Invalid webhook format');
            return;
        }
        
        // Process each entry
        for (const entryItem of entry) {
            const changes = entryItem.changes || [];
            
            for (const change of changes) {
                if (change.field !== 'messages') continue;
                
                const value = change.value;
                
                // Process messages
                for (const message of value.messages || []) {
                    await processMessage(message);
                }
                
                // Process status updates
                for (const status of value.statuses || []) {
                    await processStatus(status);
                }
            }
        }
        
        timer({ success: true });
        
    } catch (error) {
        logger.error('Error processing webhook', error);
        timer({ success: false });
    }
});

/**
 * Process incoming message
 */
async function processMessage(message) {
    logger.info('Processing message', {
        from: message.from,
        type: message.type,
        id: message.id
    });
    
    // Handle button replies (quick_reply or interactive)
    if (message.type === 'button') {
        const buttonPayload = message.button?.payload;
        
        if (buttonPayload && buttonPayload.startsWith('UNLOCK_CONTENT_')) {
            await clickToUnlockService.handleUnlockRequest({
                from: message.from,
                interactive: {
                    button_reply: {
                        id: buttonPayload
                    }
                }
            });
        }
    }
    
    // Handle interactive button replies
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
        await clickToUnlockService.handleUnlockRequest({
            from: message.from,
            interactive: message.interactive
        });
    }
    
    // Handle text messages with keywords
    if (message.type === 'text') {
        const text = message.text?.body?.toLowerCase() || '';
        
        // Check for unlock keywords
        if (text.includes('show') || text.includes('content') || text.includes('unlock')) {
            logger.info('Unlock keyword detected', { from: message.from, text });
            
            // Send all pending content
            await clickToUnlockService.handleUnlockRequest({
                from: message.from,
                interactive: {
                    button_reply: {
                        id: 'UNLOCK_CONTENT_ALL'
                    }
                }
            });
        }
    }
}

/**
 * Process status updates
 */
async function processStatus(status) {
    logger.debug('Status update received', {
        messageId: status.id,
        status: status.status,
        recipient: status.recipient_id,
        timestamp: status.timestamp
    });
    
    // Track delivery status
    if (status.status === 'delivered') {
        logger.info(`Message delivered to ${status.recipient_id}`);
    } else if (status.status === 'read') {
        logger.info(`Message read by ${status.recipient_id}`);
    } else if (status.status === 'failed') {
        logger.error(`Message failed for ${status.recipient_id}`, {
            errors: status.errors
        });
    }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'unlock-webhook-handler'
    });
});

/**
 * Start the webhook server
 */
function startServer() {
    const port = webhookConfig.port || 5001;
    
    app.listen(port, () => {
        logger.info(`Unlock webhook handler started on port ${port}`);
        console.log(`\n🚀 Click-to-Unlock Webhook Handler`);
        console.log(`📡 Listening on: http://localhost:${port}/webhook`);
        console.log(`🏥 Health check: http://localhost:${port}/health`);
        console.log(`\n✨ Ready to process unlock requests!`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server if run directly
if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    startServer,
    processMessage,
    processStatus
};