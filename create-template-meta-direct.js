#!/usr/bin/env node
/**
 * Create WhatsApp template using Meta Cloud API directly (no AiSensy)
 */

require('dotenv').config();

const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function createTemplate() {
    console.log('🚀 Creating template via Meta Cloud API (no AiSensy)\n');
    console.log('=' .repeat(60));

    if (!WABA_ID || !ACCESS_TOKEN) {
        console.log('❌ Missing credentials in .env:\n');
        console.log('WHATSAPP_BUSINESS_ACCOUNT_ID:', WABA_ID ? '✅' : '❌ Missing');
        console.log('WHATSAPP_ACCESS_TOKEN:', ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
        console.log('\n💡 Run: node setup-meta-direct.js for setup guide');
        return;
    }

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
                        text: "Send Content"
                    }
                ]
            }
        ]
    };

    console.log('\n📋 Template Details:');
    console.log('Name:', templateData.name);
    console.log('Category:', templateData.category);
    console.log('Language:', templateData.language);
    console.log('Variables: {{1}} = name, {{2}} = date');
    console.log('Button: Quick Reply (opens 24-hour window)');

    try {
        const url = `https://graph.facebook.com/v17.0/${WABA_ID}/message_templates`;

        console.log('\n⏳ Submitting to Meta...');

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
            console.log('\n✅ Template created successfully!\n');
            console.log('Template ID:', result.id);
            console.log('Status:', result.status || 'PENDING');
            console.log('\n⏰ Approval Timeline:');
            console.log('   • Usually approved in 1-2 hours');
            console.log('   • Check status: https://business.facebook.com');
            console.log('   • You\'ll receive email when approved\n');

            console.log('🔜 Next Steps:');
            console.log('   1. Wait for approval email');
            console.log('   2. Test sending: node send-via-meta-direct.js');
            console.log('   3. Monitor webhook: vercel logs --follow\n');

            console.log('💰 Cost Comparison:');
            console.log('   AiSensy: ₹2,399/month + ₹0.22/msg');
            console.log('   Meta Direct: ₹0/month + ₹0.22/msg');
            console.log('   Savings: ₹2,399/month = ₹28,788/year 🎉\n');

        } else {
            console.log('\n❌ Template creation failed:\n');
            console.log(JSON.stringify(result, null, 2));

            if (result.error) {
                console.log('\n💡 Error Details:');
                console.log('Code:', result.error.code);
                console.log('Type:', result.error.type);
                console.log('Message:', result.error.message);

                if (result.error.code === 190) {
                    console.log('\n🔧 Fix: Access token invalid or expired');
                    console.log('   1. Go to https://developers.facebook.com/apps');
                    console.log('   2. Select your app → WhatsApp → Getting Started');
                    console.log('   3. Generate new token');
                    console.log('   4. Update WHATSAPP_ACCESS_TOKEN in .env');
                }
            }
        }

        console.log('\n' + '=' .repeat(60) + '\n');

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   • Check WHATSAPP_BUSINESS_ACCOUNT_ID is correct');
        console.log('   • Verify access token has template creation permission');
        console.log('   • Check internet connection');
    }
}

createTemplate();
