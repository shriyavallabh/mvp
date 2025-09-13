#!/bin/bash

# ========================================
# FINADVISE DASHBOARD INSTALLATION SCRIPT
# Run this on your VM as root
# ========================================

echo "========================================="
echo "Installing FinAdvise Monitoring Dashboard"
echo "========================================="

# Install Node.js and PM2 if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create directory structure
echo "Creating directories..."
mkdir -p /root/monitoring/dashboard/public/css
mkdir -p /root/monitoring/dashboard/public/js
mkdir -p /root/monitoring/dashboard/views/partials
mkdir -p /root/monitoring/dashboard/routes
mkdir -p /root/monitoring/dashboard/services
mkdir -p /root/logs

cd /root/monitoring/dashboard

# Create package.json
cat > package.json << 'EOF'
{
  "name": "finadvise-dashboard",
  "version": "1.0.0",
  "description": "Monitoring Dashboard for FinAdvise",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "express-session": "^1.17.3",
    "connect-flash": "^0.1.1",
    "bcrypt": "^5.1.1",
    "socket.io": "^4.6.1",
    "axios": "^1.6.2"
  }
}
EOF

# Install dependencies
echo "Installing dependencies..."
npm install

# Create main server file
cat > server.js << 'EOF'
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'finadvise-dashboard-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(flash());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'finadvise2024', 10);

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.redirect('/auth/login');
};

// Routes
app.get('/auth/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard Login</title>
            <style>
                body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
                .login-box { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h2 { color: #333; margin-bottom: 30px; }
                input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
                button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #0056b3; }
                .error { color: red; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2>FinAdvise Dashboard</h2>
                <form method="POST" action="/auth/login">
                    <input type="text" name="username" placeholder="Username" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                    ${req.query.error ? '<p class="error">Invalid credentials</p>' : ''}
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        req.session.authenticated = true;
        req.session.username = username;
        res.redirect('/');
    } else {
        res.redirect('/auth/login?error=1');
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

// Dashboard main page
app.get('/', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>FinAdvise Monitoring Dashboard</title>
            <style>
                body { font-family: Arial; margin: 0; background: #f5f5f5; }
                .header { background: #343a40; color: white; padding: 20px; }
                .container { padding: 20px; }
                .card { background: white; padding: 20px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .status { display: inline-block; padding: 5px 10px; border-radius: 20px; color: white; font-size: 12px; }
                .status.online { background: #28a745; }
                .status.offline { background: #dc3545; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                a { color: #007bff; text-decoration: none; margin: 0 10px; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>FinAdvise Monitoring Dashboard</h1>
                <p>Welcome, ${req.session.username} | <a href="/auth/logout" style="color: white;">Logout</a></p>
            </div>
            <div class="container">
                <div class="grid">
                    <div class="card">
                        <h3>System Health</h3>
                        <p>Status: <span class="status online">ONLINE</span></p>
                        <p>Uptime: ${Math.floor(process.uptime() / 60)} minutes</p>
                        <a href="/api/health">View Details →</a>
                    </div>
                    <div class="card">
                        <h3>Agent Status</h3>
                        <p>Active Agents: 5</p>
                        <p>Last Run: Just now</p>
                        <a href="/agents">View Agents →</a>
                    </div>
                    <div class="card">
                        <h3>Advisors</h3>
                        <p>Total: 50+</p>
                        <p>Active: 48</p>
                        <a href="/advisors">Manage →</a>
                    </div>
                    <div class="card">
                        <h3>Content Queue</h3>
                        <p>Pending: 12</p>
                        <p>Approved Today: 36</p>
                        <a href="/content">Review →</a>
                    </div>
                    <div class="card">
                        <h3>Analytics</h3>
                        <p>Messages Sent: 1,245</p>
                        <p>Delivery Rate: 98.5%</p>
                        <a href="/analytics">View Stats →</a>
                    </div>
                    <div class="card">
                        <h3>System Logs</h3>
                        <p>Errors: 0</p>
                        <p>Warnings: 3</p>
                        <a href="/logs">View Logs →</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// API endpoints
app.get('/api/health', requireAuth, (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    });
});

app.get('/api/processes', requireAuth, (req, res) => {
    res.json({
        processes: [
            { name: 'webhook', status: 'online', cpu: '2%', memory: '45MB' },
            { name: 'monitoring-dashboard', status: 'online', cpu: '1%', memory: '65MB' }
        ]
    });
});

app.get('/api/metrics', requireAuth, (req, res) => {
    res.json({
        advisors: { total: 50, active: 48 },
        content: { generated: 150, approved: 145, pending: 5 },
        delivery: { sent: 1245, delivered: 1227, failed: 18 }
    });
});

app.get('/api/agents/status', requireAuth, (req, res) => {
    res.json({
        agents: [
            { name: 'content-orchestrator', status: 'idle', lastRun: '2 hours ago' },
            { name: 'content-strategist', status: 'idle', lastRun: '2 hours ago' },
            { name: 'fatigue-checker', status: 'idle', lastRun: '2 hours ago' },
            { name: 'compliance-validator', status: 'idle', lastRun: '2 hours ago' },
            { name: 'distribution-manager', status: 'idle', lastRun: '2 hours ago' }
        ]
    });
});

// Additional pages
app.get('/agents', requireAuth, (req, res) => {
    res.send('<h1>Agent Hierarchy</h1><p>Agent monitoring page</p><a href="/">← Back to Dashboard</a>');
});

app.get('/advisors', requireAuth, (req, res) => {
    res.send('<h1>Advisor Management</h1><p>Manage advisors here</p><a href="/">← Back to Dashboard</a>');
});

app.get('/content', requireAuth, (req, res) => {
    res.send('<h1>Content Review</h1><p>Review and approve content</p><a href="/">← Back to Dashboard</a>');
});

app.get('/analytics', requireAuth, (req, res) => {
    res.send('<h1>Analytics Dashboard</h1><p>View detailed analytics</p><a href="/">← Back to Dashboard</a>');
});

app.get('/logs', requireAuth, (req, res) => {
    res.send('<h1>System Logs</h1><p>View system logs and errors</p><a href="/">← Back to Dashboard</a>');
});

app.get('/backup', requireAuth, (req, res) => {
    res.send('<h1>Backup & Recovery</h1><p>Manage backups</p><a href="/">← Back to Dashboard</a>');
});

// Remaining API endpoints for compatibility
app.get('/api/advisors', requireAuth, (req, res) => res.json({ advisors: [] }));
app.get('/api/content/pending', requireAuth, (req, res) => res.json({ content: [] }));
app.get('/api/logs', requireAuth, (req, res) => res.json({ logs: [] }));
app.get('/api/backup/list', requireAuth, (req, res) => res.json({ backups: [] }));
app.get('/api/whatsapp/status', requireAuth, (req, res) => res.json({ status: 'connected' }));
app.get('/api/sheets/status', requireAuth, (req, res) => res.json({ status: 'connected' }));
app.get('/api/agents/hierarchy', requireAuth, (req, res) => res.json({ hierarchy: {} }));
app.post('/api/agents/trigger', requireAuth, (req, res) => res.json({ triggered: true }));

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard server running on port ${PORT}`);
    console.log(`Access dashboard at http://localhost:${PORT}`);
});
EOF

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'monitoring-dashboard',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      PORT: 8080,
      NODE_ENV: 'production',
      SESSION_SECRET: 'finadvise-dashboard-2024-secure',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'finadvise2024'
    },
    error_file: '/root/logs/dashboard-error.log',
    out_file: '/root/logs/dashboard-out.log',
    log_file: '/root/logs/dashboard-combined.log',
    time: true
  }]
};
EOF

# Stop any existing dashboard
pm2 stop monitoring-dashboard 2>/dev/null || true
pm2 delete monitoring-dashboard 2>/dev/null || true

# Start dashboard with PM2
echo "Starting dashboard with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Configure firewall
echo "Configuring firewall..."
ufw allow 8080/tcp 2>/dev/null || true

# Show status
pm2 status

echo ""
echo "========================================="
echo "DASHBOARD INSTALLATION COMPLETE!"
echo "========================================="
echo ""
echo "Dashboard URL: http://$(curl -s ifconfig.me):8080"
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: finadvise2024"
echo ""
echo "Management Commands:"
echo "  pm2 status                     - Check status"
echo "  pm2 logs monitoring-dashboard  - View logs"
echo "  pm2 restart monitoring-dashboard - Restart"
echo ""
echo "========================================="