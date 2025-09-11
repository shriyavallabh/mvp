#!/usr/bin/env node

/**
 * Daily Scheduler for Click-to-Unlock Content Delivery
 * Sends UTILITY templates at 5 AM daily with unlock buttons
 */

const cron = require('node-cron');
const { clickToUnlockService } = require('../services/whatsapp/click-to-unlock-strategy');
const { Logger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const logger = new Logger({ name: 'DailyUnlockScheduler' });

/**
 * Generate daily content for an advisor
 */
async function generateDailyContent(advisor) {
    const today = new Date().toISOString().split('T')[0];
    
    // This would normally call your content generation service
    // For now, creating sample content
    return {
        date: today,
        advisorName: advisor.name,
        platforms: ['LinkedIn', 'Instagram', 'Twitter', 'WhatsApp'],
        contentCount: 4,
        introduction: `Good morning ${advisor.name}! Your personalized financial content for ${today} is ready.`,
        posts: [
            {
                platform: 'LinkedIn',
                text: `🎯 Tax Saving Tip of the Day:\n\n` +
                      `Did you know that investing in ELSS funds can save you up to ₹46,800 in taxes?\n\n` +
                      `Here's how:\n` +
                      `• Investment: ₹1,50,000 (Section 80C limit)\n` +
                      `• Tax bracket: 30% + cess\n` +
                      `• Tax saved: ₹46,800\n\n` +
                      `Plus, ELSS has the shortest lock-in period among all 80C options - just 3 years!\n\n` +
                      `DM me to know the top-performing ELSS funds for 2024.`,
                hashtags: ['#TaxSaving', '#ELSS', '#FinancialPlanning', '#WealthCreation'],
                imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800'
            },
            {
                platform: 'Instagram',
                text: `💰 MONEY HACK MONDAY 💰\n\n` +
                      `The 50-30-20 Rule simplified:\n\n` +
                      `📊 50% - Needs (Rent, Bills, Groceries)\n` +
                      `🎮 30% - Wants (Entertainment, Dining)\n` +
                      `💎 20% - Savings & Investments\n\n` +
                      `Start today, thank yourself tomorrow! 🚀`,
                hashtags: ['#MoneyHack', '#PersonalFinance', '#BudgetingTips', '#FinancialFreedom'],
                imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800'
            },
            {
                platform: 'Twitter',
                text: `Market Update 📈\n\n` +
                      `Sensex: +287 points\n` +
                      `Nifty: +93 points\n\n` +
                      `IT & Banking sectors leading the rally.\n\n` +
                      `Time to review your portfolio? Let's connect!`,
                hashtags: ['#StockMarket', '#Sensex', '#Nifty', '#Investing'],
                imageUrl: null
            },
            {
                platform: 'WhatsApp Status',
                text: `🎯 Financial Wisdom\n\n` +
                      `"Compound interest is the 8th wonder of the world.\n` +
                      `He who understands it, earns it.\n` +
                      `He who doesn't, pays it."\n` +
                      `- Albert Einstein\n\n` +
                      `Start your SIP today! 📱 Contact me`,
                hashtags: [],
                imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800'
            }
        ]
    };
}

/**
 * Send daily unlock templates to all advisors
 */
async function sendDailyUnlockTemplates() {
    const startTime = Date.now();
    logger.info('Starting daily unlock template delivery');
    
    try {
        // Load advisor data
        const subscriberData = JSON.parse(
            await fs.readFile(path.join(__dirname, '../subscriber-records.json'), 'utf8')
        );
        
        const advisors = subscriberData.subscribers;
        const results = [];
        
        console.log('\n📅 DAILY CONTENT UNLOCK TEMPLATES');
        console.log('=' .repeat(60));
        console.log(`Date: ${new Date().toISOString()}`);
        console.log(`Recipients: ${advisors.length} advisors\n`);
        
        // Process each advisor
        for (const advisor of advisors) {
            try {
                // Generate content for the advisor
                const dailyContent = await generateDailyContent(advisor);
                
                // Send unlock template
                const result = await clickToUnlockService.sendDailyUnlockTemplate(
                    advisor,
                    dailyContent
                );
                
                results.push({
                    advisor: advisor.name,
                    success: true,
                    messageId: result.messageId,
                    contentId: result.contentId
                });
                
                console.log(`✅ ${advisor.name}: Template sent (Content ID: ${result.contentId})`);
                
                // Delay between messages
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                logger.error(`Failed to send to ${advisor.name}`, error);
                results.push({
                    advisor: advisor.name,
                    success: false,
                    error: error.message
                });
                console.log(`❌ ${advisor.name}: Failed - ${error.message}`);
            }
        }
        
        // Summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 DELIVERY SUMMARY');
        console.log(`✅ Successful: ${successful}/${advisors.length}`);
        console.log(`❌ Failed: ${failed}/${advisors.length}`);
        console.log(`⏱️  Duration: ${duration} seconds`);
        
        logger.info('Daily unlock template delivery completed', {
            successful,
            failed,
            duration
        });
        
        // Save results
        const resultsFile = `unlock-delivery-${Date.now()}.json`;
        await fs.writeFile(
            path.join(__dirname, '../', resultsFile),
            JSON.stringify({
                timestamp: new Date().toISOString(),
                summary: { successful, failed, duration },
                results
            }, null, 2)
        );
        
        return results;
        
    } catch (error) {
        logger.error('Failed to send daily unlock templates', error);
        throw error;
    }
}

/**
 * Send reminder for pending content
 */
async function sendPendingContentReminder() {
    logger.info('Checking for advisors with pending content');
    
    try {
        const subscriberData = JSON.parse(
            await fs.readFile(path.join(__dirname, '../subscriber-records.json'), 'utf8')
        );
        
        for (const advisor of subscriberData.subscribers) {
            // Check if advisor has pending content (more than 3 days)
            const pendingCount = await getPendingContentCount(advisor.phone);
            
            if (pendingCount > 3) {
                logger.info(`Sending batch reminder to ${advisor.name} (${pendingCount} pending)`);
                await clickToUnlockService.sendBatchUnlockTemplate(advisor);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
    } catch (error) {
        logger.error('Failed to send pending content reminders', error);
    }
}

/**
 * Get count of pending content for an advisor
 */
async function getPendingContentCount(advisorPhone) {
    // This would check the content queue
    // For now, returning mock data
    return Math.floor(Math.random() * 7);
}

/**
 * Start the scheduler
 */
function startScheduler() {
    console.log('\n🚀 CLICK-TO-UNLOCK DAILY SCHEDULER');
    console.log('=' .repeat(60));
    
    // Schedule for 5:00 AM every day
    const dailySchedule = '0 5 * * *';
    
    // Schedule for 6:00 PM every day (reminder for pending content)
    const reminderSchedule = '0 18 * * *';
    
    // For testing - run every minute
    const testSchedule = '* * * * *';
    
    // Use test schedule for development
    const scheduleToUse = process.env.NODE_ENV === 'production' ? dailySchedule : testSchedule;
    
    // Daily content delivery
    cron.schedule(scheduleToUse, async () => {
        logger.info('Cron job triggered: Daily unlock templates');
        await sendDailyUnlockTemplates();
    });
    
    // Pending content reminder
    cron.schedule(reminderSchedule, async () => {
        logger.info('Cron job triggered: Pending content reminder');
        await sendPendingContentReminder();
    });
    
    console.log(`📅 Daily content scheduled for: ${dailySchedule}`);
    console.log(`🔔 Reminder scheduled for: ${reminderSchedule}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n⚠️  Development mode: Running every minute for testing`);
    }
    
    console.log('\n✨ Scheduler is running! Press Ctrl+C to stop.\n');
    
    logger.info('Click-to-unlock scheduler started', {
        dailySchedule,
        reminderSchedule,
        environment: process.env.NODE_ENV
    });
}

// Manual trigger for testing
async function testManualSend() {
    console.log('\n🧪 TEST MODE - Sending unlock templates now...\n');
    await sendDailyUnlockTemplates();
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args[0] === 'test') {
        // Run once for testing
        testManualSend().catch(console.error);
    } else {
        // Start the scheduler
        startScheduler();
    }
}

module.exports = {
    sendDailyUnlockTemplates,
    sendPendingContentReminder,
    generateDailyContent,
    startScheduler
};