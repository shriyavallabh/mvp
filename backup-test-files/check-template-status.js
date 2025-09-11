const dotenv = require('dotenv');
dotenv.config();

const axios = require('axios');
const fs = require('fs');

const config = {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    bearerToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0'
};

async function checkAllTemplates() {
    console.log('🔍 WhatsApp Template Status Checker');
    console.log('=' .repeat(60));
    console.log(`Time: ${new Date().toLocaleString()}\n`);
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.businessAccountId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.bearerToken}`
                }
            }
        );
        
        const templates = response.data.data;
        
        // Group by status
        const statusGroups = {
            APPROVED: [],
            PENDING: [],
            REJECTED: [],
            DISABLED: []
        };
        
        templates.forEach(template => {
            const group = statusGroups[template.status] || statusGroups.DISABLED;
            group.push(template);
        });
        
        // Display summary
        console.log('📊 Summary:');
        console.log(`   Total Templates: ${templates.length}`);
        console.log(`   ✅ Approved: ${statusGroups.APPROVED.length}`);
        console.log(`   ⏳ Pending: ${statusGroups.PENDING.length}`);
        console.log(`   ❌ Rejected: ${statusGroups.REJECTED.length}`);
        console.log(`   🚫 Disabled: ${statusGroups.DISABLED.length}`);
        
        // Show approved templates with images
        const approvedWithImages = statusGroups.APPROVED.filter(t => 
            t.components.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
        );
        
        console.log(`\n📸 Approved Templates with Images: ${approvedWithImages.length}`);
        if (approvedWithImages.length > 0) {
            approvedWithImages.forEach(t => {
                console.log(`   - ${t.name}`);
            });
        }
        
        // Show pending templates
        if (statusGroups.PENDING.length > 0) {
            console.log('\n⏳ Pending Approval:');
            statusGroups.PENDING.forEach(t => {
                const hasImage = t.components.some(c => c.type === 'HEADER' && c.format === 'IMAGE');
                console.log(`   - ${t.name} ${hasImage ? '(with image)' : '(text only)'}`);
            });
        }
        
        // Show recently created templates
        const recentTemplates = templates
            .filter(t => t.name.includes('_now') || t.name.includes('alert'))
            .slice(0, 5);
            
        if (recentTemplates.length > 0) {
            console.log('\n🆕 Recent Templates:');
            recentTemplates.forEach(t => {
                console.log(`   - ${t.name}: ${t.status}`);
            });
        }
        
        // Test sending with approved templates
        const testTemplates = ['advisor_tax_alert', 'tax_alert_now', 'investment_update_now'];
        const availableTest = testTemplates.find(name => 
            statusGroups.APPROVED.some(t => t.name === name)
        );
        
        if (availableTest) {
            console.log(`\n📨 Testing with approved template: ${availableTest}`);
            await sendTestMessage(availableTest);
        }
        
        // Save status report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: templates.length,
                approved: statusGroups.APPROVED.length,
                pending: statusGroups.PENDING.length,
                rejected: statusGroups.REJECTED.length,
                withImages: approvedWithImages.length
            },
            templates: templates.map(t => ({
                name: t.name,
                status: t.status,
                hasImage: t.components.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
            }))
        };
        
        fs.writeFileSync('template-status-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Full report saved to template-status-report.json');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data?.error?.message || error.message);
    }
}

async function sendTestMessage(templateName) {
    const testParams = {
        'advisor_tax_alert': ['Avalok', '₹1,95,000', 'March 31'],
        'tax_alert_now': ['Avalok', '₹1,95,000', 'March 31'],
        'investment_update_now': ['Avalok', '+12.5%', '₹25,00,000'],
        'market_insight_now': ['Avalok', '+2.3%', 'Banking stocks']
    };
    
    const params = testParams[templateName] || ['Test', 'Value', 'Data'];
    
    const message = {
        messaging_product: 'whatsapp',
        to: '919765071249',
        type: 'template',
        template: {
            name: templateName,
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
        
        console.log(`   ✅ Test message sent: ${response.data.messages[0].id}`);
    } catch (error) {
        console.error(`   ❌ Send failed: ${error.response?.data?.error?.message}`);
    }
}

// Run the check
checkAllTemplates().then(() => {
    console.log('\n✨ Check complete!');
}).catch(console.error);