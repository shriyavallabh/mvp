/**
 * Environment Configuration Service
 * Centralized configuration management with environment variables
 * 
 * SECURITY: All sensitive credentials are loaded from environment variables
 * Never hardcode API keys, tokens, or secrets in source code
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Validates required environment variables are present
 * @param {string[]} required - Array of required env var names
 * @throws {Error} If any required variables are missing
 */
function validateRequiredEnvVars(required) {
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}\nPlease check your .env file or environment configuration.`);
    }
}

/**
 * WhatsApp Business API Configuration
 */
const whatsAppConfig = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'secure_webhook_token_2024',
    apiVersion: 'v21.0',
    baseUrl: 'https://graph.facebook.com',
    
    /**
     * Get the full API URL for WhatsApp endpoints
     * @param {string} endpoint - The endpoint path
     * @returns {string} Full URL
     */
    getApiUrl(endpoint) {
        return `${this.baseUrl}/${this.apiVersion}/${endpoint}`;
    },
    
    /**
     * Get authorization headers for API requests
     * @returns {Object} Headers object with authorization
     */
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    },
    
    /**
     * Validate WhatsApp configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        validateRequiredEnvVars([
            'WHATSAPP_PHONE_NUMBER_ID',
            'WHATSAPP_BUSINESS_ACCOUNT_ID', 
            'WHATSAPP_ACCESS_TOKEN'
        ]);
    }
};

/**
 * Google API Configuration (Gemini & Drive)
 */
const googleConfig = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    driveClientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    driveClientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    driveRefreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    driveRootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    sheetsId: process.env.GOOGLE_SHEETS_ID,
    sheetsCredentials: process.env.GOOGLE_SHEETS_CREDENTIALS,
    
    /**
     * Validate Google configuration
     * @param {string[]} services - Array of services to validate ['gemini', 'drive', 'sheets']
     * @throws {Error} If configuration is invalid
     */
    validate(services = []) {
        const requiredByService = {
            gemini: ['GEMINI_API_KEY'],
            drive: ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET'],
            sheets: ['GOOGLE_SHEETS_ID']
        };
        
        const required = services.flatMap(service => requiredByService[service] || []);
        if (required.length > 0) {
            validateRequiredEnvVars(required);
        }
    }
};

/**
 * Email Configuration
 */
const emailConfig = {
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        secure: process.env.SMTP_PORT === '465' // true for 465, false for other ports
    },
    
    /**
     * Validate email configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        if (this.smtp.user || this.smtp.pass) {
            validateRequiredEnvVars(['SMTP_USER', 'SMTP_PASS']);
        }
    }
};

/**
 * Webhook Configuration
 */
const webhookConfig = {
    secret: process.env.WEBHOOK_SECRET,
    localUrl: process.env.WEBHOOK_LOCAL_URL || 'http://localhost:5001/trigger',
    productionUrl: process.env.WEBHOOK_PRODUCTION_URL,
    port: parseInt(process.env.WEBHOOK_PORT || '5001'),
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'secure_webhook_token_2024',
    
    /**
     * Get the appropriate webhook URL based on environment
     * @returns {string} Webhook URL
     */
    getWebhookUrl() {
        return process.env.NODE_ENV === 'production' 
            ? this.productionUrl 
            : this.localUrl;
    },
    
    /**
     * Validate webhook configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        if (process.env.NODE_ENV === 'production') {
            validateRequiredEnvVars(['WEBHOOK_SECRET', 'WEBHOOK_PRODUCTION_URL']);
        }
    }
};

/**
 * Application Configuration
 */
const appConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    adminNumbers: process.env.ADMIN_WHATSAPP_NUMBERS 
        ? process.env.ADMIN_WHATSAPP_NUMBERS.split(',').map(n => n.trim())
        : [],
    
    isDevelopment() {
        return this.nodeEnv === 'development';
    },
    
    isProduction() {
        return this.nodeEnv === 'production';
    },
    
    isTest() {
        return this.nodeEnv === 'test';
    }
};

/**
 * Claude Configuration
 */
const claudeConfig = {
    sessionToken: process.env.CLAUDE_SESSION_TOKEN,
    
    /**
     * Validate Claude configuration
     * @throws {Error} If configuration is invalid
     */
    validate() {
        validateRequiredEnvVars(['CLAUDE_SESSION_TOKEN']);
    }
};

/**
 * Validate all required configurations
 * @param {Object} options - Validation options
 * @param {boolean} options.whatsapp - Validate WhatsApp config
 * @param {boolean} options.google - Validate Google config
 * @param {boolean} options.email - Validate email config
 * @param {boolean} options.webhook - Validate webhook config
 * @param {boolean} options.claude - Validate Claude config
 */
function validateConfig(options = {}) {
    const {
        whatsapp = false,
        google = false,
        email = false,
        webhook = false,
        claude = false
    } = options;
    
    try {
        if (whatsapp) whatsAppConfig.validate();
        if (google) googleConfig.validate();
        if (email) emailConfig.validate();
        if (webhook) webhookConfig.validate();
        if (claude) claudeConfig.validate();
    } catch (error) {
        console.error('Configuration validation failed:', error.message);
        console.error('Please ensure all required environment variables are set in your .env file');
        console.error('Copy .env.example to .env and fill in the values');
        throw error;
    }
}

/**
 * Get a safe version of config for logging (no sensitive data)
 * @returns {Object} Safe config object
 */
function getSafeConfig() {
    return {
        whatsapp: {
            phoneNumberId: whatsAppConfig.phoneNumberId ? '***' + whatsAppConfig.phoneNumberId.slice(-4) : undefined,
            businessAccountId: whatsAppConfig.businessAccountId,
            hasAccessToken: !!whatsAppConfig.accessToken
        },
        google: {
            hasGeminiKey: !!googleConfig.geminiApiKey,
            hasDriveCredentials: !!googleConfig.driveClientId,
            sheetsId: googleConfig.sheetsId
        },
        email: {
            host: emailConfig.smtp.host,
            port: emailConfig.smtp.port,
            hasCredentials: !!emailConfig.smtp.user
        },
        webhook: {
            port: webhookConfig.port,
            hasSecret: !!webhookConfig.secret
        },
        app: {
            nodeEnv: appConfig.nodeEnv,
            logLevel: appConfig.logLevel,
            adminCount: appConfig.adminNumbers.length
        }
    };
}

module.exports = {
    // Configurations
    whatsAppConfig,
    googleConfig,
    emailConfig,
    webhookConfig,
    appConfig,
    claudeConfig,
    
    // Utility functions
    validateConfig,
    validateRequiredEnvVars,
    getSafeConfig
};