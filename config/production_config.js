/**
 * Production Configuration for FinAdvise MVP
 * Google Account: shriyavallabh.ap@gmail.com
 */

module.exports = {
  // Google Configuration
  google: {
    account: 'shriyavallabh.ap@gmail.com',
    sheetId: '1zQ-J4MJ_PXknZSW8j9EpEU6z-0VEjXGSq8Vh1lK7DLY', // Your actual Sheet ID
    scriptId: 'YOUR_SCRIPT_ID_HERE', // Will be updated after deploying Apps Script
  },
  
  // Webhook Server Configuration (Local Development)
  webhook: {
    local: {
      url: process.env.WEBHOOK_LOCAL_URL || 'http://localhost:5001/trigger',
      secret: process.env.WEBHOOK_LOCAL_SECRET || null // Must be set in environment
    },
    // Production VM Configuration
    production: {
      url: process.env.WEBHOOK_PRODUCTION_URL || 'http://143.110.191.97:5001/trigger',
      secret: process.env.WEBHOOK_SECRET || null // Must be set in environment
    }
  },
  
  // Google Apps Script Configuration Template
  appsScriptConfig: `
const CONFIG = {
  WEBHOOK_URL: '${process.env.WEBHOOK_PRODUCTION_URL || 'WEBHOOK_URL_NOT_SET'}', // Set in environment
  WEBHOOK_SECRET: '${process.env.WEBHOOK_SECRET || 'WEBHOOK_SECRET_NOT_SET'}',     // Must match webhook server
  SHEET_ID: '${process.env.GOOGLE_SHEETS_ID || 'SHEET_ID_NOT_SET'}',                    // Your Google Sheet ID
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000
};
  `,
  
  // Service Account (Optional - for automated access)
  serviceAccount: {
    // Will be configured if needed for automated access
    // Currently using OAuth2 with your personal account
  }
};