/**
 * Daily Campaign Scheduler
 * Orchestrates the daily image generation and message sending
 */

const cron = require('node-cron');
const config = require('../config/whatsapp.config');
const logger = require('../services/logger');
const db = require('../services/database');
const sendService = require('../services/whatsapp/send.service');
const templateService = require('../services/whatsapp/templates.service');
const imageGenerator = require('./image-generator');
const ogPageGenerator = require('./og-page-generator');

class DailyCampaignScheduler {
    constructor() {
        this.nightlyTask = null;
        this.morningTask = null;
    }

    /**
     * Initialize scheduler
     */
    async initialize() {
        await db.initialize();
        
        // Verify templates are approved
        await this.verifyTemplates();

        // Schedule nightly image generation (11:00 PM)
        this.nightlyTask = cron.schedule('0 23 * * *', async () => {
            await this.runNightlyGeneration();
        });

        // Schedule morning send (5:00 AM)
        this.morningTask = cron.schedule('0 5 * * *', async () => {
            await this.runMorningSend();
        });

        logger.info('Daily campaign scheduler initialized');
        logger.info('Nightly generation: 11:00 PM');
        logger.info('Morning send: 5:00 AM');
    }

    /**
     * Verify required templates exist and are approved
     */
    async verifyTemplates() {
        const requiredTemplates = [
            config.templates.media.dailyUpdate,
            config.templates.text.fallback
        ];

        for (const templateName of requiredTemplates) {
            const isApproved = await templateService.isTemplateApproved(templateName);
            
            if (!isApproved) {
                logger.error(`Required template not approved: ${templateName}`);
                logger.info('Please ensure all templates are created and approved before running campaigns');
            } else {
                logger.info(`Template verified: ${templateName}`);
            }
        }
    }

    /**
     * Run nightly image generation
     */
    async runNightlyGeneration() {
        logger.info('Starting nightly image generation...');

        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Get all opted-in contacts
            const contacts = await db.getOptedInContacts();
            logger.info(`Found ${contacts.length} opted-in contacts`);

            // Generate images for each segment or contact
            const imageUrls = await imageGenerator.generateDailyImages(contacts, today);

            // Generate OG preview pages
            await ogPageGenerator.generateDailyPages(imageUrls, today);

            // Create campaign record
            const campaign = await db.createCampaign({
                date: today,
                template_name: config.templates.media.dailyUpdate,
                total_contacts: contacts.length,
                image_urls: imageUrls,
                status: 'planned'
            });

            logger.info(`Campaign created for ${today}: ${campaign.id}`);
            logger.info('Nightly generation completed successfully');
        } catch (error) {
            logger.error('Nightly generation failed:', error);
        }
    }

    /**
     * Run morning send campaign
     */
    async runMorningSend() {
        logger.info('Starting morning send campaign...');

        try {
            // Get today's campaign
            const campaign = await db.getTodaysCampaign();
            
            if (!campaign) {
                logger.error('No campaign found for today');
                return;
            }

            // Update campaign status
            await db.updateCampaignStatus(campaign.id, 'sending');

            // Get opted-in contacts
            const contacts = await db.getOptedInContacts();
            
            // Filter out contacts in cool-off
            const eligibleContacts = contacts.filter(contact => {
                if (contact.cooloff_until) {
                    return new Date(contact.cooloff_until) < new Date();
                }
                return true;
            });

            logger.info(`Sending to ${eligibleContacts.length} eligible contacts (${contacts.length - eligibleContacts.length} in cool-off)`);

            // Send in cohorts with pacing
            const results = await this.sendInCohorts(eligibleContacts, campaign);

            // Update campaign with results
            await db.updateCampaignStatus(campaign.id, 'done');

            // Log statistics
            const stats = await db.getCampaignStats(campaign.id);
            logger.info('Campaign completed:', stats);

            // Alert if delivery rate is below threshold
            if (stats.deliveryRate < config.monitoring.alertThreshold.deliveryRate) {
                await this.sendAlert(`Low delivery rate: ${(stats.deliveryRate * 100).toFixed(1)}%`, stats);
            }

            if (stats.failureRate > config.monitoring.alertThreshold.failureRate) {
                await this.sendAlert(`High failure rate: ${(stats.failureRate * 100).toFixed(1)}%`, stats);
            }

        } catch (error) {
            logger.error('Morning send failed:', error);
            await this.sendAlert('Morning send failed', { error: error.message });
        }
    }

    /**
     * Send messages in cohorts with rate limiting
     */
    async sendInCohorts(contacts, campaign) {
        const { cohortsPerMinute } = config.delivery.pacing;
        const cohortSize = Math.ceil(contacts.length / Math.ceil(contacts.length / cohortsPerMinute));
        
        const results = {
            total: contacts.length,
            sent: 0,
            failed: 0,
            cooledOff: 0
        };

        // Process in cohorts
        for (let i = 0; i < contacts.length; i += cohortSize) {
            const cohort = contacts.slice(i, i + cohortSize);
            const cohortNumber = Math.floor(i / cohortSize) + 1;
            
            logger.info(`Processing cohort ${cohortNumber} (${cohort.length} contacts)`);

            const cohortResults = await sendService.sendToCohort(cohort, {
                imageUrl: campaign.image_urls[0] || `${config.cdn.baseUrl}/${campaign.date}/default.jpg`,
                summary: 'Your personalized financial update for today',
                date: campaign.date,
                campaignId: campaign.id
            });

            results.sent += cohortResults.sent;
            results.failed += cohortResults.failed;
            results.cooledOff += cohortResults.cooledOff;

            // Delay between cohorts (1 minute)
            if (i + cohortSize < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }

        return results;
    }

    /**
     * Send alert to admins
     */
    async sendAlert(message, details) {
        logger.error(`ALERT: ${message}`, details);

        // Send to Slack if configured
        if (config.monitoring.slackWebhook) {
            try {
                await require('axios').post(config.monitoring.slackWebhook, {
                    text: `🚨 WhatsApp Campaign Alert: ${message}`,
                    attachments: [{
                        color: 'danger',
                        fields: Object.entries(details || {}).map(([key, value]) => ({
                            title: key,
                            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                            short: true
                        }))
                    }]
                });
            } catch (error) {
                logger.error('Failed to send Slack alert:', error);
            }
        }

        // Send WhatsApp alert to admins
        for (const adminNumber of config.monitoring.adminNumbers) {
            try {
                await sendService.sendTextTemplateWithLink({
                    to: adminNumber,
                    templateName: config.templates.text.notification,
                    bodyParams: [`Alert: ${message}`]
                });
            } catch (error) {
                logger.error(`Failed to send alert to ${adminNumber}:`, error);
            }
        }
    }

    /**
     * Run test campaign (for QA)
     */
    async runTestCampaign(testNumbers) {
        logger.info('Running test campaign...');

        const testCampaign = {
            id: `test_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            imageUrl: `${config.cdn.baseUrl}/test/sample.jpg`,
            summary: 'Test financial update'
        };

        const results = [];
        
        for (const number of testNumbers) {
            const result = await sendService.sendWithFallback({
                to: number,
                imageUrl: testCampaign.imageUrl,
                bodyParams: ['Test User', testCampaign.summary],
                ogPageUrl: `${config.cdn.ogPageUrl}/test`
            });

            results.push({
                number,
                ...result
            });

            logger.info(`Test send to ${number}:`, result);
        }

        return results;
    }

    /**
     * Stop scheduler
     */
    stop() {
        if (this.nightlyTask) {
            this.nightlyTask.stop();
        }
        if (this.morningTask) {
            this.morningTask.stop();
        }
        logger.info('Scheduler stopped');
    }
}

module.exports = new DailyCampaignScheduler();