module.exports = {
  apps: [{
    name: 'monitoring-dashboard',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      SESSION_SECRET: process.env.SESSION_SECRET || 'finadvise-dashboard-secret-key-change-in-production',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH || '$2b$10$ZiJKPV3nXqH4YnX5vqcKsuSZhQFmVqnR8RhVnZPz4vR5PqGqX6eHe',
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
      GOOGLE_DRIVE_BACKUP_FOLDER_ID: process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID
    },
    error_file: '../../logs/dashboard-error.log',
    out_file: '../../logs/dashboard-out.log',
    log_file: '../../logs/dashboard-combined.log',
    time: true
  }]
};