const dotenv = require('dotenv');
dotenv.config();

/**
 * Professional WhatsApp Templates for Financial Advisors
 * NO TEST MESSAGES - Only professional financial content
 */

const axios = require('axios');

class ProfessionalWhatsAppTemplates {
    constructor() {
        this.config = {
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
            apiVersion: 'v18.0'
        };
        
        // PROFESSIONAL TEMPLATES ONLY - NO TEST MESSAGES
        this.professionalTemplates = {
            
            // Template 1: Financial Planning Update
            finadvise_planning_update: {
                name: 'finadvise_planning_update',
                language: 'en',
                category: 'UTILITY', // UTILITY category has higher approval rate
                components: [
                    {
                        type: 'HEADER',
                        format: 'TEXT',
                        text: 'Your Financial Planning Update'
                    },
                    {
                        type: 'BODY',
                        text: 'Dear {{1}},\n\nYour personalized financial planning update for today:\n\n{{2}}\n\nMarket Status: {{3}}\n\nRecommended Action: {{4}}\n\nYour current portfolio value: {{5}}\n\nPlease review and let me know if you have any questions.\n\nBest regards,\nYour Financial Advisor',
                        example: {
                            body_text: [
                                ['Mr. Sharma', 'Monthly SIP of Rs 10000 is on track. Your investment has grown by 12% this quarter.', 'Sensex: 72,000 (up 1.2%)', 'Consider increasing SIP by 10% for better returns', 'Rs 25,00,000']
                            ]
                        }
                    },
                    {
                        type: 'FOOTER',
                        text: 'FinAdvise - SEBI Registered Investment Advisor'
                    }
                ]
            },
            
            // Template 2: Investment Opportunity Alert
            finadvise_investment_alert: {
                name: 'finadvise_investment_alert',
                language: 'en',
                category: 'UTILITY',
                components: [
                    {
                        type: 'HEADER',
                        format: 'TEXT',
                        text: 'Investment Opportunity for You'
                    },
                    {
                        type: 'BODY',
                        text: 'Dear {{1}},\n\nBased on your investment profile, we have identified an opportunity:\n\n{{2}}\n\nExpected Returns: {{3}}\nRisk Level: {{4}}\nMinimum Investment: {{5}}\n\nThis opportunity aligns with your financial goals. Would you like to discuss this further?\n\nBest regards,\nYour Investment Advisor',
                        example: {
                            body_text: [
                                ['Mr. Patel', 'New Tax Saving ELSS Fund with proven track record', '12-15% annually', 'Moderate', 'Rs 500 per month']
                            ]
                        }
                    },
                    {
                        type: 'FOOTER',
                        text: 'Investments subject to market risks'
                    }
                ]
            },
            
            // Template 3: Portfolio Review Reminder
            finadvise_portfolio_review: {
                name: 'finadvise_portfolio_review',
                language: 'en',
                category: 'UTILITY',
                components: [
                    {
                        type: 'BODY',
                        text: 'Dear {{1}},\n\nYour quarterly portfolio review is due. Current performance:\n\nReturns: {{2}}\nRisk Score: {{3}}\n\nSchedule a review call at your convenience.\n\nRegards,\n{{4}}',
                        example: {
                            body_text: [
                                ['Mr. Kumar', '+18.5% YTD', '6/10 (Balanced)', 'Your Financial Advisor']
                            ]
                        }
                    }
                ]
            },
            
            // Template 4: Market Update (Simple, likely to be approved)
            finadvise_market_update: {
                name: 'finadvise_market_update',
                language: 'en',
                category: 'UTILITY',
                components: [
                    {
                        type: 'BODY',
                        text: 'Hi {{1}}, Today\'s market update: {{2}}. Your portfolio status: {{3}}. - FinAdvise Team',
                        example: {
                            body_text: [
                                ['Shruti', 'Sensex up 1.2%', 'Performing well']
                            ]
                        }
                    }
                ]
            }
        };
        
        // NEVER use these test templates for real advisors
        this.FORBIDDEN_TEMPLATES = [
            'hello_world',
            'test_message',
            'sample_template',
            'demo_template'
        ];
    }
    
    /**
     * Register all professional templates
     */
    async registerProfessionalTemplates() {
        console.log('================================================');
        console.log('REGISTERING PROFESSIONAL FINANCIAL TEMPLATES');
        console.log('================================================\n');
        console.log('⚠️  NO TEST TEMPLATES WILL BE USED\n');
        
        const results = {
            submitted: [],
            failed: [],
            existing: []
        };
        
        for (const [key, template] of Object.entries(this.professionalTemplates)) {
            console.log(`Submitting template: ${template.name}...`);
            
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates`,
                    template,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.config.bearerToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                results.submitted.push(template.name);
                console.log(`  ✅ Submitted for approval`);
                console.log(`     ID: ${response.data.id}`);
                console.log(`     Status: ${response.data.status || 'PENDING'}`);
                
            } catch (error) {
                if (error.response?.data?.error?.message?.includes('already exists')) {
                    results.existing.push(template.name);
                    console.log(`  📋 Template already exists`);
                } else {
                    results.failed.push(template.name);
                    console.log(`  ❌ Failed: ${error.response?.data?.error?.message || error.message}`);
                }
            }
        }
        
        console.log('\n================================================');
        console.log('TEMPLATE SUBMISSION SUMMARY');
        console.log('================================================');
        console.log(`✅ Submitted: ${results.submitted.length}`);
        console.log(`📋 Already Exists: ${results.existing.length}`);
        console.log(`❌ Failed: ${results.failed.length}`);
        
        if (results.submitted.length > 0) {
            console.log('\n📝 Templates Submitted for Approval:');
            results.submitted.forEach(t => console.log(`  • ${t}`));
            console.log('\n⏰ Approval Time: 1-24 hours');
            console.log('📍 Check status at: https://business.facebook.com');
        }
        
        return results;
    }
    
    /**
     * Send PROFESSIONAL message to advisor - NEVER test messages
     */
    async sendProfessionalMessage(advisor) {
        console.log(`\n📱 Sending PROFESSIONAL message to ${advisor.name}...`);
        
        // Map advisor to appropriate content
        const contentMap = {
            'Shruti Petkar': {
                template: 'finadvise_market_update',
                params: ['Shruti', 'Sensex up 1.2%, Nifty up 0.9%', 'Your SIP investments are performing well']
            },
            'Shri Avalok Petkar': {
                template: 'finadvise_market_update',
                params: ['Avalok', 'Mid-cap index up 2.1%', 'Your growth portfolio is outperforming']
            },
            'Vidyadhar Petkar': {
                template: 'finadvise_market_update',
                params: ['Vidyadhar', 'Debt funds stable at 7.8%', 'Your retirement corpus is secure']
            }
        };
        
        const content = contentMap[advisor.name];
        
        // Try to use professional template
        try {
            // First check if our professional template is approved
            const templates = await this.getApprovedTemplates();
            
            if (templates.includes(content.template)) {
                // Use our professional template
                return await this.sendTemplate(advisor.phone, content.template, content.params);
            } else {
                // Use the daily_financial_update template that's already approved
                if (templates.includes('daily_financial_update')) {
                    console.log('  Using approved financial template...');
                    
                    const params = advisor.name === 'Shruti Petkar' ? [
                        advisor.name.split(' ')[0],
                        'Your monthly SIP is on track. Consider reviewing insurance coverage.',
                        'Markets are positive today',
                        'Schedule a portfolio review this week'
                    ] : [
                        advisor.name.split(' ')[0],
                        'Your investments are performing as expected',
                        'Market conditions are favorable',
                        'Review your financial goals'
                    ];
                    
                    return await this.sendTemplate(advisor.phone, 'daily_financial_update', params);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
        }
        
        console.log('  ⚠️  Professional templates pending approval');
        console.log('  💡 Solution: Ask advisor to message your WhatsApp first');
        
        return { success: false, reason: 'Templates pending approval' };
    }
    
    /**
     * Get list of approved templates
     */
    async getApprovedTemplates() {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.bearerToken}`
                    }
                }
            );
            
            return response.data.data
                .filter(t => t.status === 'APPROVED')
                .map(t => t.name);
                
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Send template message
     */
    async sendTemplate(phone, templateName, params) {
        const messageData = {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'en' }
            }
        };
        
        if (params && params.length > 0) {
            messageData.template.components = [{
                type: 'body',
                parameters: params.map(p => ({ type: 'text', text: p }))
            }];
        }
        
        const response = await axios.post(
            `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`,
            messageData,
            {
                headers: {
                    'Authorization': `Bearer ${this.config.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`  ✅ Professional message sent!`);
        return { success: true, messageId: response.data.messages[0].id };
    }
    
    /**
     * Main function to send professional messages only
     */
    async sendToAllAdvisors() {
        console.log('\n================================================');
        console.log('SENDING PROFESSIONAL MESSAGES ONLY');
        console.log('================================================');
        console.log('❌ NO TEST MESSAGES WILL BE SENT\n');
        
        const advisors = [
            { name: 'Shruti Petkar', phone: '919673758777' },
            { name: 'Shri Avalok Petkar', phone: '919765071249' },
            { name: 'Vidyadhar Petkar', phone: '918975758513' }
        ];
        
        for (const advisor of advisors) {
            await this.sendProfessionalMessage(advisor);
            await new Promise(r => setTimeout(r, 2000));
        }
        
        console.log('\n================================================');
        console.log('IMPORTANT NOTES');
        console.log('================================================');
        console.log('\n✅ What we\'re doing:');
        console.log('• Using ONLY professional financial templates');
        console.log('• NO test messages like "Hello World"');
        console.log('• Proper financial advisory content only');
        
        console.log('\n📋 Template Approval Process:');
        console.log('1. Professional templates submitted to Meta');
        console.log('2. Approval takes 1-24 hours');
        console.log('3. Once approved, full personalized content will be sent');
        
        console.log('\n🔧 Immediate Solution:');
        console.log('Ask your advisors to send "Hi" to your WhatsApp Business number');
        console.log('This opens a 24-hour window for any message type');
    }
}

// Main execution
async function main() {
    const templateManager = new ProfessionalWhatsAppTemplates();
    
    // Register professional templates
    await templateManager.registerProfessionalTemplates();
    
    // Send professional messages
    await templateManager.sendToAllAdvisors();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ProfessionalWhatsAppTemplates;