const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * WhatsApp Webhook Server - Standalone Version
 * Handles incoming WhatsApp messages for revision commands
 * Runs on your VM instead of Fly.io
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

// Your WhatsApp webhook verify token
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'jarvish_webhook_2024';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple console logger
const logger = {
  info: (...args) => console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] WARN:`, ...args)
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'WhatsApp Webhook Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

/**
 * WhatsApp Webhook Verification (GET)
 * WhatsApp will call this to verify your webhook URL
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('[Webhook] Verification request received');
  logger.info(`[Webhook] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('[Webhook] Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('[Webhook] Verification failed - invalid token');
    logger.error(`[Webhook] Expected token: ${VERIFY_TOKEN}, Received: ${token}`);
    res.sendStatus(403);
  }
});

/**
 * WhatsApp Webhook Handler (POST)
 * Receives incoming WhatsApp messages
 */
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    
    logger.info('[Webhook] Message received:', JSON.stringify(body, null, 2));

    // Check if it's a WhatsApp Business API webhook
    if (body.object === 'whatsapp_business_account') {
      // Process each entry
      for (const entry of body.entry) {
        const changes = entry.changes || [];
        
        for (const change of changes) {
          // Check if it's a message
          if (change.field === 'messages' && change.value.messages) {
            const messages = change.value.messages;
            
            for (const message of messages) {
              await processWhatsAppMessage(message, change.value.contacts);
            }
          }
        }
      }
      
      // Always respond quickly to WhatsApp
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error('[Webhook] Error processing webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Process individual WhatsApp message
 */
async function processWhatsAppMessage(message, contacts) {
  try {
    const { from, text, timestamp } = message;
    
    // Get contact name
    const contact = contacts?.find(c => c.wa_id === from);
    const contactName = contact?.profile?.name || 'Unknown';
    
    logger.info(`[Webhook] Message from ${contactName} (${from}): ${text?.body}`);
    
    // Check if it's a command (starts with keywords)
    const messageText = text?.body?.toUpperCase() || '';
    
    const commands = [
      'APPROVE', 'REJECT', 'REGENERATE', 'MODIFY',
      'TONE', 'ADD_EMOJI', 'REMOVE_EMOJI', 
      'SHORTEN', 'EXPAND', 'HELP', 'STATUS'
    ];
    
    const isCommand = commands.some(cmd => messageText.startsWith(cmd));
    
    if (isCommand) {
      logger.info(`[Webhook] Processing command: ${messageText}`);
      
      // Check if it's within the review window (8:30 PM - 11:00 PM)
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes; // Convert to minutes
      
      const reviewStartTime = 20 * 60 + 30; // 8:30 PM = 20:30
      const reviewEndTime = 23 * 60; // 11:00 PM = 23:00
      
      if (messageText === 'STATUS') {
        // Special command to check system status (works anytime)
        await sendWhatsAppResponse(
          from,
          `System Status: ✅ Active\nReview Window: 8:30 PM - 11:00 PM\nCurrent Time: ${new Date().toLocaleTimeString('en-IN')}\nWebhook: Running on VM`
        );
      } else if (messageText === 'HELP') {
        // Show available commands
        await sendWhatsAppResponse(
          from,
          `Available Commands (8:30 PM - 11:00 PM):\n\n` +
          `• APPROVE CNT_12345\n` +
          `• REJECT CNT_12345\n` +
          `• REGENERATE CNT_12345\n` +
          `• TONE CNT_12345 friendly\n` +
          `• SHORTEN CNT_12345\n` +
          `• EXPAND CNT_12345\n` +
          `• STATUS (anytime)\n` +
          `• HELP (anytime)`
        );
      } else if (currentTime >= reviewStartTime && currentTime <= reviewEndTime) {
        // Process the revision command during review window
        logger.info(`[Webhook] Command ${messageText} received during review window`);
        
        // Here you would normally process the command
        // For now, send acknowledgment
        await sendWhatsAppResponse(
          from,
          `Command received: ${messageText}\n✅ Processing your request...`
        );
      } else {
        // Outside review window
        await sendWhatsAppResponse(
          from, 
          `Review window is 8:30 PM - 11:00 PM.\nCurrent time: ${new Date().toLocaleTimeString('en-IN')}\nYour command will be processed during the review window.`
        );
      }
    }
    
  } catch (error) {
    logger.error('[Webhook] Error processing message:', error);
  }
}

/**
 * Send WhatsApp response
 */
async function sendWhatsAppResponse(to, message) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env file');
    }
    
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.info(`[Webhook] Response sent to ${to}`);
    
  } catch (error) {
    logger.error('[Webhook] Error sending response:', error.response?.data || error.message);
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`[Webhook] WhatsApp Webhook Server running on port ${PORT}`);
  logger.info(`[Webhook] Webhook URL: http://YOUR_VM_IP:${PORT}/webhook`);
  logger.info(`[Webhook] Health check: http://YOUR_VM_IP:${PORT}/health`);
  logger.info(`[Webhook] Verify token: ${VERIFY_TOKEN}`);
  
  console.log(`
╔══════════════════════════════════════════════╗
║      WhatsApp Webhook Server Started        ║
╚══════════════════════════════════════════════╝

Port: ${PORT}
Verify Token: ${VERIFY_TOKEN}
Status: READY FOR VERIFICATION

To configure in WhatsApp Business:
1. Webhook URL: http://143.110.191.97:${PORT}/webhook
2. Verify Token: ${VERIFY_TOKEN}

Commands accepted (8:30 PM - 11:00 PM):
- APPROVE CNT_12345
- REJECT CNT_12345
- REGENERATE CNT_12345
- TONE CNT_12345 friendly
- SHORTEN CNT_12345
- EXPAND CNT_12345
- HELP (anytime)
- STATUS (anytime)
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[Webhook] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('[Webhook] SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('[Webhook] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Webhook] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});