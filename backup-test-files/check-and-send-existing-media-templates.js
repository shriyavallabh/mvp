const dotenv = require('dotenv');
dotenv.config();

#!/usr/bin/env node

/**
 * Check for existing media templates and send them
 * Alternative approach when Resumable Upload fails
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const FormData = require('form-data');

const config = {
    wabaId: '1861646317956355',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    apiVersion: 'v18.0' // Staying with v18.0 since v23.0 is rejecting
};

/**
 * Check all templates to find any with IMAGE headers
 */
async function findImageTemplates() {
    console.log('🔍 Searching for templates with IMAGE headers...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/message_templates?limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        const templates = response.data.data || [];
        const imageTemplates = [];
        
        templates.forEach(template => {
            const hasImageHeader = template.components?.some(
                c => c.type === 'HEADER' && c.format === 'IMAGE'
            );
            
            if (hasImageHeader && template.status === 'APPROVED') {
                imageTemplates.push(template);
                console.log(`✅ Found approved IMAGE template: ${template.name}`);
                console.log(`   Language: ${template.language}`);
                console.log(`   Category: ${template.category}`);
            }
        });
        
        if (imageTemplates.length === 0) {
            console.log('❌ No approved templates with IMAGE headers found');
            
            // Check pending templates
            const pendingImageTemplates = templates.filter(t => 
                t.status === 'PENDING' && 
                t.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')
            );
            
            if (pendingImageTemplates.length > 0) {
                console.log('\n⏳ Found PENDING templates with IMAGE headers:');
                pendingImageTemplates.forEach(t => {
                    console.log(`   - ${t.name} (${t.status})`);
                });
            }
        }
        
        return imageTemplates;
        
    } catch (error) {
        console.error('Error fetching templates:', error.response?.data || error.message);
        return [];
    }
}

/**
 * Create a financial image
 */
async function createFinancialImage(advisorName) {
    console.log(`\n🎨 Creating image for ${advisorName}...`);
    
    const width = 1200;
    const height = 628;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0891b2');
    gradient.addColorStop(1, '#075985');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Pattern overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 50 + 20, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('FINANCIAL UPDATE', width / 2, 120);
    
    ctx.font = '48px Arial';
    ctx.fillText(`For ${advisorName}`, width / 2, 190);
    
    ctx.font = '32px Arial';
    ctx.fillText(new Date().toLocaleDateString('en-IN'), width / 2, 240);
    
    // Data visualization
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(100, 280, 1000, 250);
    
    // Chart bars
    const data = [65, 80, 95, 75, 88, 92];
    const barWidth = 120;
    const maxHeight = 150;
    
    data.forEach((value, i) => {
        const barHeight = (value / 100) * maxHeight;
        const x = 180 + i * (barWidth + 30);
        const y = 480 - barHeight;
        
        // Bar
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}%`, x + barWidth/2, y - 10);
        
        // Label
        ctx.fillStyle = '#374151';
        ctx.font = '20px Arial';
        ctx.fillText(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i], x + barWidth/2, 510);
    });
    
    // Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FinAdvise - Your Wealth Partner', width / 2, 580);
    
    // Save
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
    const fileName = `financial_update_${advisorName.toLowerCase()}_${Date.now()}.jpg`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`   ✅ Image created: ${fileName}`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    return filePath;
}

/**
 * Upload image to WhatsApp
 */
async function uploadImage(imagePath) {
    console.log('   📤 Uploading image to WhatsApp...');
    
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('file', fs.createReadStream(imagePath));
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${config.accessToken}`
                }
            }
        );
        
        console.log(`   ✅ Uploaded with media ID: ${response.data.id}`);
        return response.data.id;
        
    } catch (error) {
        console.error('   ❌ Upload failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Send media template or alternative solution
 */
async function sendToAdvisor(advisor, imageTemplates) {
    console.log(`\n📨 Sending to ${advisor.name} (${advisor.phone})`);
    
    // Create and upload image
    const imagePath = await createFinancialImage(advisor.name);
    const mediaId = await uploadImage(imagePath);
    
    // Option 1: If we have an image template, use it
    if (imageTemplates.length > 0) {
        const template = imageTemplates[0];
        console.log(`   Using template: ${template.name}`);
        
        const message = {
            messaging_product: 'whatsapp',
            to: advisor.phone,
            type: 'template',
            template: {
                name: template.name,
                language: { code: template.language || 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [{
                            type: 'image',
                            image: { id: mediaId }
                        }]
                    }
                ]
            }
        };
        
        // Add body parameters if template has them
        if (template.components?.some(c => c.type === 'BODY' && c.text?.includes('{{'))) {
            message.template.components.push({
                type: 'body',
                parameters: [
                    { type: 'text', text: advisor.name }
                ]
            });
        }
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                message,
                {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`   ✅ Template sent: ${response.data.messages[0].id}`);
            return { success: true, type: 'template', messageId: response.data.messages[0].id };
            
        } catch (error) {
            console.error(`   ❌ Template failed:`, error.response?.data || error.message);
        }
    }
    
    // Option 2: Try interactive message with image
    console.log('   Trying interactive message with image...');
    
    const interactiveMessage = {
        messaging_product: 'whatsapp',
        to: advisor.phone,
        type: 'interactive',
        interactive: {
            type: 'button',
            header: {
                type: 'image',
                image: { id: mediaId }
            },
            body: {
                text: `Good morning ${advisor.name}! 📊\n\nYour daily financial update is ready:\n\n💰 Portfolio: ₹25,00,000 (+12.5%)\n📈 Market: Nifty +2.3%, Sensex +2.1%\n💡 Action: Review ELSS for tax savings\n\nYour wealth journey continues with smart decisions.`
            },
            footer: {
                text: 'FinAdvise - Building Wealth Together'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'view_details',
                            title: 'View Details'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'call_advisor',
                            title: 'Call Advisor'
                        }
                    }
                ]
            }
        }
    };
    
    try {
        const response = await axios.post(
            `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
            interactiveMessage,
            {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`   ✅ Interactive message sent: ${response.data.messages[0].id}`);
        return { success: true, type: 'interactive', messageId: response.data.messages[0].id };
        
    } catch (error) {
        console.error(`   ❌ Interactive failed:`, error.response?.data || error.message);
        
        // Option 3: Try simple image message
        console.log('   Trying simple image message...');
        
        const imageMessage = {
            messaging_product: 'whatsapp',
            to: advisor.phone,
            type: 'image',
            image: {
                id: mediaId,
                caption: `Good morning ${advisor.name}! 🌟\n\n📊 *Your Daily Financial Update*\n\n*Portfolio Highlights:*\n• Current Value: ₹25,00,000\n• Monthly Return: +12.5%\n• YTD Performance: +28.3%\n\n*Market Overview:*\n• Nifty: 22,150 (+2.3%)\n• Sensex: 73,200 (+2.1%)\n• Gold: ₹62,500/10g\n\n*Today's Action Items:*\n1. Review ELSS for ₹1.95L tax saving\n2. Consider profit booking in mid-caps\n3. Rebalance portfolio (60:40 equity-debt)\n\n*Personalized Tip:*\nBased on your profile, increase large-cap allocation for stability.\n\nReply PORTFOLIO for detailed analysis.\n\n_FinAdvise - Your Trusted Partner_`
            }
        };
        
        try {
            const response = await axios.post(
                `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
                imageMessage,
                {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`   ✅ Image message sent: ${response.data.messages[0].id}`);
            return { success: true, type: 'image', messageId: response.data.messages[0].id };
            
        } catch (error) {
            console.error(`   ❌ Image message failed:`, error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 WHATSAPP MEDIA DELIVERY - ALTERNATIVE APPROACH');
    console.log('=' .repeat(60));
    console.log('Checking for existing templates and sending media');
    console.log('=' .repeat(60));
    
    // Step 1: Find image templates
    const imageTemplates = await findImageTemplates();
    
    if (imageTemplates.length === 0) {
        console.log('\n⚠️ No image templates available');
        console.log('Will try alternative methods (interactive/direct)');
    }
    
    // Step 2: Send to advisors
    console.log('\n📨 SENDING TO ADVISORS');
    console.log('=' .repeat(60));
    
    const advisors = [
        { name: 'Avalok', phone: '919765071249' },
        { name: 'Shruti', phone: '919673758777' },
        { name: 'Vidyadhar', phone: '918975758513' }
    ];
    
    const results = [];
    
    for (const advisor of advisors) {
        const result = await sendToAdvisor(advisor, imageTemplates);
        results.push({ ...result, advisor: advisor.name });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DELIVERY SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Messages sent: ${successful}/${results.length}`);
    
    results.forEach(r => {
        if (r.success) {
            console.log(`   ✅ ${r.advisor}: ${r.type} message sent`);
            console.log(`      ID: ${r.messageId}`);
        } else {
            console.log(`   ❌ ${r.advisor}: Failed`);
        }
    });
    
    console.log('\n📱 PLEASE CHECK YOUR WHATSAPP NOW!');
    console.log('=' .repeat(60));
    console.log('Check for messages from: +91 76666 84471');
    console.log('On your phone: 9765071249');
    console.log('\n🔍 What to look for:');
    console.log('1. Interactive message with image and buttons');
    console.log('2. OR simple image with caption');
    console.log('3. Check all folders (main, requests, spam)');
    
    console.log('\n❓ HAVE YOU RECEIVED THE IMAGE+TEXT MESSAGE?');
    console.log('Please confirm yes or no.');
}

// Execute
main().catch(console.error);