const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Check approval status of our media template
 */

const axios = require('axios');
const fs = require('fs');

const config = {
    wabaId: '1861646317956355',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v23.0'
};

// Load template info from previous run
const templateInfo = JSON.parse(fs.readFileSync('media-template-info.json', 'utf8'));

async function checkTemplateStatus() {
    console.log('🔍 Checking template approval status...\n');
    console.log(`Template Name: ${templateInfo.templateName}`);
    console.log(`Template ID: ${templateInfo.templateId}`);
    console.log(`Created At: ${templateInfo.createdAt}\n`);
    
    try {
        // Get all templates
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?fields=id,name,status,components,category,language&limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        // Find our template
        const ourTemplate = response.data.data.find(t => 
            t.name === templateInfo.templateName || 
            t.id === templateInfo.templateId
        );
        
        if (ourTemplate) {
            console.log('✅ Template found!');
            console.log(`   Status: ${ourTemplate.status}`);
            console.log(`   Category: ${ourTemplate.category}`);
            console.log(`   Language: ${ourTemplate.language}`);
            
            // Check if it has IMAGE header
            const hasImageHeader = ourTemplate.components?.some(c => 
                c.type === 'HEADER' && c.format === 'IMAGE'
            );
            console.log(`   Has IMAGE header: ${hasImageHeader ? '✅ YES!' : '❌ NO'}`);
            
            if (ourTemplate.status === 'APPROVED') {
                console.log('\n🎉 TEMPLATE IS APPROVED! You can now send messages with images!');
                console.log('\nRun: node send-approved-media-template.js');
                
                // Save approved status
                templateInfo.status = 'APPROVED';
                templateInfo.approvedAt = new Date().toISOString();
                fs.writeFileSync('media-template-info.json', JSON.stringify(templateInfo, null, 2));
                
            } else if (ourTemplate.status === 'REJECTED') {
                console.log('\n❌ Template was REJECTED');
                if (ourTemplate.rejected_reason) {
                    console.log(`   Reason: ${ourTemplate.rejected_reason}`);
                }
                console.log('\nYou may need to modify the template and resubmit.');
                
            } else {
                console.log('\n⏳ Template is still PENDING approval');
                console.log('   Check again in a few minutes/hours');
                
                // Calculate time elapsed
                const created = new Date(templateInfo.createdAt);
                const now = new Date();
                const hoursElapsed = ((now - created) / (1000 * 60 * 60)).toFixed(1);
                console.log(`   Time elapsed: ${hoursElapsed} hours`);
            }
            
            // Show template structure
            console.log('\n📋 Template Components:');
            ourTemplate.components?.forEach(comp => {
                if (comp.type === 'HEADER') {
                    console.log(`   - HEADER: ${comp.format}`);
                } else if (comp.type === 'BODY') {
                    console.log(`   - BODY: ${comp.text?.substring(0, 50)}...`);
                } else if (comp.type === 'FOOTER') {
                    console.log(`   - FOOTER: ${comp.text}`);
                } else if (comp.type === 'BUTTONS') {
                    console.log(`   - BUTTONS: ${comp.buttons?.length} buttons`);
                }
            });
            
        } else {
            console.log('⚠️ Template not found yet. It may take a few minutes to appear.');
            console.log('Try again in 2-3 minutes.');
        }
        
        // Also check for any other IMAGE templates
        console.log('\n🔍 Checking for any approved IMAGE templates...');
        const imageTemplates = response.data.data.filter(t => 
            t.status === 'APPROVED' && 
            t.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
        );
        
        if (imageTemplates.length > 0) {
            console.log(`\n✅ Found ${imageTemplates.length} approved IMAGE templates:`);
            imageTemplates.forEach(t => {
                console.log(`   - ${t.name} (${t.language})`);
            });
        } else {
            console.log('No approved IMAGE templates found yet.');
        }
        
    } catch (error) {
        console.error('Error checking template:', error.response?.data || error.message);
    }
}

// Execute
checkTemplateStatus().catch(console.error);