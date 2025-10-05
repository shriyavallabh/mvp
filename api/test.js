export default async function handler(req, res) {
    return res.status(200).json({
        message: 'FinAdvise Webhook Active on Vercel',
        domain: 'jarvisdaily.com',
        platform: 'vercel',
        timestamp: new Date().toISOString(),
        status: 'production_ready',
        endpoints: {
            webhook: '/webhook',
            health: '/health',
            test: '/test'
        }
    });
}