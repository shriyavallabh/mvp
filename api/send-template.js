/**
 * Vercel API Endpoint to Send WhatsApp Template
 * This should work without appsecret_proof when deployed
 */

export default async function handler(req, res) {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '574744175733556';
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD';

    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ready',
            message: 'WhatsApp Template Sender API',
            endpoint: '/api/send-template',
            usage: 'POST with { phone: "919765071249", template: "hello_world" }'
        });
    }

    if (req.method === 'POST') {
        const { phone = '919765071249', template = 'hello_world', language = 'en_US' } = req.body || {};

        try {
            console.log(`Sending ${template} to ${phone}`);

            const payload = {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: template,
                    language: {
                        code: language
                    }
                }
            };

            const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.messages && result.messages[0]) {
                console.log('✅ Template sent successfully');
                return res.status(200).json({
                    success: true,
                    message: 'Template sent successfully',
                    messageId: result.messages[0].id,
                    to: phone,
                    template: template
                });
            } else {
                console.error('Failed to send:', result);
                return res.status(400).json({
                    success: false,
                    error: result.error || 'Failed to send template',
                    details: result
                });
            }
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}