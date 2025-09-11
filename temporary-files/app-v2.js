#!/usr/bin/env node

/**
 * FinAdvise WhatsApp V2 - Main Application
 * Production-ready deliverability engine
 */

require('dotenv').config();
const { program } = require('commander');
const logger = require('./services/logger');
const package = require('./package.json');

// Services
const db = require('./services/database');
const templateService = require('./services/whatsapp/templates.service');
const sendService = require('./services/whatsapp/send.service');
const webhookService = require('./services/whatsapp/webhook.service');
const scheduler = require('./jobs/daily-campaign-scheduler');

program
    .name('finadvise-whatsapp')
    .description('FinAdvise WhatsApp V2 Deliverability Engine')
    .version(package.version || '2.0.0');

// Start all services
program
    .command('start')
    .description('Start webhook server and scheduler')
    .action(async () => {
        logger.info('Starting FinAdvise WhatsApp V2...');
        
        // Initialize database
        await db.initialize();
        
        // Start webhook server
        require('./webhook-server-v2');
        
        // Start scheduler
        await scheduler.initialize();
        
        logger.info('All services started successfully');
    });

// Start webhook server only
program
    .command('webhook')
    .description('Start webhook server only')
    .action(() => {
        logger.info('Starting webhook server...');
        require('./webhook-server-v2');
    });

// Subscribe to webhooks
program
    .command('subscribe')
    .description('Subscribe app to WABA webhooks')
    .action(async () => {
        const result = await webhookService.subscribeToWebhooks();
        if (result) {
            logger.info('Successfully subscribed to webhooks');
        } else {
            logger.error('Failed to subscribe to webhooks');
            process.exit(1);
        }
    });

// List templates
program
    .command('templates')
    .description('List all WhatsApp templates')
    .action(async () => {
        const templates = await templateService.fetchTemplates();
        
        console.log('\nAvailable Templates:');
        console.log('===================');
        
        for (const template of templates) {
            const hasImage = template.components?.some(c => 
                c.type === 'HEADER' && c.format === 'IMAGE'
            );
            
            console.log(`\n${template.name}`);
            console.log(`  Status: ${template.status}`);
            console.log(`  Category: ${template.category}`);
            console.log(`  Language: ${template.language}`);
            console.log(`  Has Image: ${hasImage ? 'Yes' : 'No'}`);
            
            if (template.status === 'REJECTED') {
                console.log(`  Rejection Reason: ${template.rejected_reason}`);
            }
        }
    });

// Create media template
program
    .command('create-template <name>')
    .description('Create a new media template')
    .option('-c, --category <category>', 'Template category (MARKETING/UTILITY)', 'MARKETING')
    .option('-i, --image <path>', 'Path to sample image for header')
    .action(async (name, options) => {
        logger.info(`Creating template: ${name}`);
        
        // Upload sample image if provided
        let headerHandle;
        if (options.image) {
            headerHandle = await templateService.uploadTemplateHeaderImage(options.image);
            logger.info(`Uploaded image with handle: ${headerHandle}`);
        }
        
        // Create template
        const result = await templateService.createMediaTemplate({
            name,
            category: options.category,
            headerHandle: headerHandle || '4::sample-handle',
            bodyText: 'Hi {{1}}, here is your financial update for today: {{2}}',
            footerText: 'FinAdvise - Your Financial Partner'
        });
        
        logger.info('Template created:', result);
        
        // Wait for approval
        logger.info('Waiting for template approval...');
        const approved = await templateService.waitForApproval(name);
        
        if (approved) {
            logger.info('Template approved and ready to use!');
        } else {
            logger.error('Template was not approved');
        }
    });

// Send test message
program
    .command('test-send <number>')
    .description('Send a test message with fallback')
    .option('-i, --image <url>', 'Image URL', 'https://finadvise.app/images/test.jpg')
    .option('-t, --text <text>', 'Body text', 'Your daily financial update')
    .action(async (number, options) => {
        await db.initialize();
        
        logger.info(`Sending test message to ${number}...`);
        
        const result = await sendService.sendWithFallback({
            to: number,
            imageUrl: options.image,
            bodyParams: ['Test User', options.text],
            ogPageUrl: 'https://finadvise.app/daily/test'
        });
        
        console.log('Result:', result);
        
        if (result.success) {
            logger.info(`Message sent successfully! WAMID: ${result.wamid}`);
            logger.info(`Channel used: ${result.channel}`);
        } else {
            logger.error('Failed to send message:', result.error || result.reason);
        }
    });

// Import contacts
program
    .command('import-contacts <file>')
    .description('Import contacts from JSON file')
    .action(async (file) => {
        const fs = require('fs');
        const contacts = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        await db.initialize();
        await db.importContacts(contacts);
        
        logger.info(`Imported ${contacts.length} contacts`);
    });

// Get campaign stats
program
    .command('stats [campaignId]')
    .description('Get campaign statistics')
    .action(async (campaignId) => {
        await db.initialize();
        
        if (campaignId) {
            const stats = await db.getCampaignStats(campaignId);
            console.log('\nCampaign Statistics:');
            console.log('===================');
            console.log(JSON.stringify(stats, null, 2));
        } else {
            // Get today's campaign
            const campaign = await db.getTodaysCampaign();
            if (campaign) {
                const stats = await db.getCampaignStats(campaign.id);
                console.log(`\nToday's Campaign (${campaign.id}):`);
                console.log('================================');
                console.log(JSON.stringify(stats, null, 2));
            } else {
                console.log('No campaign found for today');
            }
        }
    });

// Run test campaign
program
    .command('test-campaign')
    .description('Run a test campaign with sample numbers')
    .option('-n, --numbers <numbers>', 'Comma-separated test numbers')
    .action(async (options) => {
        const testNumbers = options.numbers ? 
            options.numbers.split(',').map(n => n.trim()) : 
            ['919876543210']; // Default test number
        
        await db.initialize();
        
        logger.info(`Running test campaign for ${testNumbers.length} numbers...`);
        
        const results = await scheduler.runTestCampaign(testNumbers);
        
        console.log('\nTest Campaign Results:');
        console.log('=====================');
        console.log(JSON.stringify(results, null, 2));
    });

// Clean up old data
program
    .command('cleanup')
    .description('Clean up old send records')
    .action(async () => {
        await db.initialize();
        await db.cleanupOldSends();
        logger.info('Cleanup completed');
    });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}