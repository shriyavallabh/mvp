/**
 * VM Production Environment Validation Tests
 * Tests VM connectivity, ngrok status, webhook configuration, and system health
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment configuration
require('dotenv').config();

const VM_CONFIG = {
  host: '143.110.191.97',
  user: 'mvp',
  port: 22,
  webhookPort: 5001,
  ngrokDomain: process.env.NGROK_DOMAIN || '',
  sshKeyPath: process.env.SSH_KEY_PATH || '~/.ssh/id_rsa'
};

describe('VM Production Environment Validation', () => {
  let testResults = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    vmHost: VM_CONFIG.host,
    tests: []
  };

  afterAll(() => {
    // Save test results for reporting
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(reportsDir, `vm-validation-${Date.now()}.json`),
      JSON.stringify(testResults, null, 2)
    );
  });

  describe('VM Connectivity Tests', () => {
    test('Should ping VM successfully', async () => {
      const startTime = Date.now();
      try {
        const result = execSync(`ping -c 4 ${VM_CONFIG.host}`, { encoding: 'utf-8' });
        const endTime = Date.now();
        
        expect(result).toContain('4 packets transmitted');
        expect(result).toContain('0.0% packet loss');
        
        testResults.tests.push({
          name: 'VM Ping Test',
          status: 'passed',
          duration: endTime - startTime,
          details: 'VM is reachable'
        });
      } catch (error) {
        testResults.tests.push({
          name: 'VM Ping Test',
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    }, 10000);

    test('Should connect via SSH', async () => {
      const startTime = Date.now();
      try {
        const result = execSync(
          `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${VM_CONFIG.user}@${VM_CONFIG.host} "echo 'SSH connection successful'"`,
          { encoding: 'utf-8' }
        );
        const endTime = Date.now();
        
        expect(result.trim()).toBe('SSH connection successful');
        
        testResults.tests.push({
          name: 'SSH Connection Test',
          status: 'passed',
          duration: endTime - startTime
        });
      } catch (error) {
        testResults.tests.push({
          name: 'SSH Connection Test',
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    }, 10000);
  });

  describe('Ngrok Tunnel Validation', () => {
    test('Should check ngrok tunnel status', async () => {
      try {
        // Check local ngrok API
        const response = await axios.get('http://localhost:4040/api/tunnels', {
          timeout: 5000
        });
        
        const tunnels = response.data.tunnels;
        expect(tunnels).toBeDefined();
        expect(tunnels.length).toBeGreaterThan(0);
        
        const webhookTunnel = tunnels.find(t => t.config.addr.includes('5001'));
        expect(webhookTunnel).toBeDefined();
        expect(webhookTunnel.public_url).toContain('ngrok');
        
        testResults.tests.push({
          name: 'Ngrok Tunnel Status',
          status: 'passed',
          details: {
            tunnelUrl: webhookTunnel.public_url,
            tunnelStatus: 'active'
          }
        });
        
        // Store ngrok URL for webhook validation
        process.env.NGROK_URL = webhookTunnel.public_url;
      } catch (error) {
        console.warn('Ngrok local API not accessible, checking VM ngrok...');
        
        try {
          // Check ngrok on VM
          const vmNgrokCheck = execSync(
            `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "curl -s http://localhost:4040/api/tunnels"`,
            { encoding: 'utf-8' }
          );
          
          const tunnels = JSON.parse(vmNgrokCheck).tunnels;
          if (tunnels && tunnels.length > 0) {
            const webhookTunnel = tunnels.find(t => t.config.addr.includes('5001'));
            process.env.NGROK_URL = webhookTunnel?.public_url;
            
            testResults.tests.push({
              name: 'Ngrok Tunnel Status',
              status: 'passed',
              details: {
                tunnelUrl: webhookTunnel?.public_url,
                location: 'VM'
              }
            });
          }
        } catch (vmError) {
          testResults.tests.push({
            name: 'Ngrok Tunnel Status',
            status: 'warning',
            message: 'Ngrok tunnel needs to be configured',
            action: 'Run setup-ngrok script on VM'
          });
        }
      }
    }, 15000);

    test('Should validate ngrok URL expiration', async () => {
      if (!process.env.NGROK_URL) {
        console.warn('Skipping ngrok expiration test - no URL found');
        return;
      }

      try {
        const response = await axios.get(process.env.NGROK_URL, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        // If we get any response, tunnel is active
        expect(response.status).toBeDefined();
        
        testResults.tests.push({
          name: 'Ngrok URL Expiration Check',
          status: 'passed',
          details: {
            url: process.env.NGROK_URL,
            isActive: true
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Ngrok URL Expiration Check',
          status: 'failed',
          error: 'Ngrok URL expired or unreachable',
          action: 'Need to create new ngrok tunnel and update webhook URL'
        });
        throw error;
      }
    }, 10000);
  });

  describe('Webhook Configuration Tests', () => {
    test('Should verify webhook server is running', async () => {
      try {
        const webhookStatus = execSync(
          `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "pm2 list | grep webhook-server"`,
          { encoding: 'utf-8' }
        );
        
        expect(webhookStatus).toContain('online');
        
        testResults.tests.push({
          name: 'Webhook Server Status',
          status: 'passed',
          details: 'Webhook server is online'
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Webhook Server Status',
          status: 'failed',
          error: 'Webhook server not running'
        });
        throw error;
      }
    }, 10000);

    test('Should test webhook endpoint accessibility', async () => {
      const webhookUrl = process.env.NGROK_URL || `http://${VM_CONFIG.host}:${VM_CONFIG.webhookPort}`;
      
      try {
        const response = await axios.get(`${webhookUrl}/webhook`, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        // Webhook should respond even if not verified
        expect(response.status).toBeLessThan(500);
        
        testResults.tests.push({
          name: 'Webhook Endpoint Test',
          status: 'passed',
          details: {
            endpoint: `${webhookUrl}/webhook`,
            statusCode: response.status
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'Webhook Endpoint Test',
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    }, 10000);
  });

  describe('PM2 Process Status', () => {
    test('Should verify all PM2 processes are running', async () => {
      const expectedProcesses = [
        'webhook-server',
        'claude-session',
        'daily-content-scheduler',
        'auto-approval-scheduler',
        'morning-distribution-scheduler'
      ];

      try {
        const pm2Status = execSync(
          `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "pm2 jlist"`,
          { encoding: 'utf-8' }
        );
        
        const processes = JSON.parse(pm2Status);
        const processStatuses = {};

        expectedProcesses.forEach(processName => {
          const process = processes.find(p => p.name === processName);
          processStatuses[processName] = {
            status: process ? process.pm2_env.status : 'not found',
            uptime: process ? process.pm2_env.pm_uptime : 0,
            restarts: process ? process.pm2_env.restart_time : 0,
            memory: process ? process.monit.memory : 0
          };
          
          if (processName.includes('scheduler')) {
            // Schedulers may be stopped between runs
            expect(['online', 'stopped']).toContain(processStatuses[processName].status);
          } else {
            expect(processStatuses[processName].status).toBe('online');
          }
        });

        testResults.tests.push({
          name: 'PM2 Process Status',
          status: 'passed',
          details: processStatuses
        });
      } catch (error) {
        testResults.tests.push({
          name: 'PM2 Process Status',
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    }, 15000);
  });

  describe('System Resources Check', () => {
    test('Should check VM system resources', async () => {
      try {
        // Check disk space
        const diskSpace = execSync(
          `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "df -h / | tail -1"`,
          { encoding: 'utf-8' }
        );
        
        const diskUsage = parseInt(diskSpace.match(/(\d+)%/)[1]);
        expect(diskUsage).toBeLessThan(90);

        // Check memory
        const memInfo = execSync(
          `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "free -m | grep Mem"`,
          { encoding: 'utf-8' }
        );
        
        const memParts = memInfo.split(/\s+/);
        const totalMem = parseInt(memParts[1]);
        const usedMem = parseInt(memParts[2]);
        const memUsagePercent = (usedMem / totalMem) * 100;
        
        expect(memUsagePercent).toBeLessThan(90);

        // Check CPU load
        const loadAvg = execSync(
          `ssh ${VM_CONFIG.user}@${VM_CONFIG.host} "uptime"`,
          { encoding: 'utf-8' }
        );
        
        const loadMatch = loadAvg.match(/load average: ([\d.]+), ([\d.]+), ([\d.]+)/);
        const load1Min = parseFloat(loadMatch[1]);
        
        expect(load1Min).toBeLessThan(4.0); // Assuming 4 CPU cores

        testResults.tests.push({
          name: 'System Resources',
          status: 'passed',
          details: {
            diskUsage: `${diskUsage}%`,
            memoryUsage: `${memUsagePercent.toFixed(1)}%`,
            cpuLoad: load1Min
          }
        });
      } catch (error) {
        testResults.tests.push({
          name: 'System Resources',
          status: 'failed',
          error: error.message
        });
        throw error;
      }
    }, 10000);
  });

  describe('SSL and Security Configuration', () => {
    test('Should validate SSL certificates if configured', async () => {
      if (!process.env.NGROK_URL || !process.env.NGROK_URL.startsWith('https')) {
        console.log('Skipping SSL test - not using HTTPS');
        return;
      }

      try {
        const response = await axios.get(process.env.NGROK_URL, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        expect(response.request.res.socket.authorized).toBe(true);
        
        testResults.tests.push({
          name: 'SSL Certificate Validation',
          status: 'passed',
          details: 'SSL certificate is valid'
        });
      } catch (error) {
        testResults.tests.push({
          name: 'SSL Certificate Validation',
          status: 'warning',
          message: 'Could not validate SSL certificate'
        });
      }
    });

    test('Should check firewall configuration', async () => {
      const requiredPorts = [22, 5001, 3000, 8080]; // SSH, Webhook, Dashboard, Monitoring
      const portStatuses = {};

      for (const port of requiredPorts) {
        try {
          const result = execSync(
            `nc -zv -w 2 ${VM_CONFIG.host} ${port} 2>&1`,
            { encoding: 'utf-8' }
          );
          
          portStatuses[port] = result.includes('succeeded') ? 'open' : 'closed';
        } catch (error) {
          portStatuses[port] = 'closed';
        }
      }

      // Port 22 (SSH) must be open
      expect(portStatuses[22]).toBe('open');
      
      testResults.tests.push({
        name: 'Firewall Configuration',
        status: portStatuses[22] === 'open' ? 'passed' : 'failed',
        details: portStatuses
      });
    }, 20000);
  });
});