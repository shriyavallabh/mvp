const express = require('express');
const axios = require('axios');
const eventsLogger = require('./events-logger'); // DASHBOARD INTEGRATION - Events logging
const app = express();
app.use(express.json());

// META-GRADE CONFIGURATION - Bulletproof Architecture
const CONFIG = {
    verifyToken: 'jarvish_webhook_2024',
    port: 3000,
    phoneNumberId: '574744175733556',
    accessToken: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD',
    recipientNumber: '919765071249',
    maxRetries: 3,
    messageDelay: 2000,
    requestTimeout: 15000
};

console.log('🏗️  META-GRADE WEBHOOK ARCHITECTURE v3.0');
console.log('=' .repeat(70));
console.log('📱 Phone Number ID:', CONFIG.phoneNumberId);
console.log('🎯 Target Number:', CONFIG.recipientNumber);
console.log('🔧 Max Retries:', CONFIG.maxRetries);
console.log('⏱️  Message Delay:', CONFIG.messageDelay + 'ms');
console.log('=' .repeat(70));

// PREMIUM MEDIA CONTENT LIBRARY - High Quality Assets
const MEDIA_LIBRARY = [
    {
        id: 'market_overview',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&auto=format&q=85',
        caption: '📊 *MARKET OVERVIEW - LIVE DATA*\n\n🕐 ' + new Date().toLocaleString() + '\n\nReal-time market indicators and performance metrics'
    },
    {
        id: 'market_analysis',
        type: 'text',
        content: `📈 *COMPREHENSIVE MARKET ANALYSIS*

🔍 *EQUITY MARKETS TODAY:*
• Nifty 50: 19,875 (+1.2%) ↗️
• Sensex: 65,432 (+0.9%) ↗️  
• Bank Nifty: 44,250 (+1.5%) ↗️
• India VIX: 12.45 (-2.1%) ↘️

💎 *PREMIUM STOCK RECOMMENDATIONS:*
1️⃣ *HDFC Bank* - ₹1,750 | Target: ₹1,950 | 11.4% upside
2️⃣ *Reliance Industries* - ₹2,950 | Target: ₹3,200 | 8.5% upside  
3️⃣ *TCS* - ₹3,850 | Target: ₹4,200 | 9.1% upside
4️⃣ *ICICI Bank* - ₹1,020 | Target: ₹1,150 | 12.7% upside

🎯 *High-conviction picks with 15-25% upside potential*`
    },
    {
        id: 'portfolio_strategy',
        type: 'image', 
        url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=600&fit=crop&auto=format&q=85',
        caption: '💼 *PORTFOLIO ALLOCATION MATRIX*\n\nOptimal asset distribution strategy for maximum risk-adjusted returns'
    },
    {
        id: 'investment_strategy',
        type: 'text',
        content: `💡 *ADVANCED INVESTMENT STRATEGY*

✅ *RECOMMENDED ALLOCATION MODEL:*
• Large Cap Stocks: 50% (Stability + Growth)
• Mid Cap Stocks: 25% (Growth Focus)  
• Small Cap Stocks: 15% (High Growth)
• Debt/Fixed Income: 10% (Risk Buffer)

⚠️ *CRITICAL RISK FACTORS:*
• Global market volatility (Fed policy impact)
• Rising interest rate environment
• Geopolitical tensions (Ukraine, China)
• Currency fluctuation risks

🚀 *TACTICAL ACTION PLAN:*
• Book 25% profits in overvalued large caps
• Accumulate quality mid-caps on 5%+ dips
• Maintain 15-20% cash for opportunities  
• Focus on dividend-yielding defensives

📞 *CLIENT ENGAGEMENT STRATEGY:*
• Schedule portfolio review calls this week
• Share sector-specific recommendations  
• Implement systematic rebalancing
• Set up SIP structures for new money

💰 *Expected Returns: 12-18% CAGR over 3-5 years*`
    },
    {
        id: 'sectoral_opportunities', 
        type: 'image',
        url: 'https://images.unsplash.com/photo-1643208589889-0735ad7218f0?w=800&h=600&fit=crop&auto=format&q=85',
        caption: '📈 *SECTORAL HEAT MAP*\n\nEmerging opportunities and growth vectors across Indian markets'
    },
    {
        id: 'sectoral_insights',
        type: 'text',
        content: `🌟 *PREMIUM SECTORAL INTELLIGENCE*

🔥 *HIGH-MOMENTUM SECTORS:*
• IT Services: Export revival + AI adoption
• Private Banking: NIM expansion cycle  
• Pharmaceuticals: Global generic demand
• Infrastructure: Government capex boost
• Electric Vehicles: Policy tailwinds

❄️ *SECTORS TO AVOID (Near-term):*
• Real Estate: High inventory overhang
• Metals: Commodity price peak concerns
• FMCG: Rural demand weakness

📊 *SECTOR ROTATION STRATEGY:*
1. **Reduce exposure**: Overvalued consumer discretionary
2. **Increase allocation**: Undervalued financials
3. **Maintain positions**: Quality IT exporters
4. **New investments**: Infrastructure & renewable energy

🎯 *IMMEDIATE ACTION ITEMS:*
✓ Review all client portfolios by sector allocation
✓ Rebalance overweight positions (>15% in any sector)  
✓ Schedule client calls for strategy discussions
✓ Prepare sector-specific stock recommendations
✓ Set up alerts for entry/exit triggers

*🏆 Happy Investing & Wealth Creation!*

_Powered by FinAdvise AI - Your Intelligent Investment Partner_
_Next update: Tomorrow 9:00 AM IST_`
    }
];

// META-GRADE MESSAGE DELIVERY ENGINE
class MetaMessageEngine {
    constructor() {
        this.deliveryStats = {
            attempted: 0,
            successful: 0,
            failed: 0,
            retries: 0
        };
    }

    async sendMessage(recipient, content, attempt = 1) {
        const startTime = Date.now();
        this.deliveryStats.attempted++;

        try {
            console.log(`📤 [ATTEMPT ${attempt}/${CONFIG.maxRetries}] Sending ${content.type}: ${content.id || 'unknown'}`);
            
            let payload = {
                messaging_product: 'whatsapp',
                to: recipient
            };

            if (content.type === 'text') {
                payload.type = 'text';
                payload.text = { body: content.content };
            } else if (content.type === 'image') {
                payload.type = 'image'; 
                payload.image = {
                    link: content.url,
                    caption: content.caption
                };
            }

            const response = await axios.post(
                `https://graph.facebook.com/v17.0/${CONFIG.phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${CONFIG.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: CONFIG.requestTimeout
                }
            );

            const messageId = response.data.messages?.[0]?.id;
            const duration = Date.now() - startTime;
            
            console.log(`   ✅ SUCCESS: ${content.type} delivered in ${duration}ms | ID: ${messageId}`);
            this.deliveryStats.successful++;
            return { success: true, messageId, duration };

        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMsg = error.response?.data?.error?.message || error.message;
            
            console.log(`   ❌ FAILED: ${content.type} after ${duration}ms | ${errorMsg}`);
            
            if (attempt < CONFIG.maxRetries) {
                this.deliveryStats.retries++;
                console.log(`   🔄 RETRY ${attempt + 1}/${CONFIG.maxRetries} in 3 seconds...`);
                await this.sleep(3000);
                return this.sendMessage(recipient, content, attempt + 1);
            }

            this.deliveryStats.failed++;
            return { success: false, error: errorMsg, duration };
        }
    }

    async deliverContentSequence(recipient) {
        console.log('\n🚀 INITIATING PREMIUM CONTENT DELIVERY SEQUENCE');
        console.log('=' .repeat(60));
        console.log(`📱 Recipient: ${recipient}`);
        console.log(`📦 Content Items: ${MEDIA_LIBRARY.length}`);
        console.log(`⏰ Started: ${new Date().toLocaleTimeString()}`);
        console.log('=' .repeat(60));

        const results = [];
        
        for (let i = 0; i < MEDIA_LIBRARY.length; i++) {
            const content = MEDIA_LIBRARY[i];
            console.log(`\n📨 [${i + 1}/${MEDIA_LIBRARY.length}] Processing: ${content.id} (${content.type})`);
            
            const result = await this.sendMessage(recipient, content);
            results.push({ ...result, contentId: content.id, index: i + 1 });

            if (result.success) {
                console.log(`   ✨ Message ${i + 1} delivered successfully`);
                
                // Smart delay between messages
                if (i < MEDIA_LIBRARY.length - 1) {
                    console.log(`   ⏳ Waiting ${CONFIG.messageDelay}ms before next message...`);
                    await this.sleep(CONFIG.messageDelay);
                }
            } else {
                console.log(`   ⚠️  Message ${i + 1} failed: ${result.error}`);
            }
        }

        // Delivery Summary
        const successful = results.filter(r => r.success).length;
        const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
        
        console.log('\n🏁 CONTENT DELIVERY SEQUENCE COMPLETE');
        console.log('=' .repeat(60));
        console.log(`✅ Successful: ${successful}/${MEDIA_LIBRARY.length}`);
        console.log(`❌ Failed: ${MEDIA_LIBRARY.length - successful}/${MEDIA_LIBRARY.length}`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`🕐 Completed: ${new Date().toLocaleTimeString()}`);
        console.log(`📊 Stats: ${JSON.stringify(this.deliveryStats)}`);
        console.log('=' .repeat(60));

        return results;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const messageEngine = new MetaMessageEngine();

// META-GRADE WEBHOOK VERIFICATION
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('\n🔐 WEBHOOK VERIFICATION REQUEST');
    console.log(`   Mode: ${mode}`);
    console.log(`   Token: ${token}`);
    console.log(`   Expected: ${CONFIG.verifyToken}`);
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('   ✅ VERIFICATION SUCCESSFUL');
        res.status(200).send(challenge);
    } else {
        console.log('   ❌ VERIFICATION FAILED');
        res.sendStatus(403);
    }
});

// META-GRADE EVENT PROCESSOR - BULLETPROOF BUTTON HANDLING
app.post('/webhook', async (req, res) => {
    // Meta requirement: Respond immediately
    res.sendStatus(200);
    
    const timestamp = new Date().toLocaleTimeString();
    console.log('\n' + '='.repeat(80));
    console.log('📥 INCOMING WEBHOOK EVENT');
    console.log('🕐 Timestamp:', timestamp);
    console.log('=' .repeat(80));
    
    try {
        const body = req.body;
        
        // Log complete payload for debugging
        console.log('📄 FULL PAYLOAD:');
        console.log(JSON.stringify(body, null, 2));
        
        // Defensive validation - Meta-grade error handling
        if (!body?.entry?.[0]?.changes?.[0]?.value) {
            console.log('❌ INVALID PAYLOAD: Missing required webhook structure');
            return;
        }

        const value = body.entry[0].changes[0].value;
        const messages = value.messages;
        
        if (!messages || messages.length === 0) {
            console.log('ℹ️  NON-MESSAGE EVENT: Status update or delivery receipt');
            return;
        }

        const message = messages[0];
        const from = message.from;
        const messageType = message.type;
        
        console.log('\n📱 MESSAGE DETAILS:');
        console.log(`   From: ${from}`);
        console.log(`   Type: ${messageType}`);
        console.log(`   Authorized User: ${from === CONFIG.recipientNumber ? 'YES' : 'NO'}`);
        
        // BULLETPROOF BUTTON DETECTION - Handle ALL Meta button formats
        let isButtonClick = false;
        let buttonDetails = {};
        
        if (messageType === 'button') {
            // Legacy template button format
            isButtonClick = true;
            buttonDetails = {
                text: message.button?.text,
                payload: message.button?.payload,
                format: 'legacy_button'
            };
            console.log('🔘 LEGACY BUTTON DETECTED');
            
        } else if (messageType === 'interactive') {
            // Interactive button format
            const interactive = message.interactive;
            if (interactive?.type === 'button_reply') {
                isButtonClick = true;
                buttonDetails = {
                    id: interactive.button_reply?.id,
                    title: interactive.button_reply?.title,
                    format: 'interactive_button'
                };
                console.log('🔘 INTERACTIVE BUTTON DETECTED');
            }
            
        } else if (messageType === 'text') {
            // Text message handling
            const text = message.text?.body?.toLowerCase() || '';
            console.log(`💬 TEXT MESSAGE: "${text}"`);
            
            // DASHBOARD INTEGRATION - Log text message
            eventsLogger.logTextMessage(from, text, 'incoming');
            
            // Check for content trigger keywords
            if (text.includes('content') || text.includes('retrieve') || text.includes('unlock')) {
                console.log('🎯 CONTENT TRIGGER KEYWORD DETECTED');
                isButtonClick = true; // Treat as button click
                buttonDetails = {
                    text: text,
                    format: 'text_trigger'
                };
            }
        }
        
        if (isButtonClick) {
            console.log('\n🔘 BUTTON CLICK CONFIRMED');
            console.log('   Details:', JSON.stringify(buttonDetails, null, 2));
            console.log('   Format:', buttonDetails.format);
            
            // DASHBOARD INTEGRATION - Log button click event
            eventsLogger.logButtonClick(from, buttonDetails.id || buttonDetails.payload || 'unknown', buttonDetails);
            
            // Verify authorized user
            if (from === CONFIG.recipientNumber) {
                console.log('✅ AUTHORIZED USER - TRIGGERING CONTENT DELIVERY');
                
                // Execute premium content delivery
                const results = await messageEngine.deliverContentSequence(from);
                
                // DASHBOARD INTEGRATION - Log content delivery events
                results.forEach(result => {
                    eventsLogger.logContentDelivery(from, result.contentId || 'unknown', result.success, result.duration || 0);
                });
                
                const successCount = results.filter(r => r.success).length;
                console.log(`\n📊 DELIVERY SUMMARY: ${successCount}/${results.length} messages delivered`);
                
            } else {
                console.log(`❌ UNAUTHORIZED USER: ${from} (Expected: ${CONFIG.recipientNumber})`);
            }
            
        } else {
            console.log(`⚠️  UNHANDLED MESSAGE TYPE: ${messageType}`);
            console.log('   Full message:', JSON.stringify(message, null, 2));
        }
        
    } catch (error) {
        console.error('\n💥 WEBHOOK ERROR:');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
    }
    
    console.log('=' .repeat(80));
});

// META-GRADE HEALTH & DIAGNOSTICS
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '3.0',
        architecture: 'Meta-Grade Webhook',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
            phoneNumberId: CONFIG.phoneNumberId,
            contentLibrary: MEDIA_LIBRARY.length,
            maxRetries: CONFIG.maxRetries,
            messageDelay: CONFIG.messageDelay
        },
        stats: messageEngine.deliveryStats
    });
});

// META-GRADE SERVER STARTUP
app.listen(CONFIG.port, '0.0.0.0', () => {
    console.log('\n' + '🏗️ '.repeat(35));
    console.log('🚀 META-GRADE WEBHOOK ONLINE');
    console.log('🏗️ '.repeat(35));
    console.log(`📡 Port: ${CONFIG.port}`);
    console.log(`📱 Phone ID: ${CONFIG.phoneNumberId}`);
    console.log(`🎯 Target: ${CONFIG.recipientNumber}`);
    console.log(`📦 Content Library: ${MEDIA_LIBRARY.length} premium assets`);
    console.log(`🔧 Max Retries: ${CONFIG.maxRetries}`);
    console.log(`⏱️  Message Delay: ${CONFIG.messageDelay}ms`);
    console.log(`🕐 Started: ${new Date().toLocaleString()}`);
    console.log('🏗️ '.repeat(35));
    console.log('✅ READY FOR BUTTON CLICKS - META ENGINEERING STANDARDS');
    console.log('🏗️ '.repeat(35));
});

// META-GRADE ERROR HANDLING
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n💥 UNHANDLED PROMISE REJECTION:');
    console.error('   Promise:', promise);
    console.error('   Reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('\n💥 UNCAUGHT EXCEPTION:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    console.error('🚨 SHUTTING DOWN...');
    process.exit(1);
});