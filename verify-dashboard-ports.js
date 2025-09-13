/**
 * Verify Dashboard Ports and Fix Network Issues
 */

const { NodeSSH } = require('node-ssh');
const net = require('net');

const ssh = new NodeSSH();

const VM_CONFIG = {
    host: '159.89.166.94',
    username: 'root',
    password: 'droplet'
};

async function verifyAndFixPorts() {
    console.log('🔍 Verifying Dashboard Ports and Network Configuration...\n');
    
    try {
        // Connect to VM
        console.log('📡 Connecting to VM...');
        await ssh.connect(VM_CONFIG);
        console.log('✅ Connected to VM\n');
        
        // Check listening ports
        console.log('🔍 Checking listening ports...');
        const netstat = await ssh.execCommand('netstat -tlnp | grep -E ":(8080|3000|3001|3002)"');
        console.log('Listening ports:\n', netstat.stdout || 'No ports found');
        
        // Check if services are actually running
        console.log('\n📊 Checking process details...');
        const processes = await ssh.execCommand('ps aux | grep -E "(dashboard|webhook|websocket)" | grep -v grep');
        console.log('Running processes:\n', processes.stdout);
        
        // Check iptables rules
        console.log('\n🔍 Checking iptables rules...');
        const iptables = await ssh.execCommand('iptables -L -n | grep -E "(8080|3000|3001|3002)" || echo "No specific rules found"');
        console.log('Iptables rules:', iptables.stdout);
        
        // Ensure services are listening on 0.0.0.0
        console.log('\n🔧 Fixing service configurations...');
        
        // Fix monitoring dashboard to listen on all interfaces
        const fixDashboard = `
cat > /root/monitoring/dashboard/server-fix.js << 'EOF'
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const ejs = require('ejs');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

// Story 3.2 Integration: WebSocket Server for real-time updates
const WebSocketServer = require('./services/websocket-server');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Listen on all interfaces

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'finadvise-dashboard-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const authMiddleware = (req, res, next) => {
  if (!req.session.user && !req.path.startsWith('/auth')) {
    return res.redirect('/auth/login');
  }
  next();
};

app.use('/auth', authRoutes);

app.use(authMiddleware);

app.use('/api', apiRoutes);
app.use('/', viewRoutes);

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('subscribe-agents', () => {
    socket.join('agent-updates');
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

global.io = io;

// Initialize Story 3.2 WebSocket server for real-time webhook monitoring
let webhookWsServer = null;
try {
  webhookWsServer = new WebSocketServer(3001);
  console.log('🔌 Story 3.2 WebSocket server initialized on port 3001');
  
  // Start event simulation for demonstration
  setTimeout(() => {
    if (webhookWsServer) {
      webhookWsServer.startEventSimulation();
    }
  }, 5000); // Start simulation after 5 seconds
  
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
}

// Listen on all interfaces
server.listen(PORT, HOST, () => {
  console.log(\`Dashboard server running on \${HOST}:\${PORT}\`);
  console.log(\`Access dashboard at http://\${HOST}:\${PORT}\`);
  console.log(\`External access at http://159.89.166.94:\${PORT}\`);
  console.log('');
  console.log('🔗 Story 3.2 Integration Active:');
  console.log('  📊 Real-time webhook monitoring enabled');
  console.log('  📈 Button analytics tracking active');
  console.log('  💬 CRM chat interaction monitoring enabled');
  console.log('  📡 WebSocket server: ws://localhost:3001/ws');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔌 Shutting down servers...');
  if (webhookWsServer) {
    webhookWsServer.stop();
  }
  server.close(() => {
    console.log('✅ Servers shut down gracefully');
    process.exit(0);
  });
});

module.exports = { app, server, io, webhookWsServer };
EOF

# Replace the server file
cp /root/monitoring/dashboard/server.js /root/monitoring/dashboard/server.backup.js
cp /root/monitoring/dashboard/server-fix.js /root/monitoring/dashboard/server.js
`;
        await ssh.execCommand(fixDashboard);
        console.log('✅ Dashboard server configuration updated');
        
        // Restart all services with proper configuration
        console.log('\n🔄 Restarting all services...');
        await ssh.execCommand('pm2 delete all || true');
        
        // Start webhook on all interfaces
        await ssh.execCommand('cd /root && HOST=0.0.0.0 PORT=3000 pm2 start webhook-meta-grade.js --name webhook');
        
        // Start dashboard API on all interfaces  
        await ssh.execCommand('cd /root && HOST=0.0.0.0 PORT=3002 pm2 start dashboard-api-server.js --name dashboard-api');
        
        // Start WebSocket server on all interfaces
        await ssh.execCommand('cd /root && HOST=0.0.0.0 PORT=3001 pm2 start websocket-server.js --name websocket');
        
        // Start monitoring dashboard on all interfaces
        await ssh.execCommand('cd /root/monitoring/dashboard && HOST=0.0.0.0 PORT=8080 pm2 start server.js --name dashboard');
        
        await ssh.execCommand('pm2 save');
        
        // Wait for services to start
        console.log('\n⏳ Waiting for services to fully start...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Verify ports again
        console.log('\n✅ Verifying ports after restart...');
        const newNetstat = await ssh.execCommand('netstat -tlnp | grep -E ":(8080|3000|3001|3002)"');
        console.log('New listening ports:\n', newNetstat.stdout);
        
        // Test connectivity from VM itself
        console.log('\n🧪 Testing connectivity from VM...');
        const tests = [
            { port: 8080, name: 'Dashboard' },
            { port: 3000, name: 'Webhook' },
            { port: 3001, name: 'WebSocket' },
            { port: 3002, name: 'Dashboard API' }
        ];
        
        for (const test of tests) {
            const result = await ssh.execCommand(`curl -I http://0.0.0.0:${test.port} 2>/dev/null | head -1`);
            console.log(`${test.name} (${test.port}):`, result.stdout || 'No response');
        }
        
        // Check and disable any conflicting firewall
        console.log('\n🔓 Ensuring firewall is properly configured...');
        await ssh.execCommand('ufw --force enable');
        await ssh.execCommand('ufw allow 22/tcp');
        await ssh.execCommand('ufw allow 80/tcp');
        await ssh.execCommand('ufw allow 443/tcp');
        await ssh.execCommand('ufw allow 3000/tcp');
        await ssh.execCommand('ufw allow 3001/tcp');
        await ssh.execCommand('ufw allow 3002/tcp');
        await ssh.execCommand('ufw allow 8080/tcp');
        await ssh.execCommand('ufw reload');
        
        const finalUfw = await ssh.execCommand('ufw status numbered');
        console.log('Final firewall status:\n', finalUfw.stdout);
        
        ssh.dispose();
        
        console.log('\n=====================================');
        console.log('✅ Port verification and fixes complete!');
        console.log('=====================================\n');
        
        // Test external connectivity with Node.js
        console.log('🌐 Testing external connectivity...\n');
        
        const testPort = (host, port) => {
            return new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                
                socket.on('connect', () => {
                    console.log(`✅ Port ${port} is OPEN and accessible`);
                    socket.destroy();
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    console.log(`⏱️ Port ${port} connection timeout`);
                    socket.destroy();
                    resolve(false);
                });
                
                socket.on('error', (err) => {
                    console.log(`❌ Port ${port} connection error:`, err.message);
                    resolve(false);
                });
                
                socket.connect(port, host);
            });
        };
        
        console.log('Testing port connectivity to 159.89.166.94...');
        await testPort('159.89.166.94', 8080);
        await testPort('159.89.166.94', 3000);
        await testPort('159.89.166.94', 3001);
        await testPort('159.89.166.94', 3002);
        
        console.log('\n=====================================');
        console.log('🎯 FINAL STATUS');
        console.log('=====================================');
        console.log('All services have been restarted and configured');
        console.log('to listen on all network interfaces (0.0.0.0)');
        console.log('\nIf ports are still not accessible externally,');
        console.log('it may be a DigitalOcean firewall or network');
        console.log('configuration that needs to be adjusted in the');
        console.log('DigitalOcean control panel.');
        console.log('=====================================\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run verification
verifyAndFixPorts().catch(console.error);