#!/usr/bin/env node
/**
 * Create a simple, compliant WhatsApp template
 */

require('dotenv').config();

const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function createTemplate() {
    console.log('🚀 Creating simple compliant template...\n');

    const templateData = {
        name: "content_ready_notification",
        language: "en",
        category: "UTILITY",
        components: [
            {
                type: "BODY",
                text: "Hi {{1}}, your content for {{2}} is ready. Click below to receive it."
            },
            {
                type: "BUTTONS",
                buttons: [
                    {
                        type: "QUICK_REPLY",
                        text: "Get Content"
                    }
                ]
            }
        ]
    };

    console.log('📋 Template:', JSON.stringify(templateData, null, 2));

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
            console.log('\n✅ Template created!');
            console.log('Template ID:', result.id);
            console.log('Status:', result.status);
        } else {
            console.log('\n❌ Failed:');
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

createTemplate();
