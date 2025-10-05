export default async function handler(req, res) {
    return res.status(200).json({
        status: 'healthy',
        domain: 'jarvisdaily.com',
        platform: 'vercel',
        advisors: 4,
        timestamp: new Date().toISOString(),
        webhook_url: 'https://jarvisdaily.com/webhook',
        verify_token: process.env.WEBHOOK_VERIFY_TOKEN || 'finadvise-webhook-2024'
    });
}