/**
 * FinAdvise Webhook for Vercel
 * Handles Facebook webhook verification and WhatsApp message processing
 * Updated with quick reply button for content retrieval
 */

const advisors = [
    { name: 'Shruti Petkar', phone: '919673758777', arn: 'ARN_SHRUTI_001' },
    { name: 'Vidyadhar Petkar', phone: '918975758513', arn: 'ARN_VIDYADHAR_002' },
    { name: 'Shriya Vallabh Petkar', phone: '919765071249', arn: 'ARN_SHRIYA_003' },
    { name: 'Mr. Tranquil Veda', phone: '919022810769', arn: 'ADV_004' }
];

// Environment variables (will be set in Vercel dashboard)
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '792411637295195';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WEBHOOK_VERIFY_TOKEN || 'finadvise-webhook-2024';

function findAdvisorByPhone(phone) {
    return advisors.find(advisor => {
        const cleanPhone = (p) => p.replace(/[+\s-]/g, '');
        const inputClean = cleanPhone(phone);
        const advisorClean = cleanPhone(advisor.phone);
        return advisorClean.endsWith(inputClean.slice(-10)) || inputClean.endsWith(advisorClean.slice(-10));
    });
}

// Send utility template with quick reply button
async function sendUtilityTemplateWithButton(advisor) {
    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: advisor.phone,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: `Hello ${advisor.name}! Your daily financial content is ready. This includes market insights, LinkedIn post, and WhatsApp status images tailored for you.`
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "retrieve_content",
                                    title: "Retrieve Content"
                                }
                            }
                        ]
                    }
                }
            })
        });
        const result = await response.json();
        console.log('📨 Utility template sent:', result.messages ? 'Success' : 'Failed', result);
        return result;
    } catch (error) {
        console.log('❌ Error sending utility template:', error.message);
        throw error;
    }
}

// Load latest session content for advisor
function loadAdvisorContent(advisor) {
    try {
        const fs = require('fs');
        const path = require('path');

        const outputDir = path.join(process.cwd(), 'output');
        if (!fs.existsSync(outputDir)) {
            throw new Error('No output directory found');
        }

        // Get latest session
        const sessions = fs.readdirSync(outputDir)
            .filter(f => f.startsWith('session_'))
            .sort()
            .reverse();

        if (sessions.length === 0) {
            throw new Error('No sessions found');
        }

        const sessionPath = path.join(outputDir, sessions[0]);

        // Build advisor slug
        const nameParts = advisor.name.toLowerCase().split(' ');
        const advisorSlug = nameParts.join('_');

        // Load WhatsApp message
        const whatsappDir = path.join(sessionPath, 'whatsapp/text');
        let whatsappContent = null;
        if (fs.existsSync(whatsappDir)) {
            const whatsappFiles = fs.readdirSync(whatsappDir)
                .filter(f => f.includes(advisorSlug) && f.includes('msg_1') && f.endsWith('.txt'));
            if (whatsappFiles.length > 0) {
                whatsappContent = fs.readFileSync(path.join(whatsappDir, whatsappFiles[0]), 'utf8');
            }
        }

        // Load LinkedIn post
        const linkedinDir = path.join(sessionPath, 'linkedin/text');
        let linkedinContent = null;
        if (fs.existsSync(linkedinDir)) {
            const linkedinFiles = fs.readdirSync(linkedinDir)
                .filter(f => f.includes(advisorSlug) && f.includes('post_1') && f.endsWith('.txt'));
            if (linkedinFiles.length > 0) {
                linkedinContent = fs.readFileSync(path.join(linkedinDir, linkedinFiles[0]), 'utf8');
            }
        }

        // Load status image path
        const imagesDir = path.join(sessionPath, 'images/status/compliant');
        let imagePath = null;
        if (fs.existsSync(imagesDir)) {
            const imageFiles = fs.readdirSync(imagesDir)
                .filter(f => f.includes(advisorSlug) && f.includes('status_1') && f.endsWith('.png'));
            if (imageFiles.length > 0) {
                imagePath = path.join(imagesDir, imageFiles[0]);
            }
        }

        return { whatsappContent, linkedinContent, imagePath, sessionId: sessions[0] };
    } catch (error) {
        console.log('⚠️ Error loading content:', error.message);
        return null;
    }
}

// Send complete content package
async function sendContentPackage(advisor) {
    console.log('🎯 sendContentPackage called for:', advisor.name);

    // Try to load generated content
    const content = loadAdvisorContent(advisor);

    // Generate app secret proof for API calls
    const crypto = require('crypto');
    const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '1991d7e325d42daef6bc5d6720508ea3';
    const appSecretProof = crypto
        .createHmac('sha256', APP_SECRET)
        .update(ACCESS_TOKEN)
        .digest('hex');

    const messages = [];

    // Add WhatsApp message
    if (content?.whatsappContent) {
        messages.push({
            type: "whatsapp_message",
            content: `📱 WhatsApp Message (ready to forward):\n\n${content.whatsappContent}`
        });
    }

    // Add LinkedIn post
    if (content?.linkedinContent) {
        messages.push({
            type: "linkedin_post",
            content: `💼 LinkedIn Post (copy-paste ready):\n\n${content.linkedinContent}`
        });
    }

    // Add status image instruction
    if (content?.imagePath) {
        messages.push({
            type: "status_image_info",
            content: `📸 WhatsApp Status Image:\n\nYour branded status image is ready!\n\n📁 Session: ${content.sessionId}\n💾 Download from dashboard or contact admin for delivery.\n\n✅ All content generated with Grammy-level virality standards.`
        });
    }

    // Fallback if no content found
    if (messages.length === 0) {
        messages.push({
            type: "notification",
            content: `Hi ${advisor.name},\n\nYour content is being prepared. Please contact the admin for delivery.\n\n📧 Support: jarvisdaily.in`
        });
    }

    console.log('🚀 Sending content package to', advisor.name);
    console.log(`📦 Messages to send: ${messages.length}`);

    for (const message of messages) {
        try {
            const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages?access_token=${ACCESS_TOKEN}&appsecret_proof=${appSecretProof}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: advisor.phone,
                    type: "text",
                    text: { body: message.content }
                })
            });

            const result = await response.json();
            console.log(`✅ ${message.type} sent:`, result.messages ? 'Success' : 'Failed');
            if (!result.messages) {
                console.log('Response:', JSON.stringify(result, null, 2));
            }

            // Wait 2 seconds between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.log(`❌ Error sending ${message.type}:`, error.message);
        }
    }

    console.log(`📦 Content package delivered to ${advisor.name}!`);
}

export default async function handler(req, res) {
    console.log(`🎯 Webhook ${req.method} request received at /webhook`);

    // Validate webhook signature for POST requests
    if (req.method === 'POST') {
        const signature = req.headers['x-hub-signature-256'];
        if (signature) {
            const crypto = require('crypto');
            const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '1991d7e325d42daef6bc5d6720508ea3';
            const expectedSignature = crypto
                .createHmac('sha256', APP_SECRET)
                .update(JSON.stringify(req.body))
                .digest('hex');

            const isValid = `sha256=${expectedSignature}` === signature;
            console.log('🔐 Signature validation:', isValid ? '✅ Valid' : '❌ Invalid');
        } else {
            console.log('⚠️ No signature header found');
        }
    }

    // Handle GET request (webhook verification)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('🔍 Webhook verification:', { mode, token, challenge });
        console.log('📌 Expected token:', WEBHOOK_VERIFY_TOKEN);
        console.log('📌 Token match:', token === WEBHOOK_VERIFY_TOKEN);

        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            return res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed');
            console.log('❌ Mode check:', mode === 'subscribe');
            console.log('❌ Token check:', token === WEBHOOK_VERIFY_TOKEN);
            return res.status(403).json({ error: 'Verification failed' });
        }
    }

    // Handle POST request (webhook events)
    if (req.method === 'POST') {
        console.log('📱 POST received at webhook');
        console.log('📱 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📱 Headers:', JSON.stringify(req.headers, null, 2));

        try {
            const { entry } = req.body;

            if (!entry) {
                console.log('⚠️ No entry field in webhook data');
                return res.status(200).json({ success: true, note: 'no entry' });
            }

            if (entry && entry[0] && entry[0].changes) {
                for (const change of entry[0].changes) {
                    console.log('🔍 Processing change:', JSON.stringify(change, null, 2));
                    const value = change.value;

                    // Check for different WhatsApp event types
                    if (value.statuses) {
                        console.log('📊 Status update received:', JSON.stringify(value.statuses, null, 2));
                        continue;
                    }

                    if (value.messages) {
                        for (const message of value.messages) {
                            const fromPhone = message.from;
                            const advisor = findAdvisorByPhone(fromPhone);

                            if (!advisor) {
                                console.log(`❌ Unknown phone: ${fromPhone}`);
                                continue;
                            }

                            console.log(`📱 Message from: ${advisor.name} (${fromPhone})`);
                            console.log(`📝 Message type: ${message.type}`);
                            console.log(`📝 Full message object:`, JSON.stringify(message, null, 2));

                            // Handle different button click formats
                            const isButtonClick =
                                (message.type === 'interactive' && message.interactive?.button_reply?.id === 'retrieve_content') ||
                                (message.type === 'button' && message.button?.payload === 'retrieve_content') ||
                                (message.button?.text === 'Retrieve Content');

                            if (isButtonClick) {
                                console.log('🔘 BUTTON CLICKED - Sending content!');
                                await sendContentPackage(advisor);
                            }
                            // Handle text message trigger
                            else if (message.type === 'text') {
                                const text = message.text?.body || '';
                                console.log('💬 Text message:', text);
                                if (text.toLowerCase().includes('content') || text.toLowerCase().includes('retrieve')) {
                                    console.log('💬 Text trigger detected - sending content!');
                                    await sendContentPackage(advisor);
                                }
                            }
                            else {
                                console.log('⚠️ Message type not handled:', message.type);
                            }
                        }
                    }
                }
            }

            return res.status(200).json({ success: true });

        } catch (error) {
            console.log('❌ Webhook error:', error.message);
            return res.status(500).json({ error: error.message });
        }
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
}