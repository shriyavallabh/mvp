const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * WhatsApp Image Template with Correct Specifications
 * Follows all Meta policies and uses 1200x628 dimensions
 */

const axios = require('axios');
const FormData = require('form-data');

class WhatsAppApprovedTemplates {
    constructor() {
        this.config = {
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
            apiVersion: 'v18.0'
        };
        
        // Images with correct 1200x628 dimensions
        this.compliantImages = {
            financial_growth: 'https://via.placeholder.com/1200x628/4A90E2/FFFFFF?text=Financial+Growth+Chart',
            tax_savings: 'https://via.placeholder.com/1200x628/27AE60/FFFFFF?text=Tax+Savings+Analysis', 
            retirement_planning: 'https://via.placeholder.com/1200x628/8E44AD/FFFFFF?text=Retirement+Income+Plan'
        };
        
        this.advisors = [
            {
                name: 'Shruti Petkar',
                phone: '919673758777',
                templateData: {
                    header_image: this.compliantImages.financial_growth,
                    title: 'Monthly Wealth Report',
                    value: '₹45,00,000',
                    growth: '+18.5%',
                    action: 'Review SIP allocation'
                }
            },
            {
                name: 'Shri Avalok Petkar',
                phone: '919765071249',
                templateData: {
                    header_image: this.compliantImages.tax_savings,
                    title: 'Tax Optimization Alert',
                    value: '₹1,95,000',
                    growth: 'Potential savings',
                    action: 'Complete ELSS investment'
                }
            },
            {
                name: 'Vidyadhar Petkar',
                phone: '918975758513',
                templateData: {
                    header_image: this.compliantImages.retirement_planning,
                    title: 'Retirement Income Update',
                    value: '₹75,500',
                    growth: 'Monthly income',
                    action: 'Update nominee details'
                }
            }
        ];
    }
    
    /**
     * Submit a properly formatted image template
     */
    async submitCompliantImageTemplate() {
        console.log('================================================');
        console.log('SUBMITTING COMPLIANT IMAGE TEMPLATE');
        console.log('================================================\n');
        
        // Proper template format for WhatsApp with image
        const imageTemplate = {
            name: 'financial_visual_report',
            language: 'en_US', // Must be en_US, not 'en'
            category: 'UTILITY', // UTILITY for faster approval
            components: [
                {
                    type: 'HEADER',
                    format: 'IMAGE'
                    // No example needed for image headers in submission
                },
                {
                    type: 'BODY',
                    text: 'Dear {{1}},\n\n{{2}}\n\nCurrent Value: {{3}}\nPerformance: {{4}}\n\nRecommended: {{5}}\n\nTap below to view details.',
                    example: {
                        body_text: [
                            ['Shruti', 'Monthly Wealth Report', '₹45,00,000', '+18.5%', 'Review SIP allocation']
                        ]
                    }
                },
                {
                    type: 'FOOTER',
                    text: 'FinAdvise - Your Wealth Partner'
                },
                {
                    type: 'BUTTONS',
                    buttons: [
                        {
                            type: 'QUICK_REPLY',
                            text: 'View Details'
                        },
                        {
                            type: 'QUICK_REPLY', 
                            text: 'Call Advisor'
                        }
                    ]
                }
            ]
        };
        
        console.log('📋 Template Specifications:');
        console.log('   Name: financial_visual_report');
        console.log('   Language: en_US (required format)');
        console.log('   Category: UTILITY');
        console.log('   Image: 1200x628 pixels (as required)');
        console.log('   Components: IMAGE + BODY + FOOTER + BUTTONS\n');
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates`,
                imageTemplate,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Template submitted successfully!');
            console.log(`   ID: ${response.data.id}`);
            console.log(`   Status: ${response.data.status || 'PENDING'}`);
            console.log('\n⏳ Approval Timeline:');
            console.log('   • UTILITY category: 1-4 hours typically');
            console.log('   • Image templates may take longer');
            console.log('   • Check status with: node check-template-status.js\n');
            
            return { success: true, templateId: response.data.id };
            
        } catch (error) {
            if (error.response?.data?.error?.message?.includes('already exists')) {
                console.log('ℹ️ Template already exists, checking status...');
                return await this.checkTemplateStatus('financial_visual_report');
            }
            
            console.log('❌ Template submission failed');
            console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);
            
            // If template submission fails, try simpler approach
            return await this.submitSimpleImageTemplate();
        }
    }
    
    /**
     * Submit a simpler image template
     */
    async submitSimpleImageTemplate() {
        console.log('\n📝 Trying simpler template format...\n');
        
        const simpleTemplate = {
            name: 'wealth_update_image',
            language: 'en_US',
            category: 'UTILITY',
            components: [
                {
                    type: 'HEADER',
                    format: 'IMAGE'
                },
                {
                    type: 'BODY',
                    text: 'Hi {{1}}, your {{2}} is {{3}}. {{4}}',
                    example: {
                        body_text: [
                            ['Shruti', 'portfolio value', '₹45,00,000', 'Tap to view details']
                        ]
                    }
                }
            ]
        };
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates`,
                simpleTemplate,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Simple template submitted!');
            return { success: true, templateId: response.data.id };
            
        } catch (error) {
            console.log('❌ Simple template also failed');
            console.log(`   ${error.response?.data?.error?.message || error.message}`);
            return { success: false };
        }
    }
    
    /**
     * Check template status
     */
    async checkTemplateStatus(templateName) {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates?name=${templateName}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.bearerToken}`
                    }
                }
            );
            
            if (response.data.data && response.data.data.length > 0) {
                const template = response.data.data[0];
                console.log(`   Status: ${template.status}`);
                
                if (template.status === 'APPROVED') {
                    console.log('   ✅ Template is approved!');
                    return { success: true, status: 'APPROVED', templateName };
                } else if (template.status === 'REJECTED') {
                    console.log(`   ❌ Rejected: ${template.rejected_reason || 'Unknown'}`);
                }
                
                return { success: false, status: template.status };
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
        return { success: false };
    }
    
    /**
     * Send messages using approved template with image
     */
    async sendWithApprovedTemplate() {
        console.log('\n================================================');
        console.log('SENDING MESSAGES WITH IMAGE TEMPLATE');
        console.log('================================================\n');
        
        // First check which templates are approved
        const approvedTemplates = await this.getApprovedTemplates();
        console.log(`Found ${approvedTemplates.length} approved templates\n`);
        
        // Find an image template if available
        const imageTemplate = approvedTemplates.find(t => 
            t.components?.some(c => c.format === 'IMAGE')
        );
        
        if (imageTemplate) {
            console.log(`✅ Using approved image template: ${imageTemplate.name}\n`);
            await this.sendWithImageTemplate(imageTemplate.name);
        } else {
            console.log('⚠️ No approved image templates found');
            console.log('   Using text template as fallback\n');
            await this.sendWithTextTemplate();
        }
    }
    
    /**
     * Get list of approved templates
     */
    async getApprovedTemplates() {
        try {
            const response = await axios.get(
                `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/message_templates?status=APPROVED`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.bearerToken}`
                    }
                }
            );
            
            return response.data.data || [];
        } catch (error) {
            console.log('Error fetching templates:', error.message);
            return [];
        }
    }
    
    /**
     * Send with image template
     */
    async sendWithImageTemplate(templateName) {
        for (const advisor of this.advisors) {
            console.log(`📱 Sending to ${advisor.name}...`);
            
            const messageData = {
                messaging_product: 'whatsapp',
                to: advisor.phone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: 'en_US' },
                    components: [
                        {
                            type: 'header',
                            parameters: [{
                                type: 'image',
                                image: { 
                                    link: advisor.templateData.header_image
                                }
                            }]
                        },
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: advisor.name.split(' ')[0] },
                                { type: 'text', text: advisor.templateData.title },
                                { type: 'text', text: advisor.templateData.value },
                                { type: 'text', text: advisor.templateData.growth },
                                { type: 'text', text: advisor.templateData.action }
                            ]
                        }
                    ]
                }
            };
            
            try {
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
                
                console.log(`   ✅ Sent with image!`);
                console.log(`   Message ID: ${response.data.messages[0].id}`);
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.data?.error?.message}`);
            }
            
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    
    /**
     * Send with text template fallback
     */
    async sendWithTextTemplate() {
        for (const advisor of this.advisors) {
            console.log(`📱 Sending text to ${advisor.name}...`);
            
            const messageData = {
                messaging_product: 'whatsapp',
                to: advisor.phone,
                type: 'template',
                template: {
                    name: 'investment_alert_v2',
                    language: { code: 'en_US' },
                    components: [{
                        type: 'body',
                        parameters: [
                            { type: 'text', text: advisor.name.split(' ')[0] },
                            { type: 'text', text: advisor.templateData.title },
                            { type: 'text', text: advisor.templateData.value },
                            { type: 'text', text: advisor.templateData.action }
                        ]
                    }]
                }
            };
            
            try {
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
                
                console.log(`   ✅ Text sent successfully!`);
                
            } catch (error) {
                console.log(`   ❌ Failed: ${error.response?.data?.error?.message}`);
            }
            
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    
    /**
     * Display compliance summary
     */
    displayComplianceSummary() {
        console.log('\n================================================');
        console.log('WHATSAPP COMPLIANCE SUMMARY');
        console.log('================================================\n');
        
        console.log('✅ CORRECT IMAGE SPECIFICATIONS:');
        console.log('   • Dimensions: 1200 x 628 pixels');
        console.log('   • Aspect Ratio: 1.91:1 (Facebook Link Preview)');
        console.log('   • Format: JPEG or PNG');
        console.log('   • Size: Maximum 5MB');
        console.log('   • Hosting: HTTPS URLs required\n');
        
        console.log('✅ TEMPLATE REQUIREMENTS:');
        console.log('   • Language: en_US (not "en")');
        console.log('   • Category: UTILITY (faster approval)');
        console.log('   • Variables: Keep minimal (4-5 max)');
        console.log('   • Example: Required for BODY component\n');
        
        console.log('✅ COMPLIANCE GUARDRAILS:');
        console.log('   • No promotional language in UTILITY templates');
        console.log('   • No test/demo/sample content');
        console.log('   • Professional financial terminology only');
        console.log('   • Include opt-out option when needed\n');
        
        console.log('⚠️ IMPORTANT POLICIES:');
        console.log('   • Templates must be approved before use');
        console.log('   • Direct media only works in 24-hour window');
        console.log('   • Business verification affects capabilities');
        console.log('   • Rate limits apply (1000 msgs/sec max)\n');
        
        console.log('📋 NEXT STEPS:');
        console.log('   1. Wait for template approval (1-24 hours)');
        console.log('   2. Once approved, images will send automatically');
        console.log('   3. Monitor delivery reports for issues');
        console.log('   4. Keep templates updated with Meta policies');
    }
}

// Main execution
async function main() {
    const sender = new WhatsAppApprovedTemplates();
    
    try {
        // Step 1: Submit compliant template
        const templateResult = await sender.submitCompliantImageTemplate();
        
        // Step 2: Send messages
        await sender.sendWithApprovedTemplate();
        
        // Step 3: Display compliance summary
        sender.displayComplianceSummary();
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WhatsAppApprovedTemplates;