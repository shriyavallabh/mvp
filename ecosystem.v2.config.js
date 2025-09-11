/**
 * PM2 Ecosystem Configuration for V2 WhatsApp Deliverability Engine
 */

module.exports = {
    apps: [
        {
            name: 'whatsapp-webhook-v2',
            script: './webhook-server-v2.js',
            instances: 1,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 5001
            },
            error_file: './logs/webhook-error.log',
            out_file: './logs/webhook-out.log',
            log_file: './logs/webhook-combined.log',
            time: true,
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            watch: false
        },
        {
            name: 'campaign-scheduler',
            script: './app-v2.js',
            args: 'start',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/scheduler-error.log',
            out_file: './logs/scheduler-out.log',
            log_file: './logs/scheduler-combined.log',
            time: true,
            autorestart: true,
            max_restarts: 5,
            min_uptime: '30s',
            cron_restart: '0 0 * * *', // Restart daily at midnight
            watch: false
        }
    ]
};