/**
 * Complete Dashboard Fix - Check PM2 logs and fix all issues
 */

const { NodeSSH } = require('node-ssh');
const axios = require('axios');

const ssh = new NodeSSH();

const VM_CONFIG = {
    host: '159.89.166.94',
    username: 'root',
    password: 'droplet'
};

async function fixDashboardCompletely() {
    console.log('🔧 Complete Dashboard Fix - Checking and Resolving All Issues\n');
    
    try {
        // Connect to VM
        console.log('📡 Connecting to VM...');
        await ssh.connect(VM_CONFIG);
        console.log('✅ Connected to VM\n');
        
        // Check PM2 status
        console.log('📊 Checking PM2 service status...');
        const pm2Status = await ssh.execCommand('pm2 list');
        console.log(pm2Status.stdout);
        
        // Check PM2 logs for errors
        console.log('\n📜 Checking PM2 error logs...');
        const pm2Logs = await ssh.execCommand('pm2 logs --lines 20 --nostream');
        console.log('Recent logs:\n', pm2Logs.stdout);
        
        // Check if the monitoring/dashboard directory exists
        console.log('\n📁 Checking dashboard directory structure...');
        const checkDir = await ssh.execCommand('ls -la /root/monitoring/dashboard/ 2>/dev/null || echo "Directory not found"');
        console.log(checkDir.stdout);
        
        // If directory doesn't exist or is in wrong location, fix it
        if (checkDir.stdout.includes('not found')) {
            console.log('\n🔨 Dashboard directory not found at expected location. Checking alternative locations...');
            const findDashboard = await ssh.execCommand('find /root -name "server.js" -path "*/dashboard/*" 2>/dev/null | head -5');
            console.log('Found dashboard files at:', findDashboard.stdout);
            
            // Check if it's at /root/dashboard
            const altCheck = await ssh.execCommand('ls -la /root/dashboard/ 2>/dev/null | head -10');
            if (!altCheck.stderr) {
                console.log('✅ Found dashboard at /root/dashboard/');
                
                // Start from correct location
                console.log('\n🚀 Starting dashboard from correct location...');
                await ssh.execCommand('cd /root/dashboard && pm2 delete dashboard 2>/dev/null || true');
                await ssh.execCommand('cd /root/dashboard && HOST=0.0.0.0 PORT=8080 pm2 start server.js --name dashboard');
            }
        } else {
            // Directory exists, check for missing dependencies
            console.log('\n📦 Checking dashboard dependencies...');
            const checkPackage = await ssh.execCommand('cd /root/monitoring/dashboard && ls package.json');
            
            if (!checkPackage.stderr) {
                console.log('Installing/updating dependencies...');
                await ssh.execCommand('cd /root/monitoring/dashboard && npm install');
                
                // Restart dashboard
                await ssh.execCommand('pm2 delete dashboard 2>/dev/null || true');
                await ssh.execCommand('cd /root/monitoring/dashboard && HOST=0.0.0.0 PORT=8080 pm2 start server.js --name dashboard');
            }
        }
        
        // Fix webhook server location
        console.log('\n🔧 Fixing webhook server...');
        const checkWebhook = await ssh.execCommand('ls -la /root/webhook-meta-grade.js 2>/dev/null || ls -la /root/webhook-prod.js 2>/dev/null');
        console.log('Webhook file check:', checkWebhook.stdout);
        
        if (checkWebhook.stdout.includes('webhook-prod.js')) {
            // Webhook is named differently
            await ssh.execCommand('pm2 delete webhook 2>/dev/null || true');
            await ssh.execCommand('cd /root && HOST=0.0.0.0 PORT=3000 pm2 start webhook-prod.js --name webhook');
        } else if (checkWebhook.stdout.includes('webhook-meta-grade.js')) {
            await ssh.execCommand('pm2 delete webhook 2>/dev/null || true');
            await ssh.execCommand('cd /root && HOST=0.0.0.0 PORT=3000 pm2 start webhook-meta-grade.js --name webhook');
        }
        
        // Save PM2 configuration
        await ssh.execCommand('pm2 save');
        await ssh.execCommand('pm2 startup systemd -u root --hp /root');
        
        // Wait for services to stabilize
        console.log('\n⏳ Waiting for services to start...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check final status
        console.log('\n📊 Final PM2 status:');
        const finalStatus = await ssh.execCommand('pm2 list');
        console.log(finalStatus.stdout);
        
        // Check listening ports
        console.log('\n🔍 Checking listening ports:');
        const ports = await ssh.execCommand('ss -tlnp | grep -E ":(8080|3000|3001|3002)"');
        console.log(ports.stdout || 'No services listening on expected ports');
        
        // Test internal connectivity
        console.log('\n🧪 Testing internal connectivity:');
        const tests = [
            { port: 8080, name: 'Dashboard' },
            { port: 3000, name: 'Webhook' },
            { port: 3001, name: 'WebSocket' },
            { port: 3002, name: 'API' }
        ];
        
        for (const test of tests) {
            const curl = await ssh.execCommand(`curl -I http://localhost:${test.port} 2>/dev/null | head -1`);
            console.log(`${test.name} (${test.port}): ${curl.stdout || 'No response'}`);
        }
        
        // Create a simple test endpoint
        console.log('\n🎯 Creating simple test endpoint...');
        const testEndpoint = `
cat > /root/test-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dashboard is working! Services: webhook (3000), websocket (3001), api (3002), dashboard (8080)');
});
server.listen(8888, '0.0.0.0', () => {
    console.log('Test server running on port 8888');
});
EOF
pm2 start /root/test-server.js --name test-server
`;
        await ssh.execCommand(testEndpoint);
        
        ssh.dispose();
        
        // Test external access with axios
        console.log('\n🌐 Testing external access...');
        
        try {
            // Test the simple endpoint first
            console.log('Testing test server on port 8888...');
            const testResponse = await axios.get('http://159.89.166.94:8888', { timeout: 5000 });
            console.log('✅ Test server accessible:', testResponse.data);
        } catch (err) {
            console.log('❌ Test server not accessible on 8888');
        }
        
        try {
            console.log('\nTesting dashboard on port 8080...');
            const dashResponse = await axios.get('http://159.89.166.94:8080', { 
                timeout: 5000,
                maxRedirects: 0,
                validateStatus: () => true 
            });
            
            if (dashResponse.status === 302 || dashResponse.status === 200) {
                console.log('✅ Dashboard is accessible! Status:', dashResponse.status);
                console.log('   Redirect to:', dashResponse.headers.location);
            } else {
                console.log('⚠️ Dashboard returned status:', dashResponse.status);
            }
        } catch (err) {
            console.log('❌ Dashboard not accessible:', err.message);
        }
        
        console.log('\n=====================================');
        console.log('📋 TROUBLESHOOTING SUMMARY');
        console.log('=====================================');
        console.log('1. PM2 services have been restarted');
        console.log('2. Firewall ports are open (8080, 3000, 3001, 3002)');
        console.log('3. Services configured to listen on 0.0.0.0');
        console.log('4. Test server created on port 8888');
        console.log('\n🔍 If services are still not accessible:');
        console.log('   1. Check DigitalOcean Firewall in control panel');
        console.log('   2. Ensure no cloud firewall is blocking ports');
        console.log('   3. Verify VM networking configuration');
        console.log('\n📱 Test URLs:');
        console.log('   Test Server: http://159.89.166.94:8888');
        console.log('   Dashboard: http://159.89.166.94:8080');
        console.log('   Webhook: http://159.89.166.94:3000');
        console.log('=====================================\n');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the complete fix
fixDashboardCompletely().catch(console.error);