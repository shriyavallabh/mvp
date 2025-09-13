const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function deployDashboard() {
    console.log('========================================');
    console.log('DEPLOYING DASHBOARD TO VM');
    console.log('========================================');
    console.log(`VM IP: ${VM_IP}`);
    console.log('');

    try {
        // Create deployment package
        console.log('1. Creating deployment package...');
        await execPromise('tar -czf dashboard-deploy.tar.gz monitoring/dashboard package.json package-lock.json');
        console.log('✓ Package created');

        // Create manual deployment instructions
        console.log('\n========================================');
        console.log('MANUAL DEPLOYMENT INSTRUCTIONS');
        console.log('========================================');
        console.log('');
        console.log('Since SSH is not configured, please follow these steps:');
        console.log('');
        console.log('1. First, SSH into your VM:');
        console.log('   ssh root@159.89.166.94');
        console.log('');
        console.log('2. Run this command to install the dashboard:');
        console.log('');
        console.log('curl -fsSL https://finadvise-dashboard.s3.amazonaws.com/install.sh | bash');
        console.log('');
        console.log('OR copy and paste these commands:');
        console.log('----------------------------------------');
        console.log(`
cd /root

# Install dependencies if needed
npm install -g pm2

# Create directories
mkdir -p /root/monitoring/dashboard
mkdir -p /root/logs

# Download dashboard files (you'll need to transfer these)
# For now, create the dashboard manually

# Create the main server file
cat > /root/monitoring/dashboard/server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static('public'));

// Basic auth middleware
app.use((req, res, next) => {
    const auth = { login: 'admin', password: 'finadvise2024' };
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    if (login && password && login === auth.login && password === auth.password) {
        return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
});

app.get('/', (req, res) => {
    res.send('<h1>FinAdvise Monitoring Dashboard</h1><p>Dashboard is running!</p>');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(\`Dashboard running on port \${PORT}\`);
});
EOF

# Install Express
cd /root/monitoring/dashboard
npm init -y
npm install express

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'monitoring-dashboard',
    script: 'server.js',
    env: {
      PORT: 8080,
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Open firewall port
ufw allow 8080

echo "Dashboard installed!"
echo "Access at: http://159.89.166.94:8080"
`);

        console.log('');
        console.log('========================================');
        console.log('AFTER INSTALLATION');
        console.log('========================================');
        console.log('');
        console.log('Dashboard will be available at:');
        console.log(`http://${VM_IP}:8080`);
        console.log('');
        console.log('Login Credentials:');
        console.log('Username: admin');
        console.log('Password: finadvise2024');
        console.log('');
        console.log('========================================');

        // Test current accessibility
        console.log('\nTesting current dashboard status...');
        try {
            const response = await axios.get(`http://${VM_IP}:8080`, { timeout: 3000 });
            console.log('✅ Dashboard is already running!');
            console.log(`\n🎉 Access it now at: http://${VM_IP}:8080`);
        } catch (error) {
            console.log('❌ Dashboard not yet installed on VM');
            console.log('   Please follow the manual installation steps above');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

deployDashboard();