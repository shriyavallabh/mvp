/**
 * PM2 Ecosystem Configuration for Content Generation System
 * Handles cron scheduling for automated content workflows
 */

module.exports = {
  apps: [
    {
      name: 'evening-generation',
      script: 'claude',
      args: '/content-engine --generate',
      cron_restart: '30 20 * * *',  // 8:30 PM daily
      autorestart: false,
      max_execution_time: 1800000,   // 30 minutes
      env: {
        NODE_ENV: 'production',
        CLAUDE_SESSION_TOKEN: process.env.CLAUDE_SESSION_TOKEN
      },
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/evening-generation-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/evening-generation-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'auto-approval',
      script: 'claude',
      args: '/approval-guardian --auto',
      cron_restart: '0 23 * * *',   // 11:00 PM daily
      autorestart: false,
      max_execution_time: 600000,    // 10 minutes
      env: {
        NODE_ENV: 'production',
        CLAUDE_SESSION_TOKEN: process.env.CLAUDE_SESSION_TOKEN
      },
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/auto-approval-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/auto-approval-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'morning-distribution',
      script: 'claude',
      args: '/content-engine --distribute',
      cron_restart: '0 5 * * *',    // 5:00 AM daily
      autorestart: false,
      max_execution_time: 3600000,   // 60 minutes
      env: {
        NODE_ENV: 'production',
        CLAUDE_SESSION_TOKEN: process.env.CLAUDE_SESSION_TOKEN
      },
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/morning-distribution-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/morning-distribution-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'session-maintenance',
      script: '/Users/shriyavallabh/Desktop/mvp/scripts/maintain-session.js',
      cron_restart: '0 0 * * *',    // Daily at midnight
      autorestart: true,
      instances: 1,
      env: {
        NODE_ENV: 'production',
        CLAUDE_SESSION_TOKEN: process.env.CLAUDE_SESSION_TOKEN
      },
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/session-maintenance-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/pm2/session-maintenance-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'mvp',
      host: '143.110.191.97',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/finadvise-mvp.git',
      path: '/home/mvp',
      'post-deploy': 'npm install && pm2 reload ecosystem.content.config.js --env production'
    }
  }
};