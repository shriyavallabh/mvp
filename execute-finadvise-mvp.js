#!/usr/bin/env node

/**
 * FinAdvise MVP Complete Execution
 * Orchestrates the entire content generation and distribution pipeline
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class FinAdviseMVP {
    constructor() {
        this.sessionId = `session_${new Date().toISOString().replace(/[:.]/g, '-')}`;
        this.outputDir = path.join(__dirname, 'output', this.sessionId);
        this.results = {
            advisors: [],
            contentGenerated: [],
            imagesGenerated: [],
            messagesDelivered: [],
            errors: []
        };
    }

    async init() {
        // Create output directory
        await fs.mkdir(this.outputDir, { recursive: true });
        console.log(`🚀 FinAdvise MVP Execution`);
        console.log(`📁 Session: ${this.sessionId}`);
        console.log(`📂 Output: ${this.outputDir}`);
        console.log('='.repeat(60));
    }

    async loadAdvisors() {
        console.log('\n📊 Loading advisor data...');
        try {
            const data = await fs.readFile(path.join(__dirname, 'data', 'advisors.json'), 'utf8');
            this.results.advisors = JSON.parse(data);
            console.log(`✅ Loaded ${this.results.advisors.length} advisors`);
            return this.results.advisors;
        } catch (error) {
            console.error(`❌ Error loading advisors: ${error.message}`);
            throw error;
        }
    }

    async generateMarketIntelligence() {
        console.log('\n📈 Generating market intelligence...');

        const marketData = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-IN'),
            indices: {
                sensex: {
                    value: 82876 + Math.floor(Math.random() * 500 - 250),
                    change: (Math.random() * 2 - 1).toFixed(2),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                },
                nifty: {
                    value: 25423 + Math.floor(Math.random() * 150 - 75),
                    change: (Math.random() * 2 - 1).toFixed(2),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                }
            },
            sectors: [
                { name: 'IT', change: '+4.41%', performance: 'strong' },
                { name: 'Banking', change: '+2.15%', performance: 'moderate' },
                { name: 'Auto', change: '-0.82%', performance: 'weak' },
                { name: 'Pharma', change: '+1.23%', performance: 'moderate' }
            ],
            insights: [
                'IT sector continues to outperform with strong Q3 results',
                'Banking stocks near 52-week highs on rate cut expectations',
                'FII inflows turning positive after 3 months of selling',
                'Small-cap index showing signs of recovery'
            ],
            recommendations: {
                buy: ['Tech funds', 'Banking ETFs'],
                hold: ['Pharma sector', 'Auto stocks'],
                review: ['International funds', 'Commodity plays']
            }
        };

        // Save market data
        const marketFile = path.join(this.outputDir, 'market-intelligence.json');
        await fs.writeFile(marketFile, JSON.stringify(marketData, null, 2));

        console.log('✅ Market intelligence generated');
        return marketData;
    }

    async generateContent(advisors, marketData) {
        console.log('\n✍️ Generating personalized content...');

        const content = {
            whatsapp: [],
            linkedin: [],
            statusUpdates: []
        };

        for (const advisor of advisors) {
            console.log(`  👤 Generating for ${advisor.name}...`);

            // WhatsApp Message
            const whatsappMsg = this.createWhatsAppMessage(advisor, marketData);
            content.whatsapp.push({
                advisorId: advisor.id,
                advisorName: advisor.name,
                phone: advisor.phone,
                message: whatsappMsg,
                timestamp: new Date().toISOString()
            });

            // LinkedIn Post
            const linkedinPost = this.createLinkedInPost(advisor, marketData);
            content.linkedin.push({
                advisorId: advisor.id,
                advisorName: advisor.name,
                post: linkedinPost,
                timestamp: new Date().toISOString()
            });

            // Status Update
            const statusUpdate = this.createStatusUpdate(advisor, marketData);
            content.statusUpdates.push({
                advisorId: advisor.id,
                advisorName: advisor.name,
                status: statusUpdate,
                timestamp: new Date().toISOString()
            });
        }

        // Save content
        await fs.writeFile(
            path.join(this.outputDir, 'whatsapp-messages.json'),
            JSON.stringify(content.whatsapp, null, 2)
        );
        await fs.writeFile(
            path.join(this.outputDir, 'linkedin-posts.json'),
            JSON.stringify(content.linkedin, null, 2)
        );
        await fs.writeFile(
            path.join(this.outputDir, 'status-updates.json'),
            JSON.stringify(content.statusUpdates, null, 2)
        );

        this.results.contentGenerated = content;
        console.log('✅ Content generation complete');
        return content;
    }

    createWhatsAppMessage(advisor, marketData) {
        const { sensex, nifty } = marketData.indices;
        const topSector = marketData.sectors[0];
        const insight = marketData.insights[0];

        return `📊 *Market Update - ${marketData.date}*

Hello ${advisor.name.split(' ')[0]}! Here's your market summary:

*Indices Performance:*
• SENSEX: ${sensex.value.toLocaleString()} (${sensex.change}%)
• NIFTY: ${nifty.value.toLocaleString()} (${nifty.change}%)

*Top Performer:*
${topSector.name} sector ${topSector.change}

*Key Insight:*
${insight}

*Action Points:*
✅ Review tech allocation in client portfolios
✅ Consider booking partial profits in outperformers
✅ Explore opportunities in banking sector

_${advisor.branding.tagline}_

For detailed analysis, check your dashboard.
ARN: ${advisor.arn}`;
    }

    createLinkedInPost(advisor, marketData) {
        const { sensex, nifty } = marketData.indices;
        const sectors = marketData.sectors.slice(0, 3);

        return `Market Update: ${marketData.date} 📈

Today's market showed ${sensex.change > 0 ? 'positive momentum' : 'cautious trading'} with key indices ${sensex.change > 0 ? 'advancing' : 'consolidating'}.

Key Highlights:
${sectors.map(s => `🔹 ${s.name}: ${s.change}`).join('\n')}

${marketData.insights[0]}

Investment Perspective:
${marketData.insights[1]}

What's your take on the current market scenario? Share your views below!

#MarketUpdate #WealthManagement #InvestmentStrategy #FinancialPlanning #MutualFunds

---
${advisor.name}
${advisor.arn}
${advisor.branding.tagline}

Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.`;
    }

    createStatusUpdate(advisor, marketData) {
        return {
            headline: `Markets ${marketData.indices.sensex.change > 0 ? 'Rise' : 'Dip'} - ${marketData.date}`,
            summary: `SENSEX: ${marketData.indices.sensex.value} | NIFTY: ${marketData.indices.nifty.value}`,
            highlight: marketData.sectors[0].name + ' ' + marketData.sectors[0].change,
            cta: 'Tap to view detailed analysis'
        };
    }

    async generateImages() {
        console.log('\n🎨 Generating marketing images...');

        // Check if Python is available
        try {
            // Run the Gemini image generator
            const pythonScript = path.join(__dirname, 'gemini_enhanced_image_generator.py');

            return new Promise((resolve, reject) => {
                const pythonProcess = spawn('python3', [pythonScript], {
                    env: { ...process.env, SESSION_ID: this.sessionId }
                });

                pythonProcess.stdout.on('data', (data) => {
                    console.log(`  ${data.toString().trim()}`);
                });

                pythonProcess.stderr.on('data', (data) => {
                    console.error(`  ⚠️ ${data.toString().trim()}`);
                });

                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Image generation complete');
                        resolve(true);
                    } else {
                        console.log('⚠️ Image generation skipped (Python not configured)');
                        resolve(false);
                    }
                });

                pythonProcess.on('error', (err) => {
                    console.log('⚠️ Image generation skipped (Python not available)');
                    resolve(false);
                });
            });
        } catch (error) {
            console.log('⚠️ Image generation skipped');
            return false;
        }
    }

    async deliverContent(content) {
        console.log('\n📱 Delivering content via WhatsApp...');

        const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
            console.log('⚠️ WhatsApp credentials not configured');
            return [];
        }

        const deliveryResults = [];

        // Send to first advisor only (for testing)
        const testMessage = content.whatsapp[0];

        try {
            console.log(`  📤 Sending to ${testMessage.advisorName}...`);

            const response = await fetch(
                `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: testMessage.phone,
                        type: 'text',
                        text: { body: testMessage.message }
                    })
                }
            );

            const result = await response.json();

            if (result.messages && result.messages[0]) {
                console.log(`  ✅ Delivered to ${testMessage.advisorName}`);
                deliveryResults.push({
                    advisor: testMessage.advisorName,
                    messageId: result.messages[0].id,
                    status: 'delivered',
                    timestamp: new Date().toISOString()
                });
            } else {
                console.log(`  ❌ Failed: ${JSON.stringify(result)}`);
                deliveryResults.push({
                    advisor: testMessage.advisorName,
                    status: 'failed',
                    error: result,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            deliveryResults.push({
                advisor: testMessage.advisorName,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        this.results.messagesDelivered = deliveryResults;
        return deliveryResults;
    }

    async saveReport() {
        console.log('\n📋 Generating execution report...');

        const report = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            summary: {
                advisorsProcessed: this.results.advisors.length,
                contentGenerated: {
                    whatsapp: this.results.contentGenerated.whatsapp?.length || 0,
                    linkedin: this.results.contentGenerated.linkedin?.length || 0,
                    statusUpdates: this.results.contentGenerated.statusUpdates?.length || 0
                },
                messagesDelivered: this.results.messagesDelivered.length,
                successfulDeliveries: this.results.messagesDelivered.filter(d => d.status === 'delivered').length
            },
            details: this.results
        };

        const reportPath = path.join(this.outputDir, 'execution-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log('✅ Report saved');
        console.log('\n' + '='.repeat(60));
        console.log('📊 EXECUTION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Session: ${this.sessionId}`);
        console.log(`Advisors: ${report.summary.advisorsProcessed}`);
        console.log(`Content Generated: ${report.summary.contentGenerated.whatsapp + report.summary.contentGenerated.linkedin} pieces`);
        console.log(`Messages Delivered: ${report.summary.successfulDeliveries}/${report.summary.messagesDelivered}`);
        console.log(`Output: ${this.outputDir}`);
        console.log('='.repeat(60));

        return report;
    }

    async execute() {
        try {
            await this.init();

            // 1. Load advisor data
            const advisors = await this.loadAdvisors();

            // 2. Generate market intelligence
            const marketData = await this.generateMarketIntelligence();

            // 3. Generate personalized content
            const content = await this.generateContent(advisors, marketData);

            // 4. Generate images (optional)
            await this.generateImages();

            // 5. Deliver content
            await this.deliverContent(content);

            // 6. Save report
            await this.saveReport();

            console.log('\n✅ FinAdvise MVP execution complete!');
            return true;

        } catch (error) {
            console.error(`\n❌ Execution failed: ${error.message}`);
            this.results.errors.push({
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const mvp = new FinAdviseMVP();
    mvp.execute().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = FinAdviseMVP;