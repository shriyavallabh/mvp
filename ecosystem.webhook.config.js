/**
 * PM2 Configuration for WhatsApp Webhook Server
 * Replaces Fly.io dependency with local VM hosting
 */

module.exports = {
  apps: [
    {
      name: 'whatsapp-webhook',
      script: './webhook-server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: process.env.WEBHOOK_PORT || 3000,
        // WhatsApp webhook verify token - must be set in environment
        WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      merge_logs: true,
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health check
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ]
};