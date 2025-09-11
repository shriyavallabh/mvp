#!/usr/bin/env node

/**
 * SECURE VERSION - Send Media Templates to All Advisors
 * Uses environment variables and enhanced error handling
 */

const fs = require('fs');
const { whatsAppService } = require('./services/whatsapp/whatsapp.service');
const { validateConfig } = require('./config/env.config');
const { Logger } = require('./utils/logger');
const { validatePhoneNumbers } = require('./utils/validation');

// Initialize logger
const logger = new Logger({ name: 'AdvisorSender' });

// Validate configuration before starting
try {
    validateConfig({ whatsapp: true });
} catch (error) {
    logger.error('Configuration validation failed', error);
    console.error('\n❌ Please ensure your .env file is properly configured.');
    console.error('Copy .env.example to .env and fill in the WhatsApp credentials.\n');
    process.exit(1);
}

// Load subscriber data
let subscriberData;
try {
    subscriberData = JSON.parse(fs.readFileSync('./subscriber-records.json', 'utf8'));
    logger.info('Loaded subscriber data', { count: subscriberData.subscribers.length });
} catch (error) {
    logger.error('Failed to load subscriber data', error);
    process.exit(1);
}

// Professional financial images
const imageUrls = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', // Trading chart
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80', // Financial dashboard
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80'  // Money growth
];

console.log('\n✨ FINADVISE MEDIA TEMPLATE DELIVERY - SECURE VERSION');
console.log('=' .repeat(70));
console.log('Using environment-based configuration');
console.log(`Recipients: ${subscriberData.subscribers.length} advisors\n`);

/**
 * Send media template to an advisor
 * @param {Object} subscriber - Subscriber data
 * @param {number} imageIndex - Index of image to use
 * @returns {Promise<Object>} Send result
 */
async function sendMediaTemplateToAdvisor(subscriber, imageIndex) {
    const timer = logger.startTimer(`Send to ${subscriber.name}`);
    
    try {
        // Validate phone number
        const phoneValidation = validatePhoneNumbers([subscriber.phone]);
        if (!phoneValidation.isValid) {
            throw new Error(`Invalid phone number for ${subscriber.name}: ${phoneValidation.invalid[0].error}`);
        }
        
        const imageUrl = imageUrls[imageIndex % imageUrls.length];
        const today = new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        // Personalized data per advisor
        const portfolioData = {
            'Avalok': { value: '45,00,000', change: '+3.2%', action: 'Review ELSS investments' },
            'Shruti': { value: '32,00,000', change: '+2.8%', action: 'Rebalance equity allocation' },
            'Vidyadhar': { value: '68,00,000', change: '+4.1%', action: 'Consider debt fund switch' },
            'Valued Subscriber': { value: '52,75,000', change: '+3.5%', action: 'Optimize portfolio mix' }
        };
        
        const data = portfolioData[subscriber.name] || portfolioData['Valued Subscriber'];
        
        // Build message with validated template structure
        const message = {
            type: 'template',
            template: {
                name: 'finadvise_account_update_v1757563699228', // UTILITY template
                language: { code: 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [{
                            type: 'image',
                            image: { link: imageUrl }
                        }]
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: subscriber.name },
                            { type: 'text', text: today },
                            { type: 'text', text: data.value },
                            { type: 'text', text: data.change },
                            { type: 'text', text: data.action }
                        ]
                    }
                ]
            }
        };
        
        // Send using the service (includes retry logic and circuit breaker)
        const result = await whatsAppService.sendMessage(
            phoneValidation.valid[0].normalized,
            message
        );
        
        logger.info(`✅ Sent to ${subscriber.name}`, {
            messageId: result.messageId,
            phone: subscriber.phone
        });
        
        timer({ success: true, messageId: result.messageId });
        
        return {
            success: true,
            messageId: result.messageId,
            recipient: subscriber.name,
            phone: subscriber.phone
        };
        
    } catch (error) {
        logger.error(`❌ Failed to send to ${subscriber.name}`, {
            error: error.message,
            phone: subscriber.phone
        });
        
        timer({ success: false, error: error.message });
        
        return {
            success: false,
            recipient: subscriber.name,
            phone: subscriber.phone,
            error: error.message
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    const startTime = Date.now();
    const results = [];
    
    console.log('🚀 Starting delivery to all advisors...\n');
    
    // Process each subscriber
    for (let i = 0; i < subscriberData.subscribers.length; i++) {
        const subscriber = subscriberData.subscribers[i];
        
        console.log(`[${i + 1}/${subscriberData.subscribers.length}] Sending to ${subscriber.name}...`);
        
        const result = await sendMediaTemplateToAdvisor(subscriber, i);
        results.push(result);
        
        if (result.success) {
            console.log(`    ✅ Success - Message ID: ${result.messageId.slice(-8)}`);
        } else {
            console.log(`    ❌ Failed - ${result.error}`);
        }
        
        // Add delay between messages to respect rate limits
        if (i < subscriberData.subscribers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Generate summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Total Recipients: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    
    if (successful.length > 0) {
        console.log('\nSuccessful Deliveries:');
        successful.forEach(s => {
            console.log(`  • ${s.recipient} (${s.phone}): ${s.messageId.slice(-8)}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\nFailed Deliveries:');
        failed.forEach(f => {
            console.log(`  • ${f.recipient} (${f.phone}): ${f.error}`);
        });
    }
    
    // Save results to file
    const resultsFile = `delivery-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            duration: `${duration}s`
        },
        results
    }, null, 2));
    
    console.log(`\n📁 Results saved to: ${resultsFile}`);
    
    logger.info('Delivery completed', {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        duration
    });
}

// Error handling
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection', error);
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    logger.error('Main function error', error);
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});