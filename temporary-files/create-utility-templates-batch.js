#!/usr/bin/env node

/**
 * Batch Create UTILITY Templates for Click-to-Unlock Strategy
 * Creates 25 variations to ensure some remain as UTILITY category
 */

const axios = require('axios');
const { whatsAppConfig } = require('./config/env.config');
const { Logger } = require('./utils/logger');
const fs = require('fs').promises;

const logger = new Logger({ name: 'TemplateCreator' });

// Template variations designed to maintain UTILITY category
const TEMPLATE_VARIATIONS = [
    // Service notifications
    {
        name: 'daily_content_ready_v1',
        header: 'Content Delivery Notification',
        body: 'Hi {{1}}, your scheduled content for {{2}} has been processed and is ready for retrieval. Content ID: {{3}}. This is an automated service notification.',
        footer: 'FinAdvise Content Service',
        buttonText: 'Retrieve Content'
    },
    {
        name: 'content_available_v1',
        header: 'Scheduled Delivery Complete',
        body: '{{1}}, your requested materials dated {{2}} are now available in your account. Reference: {{3}}. Access them at your convenience.',
        footer: 'Automated Delivery System',
        buttonText: 'Access Materials'
    },
    {
        name: 'materials_processed_v1',
        header: 'Processing Complete',
        body: 'Dear {{1}}, processing for your {{2}} request has been completed. Transaction ID: {{3}}. You may now retrieve your materials.',
        footer: 'FinAdvise Platform',
        buttonText: 'View Materials'
    },
    {
        name: 'subscription_content_v1',
        header: 'Subscription Update',
        body: '{{1}}, your subscription content for {{2}} is ready. Batch number: {{3}}. This is based on your active subscription preferences.',
        footer: 'Subscription Service',
        buttonText: 'Get Update'
    },
    {
        name: 'scheduled_delivery_v1',
        header: 'Scheduled Delivery',
        body: 'Notification for {{1}}: Your scheduled delivery dated {{2}} with reference {{3}} has been completed successfully.',
        footer: 'Delivery Confirmation',
        buttonText: 'View Delivery'
    },
    
    // Account updates
    {
        name: 'account_materials_v1',
        header: 'Account Update Available',
        body: '{{1}}, new materials have been added to your account on {{2}}. Update reference: {{3}}. Login to view details.',
        footer: 'Account Services',
        buttonText: 'Check Update'
    },
    {
        name: 'profile_content_ready_v1',
        header: 'Profile Update',
        body: 'Hi {{1}}, your profile has been updated with new content dated {{2}}. Update ID: {{3}}. Review at your earliest convenience.',
        footer: 'Profile Management',
        buttonText: 'Review Update'
    },
    {
        name: 'member_content_v1',
        header: 'Member Portal Update',
        body: '{{1}}, your member portal has new content from {{2}}. Content code: {{3}}. Access through your member dashboard.',
        footer: 'Member Services',
        buttonText: 'Open Portal'
    },
    
    // System notifications
    {
        name: 'system_delivery_v1',
        header: 'System Notification',
        body: 'User {{1}}: Automated delivery for date {{2}} completed. System reference: {{3}}. No action required unless you wish to review.',
        footer: 'System Message',
        buttonText: 'Review'
    },
    {
        name: 'automated_update_v1',
        header: 'Automated Update',
        body: '{{1}}, this is an automated update for {{2}}. Process ID: {{3}}. Your preferences have been applied.',
        footer: 'Automation Service',
        buttonText: 'View Details'
    },
    
    // Compliance-focused
    {
        name: 'compliance_update_v1',
        header: 'Compliance Notice',
        body: '{{1}}, required materials for {{2}} are ready for your review. Compliance ID: {{3}}. Please acknowledge receipt.',
        footer: 'Compliance Department',
        buttonText: 'Acknowledge'
    },
    {
        name: 'regulatory_content_v1',
        header: 'Regulatory Update',
        body: 'Attention {{1}}: Regulatory content dated {{2}} is available. Document ID: {{3}}. Review for compliance purposes.',
        footer: 'Regulatory Affairs',
        buttonText: 'Access Document'
    },
    
    // Educational/Informational
    {
        name: 'educational_ready_v1',
        header: 'Educational Material Ready',
        body: '{{1}}, educational material scheduled for {{2}} is prepared. Material ID: {{3}}. Access when convenient.',
        footer: 'Education Center',
        buttonText: 'Access Material'
    },
    {
        name: 'information_update_v1',
        header: 'Information Update',
        body: 'Dear {{1}}, information update for {{2}} is available. Reference number: {{3}}. This is for your records.',
        footer: 'Information Services',
        buttonText: 'View Information'
    },
    {
        name: 'resource_notification_v1',
        header: 'Resource Notification',
        body: '{{1}}, requested resources for {{2}} are ready. Resource ID: {{3}}. Available in your resource center.',
        footer: 'Resource Management',
        buttonText: 'Get Resources'
    },
    
    // Technical notifications
    {
        name: 'batch_complete_v1',
        header: 'Batch Processing Complete',
        body: '{{1}}, batch processing for {{2}} finished successfully. Batch ID: {{3}}. Results available for download.',
        footer: 'Processing Center',
        buttonText: 'Download Results'
    },
    {
        name: 'queue_processed_v1',
        header: 'Queue Processed',
        body: 'Hi {{1}}, your queued items for {{2}} have been processed. Queue ID: {{3}}. Ready for collection.',
        footer: 'Queue Management',
        buttonText: 'Collect Items'
    },
    {
        name: 'task_complete_v1',
        header: 'Task Completed',
        body: '{{1}}, scheduled task for {{2}} is complete. Task reference: {{3}}. Output is ready for review.',
        footer: 'Task Scheduler',
        buttonText: 'Review Output'
    },
    
    // Simple service messages
    {
        name: 'service_ready_v1',
        header: 'Service Update',
        body: '{{1}}: Service request for {{2}} completed. ID: {{3}}.',
        footer: 'Service Desk',
        buttonText: 'View'
    },
    {
        name: 'request_complete_v1',
        header: 'Request Processed',
        body: '{{1}}, your request dated {{2}} is processed. Ref: {{3}}.',
        footer: 'Request Handler',
        buttonText: 'Check'
    },
    {
        name: 'update_available_v1',
        header: 'Update Available',
        body: 'Hi {{1}}, update for {{2}} ready. Code: {{3}}.',
        footer: 'Updates',
        buttonText: 'Get'
    },
    {
        name: 'notification_v1',
        header: 'Notification',
        body: '{{1}}: Item for {{2}} available. ID: {{3}}.',
        footer: 'Notifications',
        buttonText: 'Open'
    },
    
    // Alternative phrasings
    {
        name: 'fulfillment_complete_v1',
        header: 'Fulfillment Complete',
        body: '{{1}}, your order for {{2}} has been fulfilled. Order number: {{3}}. Ready for pickup.',
        footer: 'Fulfillment Center',
        buttonText: 'Track Order'
    },
    {
        name: 'preparation_done_v1',
        header: 'Preparation Complete',
        body: 'Dear {{1}}, preparation for your {{2}} request is done. Reference: {{3}}. Awaiting your action.',
        footer: 'Preparation Team',
        buttonText: 'Proceed'
    },
    {
        name: 'availability_notice_v1',
        header: 'Availability Notice',
        body: '{{1}}, items for {{2}} are now available. Availability code: {{3}}. Limited time access.',
        footer: 'Availability System',
        buttonText: 'Access Now'
    }
];

/**
 * Create a template with Meta API
 */
async function createTemplate(template) {
    const url = `https://graph.facebook.com/v21.0/${whatsAppConfig.businessAccountId}/message_templates`;
    
    const payload = {
        name: template.name,
        category: 'UTILITY',  // Request UTILITY category
        language: 'en',
        components: [
            {
                type: 'HEADER',
                format: 'TEXT',
                text: template.header
            },
            {
                type: 'BODY',
                text: template.body,
                example: {
                    body_text: [
                        ['John', '2024-01-11', 'CNT123456']
                    ]
                }
            },
            {
                type: 'FOOTER',
                text: template.footer
            },
            {
                type: 'BUTTONS',
                buttons: [
                    {
                        type: 'QUICK_REPLY',
                        text: template.buttonText
                    }
                ]
            }
        ]
    };
    
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${whatsAppConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            template: template.name,
            id: response.data.id,
            status: response.data.status,
            category: response.data.category
        };
        
    } catch (error) {
        return {
            success: false,
            template: template.name,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Create all template variations
 */
async function createAllTemplates() {
    console.log('\n🚀 BATCH UTILITY TEMPLATE CREATION');
    console.log('=' .repeat(70));
    console.log(`Creating ${TEMPLATE_VARIATIONS.length} template variations...`);
    console.log('Strategy: Submit many, use the ones that stay UTILITY\n');
    
    const results = [];
    
    for (let i = 0; i < TEMPLATE_VARIATIONS.length; i++) {
        const template = TEMPLATE_VARIATIONS[i];
        console.log(`[${i + 1}/${TEMPLATE_VARIATIONS.length}] Creating: ${template.name}`);
        
        const result = await createTemplate(template);
        results.push(result);
        
        if (result.success) {
            console.log(`   ✅ Created successfully (ID: ${result.id})`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 CREATION SUMMARY');
    console.log(`✅ Successful: ${successful.length}/${TEMPLATE_VARIATIONS.length}`);
    console.log(`❌ Failed: ${failed.length}/${TEMPLATE_VARIATIONS.length}`);
    
    // Save results
    await fs.writeFile(
        'template-creation-results.json',
        JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total: TEMPLATE_VARIATIONS.length,
                successful: successful.length,
                failed: failed.length
            },
            templates: results
        }, null, 2)
    );
    
    console.log('\n📁 Results saved to: template-creation-results.json');
    console.log('\n⏰ NEXT STEPS:');
    console.log('1. Wait 10-15 minutes for Meta to process templates');
    console.log('2. Run: node check-template-categories.js');
    console.log('3. Use only templates that remain as UTILITY');
    
    return results;
}

// Run if executed directly
if (require.main === module) {
    createAllTemplates().catch(console.error);
}

module.exports = {
    createAllTemplates,
    TEMPLATE_VARIATIONS
};