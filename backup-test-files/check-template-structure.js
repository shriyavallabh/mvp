const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Check the exact structure and parameters of our approved templates
 */

const axios = require('axios');

const config = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function checkTemplateStructure() {
    console.log('🔍 Checking Template Structure\n');
    
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
        
        // Find our specific templates
        const mediaTemplate = templates.find(t => t.name === 'finadvise_daily_v1757531949615');
        const textTemplate = templates.find(t => t.name === 'finadvise_daily_notification_v1757563710819');
        
        if (mediaTemplate) {
            console.log('📸 MEDIA TEMPLATE: finadvise_daily_v1757531949615');
            console.log('='.repeat(50));
            console.log('Status:', mediaTemplate.status);
            console.log('Language:', mediaTemplate.language);
            console.log('\nComponents:');
            
            mediaTemplate.components.forEach(comp => {
                console.log(`\n  ${comp.type}:`);
                if (comp.format) console.log(`    Format: ${comp.format}`);
                if (comp.text) {
                    console.log(`    Text: "${comp.text}"`);
                    // Count parameters
                    const params = comp.text.match(/\{\{[\d]+\}\}/g) || [];
                    console.log(`    Parameters: ${params.length} (${params.join(', ')})`);
                }
                if (comp.example) {
                    console.log(`    Example:`, JSON.stringify(comp.example, null, 6));
                }
            });
        }
        
        console.log('\n');
        
        if (textTemplate) {
            console.log('📝 TEXT TEMPLATE: finadvise_daily_notification_v1757563710819');
            console.log('='.repeat(50));
            console.log('Status:', textTemplate.status);
            console.log('Language:', textTemplate.language);
            console.log('\nComponents:');
            
            textTemplate.components.forEach(comp => {
                console.log(`\n  ${comp.type}:`);
                if (comp.text) {
                    console.log(`    Text: "${comp.text}"`);
                    // Count parameters
                    const params = comp.text.match(/\{\{[\d]+\}\}/g) || [];
                    console.log(`    Parameters: ${params.length} (${params.join(', ')})`);
                }
                if (comp.example) {
                    console.log(`    Example:`, JSON.stringify(comp.example, null, 6));
                }
            });
        }
        
        // Also check hello_world template as backup
        const helloWorld = templates.find(t => t.name === 'hello_world');
        if (helloWorld) {
            console.log('\n\n📋 BACKUP TEMPLATE: hello_world');
            console.log('='.repeat(50));
            console.log('Status:', helloWorld.status);
            console.log('Language:', helloWorld.language);
            console.log('Components:', JSON.stringify(helloWorld.components, null, 2));
        }
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkTemplateStructure();