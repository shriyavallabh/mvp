module.exports = {
  apps: [
    {
      name: 'webhook-server',
      script: '/Users/shriyavallabh/Desktop/mvp/scripts/webhook_server.py',
      interpreter: '/Users/shriyavallabh/Desktop/mvp/venv/bin/python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        WEBHOOK_PORT: process.env.WEBHOOK_PORT || 5001,
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET, // Must be set explicitly
        PYTHONPATH: '/Users/shriyavallabh/Desktop/mvp'
      },
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/webhook-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/webhook-out.log',
      log_file: '/Users/shriyavallabh/Desktop/mvp/logs/webhook-combined.log',
      time: true
    },
    {
      name: 'claude-session',
      script: '/Users/shriyavallabh/Desktop/mvp/scripts/maintain_session.js',
      instances: 1,
      cron_restart: '0 0 * * *',  // Daily restart at midnight
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      error_file: '/Users/shriyavallabh/Desktop/mvp/logs/session-error.log',
      out_file: '/Users/shriyavallabh/Desktop/mvp/logs/session-out.log',
      log_file: '/Users/shriyavallabh/Desktop/mvp/logs/session-combined.log',
      time: true
    }
  ],
  
  deploy: {
    production: {
      user: 'mvp',
      host: '143.110.191.97',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/finadvise-mvp.git',
      path: '/home/mvp',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};