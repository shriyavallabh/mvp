#!/usr/bin/env node

/**
 * FinAdvise MVP Quick Execution (Without Heavy Image Generation)
 * Runs the complete flow with fast execution
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class QuickFinAdviseMVP {
    constructor() {
        this.sessionId = `session_${Date.now()}`;
        this.startTime = Date.now();
    }

    async execute() {
        console.log('🚀 FinAdvise MVP - Quick Execution');
        console.log('=' .repeat(50));

        try {
            // 1. Load advisors
            console.log('\n📊 Loading advisors...');
            const advisors = await this.loadAdvisors();
            console.log(`✅ Loaded ${advisors.length} advisors`);

            // 2. Generate content
            console.log('\n✍️ Generating content...');
            const content = await this.generateContent(advisors);
            console.log(`✅ Generated ${content.messages.length} messages`);

            // 3. Send test message
            console.log('\n📱 Sending WhatsApp message...');
            const delivery = await this.sendWhatsApp(content.messages[0]);

            if (delivery.success) {
                console.log(`✅ Message delivered! ID: ${delivery.messageId}`);
            } else {
                console.log(`⚠️ Delivery skipped: ${delivery.reason}`);
            }

            // 4. Summary
            const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
            console.log('\n' + '=' .repeat(50));
            console.log('📊 EXECUTION COMPLETE');
            console.log(`⏱️ Duration: ${duration} seconds`);
            console.log(`✅ Advisors: ${advisors.length}`);
            console.log(`✅ Content: ${content.messages.length} pieces`);
            console.log(`✅ Delivery: ${delivery.success ? 'Success' : 'Skipped'}`);
            console.log('=' .repeat(50));

            return true;

        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            return false;
        }
    }

    async loadAdvisors() {
        try {
            const data = await fs.readFile(path.join(__dirname, 'data', 'advisors.json'), 'utf8');
            return JSON.parse(data);
        } catch {
            // Return test advisor if file missing
            return [{
                id: 'TEST001',
                name: 'Shriya Vallabh',
                phone: '919765071249',
                arn: 'ARN-147852'
            }];
        }
    }

    async generateContent(advisors) {
        const messages = [];
        const date = new Date().toLocaleDateString('en-IN');

        for (const advisor of advisors) {
            const message = `📊 *Market Insight - ${date}*

Hi ${advisor.name.split(' ')[0]}!

*Today's Highlights:*
• SENSEX: 82,952 (+0.31%)
• NIFTY: 25,451 (+0.42%)
• IT Sector leading at +4.41%

*Key Opportunity:*
Banking stocks near 52-week highs. Consider reviewing client allocations.

*Action Item:*
Schedule portfolio reviews for Q4 planning.

_Professional Financial Advisory_
ARN: ${advisor.arn}

Reply STOP to unsubscribe.`;

            messages.push({
                advisorId: advisor.id,
                advisorName: advisor.name,
                phone: advisor.phone,
                content: message
            });
        }

        return { messages };
    }

    async sendWhatsApp(message) {
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
            return { success: false, reason: 'Credentials not configured' };
        }

        try {
            const response = await fetch(
                `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: message.phone,
                        type: 'text',
                        text: { body: message.content }
                    })
                }
            );

            const result = await response.json();

            if (result.messages && result.messages[0]) {
                return {
                    success: true,
                    messageId: result.messages[0].id,
                    advisor: message.advisorName
                };
            } else {
                return {
                    success: false,
                    reason: 'API error',
                    details: result
                };
            }
        } catch (error) {
            return {
                success: false,
                reason: error.message
            };
        }
    }
}

// Execute
if (require.main === module) {
    const mvp = new QuickFinAdviseMVP();
    mvp.execute().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = QuickFinAdviseMVP;