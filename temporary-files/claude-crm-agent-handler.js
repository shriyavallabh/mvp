const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * CLAUDE-POWERED CRM AGENT
 * Routes advisor messages to Claude Code IDE on VM
 * Differentiates between button clicks and text messages
 */

const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    claudeCodePath: '/usr/local/bin/claude-code', // Path to Claude Code CLI on VM
    vmClaudeEndpoint: 'http://localhost:8080/claude' // If running as API on VM
};

// Advisor context storage
const advisorContext = new Map();

// CRM Agent prompt
const CRM_AGENT_PROMPT = `You are a helpful CRM assistant for FinAdvise financial advisors.

Your role:
- Answer questions about daily content
- Handle feedback about messages
- Provide support for using the platform
- Help with content customization requests
- Track advisor preferences

Current advisor is messaging about financial advisory content they receive daily.

Guidelines:
- Be professional but friendly
- Keep responses concise (under 200 words)
- If they complain about content, acknowledge and offer alternatives
- If they request specific content, note it for future delivery
- Always be helpful and solution-oriented

Respond to this advisor message:`;

console.log('\n🤖 CLAUDE-POWERED CRM AGENT');
console.log('=' .repeat(70));
console.log('Routes messages to Claude Code IDE for intelligent responses\n');

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
    const body = req.body;
    
    // Always respond immediately
    res.status(200).send('OK');
    
    // Process events
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    const contacts = value?.contacts || [];
    
    for (const message of messages) {
        const from = message.from;
        const contactName = contacts.find(c => c.wa_id === from)?.profile?.name || 'Advisor';
        
        console.log(`\n📨 Message from ${contactName} (${from})`);
        console.log(`   Type: ${message.type}`);
        
        // DIFFERENTIATE MESSAGE TYPES
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            // BUTTON CLICK - Handle content delivery
            await handleButtonClick(from, message.interactive.button_reply, contactName);
            
        } else if (message.type === 'text') {
            // TEXT MESSAGE - Route to Claude CRM Agent
            await handleTextMessage(from, message.text.body, contactName);
            
        } else if (message.type === 'image' || message.type === 'document') {
            // MEDIA MESSAGE - Acknowledge receipt
            await handleMediaMessage(from, message.type, contactName);
        }
    }
});

/**
 * Handle button clicks (content delivery)
 */
async function handleButtonClick(from, buttonReply, contactName) {
    console.log(`   🔘 Button clicked: "${buttonReply.title}"`);
    console.log(`   Button ID: ${buttonReply.id}`);
    
    // Handle different button types
    if (buttonReply.id.includes('UNLOCK')) {
        // Deliver content (existing flow)
        await deliverContent(from, buttonReply.id);
    } else if (buttonReply.id.includes('FEEDBACK')) {
        // Handle feedback buttons
        await handleFeedback(from, buttonReply.id);
    }
}

/**
 * Handle text messages - Route to Claude
 */
async function handleTextMessage(from, text, contactName) {
    console.log(`   💬 Text: "${text.substring(0, 50)}..."`);
    console.log(`   🤖 Routing to Claude CRM Agent...`);
    
    try {
        // Get advisor context
        const context = advisorContext.get(from) || [];
        
        // Build conversation history
        const conversationHistory = context.map(msg => 
            `${msg.role}: ${msg.content}`
        ).join('\n');
        
        // Create prompt for Claude
        const fullPrompt = `${CRM_AGENT_PROMPT}

Advisor Name: ${contactName}
Phone: ${from}

Previous conversation:
${conversationHistory || 'No previous messages'}

Current message: "${text}"

Response:`;
        
        // METHOD 1: Call Claude Code CLI (if installed on same machine)
        let claudeResponse;
        if (CONFIG.claudeCodePath) {
            claudeResponse = await callClaudeCLI(fullPrompt);
        } else {
            // METHOD 2: Call Claude API endpoint on VM
            claudeResponse = await callClaudeAPI(fullPrompt);
        }
        
        // Send Claude's response back to advisor
        await sendMessage(from, claudeResponse);
        
        // Update context
        context.push({ role: 'advisor', content: text });
        context.push({ role: 'agent', content: claudeResponse });
        
        // Keep only last 10 messages in context
        if (context.length > 10) {
            context.splice(0, context.length - 10);
        }
        advisorContext.set(from, context);
        
        console.log(`   ✅ Claude response sent`);
        
    } catch (error) {
        console.error('   ❌ Error getting Claude response:', error.message);
        
        // Fallback response
        await sendMessage(from, 
            "I understand your message. Let me connect you with our support team. " +
            "Meanwhile, is there anything specific about today's content I can help with?"
        );
    }
}

/**
 * Call Claude Code CLI
 */
async function callClaudeCLI(prompt) {
    try {
        // Use claude-code CLI command
        const command = `echo "${prompt.replace(/"/g, '\\"')}" | ${CONFIG.claudeCodePath} --max-tokens 200`;
        const { stdout } = await execPromise(command);
        return stdout.trim();
    } catch (error) {
        console.error('Claude CLI error:', error);
        throw error;
    }
}

/**
 * Call Claude API on VM
 */
async function callClaudeAPI(prompt) {
    try {
        // Call Claude endpoint on VM
        const response = await axios.post(CONFIG.vmClaudeEndpoint, {
            prompt: prompt,
            max_tokens: 200,
            temperature: 0.7
        });
        
        return response.data.response || response.data.text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

/**
 * Handle media messages
 */
async function handleMediaMessage(from, type, contactName) {
    console.log(`   📎 ${type} received from ${contactName}`);
    
    await sendMessage(from, 
        `Thank you for sharing the ${type}. I've received it. ` +
        `How can I help you with this?`
    );
}

/**
 * Deliver content (existing flow for button clicks)
 */
async function deliverContent(from, buttonId) {
    console.log(`   📦 Delivering content for button: ${buttonId}`);
    
    // Your existing content delivery logic
    const content = [
        "📊 Here's today's market update...",
        "💰 Investment strategies for your clients...",
        "📋 Tax planning tips..."
    ];
    
    for (const msg of content) {
        await sendMessage(from, msg);
        await new Promise(r => setTimeout(r, 1000));
    }
}

/**
 * Handle feedback
 */
async function handleFeedback(from, feedbackId) {
    const feedbackType = feedbackId.includes('POSITIVE') ? 'positive' : 'negative';
    
    console.log(`   ${feedbackType === 'positive' ? '👍' : '👎'} Feedback received`);
    
    const response = feedbackType === 'positive' 
        ? "Thank you for the positive feedback! We'll continue sending similar content."
        : "Thank you for your feedback. What type of content would you prefer? Please let me know.";
    
    await sendMessage(from, response);
}

/**
 * Send WhatsApp message
 */
async function sendMessage(to, text) {
    try {
        const response = await axios.post(
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
        
        return response.data;
    } catch (error) {
        console.error('Send message error:', error.response?.data || error.message);
        throw error;
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'claude-crm-agent',
        activeConversations: advisorContext.size
    });
});

// Start server
app.listen(CONFIG.port, () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    console.log('📊 Message routing:');
    console.log('   • Button clicks → Content delivery');
    console.log('   • Text messages → Claude CRM Agent');
    console.log('   • Media messages → Acknowledgment');
    console.log('\nWaiting for messages...\n');
});

module.exports = { handleTextMessage, handleButtonClick };