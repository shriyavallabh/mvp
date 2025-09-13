#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

const CONFIG = {
    businessId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '350561571475661',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
};

async function findTemplates() {
    console.log('🔍 FINDING EXISTING WHATSAPP TEMPLATES\n');
    
    try {
        // Try to get templates
        const url = `https://graph.facebook.com/v17.0/${CONFIG.businessId}/message_templates`;
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`
            }
        });
        
        if (response.data?.data?.length > 0) {
            console.log('✅ Found templates:\n');
            response.data.data.forEach((template, index) => {
                console.log(`${index + 1}. Template: "${template.name}"`);
                console.log(`   Status: ${template.status}`);
                console.log(`   Language: ${template.language}`);
                console.log(`   Category: ${template.category}`);
                if (template.components) {
                    template.components.forEach(comp => {
                        if (comp.type === 'BUTTONS') {
                            console.log('   Buttons:', comp.buttons?.map(b => b.text).join(' | '));
                        }
                    });
                }
                console.log('');
            });
        } else {
            console.log('No templates found');
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        
        // Try sending a simple text message instead
        console.log('\n📱 Let\'s send a simple button message instead...');
    }
}

findTemplates();
