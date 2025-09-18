/**
 * FinAdvise Webhook for Vercel
 * Handles Facebook webhook verification and WhatsApp message processing
 */

const advisors = [
    { name: 'Shruti Petkar', phone: '919673758777', arn: 'ARN_SHRUTI_001' },
    { name: 'Vidyadhar Petkar', phone: '918975758513', arn: 'ARN_VIDYADHAR_002' },
    { name: 'Shriya Vallabh Petkar', phone: '919765071249', arn: 'ARN_SHRIYA_003' },
    { name: 'Mr. Tranquil Veda', phone: '919022810769', arn: 'ADV_004' }
];

// Environment variables (will be set in Vercel dashboard)
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

function findAdvisorByPhone(phone) {
    return advisors.find(advisor => {
        const cleanPhone = (p) => p.replace(/[+\s-]/g, '');
        const inputClean = cleanPhone(phone);
        const advisorClean = cleanPhone(advisor.phone);
        return advisorClean.endsWith(inputClean.slice(-10)) || inputClean.endsWith(advisorClean.slice(-10));
    });
}

// Send market summary
async function sendMarketSummary(advisor) {
    const summary = `📊 Today's Market Summary (Sep 19, 2025)

🔹 SENSEX: 82,876 (+0.22%)
🔹 NIFTY: 25,423 (+0.37%)
🔹 IT Sector: +4.41% (Top Performer)
🔹 PSU Banks: +2% (Near 52-week high)

📈 Key Highlights:
• IT sector leads with strong performance
• Banking stocks show momentum
• FII vs DII flow turning positive
• Inflation at historic lows (3.16%)

💡 For ${advisor.name}:
Consider reviewing tech allocation in client portfolios. PSU banking presents interesting opportunities.

Market data as of 3:30 PM IST
ARN: ${advisor.arn}`;

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
                type: "text",
                text: { body: summary }
            })
        });
        const result = await response.json();
        console.log('📊 Market summary sent:', result.messages ? 'Success' : 'Failed');
        return !!result.messages;
    } catch (error) {
        console.log('❌ Error sending market summary:', error.message);
        return false;
    }
}

// Send LinkedIn post
async function sendLinkedInPost(advisor) {
    const post = `💼 Your LinkedIn Post Ready:

"Market momentum continues as IT sector outperforms with +4.41% gains today.

Key observations:
🔹 Technology stocks leading the charge
🔹 PSU banks approaching 52-week highs
🔹 Domestic institutional flow strengthening

For investors, this presents opportunities to review tech allocation and consider rebalancing strategies.

What's your take on the current IT sector rally?

#WealthManagement #MarketUpdate #ITStocks #FinAdvise

---
${advisor.name}
${advisor.arn}
'Building Wealth, Creating Trust'

Mutual fund investments are subject to market risks."

💡 Ready to copy and post on LinkedIn!`;

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
                type: "text",
                text: { body: post }
            })
        });
        const result = await response.json();
        console.log('💼 LinkedIn post sent:', result.messages ? 'Success' : 'Failed');
        return !!result.messages;
    } catch (error) {
        console.log('❌ Error sending LinkedIn post:', error.message);
        return false;
    }
}

export default async function handler(req, res) {
    console.log(`🎯 Webhook ${req.method} request received`);

    // Handle GET request (webhook verification)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('🔍 Webhook verification:', { mode, token, challenge });

        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            return res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed');
            return res.status(403).json({ error: 'Verification failed' });
        }
    }

    // Handle POST request (webhook events)
    if (req.method === 'POST') {
        console.log('📱 Webhook data received:', JSON.stringify(req.body, null, 2));

        try {
            const { entry } = req.body;

            if (entry && entry[0] && entry[0].changes) {
                for (const change of entry[0].changes) {
                    const value = change.value;

                    if (value.messages) {
                        for (const message of value.messages) {
                            const fromPhone = message.from;
                            const advisor = findAdvisorByPhone(fromPhone);

                            if (!advisor) {
                                console.log(`❌ Unknown phone: ${fromPhone}`);
                                continue;
                            }

                            console.log(`📱 Message from: ${advisor.name} (${fromPhone})`);

                            // Handle different button payload formats
                            const isButtonClick = message.interactive?.button_reply ||
                                                 message.button?.payload ||
                                                 message.type === 'button';

                            const isTextTrigger = message.text &&
                                                 message.text.body.toLowerCase().includes('content');

                            console.log(`📝 Message type: ${message.type}`);
                            console.log(`📝 Interactive: ${JSON.stringify(message.interactive)}`);
                            console.log(`📝 Button: ${JSON.stringify(message.button)}`);

                            if (isButtonClick || isTextTrigger) {

                                console.log('🚀 Delivering content packages...');

                                // Send market summary first
                                await sendMarketSummary(advisor);

                                // Wait 2 seconds between messages
                                await new Promise(resolve => setTimeout(resolve, 2000));

                                // Send LinkedIn post
                                await sendLinkedInPost(advisor);

                                console.log(`✅ Complete content delivered to ${advisor.name}!`);
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