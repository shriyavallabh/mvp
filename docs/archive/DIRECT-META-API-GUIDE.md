#!/usr/bin/env node
/**
 * Create WhatsApp template using Meta Cloud API directly (no AiSensy)
 */

require('dotenv').config();

const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID; // Get from Meta Business Manager
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function createTemplate() {
    console.log('🚀 Creating template via Meta Cloud API...\n');

    const templateData = {
        name: "daily_content_unlock_v5_meta",
        language: "en",
        category: "UTILITY",
        components: [
            {
                type: "BODY",
                text: "Hi {{1}}, your JarvisDaily content for {{2}} is ready!\n\nTap below to receive:\n✅ WhatsApp message (share with clients)\n✅ LinkedIn post (copy-paste ready)\n✅ Status image (download & post)"
            },
            {
                type: "FOOTER",
                text: "JarvisDaily - AI-powered content"
            },
            {
                type: "BUTTONS",
                buttons: [
                    {
                        type: "QUICK_REPLY",
                        text: "📱 Send Content"
                    }
                ]
            }
        ]
    };

    try {
        const url = `https://graph.facebook.com/v17.0/${WABA_ID}/message_templates`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Template created successfully!\n');
            console.log('Template ID:', result.id);
            console.log('Status:', result.status || 'PENDING');
            console.log('\n⏰ Approval timeline: 1-2 hours');
            console.log('Check status at: https://business.facebook.com\n');
        } else {
            console.log('❌ Error creating template:\n');
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

createTemplate();
