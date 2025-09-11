/**
 * PM2 Configuration for Cloudflare Tunnel
 * Maintains persistent HTTPS tunnel for WhatsApp webhook
 * FREE - No costs involved
 */

module.exports = {
  apps: [
    {
      name: 'cloudflare-tunnel',
      script: './cloudflare-tunnel.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '200M',
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/tunnel-error.log',
      out_file: './logs/tunnel-out.log',
      merge_logs: true,
      
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};