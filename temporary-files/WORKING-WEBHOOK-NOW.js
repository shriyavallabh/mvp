#!/usr/bin/env node

/**
 * WORKING WEBHOOK - THIS WILL ACTUALLY WORK
 */

const express = require('express');
const app = express();

// Raw body for signature verification
app.use(express.raw({ type: 'application/json' }));

const PORT = 3000;
const VERIFY_TOKEN = 'jarvish_webhook_2024';

console.log('\n🚀 STARTING FRESH WEBHOOK SERVER');
console.log('=' .repeat(70));
console.log(`Port: ${PORT}`);
console.log(`URL: https://softball-one-realtor-telecom.trycloudflare.com/webhook`);
console.log(`Token: ${VERIFY_TOKEN}\n`);

// Verification endpoint
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('✅ VERIFICATION REQUEST RECEIVED');
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Event handler
app.post('/webhook', (req, res) => {
    const body = JSON.parse(req.body.toString());
    
    console.log('\n🎉🎉🎉 WEBHOOK EVENT RECEIVED! 🎉🎉🎉');
    console.log('Time:', new Date().toISOString());
    console.log('=' .repeat(70));
    console.log(JSON.stringify(body, null, 2));
    console.log('=' .repeat(70));
    
    // Parse the event
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    
    for (const message of messages) {
        console.log('\n📱 MESSAGE DETAILS:');
        console.log('From:', message.from);
        console.log('Type:', message.type);
        
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            console.log('\n✅✅✅ BUTTON CLICK DETECTED! ✅✅✅');
            console.log('Button ID:', message.interactive.button_reply.id);
            console.log('Button Title:', message.interactive.button_reply.title);
            console.log('\n🎯 WEBHOOK IS WORKING! BUTTON CLICKS ARE BEING RECEIVED!');
        } else if (message.type === 'text') {
            console.log('Text:', message.text?.body);
        }
    }
    
    // Always return 200 immediately
    res.status(200).send('OK');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ WEBHOOK SERVER RUNNING ON PORT ${PORT}`);
    console.log('Waiting for events...\n');
});