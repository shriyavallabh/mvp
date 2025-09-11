const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');

const config = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

const advisors = [
    { name: 'Avalok', phone: '919765071249' },
    { name: 'Shruti', phone: '919673758777' },
    { name: 'Vidyadhar', phone: '918975758513' }
];

const messageTemplates = [
    {
        template: 'tax_alert_now',
        getParams: (name) => [name, '₹1,95,000', 'March 31']
    },
    {
        template: 'investment_update_now', 
        getParams: (name) => [name, '+12.5%', '₹25,00,000']
    },
    {
        template: 'market_insight_now',
        getParams: (name) => [name, '+2.3%', 'Banking stocks']
    }
];

async function sendMessage(advisor, templateConfig) {
    const params = templateConfig.getParams(advisor.name);
    
    const message = {
        messaging_product: 'whatsapp',
        to: advisor.phone,
        type: 'template',
        template: {
            name: templateConfig.template,
            language: { code: 'en_US' },
            components: [{
                type: 'body',
                parameters: params.map(text => ({ type: 'text', text }))
            }]
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            message,
            {
                headers: {
                    'Authorization': `Bearer ${config.bearerToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Sent to ${advisor.name} (${advisor.phone}): ${response.data.messages[0].id}`);
        return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
        console.error(`❌ Failed for ${advisor.name}: ${error.response?.data?.error?.message}`);
        return { success: false, error: error.response?.data?.error?.message };
    }
}

async function sendToAllAdvisors() {
    console.log('📨 Sending WhatsApp Messages to All Advisors');
    console.log('=' .repeat(50));
    console.log(`Time: ${new Date().toLocaleString()}\n`);
    
    const results = [];
    
    for (const advisor of advisors) {
        console.log(`\n👤 Sending to ${advisor.name}:`);
        
        for (const template of messageTemplates) {
            console.log(`   📝 Template: ${template.template}`);
            const result = await sendMessage(advisor, template);
            
            results.push({
                advisor: advisor.name,
                phone: advisor.phone,
                template: template.template,
                ...result,
                timestamp: new Date().toISOString()
            });
            
            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total Messages: ${results.length}`);
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    // Save delivery report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            successful,
            failed
        },
        details: results
    };
    
    require('fs').writeFileSync(
        'whatsapp-delivery-report.json',
        JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Delivery report saved to whatsapp-delivery-report.json');
}

// Execute
sendToAllAdvisors().then(() => {
    console.log('\n✨ All messages sent!');
}).catch(console.error);