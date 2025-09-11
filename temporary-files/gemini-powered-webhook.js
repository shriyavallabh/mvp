const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * GEMINI-POWERED WEBHOOK - ACTUAL AI RESPONSES
 * Uses Google's Gemini for intelligent chat
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY', // Add your key
    port: 3000
};

// System prompt for Gemini
const SYSTEM_PROMPT = `You are a helpful financial advisory assistant for FinAdvise. 
You help financial advisors with market updates, investment strategies, and client management.
Keep responses concise (under 150 words) and professional.
Today's date is ${new Date().toLocaleDateString()}.
When asked about market data, provide realistic estimates based on Indian markets.`;

console.log('\n🤖 GEMINI-POWERED INTELLIGENT WEBHOOK');
console.log('=' .repeat(70));
console.log('Using ACTUAL AI for responses\n');

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Main webhook handler
app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');
    
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    const contacts = value?.contacts || [];
    
    for (const message of messages) {
        const from = message.from;
        const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'there';
        
        console.log(`\n📨 From: ${contactName} (${from})`);
        console.log(`   Type: ${message.type}`);
        
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            // Handle button clicks
            await handleButtonClick(from, message.interactive.button_reply);
            
        } else if (message.type === 'text') {
            // TEXT MESSAGE - Use Gemini AI
            const text = message.text.body;
            console.log(`   Message: "${text}"`);
            
            // Get AI response
            const response = await getGeminiResponse(text, contactName);
            console.log(`   AI Response: "${response.substring(0, 60)}..."`);
            
            await sendMessage(from, response);
        }
    }
});

/**
 * Get response from Gemini AI
 */
async function getGeminiResponse(userMessage, userName) {
    // If no API key, use fallback
    if (!CONFIG.geminiApiKey || CONFIG.geminiApiKey === 'YOUR_GEMINI_KEY') {
        return getFallbackResponse(userMessage, userName);
    }
    
    try {
        const prompt = `${SYSTEM_PROMPT}
        
User Name: ${userName}
User Message: "${userMessage}"

Provide a helpful response:`;
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.geminiApiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            }
        );
        
        const aiResponse = response.data.candidates[0].content.parts[0].text;
        return aiResponse;
        
    } catch (error) {
        console.error('Gemini API error:', error.response?.data || error.message);
        return getFallbackResponse(userMessage, userName);
    }
}

/**
 * Fallback responses when AI not available
 */
function getFallbackResponse(text, name) {
    const lower = text.toLowerCase();
    
    // Common questions with better responses
    const responses = {
        'date': `Today is ${new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`,
        
        'time': `Current time is ${new Date().toLocaleTimeString('en-IN')}`,
        
        'market': `For real-time market data, I'd need API access. As of last close:
• Nifty 50: ~19,800
• Sensex: ~66,500
• Bank Nifty: ~44,600

Check NSE/BSE websites for live data.`,
        
        'hello': `Hello ${name}! How can I assist you today?`,
        
        'help': `I can help with:
• Market updates
• Investment strategies
• Tax planning
• Content preferences
What would you like to know?`
    };
    
    // Check which pattern matches
    for (const [pattern, response] of Object.entries(responses)) {
        if (lower.includes(pattern)) {
            return response;
        }
    }
    
    // Default
    return `I understand you're asking about "${text}". 

For accurate information, I'd need AI integration. Currently, I can help with:
• Market updates
• Investment tips
• Tax planning
• Content delivery

What specific information do you need?`;
}

/**
 * Handle button clicks (images)
 */
async function handleButtonClick(from, buttonReply) {
    const buttonId = buttonReply.id;
    const buttonTitle = buttonReply.title;
    
    console.log(`   🔘 Button: "${buttonTitle}"`);
    
    if (buttonId.includes('UNLOCK_MEDIA') || buttonTitle.includes('Get Images')) {
        // Send images
        const images = [
            {
                url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
                caption: '📊 Market Analysis'
            },
            {
                url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
                caption: '💰 Investment Guide'
            },
            {
                url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
                caption: '📋 Tax Planning'
            }
        ];
        
        for (const img of images) {
            await sendImage(from, img.url, img.caption);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

async function sendMessage(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Send error:', error.response?.data || error.message);
    }
}

async function sendImage(to, url, caption) {
    try {
        await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: { link: url, caption: caption }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Image error:', error.response?.data || error.message);
    }
}

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        ai: CONFIG.geminiApiKey ? 'enabled' : 'disabled',
        timestamp: new Date().toISOString()
    });
});

app.listen(CONFIG.port, () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log('\n📊 CONFIGURATION:');
    if (CONFIG.geminiApiKey && CONFIG.geminiApiKey !== 'YOUR_GEMINI_KEY') {
        console.log('   ✅ Gemini AI: ENABLED');
    } else {
        console.log('   ⚠️  Gemini AI: DISABLED (using fallback)');
        console.log('   Add GEMINI_API_KEY to enable AI');
    }
    console.log('\nReady for intelligent conversations!\n');
});