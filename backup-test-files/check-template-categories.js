#!/usr/bin/env node

/**
 * Check Template Categories
 * Identifies which templates remained as UTILITY after Meta's processing
 */

const axios = require('axios');
const { whatsAppConfig } = require('./config/env.config');
const { Logger } = require('./utils/logger');
const fs = require('fs').promises;

const logger = new Logger({ name: 'CategoryChecker' });

/**
 * Get all templates from Meta
 */
async function getAllTemplates() {
    const url = `https://graph.facebook.com/v21.0/${whatsAppConfig.businessAccountId}/message_templates?limit=100`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${whatsAppConfig.accessToken}`
            }
        });
        
        return response.data.data || [];
        
    } catch (error) {
        logger.error('Failed to fetch templates', error);
        throw error;
    }
}

/**
 * Filter templates by category and status
 */
async function checkTemplateCategories() {
    console.log('\n🔍 TEMPLATE CATEGORY CHECKER');
    console.log('=' .repeat(70));
    console.log('Fetching all templates from Meta...\n');
    
    const allTemplates = await getAllTemplates();
    
    // Filter our templates (ones we created)
    const ourTemplates = allTemplates.filter(t => 
        t.name.includes('_v1') && 
        (t.name.includes('content') || 
         t.name.includes('delivery') || 
         t.name.includes('update') ||
         t.name.includes('notification') ||
         t.name.includes('service') ||
         t.name.includes('ready'))
    );
    
    // Categorize templates
    const utilityTemplates = ourTemplates.filter(t => t.category === 'UTILITY');
    const marketingTemplates = ourTemplates.filter(t => t.category === 'MARKETING');
    const approvedUtility = utilityTemplates.filter(t => t.status === 'APPROVED');
    const pendingUtility = utilityTemplates.filter(t => t.status === 'PENDING');
    const rejectedTemplates = ourTemplates.filter(t => t.status === 'REJECTED');
    
    console.log('📊 TEMPLATE ANALYSIS');
    console.log('=' .repeat(70));
    console.log(`Total Templates Found: ${ourTemplates.length}`);
    console.log(`├─ UTILITY Category: ${utilityTemplates.length}`);
    console.log(`│  ├─ Approved: ${approvedUtility.length} ✅`);
    console.log(`│  └─ Pending: ${pendingUtility.length} ⏳`);
    console.log(`├─ MARKETING Category: ${marketingTemplates.length} ❌`);
    console.log(`└─ Rejected: ${rejectedTemplates.length} ❌`);
    
    console.log('\n✅ APPROVED UTILITY TEMPLATES (Ready to Use):');
    console.log('=' .repeat(70));
    
    if (approvedUtility.length > 0) {
        approvedUtility.forEach((template, index) => {
            console.log(`\n${index + 1}. ${template.name}`);
            console.log(`   Status: ${template.status}`);
            console.log(`   Category: ${template.category}`);
            console.log(`   Language: ${template.language}`);
            console.log(`   ID: ${template.id}`);
            
            // Extract body text to show parameters
            const bodyComponent = template.components?.find(c => c.type === 'BODY');
            if (bodyComponent) {
                console.log(`   Body: ${bodyComponent.text.substring(0, 100)}...`);
            }
        });
    } else {
        console.log('No approved UTILITY templates yet. Please wait and check again.');
    }
    
    if (pendingUtility.length > 0) {
        console.log('\n⏳ PENDING UTILITY TEMPLATES:');
        console.log('=' .repeat(70));
        pendingUtility.forEach(t => {
            console.log(`- ${t.name} (ID: ${t.id})`);
        });
        console.log('\nThese templates are still being reviewed by Meta.');
    }
    
    if (marketingTemplates.length > 0) {
        console.log('\n❌ CONVERTED TO MARKETING (Cannot use for unlock strategy):');
        console.log('=' .repeat(70));
        marketingTemplates.forEach(t => {
            console.log(`- ${t.name} (Status: ${t.status})`);
        });
    }
    
    // Save results
    const results = {
        timestamp: new Date().toISOString(),
        summary: {
            total: ourTemplates.length,
            utility: utilityTemplates.length,
            utilityApproved: approvedUtility.length,
            utilityPending: pendingUtility.length,
            marketing: marketingTemplates.length,
            rejected: rejectedTemplates.length
        },
        utilityTemplates: approvedUtility.map(t => ({
            name: t.name,
            id: t.id,
            status: t.status,
            category: t.category,
            components: t.components
        })),
        marketingTemplates: marketingTemplates.map(t => t.name),
        pendingTemplates: pendingUtility.map(t => t.name)
    };
    
    await fs.writeFile(
        'utility-templates-approved.json',
        JSON.stringify(results, null, 2)
    );
    
    console.log('\n📁 Results saved to: utility-templates-approved.json');
    
    // Success rate
    const successRate = ((approvedUtility.length / ourTemplates.length) * 100).toFixed(1);
    console.log(`\n📈 UTILITY Success Rate: ${successRate}%`);
    
    if (approvedUtility.length >= 3) {
        console.log('\n✅ SUCCESS! You have enough UTILITY templates for the unlock strategy.');
        console.log('Next step: Run the end-to-end test with these templates.');
    } else if (pendingUtility.length > 0) {
        console.log('\n⏳ Wait for pending templates to be approved and check again.');
    } else {
        console.log('\n⚠️  Not enough UTILITY templates. You may need to create more variations.');
    }
    
    return results;
}

// Run if executed directly
if (require.main === module) {
    checkTemplateCategories().catch(console.error);
}

module.exports = {
    checkTemplateCategories,
    getAllTemplates
};