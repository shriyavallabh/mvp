const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * TEST CLAUDE-POWERED CHAT
 * Demonstrates text message handling vs button clicks
 */

const axios = require('axios');

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN
};

console.log('\n🤖 CLAUDE CHAT CAPABILITY TEST');
console.log('=' .repeat(70));
console.log('Testing AI-powered responses to advisor messages\n');

/**
 * Send test message to trigger chat response
 */
async function sendTestPrompt(to, name) {
    console.log(`📱 Sending test prompt to ${name}...`);
    
    const testMessages = [
        "Hi, I don't like today's content. Can you send something about mutual funds instead?",
        "What time do you send daily updates?",
        "Can I get content in Hindi?",
        "Stop sending me messages",
        "MORE"
    ];
    
    // Pick a random test message
    const message = testMessages[Math.floor(Math.random() * testMessages.length)];
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: {
                    body: `🧪 CHAT TEST: Reply to this message to test Claude responses.
                    
Try typing:
• "I don't like today's content"
• "Send me tax planning tips"
• "What time do updates arrive?"
• Any feedback or question

The system will respond intelligently using Claude.`
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Sent test prompt`);
        console.log(`   Example message to try: "${message}"`);
        
    } catch (error) {
        console.error(`   ❌ Failed:`, error.response?.data || error.message);
    }
}

async function main() {
    console.log('📊 SYSTEM ARCHITECTURE:');
    console.log('=' .repeat(70));
    console.log('\nWhatsApp Message Flow:');
    console.log('1. Advisor sends message → WhatsApp Cloud API');
    console.log('2. WhatsApp → Your Webhook (port 3000)');
    console.log('3. Webhook identifies message type:');
    console.log('   a) Button Click → Deliver content');
    console.log('   b) Text Message → Route to Claude');
    console.log('4. Claude on VM generates response');
    console.log('5. Response sent back to advisor\n');
    
    console.log('💡 ADVANTAGES:');
    console.log('• No external API costs (Gemini, OpenAI)');
    console.log('• Uses existing Claude Code on VM');
    console.log('• Maintains conversation context');
    console.log('• Can handle feedback and preferences');
    console.log('• Acts as intelligent CRM agent\n');
    
    // Send test prompts
    const advisors = [
        { phone: '919022810769', name: 'Test Advisor' },
        { phone: '919765071249', name: 'Avalok' }
    ];
    
    for (const advisor of advisors) {
        await sendTestPrompt(advisor.phone, advisor.name);
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 HOW TO TEST CLAUDE CHAT:');
    console.log('=' .repeat(70));
    
    console.log('\n1️⃣ REPLY to the test message with:');
    console.log('   • "I don\'t like today\'s content"');
    console.log('   • "Send me mutual fund strategies"');
    console.log('   • "What\'s the best tax saving option?"');
    console.log('   • Any question or feedback');
    
    console.log('\n2️⃣ EXPECTED BEHAVIOR:');
    console.log('   • Webhook detects it\'s a TEXT message (not button)');
    console.log('   • Routes to Claude CRM Agent');
    console.log('   • Claude generates intelligent response');
    console.log('   • Response sent back via WhatsApp');
    
    console.log('\n3️⃣ DEPLOYMENT ON VM:');
    console.log('   1. Deploy claude-api-wrapper-for-vm.js on VM');
    console.log('   2. Run: node claude-api-wrapper-for-vm.js');
    console.log('   3. Update webhook to call VM endpoint');
    console.log('   4. Claude Code handles all responses');
    
    console.log('\n✅ NO API COSTS - Uses your existing Claude Code!');
}

main().catch(console.error);