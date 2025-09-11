/**
 * WhatsApp Business API Configuration
 * CRITICAL: All secrets must be in environment variables
 * 
 * V2 Deliverability Engine Configuration
 */

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID', 
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_APP_ID',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please set these in your .env file');
    process.exit(1);
}

// Graph API version standardization
const GRAPH_API_VERSION = 'v23.0';

module.exports = {
    // Meta App Configuration
    app: {
        id: process.env.WHATSAPP_APP_ID,
        secret: process.env.WHATSAPP_APP_SECRET
    },

    // WhatsApp Business Account
    waba: {
        id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN
    },

    // API Configuration
    api: {
        version: GRAPH_API_VERSION,
        baseUrl: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
        timeout: 30000 // 30 seconds
    },

    // Webhook Configuration
    webhook: {
        verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
        port: process.env.WEBHOOK_PORT || 5001,
        endpoint: '/webhooks/whatsapp'
    },

    // Template Names (to be configured per deployment)
    templates: {
        media: {
            dailyUpdate: process.env.TEMPLATE_MEDIA_DAILY || 'daily_financial_update_v2',
            utility: process.env.TEMPLATE_MEDIA_UTILITY || 'market_alert_utility'
        },
        text: {
            fallback: process.env.TEMPLATE_TEXT_FALLBACK || 'daily_update_link',
            notification: process.env.TEMPLATE_TEXT_NOTIFICATION || 'simple_notification'
        }
    },

    // CDN Configuration
    cdn: {
        baseUrl: process.env.CDN_BASE_URL || 'https://finadvise.app/images',
        ogPageUrl: process.env.OG_PAGE_BASE_URL || 'https://finadvise.app/daily'
    },

    // Delivery Configuration
    delivery: {
        // Pacing configuration
        pacing: {
            cohortsPerMinute: parseInt(process.env.COHORT_RATE || '500'),
            concurrentWorkers: parseInt(process.env.CONCURRENT_WORKERS || '20'),
            retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || '3'),
            retryDelay: parseInt(process.env.RETRY_DELAY || '5000') // 5 seconds
        },
        
        // Timeouts
        timeouts: {
            webhookDelivery: parseInt(process.env.WEBHOOK_TIMEOUT || '120000'), // 2 minutes
            fallbackTrigger: parseInt(process.env.FALLBACK_TIMEOUT || '60000')  // 1 minute
        },

        // Cool-off periods (in hours)
        coolOff: {
            policyDrop: parseInt(process.env.COOLOFF_POLICY || '72'),
            undeliverable: parseInt(process.env.COOLOFF_UNDELIVERABLE || '24')
        }
    },

    // Feature Flags
    features: {
        useMediaId: process.env.USE_MEDIA_ID === 'true',
        usePublicLink: process.env.USE_PUBLIC_LINK !== 'false', // Default true
        enableFallback: process.env.ENABLE_FALLBACK !== 'false', // Default true
        enableWebhooks: process.env.ENABLE_WEBHOOKS !== 'false', // Default true
        debugMode: process.env.DEBUG_MODE === 'true'
    },

    // Monitoring & Alerts
    monitoring: {
        alertThreshold: {
            failureRate: parseFloat(process.env.ALERT_FAILURE_RATE || '0.1'), // 10%
            deliveryRate: parseFloat(process.env.ALERT_DELIVERY_RATE || '0.8') // 80%
        },
        slackWebhook: process.env.SLACK_WEBHOOK_URL,
        adminNumbers: process.env.ADMIN_WHATSAPP_NUMBERS?.split(',') || []
    }
};