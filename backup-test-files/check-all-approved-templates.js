const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Check ALL approved WhatsApp templates and their structure
 * This will show us which templates have image capabilities
 */

const axios = require('axios');

const config = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function getAllTemplates() {
    console.log('🔍 Fetching ALL WhatsApp Templates');
    console.log('=' .repeat(60));
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const templates = response.data.data || [];
        console.log(`Found ${templates.length} templates total\n`);
        
        // Categorize templates
        const approved = templates.filter(t => t.status === 'APPROVED');
        const pending = templates.filter(t => t.status === 'PENDING');
        const rejected = templates.filter(t => t.status === 'REJECTED');
        
        console.log(`📊 Status Summary:`);
        console.log(`   ✅ Approved: ${approved.length}`);
        console.log(`   ⏳ Pending: ${pending.length}`);
        console.log(`   ❌ Rejected: ${rejected.length}`);
        console.log('');
        
        // Analyze approved templates for image capabilities
        console.log('✅ APPROVED TEMPLATES:');
        console.log('=' .repeat(60));
        
        let hasImageHeader = 0;
        let textOnly = 0;
        
        approved.forEach((template, index) => {
            console.log(`\n${index + 1}. ${template.name}`);
            console.log(`   Language: ${template.language}`);
            console.log(`   Category: ${template.category}`);
            console.log(`   ID: ${template.id}`);
            
            // Check components for image headers
            let hasImage = false;
            let components = [];
            
            if (template.components) {
                template.components.forEach(comp => {
                    if (comp.type === 'HEADER') {
                        if (comp.format === 'IMAGE') {
                            hasImage = true;
                            components.push('IMAGE HEADER');
                        } else if (comp.format === 'TEXT') {
                            components.push('TEXT HEADER');
                        }
                    } else if (comp.type === 'BODY') {
                        components.push('BODY');
                        if (comp.text) {
                            console.log(`   Body preview: "${comp.text.substring(0, 100)}..."`);
                        }
                    } else if (comp.type === 'FOOTER') {
                        components.push('FOOTER');
                    } else if (comp.type === 'BUTTONS') {
                        components.push(`BUTTONS (${comp.buttons?.length || 0})`);
                    }
                });
            }
            
            console.log(`   Components: ${components.join(', ')}`);
            console.log(`   Has Image: ${hasImage ? '✅ YES' : '❌ NO'}`);
            
            if (hasImage) {
                hasImageHeader++;
                console.log(`   🖼️ This template CAN send images!`);
            } else {
                textOnly++;
            }
        });
        
        console.log('\n' + '=' .repeat(60));
        console.log('📈 TEMPLATE ANALYSIS:');
        console.log('=' .repeat(60));
        console.log(`Templates with IMAGE headers: ${hasImageHeader}`);
        console.log(`Text-only templates: ${textOnly}`);
        
        if (hasImageHeader === 0) {
            console.log('\n⚠️ PROBLEM IDENTIFIED:');
            console.log('No approved templates have IMAGE headers!');
            console.log('This is why images are not being sent.');
            console.log('\n💡 SOLUTION:');
            console.log('We need to create NEW templates with IMAGE headers.');
            console.log('These require sample images during template creation.');
        }
        
        // Show pending templates that might have images
        if (pending.length > 0) {
            console.log('\n⏳ PENDING TEMPLATES:');
            console.log('=' .repeat(60));
            pending.forEach(template => {
                const hasImage = template.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE');
                console.log(`   ${template.name}: ${hasImage ? '🖼️ Has Image' : '📝 Text Only'}`);
            });
        }
        
        return {
            approved,
            pending,
            rejected,
            hasImageTemplates: hasImageHeader > 0
        };
        
    } catch (error) {
        console.error('❌ Error fetching templates:', error.response?.data || error.message);
        return null;
    }
}

// Run the check
getAllTemplates().then(result => {
    if (result && !result.hasImageTemplates) {
        console.log('\n' + '=' .repeat(60));
        console.log('🚨 ACTION REQUIRED:');
        console.log('=' .repeat(60));
        console.log('1. Create new templates with IMAGE headers');
        console.log('2. Use Gemini API to generate sample images');
        console.log('3. Submit templates for approval');
        console.log('4. Wait for approval (usually 1-2 minutes)');
        console.log('5. Then send messages with integrated images');
    }
});