// STORY 3.2 DASHBOARD INTEGRATION - PM2 ECOSYSTEM CONFIG
// Separate PM2 configuration for new dashboard integration services

module.exports = {
  apps: [
    {
      name: 'dashboard-api-server',
      script: './dashboard-api-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: './logs/dashboard-api-error.log',
      out_file: './logs/dashboard-api-out.log',
      log_file: './logs/dashboard-api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'websocket-server',
      script: './websocket-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      },
      error_file: './logs/websocket-error.log',
      out_file: './logs/websocket-out.log',
      log_file: './logs/websocket-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};