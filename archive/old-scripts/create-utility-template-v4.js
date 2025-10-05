#!/usr/bin/env node
/**
 * Create daily_content_unlock_v4 utility template with Quick Reply button
 * This template opens the 24-hour window when user clicks the button
 */

require('dotenv').config();

const AISENSY_API_KEY = process.env.AISENSY_API_KEY;

async function createUtilityTemplate() {
    console.log('🚀 Creating daily_content_unlock_v4 utility template...\n');

    const templateData = {
        name: "daily_content_unlock_v4",
        category: "UTILITY",
        language: "en",

        // No header
        header: null,

        // Body with variables: {{1}} = advisor name, {{2}} = date
        body: "Hi {{1}}, your JarvisDaily content for {{2}} is ready!\n\nTap below to receive:\n✅ WhatsApp message (share with clients)\n✅ LinkedIn post (copy-paste ready)\n✅ Status image (download & post)",

        // Footer
        footer: "JarvisDaily - AI-powered content",

        // Quick Reply button (opens 24-hour window)
        buttons: [
            {
                type: "QUICK_REPLY",
                text: "📱 Send Content"
            }
        ]
    };

    console.log('📋 Template configuration:');
    console.log(JSON.stringify(templateData, null, 2));
    console.log('\n⏳ Submitting to WhatsApp for approval...\n');

    try {
        const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2/template/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AISENSY_API_KEY}`
            },
            body: JSON.stringify(templateData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Template submitted successfully!\n');
            console.log('📊 Response:', JSON.stringify(result, null, 2));
            console.log('\n⏰ Approval timeline:');
            console.log('   • Usually approved within 1-2 hours');
            console.log('   • Check status in AiSensy dashboard');
            console.log('   • You\'ll receive email when approved\n');

            console.log('📝 Template details:');
            console.log(`   Name: ${templateData.name}`);
            console.log(`   Category: ${templateData.category} ⚡`);
            console.log(`   Language: ${templateData.language}`);
            console.log(`   Variables: {{1}} = name, {{2}} = date`);
            console.log(`   Button: Quick Reply (opens 24-hour window) ✅\n`);

            console.log('🔜 Next steps:');
            console.log('   1. Wait for template approval');
            console.log('   2. Configure Meta webhook in Business Manager');
            console.log('   3. Test with: node send-daily-templates.js');
            console.log('   4. Click button → Webhook triggers → Content delivered\n');
        } else {
            console.log('❌ Template submission failed!\n');
            console.log('📊 Error response:', JSON.stringify(result, null, 2));

            if (result.message) {
                console.log('\n💡 Error message:', result.message);
            }

            console.log('\n🔧 Common issues:');
            console.log('   • Template name already exists → Change name to v5, v6, etc.');
            console.log('   • Invalid button format → Check Quick Reply button syntax');
            console.log('   • Body too long → Max 1024 characters');
            console.log('   • Variables in buttons → Not allowed (use static text only)');
        }
    } catch (error) {
        console.log('❌ Error creating template:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   • Check AISENSY_API_KEY in .env');
        console.log('   • Verify network connection');
        console.log('   • Check AiSensy API status');
    }
}

// Run
createUtilityTemplate();
