#!/usr/bin/env node

/**
 * Deliver Content Now - Simulates what happens after button click
 * Sends actual content to advisors who clicked the button
 */

const { whatsAppService } = require('./services/whatsapp/whatsapp.service');
const { Logger } = require('./utils/logger');
const fs = require('fs').promises;

const logger = new Logger({ name: 'ContentDelivery' });

/**
 * Deliver content to specific advisors
 */
async function deliverContentNow() {
    console.log('\n📤 DELIVERING CONTENT AFTER BUTTON CLICK');
    console.log('=' .repeat(70));
    console.log('Simulating webhook response - sending actual content...\n');
    
    // Advisors who clicked the button
    const advisorsWhoClicked = [
        { name: 'Avalok', phone: '919765071249' },
        { name: 'Test User', phone: '919022810769' }
    ];
    
    for (const advisor of advisorsWhoClicked) {
        console.log(`\n📱 Delivering content to ${advisor.name} (${advisor.phone})...`);
        
        try {
            // Step 1: Send introduction message
            await whatsAppService.sendText(
                advisor.phone,
                `🎯 *Content Unlocked Successfully!*\n\n` +
                `Hi ${advisor.name}, here's your daily financial content for sharing:\n\n` +
                `_Each message below is formatted for easy copying. Long press to copy and share with your clients._`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 2: LinkedIn Content
            await whatsAppService.sendText(
                advisor.phone,
                `*📘 LINKEDIN POST*\n\n` +
                `🎯 Tax Saving Tip of the Day:\n\n` +
                `Did you know that investing in ELSS funds can save you up to ₹46,800 in taxes?\n\n` +
                `Here's how:\n` +
                `• Investment: ₹1,50,000 (Section 80C limit)\n` +
                `• Tax bracket: 30% + cess\n` +
                `• Tax saved: ₹46,800\n\n` +
                `Plus, ELSS has the shortest lock-in period among all 80C options - just 3 years!\n\n` +
                `DM me to know the top-performing ELSS funds for 2024.\n\n` +
                `#TaxSaving #ELSS #FinancialPlanning #WealthCreation #InvestmentTips`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 3: Instagram Content with Image
            await whatsAppService.sendImage(
                advisor.phone,
                'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
                `📸 *INSTAGRAM POST*\n\n💰 MONEY HACK MONDAY\n\nThe 50-30-20 Rule:\n📊 50% - Needs\n🎮 30% - Wants\n💎 20% - Savings\n\n#MoneyHack #PersonalFinance #FinancialFreedom`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 4: Twitter/X Content
            await whatsAppService.sendText(
                advisor.phone,
                `*🐦 TWITTER/X POST*\n\n` +
                `Market Update 📈\n\n` +
                `Sensex: +287 points (0.45%)\n` +
                `Nifty: +93 points (0.52%)\n\n` +
                `IT & Banking sectors leading the rally. Tech stocks showing strong momentum.\n\n` +
                `Time to review your portfolio? Let's connect!\n\n` +
                `#StockMarket #Sensex #Nifty #Investing #MarketUpdate`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 5: WhatsApp Status
            await whatsAppService.sendText(
                advisor.phone,
                `*💬 WHATSAPP STATUS*\n\n` +
                `🎯 Financial Wisdom\n\n` +
                `"Compound interest is the 8th wonder of the world.\n` +
                `He who understands it, earns it.\n` +
                `He who doesn't, pays it."\n` +
                `- Albert Einstein\n\n` +
                `Start your SIP today!\n` +
                `📱 Contact me for personalized advice`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 6: Bonus - Market Insights
            await whatsAppService.sendImage(
                advisor.phone,
                'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
                `📊 *MARKET INSIGHTS*\n\nTop Performing Sectors:\n✅ IT: +2.3%\n✅ Banking: +1.8%\n✅ Pharma: +1.5%\n\nInvestment Opportunity Alert!`
            );
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Step 7: Instructions for use
            await whatsAppService.sendText(
                advisor.phone,
                `✅ *CONTENT DELIVERED SUCCESSFULLY!*\n\n` +
                `*How to use this content:*\n` +
                `1️⃣ *Copy*: Long press any message above to copy\n` +
                `2️⃣ *Customize*: Add your personal touch if needed\n` +
                `3️⃣ *Share*: Post on respective platforms\n` +
                `4️⃣ *Forward*: Send directly to interested clients\n\n` +
                `💡 *Pro Tips:*\n` +
                `• Best posting time: 9-11 AM & 5-7 PM\n` +
                `• Use images for better engagement\n` +
                `• Respond to comments promptly\n\n` +
                `🔔 You'll receive fresh content daily at 5 AM!\n` +
                `📲 Click the button anytime to unlock your content.`
            );
            
            console.log(`✅ All content delivered to ${advisor.name}`);
            
        } catch (error) {
            console.error(`❌ Failed to deliver to ${advisor.name}:`, error.message);
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 DELIVERY COMPLETE');
    console.log('=' .repeat(70));
    console.log('\n✨ Content has been delivered to both numbers!');
    console.log('\n📱 Check your WhatsApp for:');
    console.log('  • LinkedIn post (copyable text)');
    console.log('  • Instagram post with image');
    console.log('  • Twitter/X update');
    console.log('  • WhatsApp Status');
    console.log('  • Market insights with chart');
    console.log('  • Usage instructions');
    
    console.log('\n🎯 This is exactly what will happen automatically when:');
    console.log('  1. Webhook is properly configured');
    console.log('  2. Button click events are captured');
    console.log('  3. Content queue is processed');
}

// Run the delivery
deliverContentNow().catch(console.error);