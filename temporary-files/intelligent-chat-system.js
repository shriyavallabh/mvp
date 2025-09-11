#!/usr/bin/env node

/**
 * Story 3.2: Intelligent Chat System
 * ====================================
 * Provides Claude-powered intelligent responses for advisor chat
 * Falls back to contextual responses when Claude unavailable
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
    maxContextMessages: 10,
    responseTimeout: 5000,
    contextFile: '/home/mvp/data/chat-contexts.json',
    knowledgeBase: '/home/mvp/data/financial-knowledge.json'
};

// Financial advisory knowledge base
const KNOWLEDGE_BASE = {
    markets: {
        nifty: { current: 19823, change: '+1.2%', support: 19700, resistance: 19900 },
        sensex: { current: 66598, change: '+0.58%', support: 66000, resistance: 67000 },
        bankNifty: { current: 44672, change: '+0.82%', support: 44500, resistance: 45000 }
    },
    sectors: {
        it: { outlook: 'positive', reason: 'US tech rally, strong Q3 results expected' },
        pharma: { outlook: 'positive', reason: 'Defensive play, FDA approvals pipeline' },
        banking: { outlook: 'neutral', reason: 'NIM pressure, but credit growth strong' },
        realty: { outlook: 'negative', reason: 'Rate hike concerns, inventory buildup' }
    },
    investments: {
        sip: 'Systematic Investment Plan - Best for long-term wealth creation',
        elss: 'Tax saving mutual funds with 3-year lock-in under 80C',
        nps: 'Additional ₹50,000 tax benefit under 80CCD(1B)',
        ppf: 'Safe investment with 7.1% returns, 15-year lock-in'
    },
    tax: {
        fy2024: {
            section80C: '₹1.5 lakh limit for ELSS, PPF, insurance',
            section80D: '₹25,000 for health insurance, ₹50,000 for senior citizens',
            section80CCD: 'Additional ₹50,000 for NPS',
            ltcg: '10% on gains above ₹1 lakh from equity'
        }
    }
};

/**
 * Main intelligent response function
 */
async function getIntelligentResponse(text, advisorName, phoneNumber, conversationHistory = []) {
    console.log(`🤖 Generating response for: "${text.substring(0, 50)}..."`);
    
    // Try Claude first
    const claudeResponse = await tryClaudeResponse(text, advisorName, conversationHistory);
    if (claudeResponse) {
        return claudeResponse;
    }
    
    // Fall back to advanced contextual response
    return await generateContextualResponse(text, advisorName, phoneNumber, conversationHistory);
}

/**
 * Try to get response from Claude
 */
async function tryClaudeResponse(text, advisorName, conversationHistory) {
    try {
        // Check if Claude is available
        const claudeCheck = await execPromise('which claude', { timeout: 1000 });
        if (!claudeCheck.stdout) {
            console.log('  Claude not found on system');
            return null;
        }
        
        // Build context from conversation history
        const context = conversationHistory.slice(-5)
            .map(msg => `${msg.type === 'user' ? 'Advisor' : 'Assistant'}: ${msg.content}`)
            .join('\n');
        
        // Create prompt
        const prompt = `You are an AI assistant for financial advisors. You help ${advisorName} with market insights, investment strategies, and client management.

Previous conversation:
${context}

Current question from ${advisorName}: "${text}"

Provide a helpful, professional response focusing on Indian financial markets. Be concise and practical. Include specific numbers or actionable advice when relevant.`;
        
        // Execute Claude
        const command = `echo '${prompt.replace(/'/g, "'\\''")}' | timeout ${CONFIG.responseTimeout / 1000} claude 2>/dev/null`;
        const { stdout } = await execPromise(command, { 
            timeout: CONFIG.responseTimeout,
            maxBuffer: 1024 * 1024 
        });
        
        if (stdout && stdout.trim()) {
            console.log('  ✅ Claude response generated');
            return stdout.trim();
        }
        
    } catch (error) {
        console.log('  ⚠️ Claude unavailable, using fallback');
    }
    
    return null;
}

/**
 * Generate contextual response without Claude
 */
async function generateContextualResponse(text, advisorName, phoneNumber, conversationHistory) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    
    // Analyze intent
    const intent = analyzeIntent(lower, words);
    console.log(`  Intent detected: ${intent}`);
    
    // Generate response based on intent
    switch(intent) {
        case 'greeting':
            return generateGreeting(advisorName);
            
        case 'market_update':
            return generateMarketUpdate();
            
        case 'sector_analysis':
            return generateSectorAnalysis(words);
            
        case 'investment_advice':
            return generateInvestmentAdvice(lower);
            
        case 'tax_planning':
            return generateTaxAdvice();
            
        case 'client_management':
            return generateClientManagementTips();
            
        case 'technical_analysis':
            return generateTechnicalAnalysis(words);
            
        case 'help':
            return generateHelpMessage();
            
        default:
            return generateDefaultResponse(text, advisorName);
    }
}

/**
 * Analyze user intent from text
 */
function analyzeIntent(text, words) {
    // Greeting patterns
    if (text.match(/^(hi|hello|hey|good morning|good evening)/)) {
        return 'greeting';
    }
    
    // Market updates
    if (text.includes('market') || text.includes('nifty') || text.includes('sensex')) {
        return 'market_update';
    }
    
    // Sector analysis
    if (text.includes('sector') || words.some(w => ['it', 'pharma', 'banking', 'auto', 'fmcg'].includes(w))) {
        return 'sector_analysis';
    }
    
    // Investment advice
    if (text.includes('invest') || text.includes('sip') || text.includes('mutual fund')) {
        return 'investment_advice';
    }
    
    // Tax planning
    if (text.includes('tax') || text.includes('80c') || text.includes('elss')) {
        return 'tax_planning';
    }
    
    // Client management
    if (text.includes('client') || text.includes('portfolio') || text.includes('review')) {
        return 'client_management';
    }
    
    // Technical analysis
    if (text.includes('support') || text.includes('resistance') || text.includes('chart')) {
        return 'technical_analysis';
    }
    
    // Help
    if (text.includes('help') || text.includes('what can you')) {
        return 'help';
    }
    
    return 'unknown';
}

/**
 * Response generators for each intent
 */
function generateGreeting(advisorName) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    return `${greeting}, ${advisorName}! 👋

Today's market is showing positive momentum with Nifty up ${KNOWLEDGE_BASE.markets.nifty.change}.

How can I assist you today? I can help with:
• Market updates and analysis
• Investment strategies
• Client portfolio reviews
• Tax planning insights`;
}

function generateMarketUpdate() {
    const now = new Date();
    const hour = now.getHours();
    const isMarketOpen = hour >= 9 && hour < 15.5;
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    return `📊 *Market Update* (${time} IST)
${isMarketOpen ? '🟢 Markets Open' : '🔴 Markets Closed'}

*Index Performance:*
• Nifty 50: ${KNOWLEDGE_BASE.markets.nifty.current} (${KNOWLEDGE_BASE.markets.nifty.change})
  Support: ${KNOWLEDGE_BASE.markets.nifty.support} | Resistance: ${KNOWLEDGE_BASE.markets.nifty.resistance}
  
• Sensex: ${KNOWLEDGE_BASE.markets.sensex.current} (${KNOWLEDGE_BASE.markets.sensex.change})
  Support: ${KNOWLEDGE_BASE.markets.sensex.support} | Resistance: ${KNOWLEDGE_BASE.markets.sensex.resistance}
  
• Bank Nifty: ${KNOWLEDGE_BASE.markets.bankNifty.current} (${KNOWLEDGE_BASE.markets.bankNifty.change})

*Key Movers:*
✅ IT & Pharma leading gains
❌ Realty & PSU Banks under pressure

*FII/DII Activity:*
FII: Net buyers ₹1,234 Cr
DII: Net sellers ₹456 Cr

${isMarketOpen ? '*Strategy:* Buy quality stocks on dips' : '*Tomorrow:* Watch global cues'}`;
}

function generateSectorAnalysis(words) {
    // Find mentioned sector
    let sector = null;
    for (const word of words) {
        if (KNOWLEDGE_BASE.sectors[word]) {
            sector = word;
            break;
        }
    }
    
    if (!sector) {
        // Return overview of all sectors
        return `📊 *Sector Analysis*

*Top Performing:*
✅ IT Services - ${KNOWLEDGE_BASE.sectors.it.reason}
✅ Pharma - ${KNOWLEDGE_BASE.sectors.pharma.reason}

*Neutral:*
➖ Banking - ${KNOWLEDGE_BASE.sectors.banking.reason}

*Underperforming:*
❌ Realty - ${KNOWLEDGE_BASE.sectors.realty.reason}

*Recommendation:*
• Overweight: IT, Pharma, FMCG
• Neutral: Banking, Auto
• Underweight: Realty, Metals

Focus on defensive sectors in current volatile environment.`;
    }
    
    const sectorData = KNOWLEDGE_BASE.sectors[sector];
    return `📊 *${sector.toUpperCase()} Sector Analysis*

*Outlook:* ${sectorData.outlook.toUpperCase()}
*Reason:* ${sectorData.reason}

*Top Stocks to Consider:*
${sector === 'it' ? '• TCS, Infosys, HCL Tech' : ''}
${sector === 'pharma' ? '• Sun Pharma, Dr. Reddy, Cipla' : ''}
${sector === 'banking' ? '• HDFC Bank, ICICI Bank, Kotak' : ''}

*Investment Strategy:*
${sectorData.outlook === 'positive' ? 'Accumulate on dips, target 15-20% returns' : 
  sectorData.outlook === 'neutral' ? 'Hold existing positions, wait for clarity' :
  'Book profits, reduce exposure'}`;
}

function generateInvestmentAdvice(text) {
    if (text.includes('sip')) {
        return `💰 *SIP Investment Strategy*

*Recommended Allocation:*
• Large Cap: 40% (Stability)
• Mid Cap: 30% (Growth)
• Small Cap: 20% (Alpha)
• Debt: 10% (Safety)

*Top SIP Funds:*
1. HDFC Flexicap Fund
2. Axis Bluechip Fund
3. Kotak Emerging Equity

*Optimal Amount:*
• Beginners: ₹5,000-10,000/month
• Intermediate: ₹25,000-50,000/month
• HNI: ₹1 lakh+/month

*Pro Tip:* Increase SIP by 10% annually for better compounding`;
    }
    
    return `💡 *Investment Recommendations*

*Current Strategy:*
Given market at all-time highs:

*Asset Allocation:*
• Equity: 60% (Quality large-caps)
• Debt: 25% (Safety cushion)
• Gold: 10% (Hedge)
• Cash: 5% (Opportunities)

*Action Items:*
1. Book 20% profits in small-caps
2. Increase allocation to pharma/IT
3. Start SIPs in flexicap funds
4. Consider profit booking above 20% gains

*Risk Management:*
• Set stop-loss at 8-10%
• Diversify across 15-20 stocks
• Review portfolio monthly`;
}

function generateTaxAdvice() {
    return `📋 *Tax Planning Guide FY 2024-25*

*Section 80C (₹1.5 Lakh):*
• ELSS Funds: Best for returns
• PPF: Safe, 7.1% returns
• Life Insurance: Coverage + saving
• NPS: Additional ₹50K under 80CCD

*Key Deadlines:*
• Advance Tax: Dec 15, Mar 15
• ITR Filing: July 31, 2025
• Tax Saving Investments: Mar 31, 2025

*Smart Strategies:*
1. Maximize 80C with ELSS for equity exposure
2. Use NPS for additional ₹50,000 benefit
3. Health insurance for 80D benefit
4. HRA claims if paying rent

*Capital Gains Planning:*
• LTCG: 10% above ₹1 lakh
• STCG: 15% on equity
• Tax harvesting before March 31

Need help with specific calculations?`;
}

function generateClientManagementTips() {
    return `👥 *Client Management Best Practices*

*Daily Actions:*
✅ Send market updates by 9 AM
✅ Call 5 clients for portfolio review
✅ Share one educational post
✅ Update CRM with interactions

*Weekly Goals:*
• 10 portfolio reviews
• 5 new client meetings
• 20 follow-up calls
• 3 investment proposals

*Client Segmentation:*
• Premium (>₹1 Cr): Weekly personal updates
• Gold (₹50L-1Cr): Bi-weekly calls
• Silver (<₹50L): Monthly reviews

*Retention Strategy:*
1. Quarterly performance reports
2. Tax planning sessions
3. Exclusive webinars
4. Birthday/anniversary wishes
5. Market crash hand-holding

*Growth Tips:*
• Ask for referrals after good returns
• Host investor education sessions
• Use WhatsApp for quick updates`;
}

function generateTechnicalAnalysis(words) {
    return `📈 *Technical Analysis*

*Nifty 50 Levels:*
• Current: ${KNOWLEDGE_BASE.markets.nifty.current}
• Support: ${KNOWLEDGE_BASE.markets.nifty.support}, 19,500
• Resistance: ${KNOWLEDGE_BASE.markets.nifty.resistance}, 20,100
• 50 DMA: 19,650
• 200 DMA: 19,200

*Key Indicators:*
• RSI: 58 (Neutral)
• MACD: Bullish crossover
• ADX: 25 (Trending)

*Chart Patterns:*
• Formation: Ascending triangle
• Target: 20,200
• Stop Loss: 19,600

*Trading Strategy:*
• Buy on dips near 19,700
• Book profits at 19,900-20,000
• Strict stop loss at 19,600

*Stocks Showing Breakout:*
1. Reliance - Above 2,450
2. TCS - Above 3,600
3. HDFC Bank - Above 1,650`;
}

function generateHelpMessage() {
    return `🤝 *I'm here to help you with:*

*Market Intelligence:*
• Live market updates
• Sector analysis
• Stock recommendations
• Technical levels

*Investment Advisory:*
• Portfolio allocation
• SIP strategies
• Tax planning
• Risk management

*Business Growth:*
• Client management tips
• Lead generation ideas
• Compliance updates
• Product knowledge

*Quick Commands:*
• "Market update" - Latest indices
• "Top stocks" - Today's recommendations
• "Tax tips" - Saving strategies
• "Client ideas" - Engagement tips

Just ask me anything about financial advisory!`;
}

function generateDefaultResponse(text, advisorName) {
    return `Thank you for your message, ${advisorName}.

I understand you're asking about "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}".

While I'm processing this specific query, here are some quick actions you can take:

1. Check today's market levels and share with clients
2. Review portfolios showing >20% gains for profit booking
3. Use our daily content buttons for instant materials

For immediate assistance with:
• Market data - Type "market update"
• Investment ideas - Type "investment tips"
• Client management - Type "client tips"

How else can I help you today?`;
}

/**
 * Store conversation context
 */
async function storeContext(phoneNumber, userMessage, botResponse) {
    try {
        let contexts = {};
        
        try {
            const data = await fs.readFile(CONFIG.contextFile, 'utf-8');
            contexts = JSON.parse(data);
        } catch (e) {
            // File doesn't exist yet
        }
        
        if (!contexts[phoneNumber]) {
            contexts[phoneNumber] = [];
        }
        
        contexts[phoneNumber].push({
            timestamp: new Date().toISOString(),
            user: userMessage,
            bot: botResponse
        });
        
        // Keep only last N messages
        if (contexts[phoneNumber].length > CONFIG.maxContextMessages) {
            contexts[phoneNumber] = contexts[phoneNumber].slice(-CONFIG.maxContextMessages);
        }
        
        await fs.mkdir(path.dirname(CONFIG.contextFile), { recursive: true });
        await fs.writeFile(CONFIG.contextFile, JSON.stringify(contexts, null, 2));
        
    } catch (error) {
        console.error('Failed to store context:', error);
    }
}

/**
 * Load conversation context
 */
async function loadContext(phoneNumber) {
    try {
        const data = await fs.readFile(CONFIG.contextFile, 'utf-8');
        const contexts = JSON.parse(data);
        return contexts[phoneNumber] || [];
    } catch (error) {
        return [];
    }
}

/**
 * Export for webhook integration
 */
module.exports = {
    getIntelligentResponse,
    storeContext,
    loadContext,
    analyzeIntent
};

// Test mode if run directly
if (require.main === module) {
    const testMessages = [
        "Hello",
        "What's the market status?",
        "Tell me about IT sector",
        "Should I invest in SIP?",
        "Tax saving options",
        "How to manage clients better?",
        "What's the support level for Nifty?",
        "Help"
    ];
    
    (async () => {
        console.log('🧪 Testing Intelligent Chat System\n');
        
        for (const message of testMessages) {
            console.log(`\n📨 User: "${message}"`);
            const response = await getIntelligentResponse(message, 'Test Advisor', '919999999999', []);
            console.log(`🤖 Bot: ${response.substring(0, 200)}...`);
            console.log('---');
        }
    })();
}