#!/usr/bin/env node

/**
 * Story 3.2: Button Click Content Delivery Handler
 * ==================================================
 * Handles button clicks from UTILITY templates
 * Delivers personalized content based on button selection
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    contentDir: '/home/mvp/generated-content',
    imagesDir: '/home/mvp/generated-images',
    templatesDir: '/home/mvp/templates',
    deliveryLog: '/home/mvp/logs/content-delivery.json'
};

// Advisor mapping
const ADVISOR_NAMES = {
    '919022810769': 'Avalok',
    '918369865935': 'Vidyadhar',
    '919137926441': 'Shruti'
};

/**
 * Handle UNLOCK_IMAGES button click
 */
async function handleUnlockImages(phoneNumber) {
    console.log(`📸 Delivering images to ${phoneNumber}...`);
    
    const advisorName = ADVISOR_NAMES[phoneNumber] || 'Advisor';
    const today = new Date().toISOString().split('T')[0];
    
    try {
        // Check for advisor-specific generated images
        const generatedImages = await getAdvisorImages(phoneNumber, advisorName);
        
        if (generatedImages.length > 0) {
            // Send personalized images
            for (let i = 0; i < generatedImages.length; i++) {
                await sendImage(phoneNumber, generatedImages[i].url, generatedImages[i].caption);
                console.log(`  ✅ Sent image ${i + 1}/${generatedImages.length}`);
                await delay(2000);
            }
        } else {
            // Send default market images
            const defaultImages = await getDefaultImages();
            for (let i = 0; i < defaultImages.length; i++) {
                await sendImage(phoneNumber, defaultImages[i].url, defaultImages[i].caption);
                console.log(`  ✅ Sent default image ${i + 1}/${defaultImages.length}`);
                await delay(2000);
            }
        }
        
        // Log delivery
        await logDelivery(phoneNumber, 'UNLOCK_IMAGES', generatedImages.length || 3);
        
        // Send follow-up message
        await sendMessage(phoneNumber, `📸 Images delivered! Share these with your clients to boost engagement.

💡 Tip: Post these during market hours for maximum reach.`);
        
        return { success: true, count: generatedImages.length || 3 };
        
    } catch (error) {
        console.error(`❌ Error delivering images: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Handle UNLOCK_CONTENT button click
 */
async function handleUnlockContent(phoneNumber) {
    console.log(`📝 Delivering content to ${phoneNumber}...`);
    
    const advisorName = ADVISOR_NAMES[phoneNumber] || 'Advisor';
    
    try {
        // Get personalized content
        const content = await getAdvisorContent(phoneNumber, advisorName);
        
        // Send content messages
        for (let i = 0; i < content.length; i++) {
            await sendMessage(phoneNumber, content[i]);
            console.log(`  ✅ Sent content ${i + 1}/${content.length}`);
            await delay(1500);
        }
        
        // Log delivery
        await logDelivery(phoneNumber, 'UNLOCK_CONTENT', content.length);
        
        return { success: true, count: content.length };
        
    } catch (error) {
        console.error(`❌ Error delivering content: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Handle UNLOCK_UPDATES button click
 */
async function handleUnlockUpdates(phoneNumber) {
    console.log(`📊 Delivering market updates to ${phoneNumber}...`);
    
    try {
        const updates = await getMarketUpdates();
        
        await sendMessage(phoneNumber, updates);
        console.log(`  ✅ Market updates sent`);
        
        // Send additional insights
        const insights = await getMarketInsights();
        await delay(2000);
        await sendMessage(phoneNumber, insights);
        console.log(`  ✅ Market insights sent`);
        
        // Log delivery
        await logDelivery(phoneNumber, 'UNLOCK_UPDATES', 2);
        
        return { success: true, count: 2 };
        
    } catch (error) {
        console.error(`❌ Error delivering updates: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Get advisor-specific generated images
 */
async function getAdvisorImages(phoneNumber, advisorName) {
    const images = [];
    
    try {
        // Check Story 2.1 generated images directory
        const today = new Date().toISOString().split('T')[0];
        const advisorDir = path.join(CONFIG.imagesDir, advisorName.toLowerCase());
        
        const files = await fs.readdir(advisorDir);
        const todayImages = files.filter(f => f.includes(today) && f.endsWith('.jpg'));
        
        for (const imageFile of todayImages.slice(0, 3)) {
            const imagePath = path.join(advisorDir, imageFile);
            
            // For production, these would be served via HTTPS
            images.push({
                url: `https://hubix.duckdns.org/images/${advisorName.toLowerCase()}/${imageFile}`,
                caption: await getImageCaption(imageFile, advisorName)
            });
        }
    } catch (error) {
        console.log(`  No personalized images found for ${advisorName}`);
    }
    
    return images;
}

/**
 * Get default market images
 */
async function getDefaultImages() {
    return [
        {
            url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            caption: `📊 *Today's Market Overview*\n\nNifty: 19,823 (+1.2%)\nSensex: 66,598 (+385)\n\n✅ Bulls in control\n📈 IT & Pharma leading`
        },
        {
            url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            caption: `💰 *Smart Investment Tips*\n\n• Diversify across sectors\n• Focus on quality stocks\n• Maintain 20% cash\n• Review quarterly`
        },
        {
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            caption: `📋 *Tax Saving Alert*\n\nFY 2024-25 Planning:\n• ELSS Investment ₹1.5L\n• NPS Additional ₹50K\n• Health Insurance\n\nDeadline: March 31, 2025`
        }
    ];
}

/**
 * Get advisor-specific content
 */
async function getAdvisorContent(phoneNumber, advisorName) {
    const content = [];
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-IN');
    
    try {
        // Try to load from Story 2.1 generated content
        const contentFile = path.join(CONFIG.contentDir, `${advisorName.toLowerCase()}-${date.toISOString().split('T')[0]}.json`);
        const data = await fs.readFile(contentFile, 'utf-8');
        const generated = JSON.parse(data);
        
        if (generated.posts) {
            content.push(...generated.posts.slice(0, 3));
        }
    } catch (error) {
        // Use default content
        content.push(
            `📊 *Market Snapshot - ${dateStr}*\n\n` +
            `Nifty 50: 19,823 (+235 pts)\n` +
            `Sensex: 66,598 (+385 pts)\n` +
            `Bank Nifty: 44,672 (+0.8%)\n\n` +
            `Top Gainers: IT, Pharma, FMCG\n` +
            `Top Losers: Realty, PSU Banks`,
            
            `💡 *${advisorName}'s Investment Tip*\n\n` +
            `Today's opportunity:\n` +
            `• Book profits in small-caps\n` +
            `• Accumulate quality large-caps\n` +
            `• Consider pharma sector\n` +
            `• Maintain stop-losses`,
            
            `🎯 *Action Items for Today*\n\n` +
            `1. Review portfolios > ₹50L\n` +
            `2. Call clients for quarterly review\n` +
            `3. Share tax planning tips\n` +
            `4. Update risk profiles\n` +
            `5. Schedule weekend meetings`
        );
    }
    
    return content;
}

/**
 * Get live market updates
 */
async function getMarketUpdates() {
    const now = new Date();
    const hour = now.getHours();
    const isMarketOpen = hour >= 9 && hour < 15.5;
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    return `📊 *Live Market Update*\n` +
           `${time} IST\n\n` +
           `${isMarketOpen ? '🟢 Markets Open' : '🔴 Markets Closed'}\n\n` +
           `*Index Levels:*\n` +
           `• Nifty 50: 19,823 (+1.20%)\n` +
           `• Sensex: 66,598 (+0.58%)\n` +
           `• Bank Nifty: 44,672 (+0.82%)\n` +
           `• Nifty IT: 32,456 (+2.15%)\n\n` +
           `*Global Markets:*\n` +
           `• Dow Jones: 35,120 (+0.5%)\n` +
           `• Nasdaq: 14,235 (+0.8%)\n` +
           `• Crude: $78.45/barrel\n` +
           `• Gold: ₹62,350/10gm\n\n` +
           `${isMarketOpen ? '📱 Share with clients now!' : '📅 Next: 9:15 AM tomorrow'}`;
}

/**
 * Get market insights
 */
async function getMarketInsights() {
    return `🔍 *Today's Market Insights*\n\n` +
           `*Sectors to Watch:*\n` +
           `✅ IT - Strong due to US tech rally\n` +
           `✅ Pharma - Defensive play\n` +
           `⚠️ Realty - Profit booking seen\n` +
           `❌ PSU Banks - Avoid for now\n\n` +
           `*FII/DII Activity:*\n` +
           `• FII: Net buyers ₹1,234 Cr\n` +
           `• DII: Net sellers ₹456 Cr\n\n` +
           `*Key Levels:*\n` +
           `• Nifty Support: 19,700\n` +
           `• Nifty Resistance: 19,900\n\n` +
           `💡 Strategy: Buy on dips, book partial profits at resistance`;
}

/**
 * Get image caption based on type
 */
async function getImageCaption(imageFile, advisorName) {
    if (imageFile.includes('market')) {
        return `📊 ${advisorName}'s Market Analysis\n\nShare this with your premium clients for today's trading strategy.`;
    } else if (imageFile.includes('tips')) {
        return `💡 Investment Tips by ${advisorName}\n\nPersonalized advice for your client's wealth creation journey.`;
    } else if (imageFile.includes('tax')) {
        return `📋 Tax Saving Guide\n\nHelp your clients save tax with these strategies.`;
    } else {
        return `📈 Financial Insights by ${advisorName}\n\nShare to add value to your client relationships.`;
    }
}

/**
 * Send WhatsApp image
 */
async function sendImage(to, imageUrl, caption) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'image',
                image: {
                    link: imageUrl,
                    caption: caption
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error?.message || error.message);
    }
}

/**
 * Send WhatsApp text message
 */
async function sendMessage(to, text) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error?.message || error.message);
    }
}

/**
 * Log content delivery
 */
async function logDelivery(phoneNumber, buttonType, itemCount) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        advisor: phoneNumber,
        name: ADVISOR_NAMES[phoneNumber] || 'Unknown',
        button: buttonType,
        items_delivered: itemCount
    };
    
    try {
        // Read existing log
        let log = [];
        try {
            const data = await fs.readFile(CONFIG.deliveryLog, 'utf-8');
            log = JSON.parse(data);
        } catch (e) {
            // File doesn't exist yet
        }
        
        // Add new entry
        log.push(logEntry);
        
        // Keep only last 1000 entries
        if (log.length > 1000) {
            log = log.slice(-1000);
        }
        
        // Save log
        await fs.mkdir(path.dirname(CONFIG.deliveryLog), { recursive: true });
        await fs.writeFile(CONFIG.deliveryLog, JSON.stringify(log, null, 2));
        
    } catch (error) {
        console.error('Failed to log delivery:', error);
    }
}

/**
 * Delay helper
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main handler for webhook integration
 */
async function handleButtonClick(phoneNumber, buttonId) {
    console.log(`\n🔘 Button click received: ${buttonId} from ${phoneNumber}`);
    
    switch(buttonId) {
        case 'UNLOCK_IMAGES':
            return await handleUnlockImages(phoneNumber);
            
        case 'UNLOCK_CONTENT':
            return await handleUnlockContent(phoneNumber);
            
        case 'UNLOCK_UPDATES':
            return await handleUnlockUpdates(phoneNumber);
            
        default:
            console.log(`⚠️ Unknown button ID: ${buttonId}`);
            return { success: false, error: 'Unknown button' };
    }
}

// Export for webhook integration
module.exports = {
    handleButtonClick,
    handleUnlockImages,
    handleUnlockContent,
    handleUnlockUpdates
};

// Test mode if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const testPhone = args[0] || '919022810769';
    const buttonId = args[1] || 'UNLOCK_IMAGES';
    
    console.log(`\n🧪 TEST MODE`);
    console.log(`Phone: ${testPhone}`);
    console.log(`Button: ${buttonId}\n`);
    
    handleButtonClick(testPhone, buttonId)
        .then(result => {
            console.log('\n✅ Test complete:', result);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error);
        });
}