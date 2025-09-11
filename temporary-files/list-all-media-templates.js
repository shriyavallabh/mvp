const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * List ALL Media Templates (Image + Content) that are already uploaded and approved
 * Shows complete structure and parameters for each
 */

const axios = require('axios');

const config = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function listAllMediaTemplates() {
    console.log('\n🎯 FETCHING ALL MEDIA TEMPLATES (IMAGE + CONTENT)');
    console.log('=' .repeat(70));
    console.log('\nBusiness Account ID:', config.businessAccountId);
    console.log('Checking for templates with IMAGE headers...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const allTemplates = response.data.data || [];
        
        // Filter for templates with IMAGE headers
        const mediaTemplates = allTemplates.filter(template => {
            return template.components?.some(comp => 
                comp.type === 'HEADER' && comp.format === 'IMAGE'
            );
        });

        console.log(`📊 Found ${mediaTemplates.length} media templates out of ${allTemplates.length} total templates\n`);
        
        // Separate by status
        const approved = mediaTemplates.filter(t => t.status === 'APPROVED');
        const pending = mediaTemplates.filter(t => t.status === 'PENDING');
        const rejected = mediaTemplates.filter(t => t.status === 'REJECTED');
        
        console.log('Status Breakdown:');
        console.log(`  ✅ Approved: ${approved.length}`);
        console.log(`  ⏳ Pending: ${pending.length}`);
        console.log(`  ❌ Rejected: ${rejected.length}`);
        console.log('\n' + '='.repeat(70));

        // Show APPROVED media templates first
        if (approved.length > 0) {
            console.log('\n✅ APPROVED MEDIA TEMPLATES (Ready to Use)\n');
            
            approved.forEach((template, index) => {
                console.log(`${index + 1}. Template Name: ${template.name}`);
                console.log('   ' + '-'.repeat(50));
                console.log(`   Status: ${template.status}`);
                console.log(`   Category: ${template.category}`);
                console.log(`   Language: ${template.language}`);
                
                // Show components
                template.components.forEach(comp => {
                    if (comp.type === 'HEADER' && comp.format === 'IMAGE') {
                        console.log('\n   📸 IMAGE HEADER:');
                        if (comp.example?.header_handle) {
                            console.log(`      Sample: ${comp.example.header_handle[0].substring(0, 50)}...`);
                        }
                    }
                    
                    if (comp.type === 'BODY') {
                        console.log('\n   📝 BODY CONTENT:');
                        console.log(`      "${comp.text.substring(0, 100)}${comp.text.length > 100 ? '...' : ''}"`);
                        
                        // Count parameters
                        const params = comp.text.match(/\{\{[\d]+\}\}/g) || [];
                        console.log(`      Parameters Required: ${params.length}`);
                        if (params.length > 0) {
                            console.log(`      Parameter List: ${params.join(', ')}`);
                        }
                    }
                    
                    if (comp.type === 'FOOTER') {
                        console.log('\n   📍 FOOTER:');
                        console.log(`      "${comp.text}"`);
                    }
                    
                    if (comp.type === 'BUTTONS') {
                        console.log('\n   🔘 BUTTONS:');
                        comp.buttons?.forEach(btn => {
                            console.log(`      - ${btn.type}: ${btn.text || btn.url || btn.phone_number}`);
                        });
                    }
                });
                
                console.log('\n');
            });
        }

        // Show PENDING media templates
        if (pending.length > 0) {
            console.log('\n⏳ PENDING MEDIA TEMPLATES (Awaiting Approval)\n');
            
            pending.forEach((template, index) => {
                console.log(`${index + 1}. ${template.name} (${template.category})`);
            });
            console.log('');
        }

        // Show REJECTED media templates
        if (rejected.length > 0) {
            console.log('\n❌ REJECTED MEDIA TEMPLATES\n');
            
            rejected.forEach((template, index) => {
                console.log(`${index + 1}. ${template.name}`);
                if (template.rejected_reason) {
                    console.log(`   Reason: ${template.rejected_reason}`);
                }
            });
            console.log('');
        }

        // Summary for quick use
        console.log('\n' + '='.repeat(70));
        console.log('📋 QUICK REFERENCE - APPROVED MEDIA TEMPLATES\n');
        
        if (approved.length > 0) {
            console.log('Copy these template names for immediate use:\n');
            approved.forEach(template => {
                const bodyParams = template.components.find(c => c.type === 'BODY')?.text.match(/\{\{[\d]+\}\}/g) || [];
                console.log(`• ${template.name}`);
                console.log(`  Language: ${template.language}`);
                console.log(`  Body Parameters: ${bodyParams.length} required`);
                console.log('');
            });
        } else {
            console.log('No approved media templates available.');
            console.log('You need to create and get approval for media templates first.');
        }

        // Show sample code
        if (approved.length > 0) {
            const sampleTemplate = approved[0];
            const bodyParams = sampleTemplate.components.find(c => c.type === 'BODY')?.text.match(/\{\{[\d]+\}\}/g) || [];
            
            console.log('\n' + '='.repeat(70));
            console.log('💻 SAMPLE CODE TO USE MEDIA TEMPLATE\n');
            console.log('```javascript');
            console.log(`const payload = {
    messaging_product: 'whatsapp',
    to: '919876543210',
    type: 'template',
    template: {
        name: '${sampleTemplate.name}',
        language: { code: '${sampleTemplate.language}' },
        components: [
            {
                type: 'header',
                parameters: [{
                    type: 'image',
                    image: { 
                        link: 'https://your-image-url.jpg'
                    }
                }]
            }${bodyParams.length > 0 ? `,
            {
                type: 'body',
                parameters: [${bodyParams.map((p, i) => `
                    { type: 'text', text: 'Value for ${p}' }`).join(',')}
                ]
            }` : ''}
        ]
    }
};`);
            console.log('```');
        }

    } catch (error) {
        console.error('❌ Error fetching templates:', error.response?.data || error.message);
    }
}

// Run the check
listAllMediaTemplates();