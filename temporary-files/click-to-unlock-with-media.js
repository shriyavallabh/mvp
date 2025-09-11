const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * PRODUCTION CLICK-TO-UNLOCK WITH MEDIA/IMAGES
 * Delivers rich media content on button click
 */

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    verifyToken: 'jarvish_webhook_2024',
    port: 3000
};

// Pre-uploaded media IDs (you need to upload these first)
const MEDIA_LIBRARY = {
    market_update: {
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', // Stock market chart
        mediaId: null, // Will be set after upload
        caption: `📊 *Today's Market Snapshot*

Nifty 50: 19,783 (+1.2%) 📈
Sensex: 66,428 (+380 pts)
Bank Nifty: 44,567 (+0.8%)

*Top Gainers:*
• HDFC Bank +2.3%
• Infosys +1.8%
• Reliance +1.5%

*Investment Tip:* Consider systematic investment in quality large-cap stocks during market corrections.`
    },
    investment_strategy: {
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', // Investment strategy
        mediaId: null,
        caption: `💰 *Smart Investment Strategy*

*Recommended Portfolio Allocation:*
• Equity: 60%
• Debt: 25%
• Gold: 10%
• Emergency Fund: 5%

*SIP Recommendations:*
₹10,000/month can grow to ₹1 Cr in 20 years at 12% CAGR

Share this with clients to demonstrate long-term wealth creation!`
    },
    tax_saving: {
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', // Tax planning
        mediaId: null,
        caption: `📋 *Tax Saving Guide FY 2024-25*

*Section 80C (₹1.5L limit):*
• ELSS Funds
• PPF/EPF
• Life Insurance
• Home Loan Principal

*Additional Deductions:*
• NPS: ₹50,000 (80CCD)
• Health Insurance: ₹25,000-₹1L
• Education Loan Interest

*Action:* Help clients save up to ₹78,000 in taxes!`
    }
};

console.log('\n🚀 CLICK-TO-UNLOCK WITH RICH MEDIA');
console.log('=' .repeat(70));
console.log('Starting server with media delivery capability...\n');

// Upload media to WhatsApp
async function uploadMedia(imageUrl, caption) {
    console.log(`📤 Uploading media: ${imageUrl.substring(0, 50)}...`);
    
    try {
        // First, upload the image
        const uploadResponse = await axios.post(
            `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/media`,
            {
                messaging_product: 'whatsapp',
                type: 'image',
                link: imageUrl
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const mediaId = uploadResponse.data.id;
        console.log(`   ✅ Uploaded! Media ID: ${mediaId}`);
        return mediaId;
    } catch (error) {
        console.error(`   ❌ Upload failed:`, error.response?.data || error.message);
        return null;
    }
}

// Initialize media library
async function initializeMedia() {
    console.log('📚 Initializing media library...\n');
    
    for (const [key, media] of Object.entries(MEDIA_LIBRARY)) {
        media.mediaId = await uploadMedia(media.imageUrl, media.caption);
        await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
    
    console.log('\n✅ Media library ready!\n');
}

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === CONFIG.verifyToken) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Forbidden');
    }
});

// Handle webhook events
app.post('/webhook', async (req, res) => {
    const body = req.body;
    
    console.log(`\n[${new Date().toISOString()}] Event received`);
    
    // Always respond immediately
    res.status(200).send('OK');
    
    // Process events
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    
    for (const message of messages) {
        if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            const buttonId = message.interactive.button_reply.id;
            const from = message.from;
            
            console.log(`\n🔘 BUTTON CLICK DETECTED`);
            console.log(`   From: ${from}`);
            console.log(`   Button: ${buttonId}`);
            
            // Check if this is an unlock request
            if (buttonId.includes('UNLOCK_MEDIA')) {
                await handleMediaUnlock(from, buttonId);
            }
        }
    }
});

// Handle media unlock request
async function handleMediaUnlock(advisorPhone, buttonId) {
    console.log(`\n📬 Processing media unlock request from ${advisorPhone}`);
    console.log(`   Delivering 3 media messages with images...`);
    
    const mediaItems = Object.values(MEDIA_LIBRARY);
    
    for (let i = 0; i < mediaItems.length; i++) {
        const media = mediaItems[i];
        
        try {
            // Send image with caption
            if (media.mediaId) {
                // Use pre-uploaded media
                await sendMediaMessage(advisorPhone, media.mediaId, media.caption);
            } else {
                // Fallback to URL-based sending
                await sendImageByUrl(advisorPhone, media.imageUrl, media.caption);
            }
            
            console.log(`   ✅ Media ${i + 1}/${mediaItems.length} sent`);
            
            // Wait between messages
            if (i < mediaItems.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`   ❌ Failed to send media ${i + 1}:`, error.message);
        }
    }
    
    // Send final text with CTA
    await sendFollowUpMessage(advisorPhone);
    
    console.log(`   ✅ Media delivery complete for ${advisorPhone}`);
}

// Send media message using media ID
async function sendMediaMessage(to, mediaId, caption) {
    const response = await axios.post(
        `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to: to,
            type: 'image',
            image: {
                id: mediaId,
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
}

// Send image by URL
async function sendImageByUrl(to, imageUrl, caption) {
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
}

// Send follow-up message
async function sendFollowUpMessage(to) {
    const response = await axios.post(
        `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: `✅ *Content Delivered Successfully!*

You've received:
📊 Market Update Chart
💰 Investment Strategy Infographic  
📋 Tax Saving Guide

*Next Steps:*
1. Share these insights with your clients
2. Use images in your social media posts
3. Include in client presentations

*Pro Tip:* Save these images for quick client responses!

Need more content? Reply "MORE" for additional resources.

_FinAdvise - Your Success Partner_`
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
}

// Send UTILITY template with media unlock button
async function sendMediaUnlockTemplate(advisorPhone, advisorName) {
    console.log(`\n📤 Sending media unlock template to ${advisorName} (${advisorPhone})`);
    
    const buttonId = `UNLOCK_MEDIA_${Date.now()}`;
    
    const response = await axios.post(
        `https://graph.facebook.com/v23.0/${CONFIG.phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            to: advisorPhone,
            type: 'interactive',
            interactive: {
                type: 'button',
                header: {
                    type: 'text',
                    text: '🎨 Visual Content Package'
                },
                body: {
                    text: `Hi ${advisorName}!

Today's visual content package is ready with:

📊 *Market Analysis Charts*
📈 *Investment Infographics*
📋 *Tax Planning Visuals*

These high-quality images are:
✓ Ready to share on WhatsApp
✓ Perfect for social media
✓ Professional & branded
✓ Updated with latest data

Click below to receive 3 shareable images with captions.`
                },
                footer: {
                    text: 'FinAdvise Premium Content'
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: buttonId,
                                title: '🖼️ Get Images'
                            }
                        }
                    ]
                }
            }
        },
        {
            headers: {
                'Authorization': `Bearer ${CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );
    
    console.log(`   ✅ Template sent! Button ID: ${buttonId}`);
    return response.data;
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'click-to-unlock-media',
        mediaLibrarySize: Object.keys(MEDIA_LIBRARY).length
    });
});

// Start server
app.listen(CONFIG.port, async () => {
    console.log(`✅ Server running on port ${CONFIG.port}`);
    
    // Initialize media library
    await initializeMedia();
    
    console.log('Ready to deliver media content!\n');
});

// Export for testing
module.exports = { sendMediaUnlockTemplate, handleMediaUnlock };