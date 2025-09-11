/**
 * WhatsApp Webhook Server V2
 * Production-grade webhook handler with fallback support
 */

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/whatsapp.config');
const webhookService = require('./services/whatsapp/webhook.service');
const logger = require('./services/logger');

const app = express();

// Middleware
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        // Store raw body for signature verification
        req.rawBody = buf.toString('utf8');
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// Webhook verification endpoint (GET)
app.get(config.webhook.endpoint, (req, res) => {
    webhookService.handleVerification(req, res);
});

// Webhook events endpoint (POST)
app.post(config.webhook.endpoint, async (req, res) => {
    await webhookService.processWebhook(req, res);
});

// Subscribe to webhooks endpoint (admin only)
app.post('/admin/subscribe-webhooks', async (req, res) => {
    // Simple auth check (improve for production)
    const authToken = req.headers.authorization;
    if (authToken !== `Bearer ${config.waba.accessToken}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await webhookService.subscribeToWebhooks();
    res.json({ success: result });
});

// Get webhook status endpoint
app.get('/admin/webhook-status', async (req, res) => {
    const db = require('./services/database');
    await db.initialize();

    const recentSends = Array.from(db.cache.sends.values())
        .slice(-100)
        .map(s => ({
            wamid: s.wamid,
            status: s.status,
            channel: s.channel,
            created: s.created_at,
            updated: s.updated_at
        }));

    res.json({
        recent_sends: recentSends,
        total_sends: db.cache.sends.size
    });
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = config.webhook.port;
const HOST = process.env.WEBHOOK_HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    logger.info(`Webhook server V2 running on ${HOST}:${PORT}`);
    logger.info(`Webhook endpoint: ${config.webhook.endpoint}`);
    logger.info(`Public URL should be: ${process.env.WEBHOOK_PUBLIC_URL || 'https://your-domain.com'}${config.webhook.endpoint}`);
    
    if (config.features.debugMode) {
        logger.debug('Debug mode enabled');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});