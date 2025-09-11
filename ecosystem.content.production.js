/**
 * PM2 Configuration for Story 2.1 Content Generation System
 * Production-ready configuration for VM deployment
 */

module.exports = {
  apps: [
    {
      name: 'evening-generation',
      script: 'node',
      args: '/home/mvp/agents/generators/content-generator.js',
      cron_restart: '30 20 * * *', // 8:30 PM daily
      autorestart: false,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        AGENT_MODE: 'scheduled'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/mvp/logs/evening-generation-error.log',
      out_file: '/home/mvp/logs/evening-generation-out.log'
    },
    {
      name: 'auto-approval',
      script: 'node',
      args: '/home/mvp/agents/controllers/approval-guardian.js',
      cron_restart: '0 23 * * *', // 11:00 PM daily
      autorestart: false,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        AGENT_MODE: 'scheduled'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/mvp/logs/auto-approval-error.log',
      out_file: '/home/mvp/logs/auto-approval-out.log'
    },
    {
      name: 'morning-distribution',
      script: 'node',
      args: '/home/mvp/agents/controllers/distribution-manager-whatsapp.js',
      cron_restart: '0 5 * * *', // 5:00 AM daily
      autorestart: false,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        AGENT_MODE: 'scheduled'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/mvp/logs/morning-distribution-error.log',
      out_file: '/home/mvp/logs/morning-distribution-out.log'
    }
  ]
};