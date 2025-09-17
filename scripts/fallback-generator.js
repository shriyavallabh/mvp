#!/usr/bin/env node
/**
 * Fallback Generator Script
 * Referenced by: master.md
 * Creates fallback content when primary generation fails
 */

const fs = require('fs').promises;
const path = require('path');

async function generateFallbackContent() {
    console.log('🔄 Starting fallback content generation...');

    try {
        // Ensure output directories exist
        await fs.mkdir('output/whatsapp', { recursive: true });
        await fs.mkdir('output/linkedin', { recursive: true });
        await fs.mkdir('output/images', { recursive: true });

        // Create fallback advisor data if missing
        await createFallbackAdvisorData();

        // Generate fallback content
        await generateFallbackWhatsApp();
        await generateFallbackLinkedIn();
        await generateFallbackImages();

        console.log('✅ Fallback content generation completed');

    } catch (error) {
        console.error('❌ Fallback generation failed:', error.message);
        process.exit(1);
    }
}

async function createFallbackAdvisorData() {
    const fallbackData = {
        timestamp: new Date().toISOString(),
        advisors: [
            {
                id: 'fallback_advisor_001',
                name: 'Demo Financial Advisor',
                arn: 'ARN-12345',
                email: 'advisor@finadvise.com',
                phone: '+91-9876543210',
                branding: {
                    primaryColor: '#1A73E8',
                    logo: null,
                    tagline: 'Your Financial Future, Our Priority'
                }
            }
        ]
    };

    // Only create if doesn't exist
    try {
        await fs.access('data/advisor-data.json');
    } catch {
        await fs.mkdir('data', { recursive: true });
        await fs.writeFile('data/advisor-data.json', JSON.stringify(fallbackData, null, 2));
        console.log('📄 Created fallback advisor data');
    }
}

async function generateFallbackWhatsApp() {
    console.log('📱 Generating fallback WhatsApp messages...');

    const fallbackMessages = [
        {
            id: 'fallback_whatsapp_001',
            content: `🌟 Market Update

📈 Markets are showing steady progress this week.

💡 Remember: Systematic investing beats timing the market.

📞 Let's review your portfolio strategy.

ARN: ARN-12345

⚠️ Mutual funds are subject to market risks. Read all scheme related documents carefully.`
        }
    ];

    for (const message of fallbackMessages) {
        await fs.writeFile(
            `output/whatsapp/${message.id}.txt`,
            message.content
        );
    }

    console.log('✅ Fallback WhatsApp messages created');
}

async function generateFallbackLinkedIn() {
    console.log('💼 Generating fallback LinkedIn posts...');

    const fallbackPosts = [
        {
            id: 'fallback_linkedin_001',
            content: `🎯 Weekly Market Insights

As we navigate through current market conditions, here are key observations:

📊 Market Highlights:
• Equity markets maintaining stability
• Fixed income opportunities emerging
• Sectoral rotation continues

💡 Investment Wisdom:
"Diversification is the only free lunch in investing" - Harry Markowitz

🎯 Strategy Focus:
✓ Asset allocation based on risk profile
✓ Regular portfolio rebalancing
✓ Long-term wealth creation approach

📈 Ready to optimize your investment strategy? Let's connect.

#InvestmentStrategy #WealthManagement #FinancialPlanning

---
Demo Financial Advisor
ARN: ARN-12345

Disclaimer: Mutual fund investments are subject to market risks. Please read all scheme related documents carefully.`
        }
    ];

    for (const post of fallbackPosts) {
        await fs.writeFile(
            `output/linkedin/${post.id}.txt`,
            post.content
        );
    }

    console.log('✅ Fallback LinkedIn posts created');
}

async function generateFallbackImages() {
    console.log('🎨 Generating fallback images...');

    const fallbackStatusImage = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            width: 1080px;
            height: 1920px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 40px;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <h1>📈 FINADVISE</h1>
    <h2>Your Financial Partner</h2>
    <p>Building wealth through smart investments</p>
    <div>ARN: ARN-12345</div>
</body>
</html>`;

    await fs.writeFile('output/images/fallback_status_1080x1920.html', fallbackStatusImage);

    const fallbackMarketingImage = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            width: 1200px;
            height: 628px;
            background: linear-gradient(45deg, #2193b0 0%, #6dd5ed 100%);
            font-family: Arial, sans-serif;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
    </style>
</head>
<body>
    <div>
        <h1>🎯 WEALTH CREATION</h1>
        <h2>Strategic Investment Solutions</h2>
        <p>Demo Financial Advisor | ARN: ARN-12345</p>
    </div>
</body>
</html>`;

    await fs.writeFile('output/images/fallback_marketing_1200x628.html', fallbackMarketingImage);

    console.log('✅ Fallback images created');
}

// Execute if called directly
if (require.main === module) {
    generateFallbackContent();
}

module.exports = { generateFallbackContent };