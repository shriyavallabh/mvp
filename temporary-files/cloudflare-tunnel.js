#!/usr/bin/env node

/**
 * Cloudflare Tunnel Manager
 * Maintains persistent HTTPS tunnel for WhatsApp webhook
 * Saves URL to file for easy reference
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TUNNEL_URL_FILE = '/home/mvp/tunnel-url.txt';
const LOG_FILE = '/home/mvp/logs/cloudflare-tunnel.log';

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

console.log('Starting Cloudflare tunnel manager...');

function startTunnel() {
  console.log(`[${new Date().toISOString()}] Starting Cloudflare tunnel...`);
  
  const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:3000'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let urlFound = false;

  tunnel.stdout.on('data', (data) => {
    const output = data.toString();
    
    // Log to file
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${output}`);
    
    // Look for the tunnel URL
    if (!urlFound && output.includes('trycloudflare.com')) {
      const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
      if (match) {
        const tunnelUrl = match[0];
        urlFound = true;
        
        // Save URL to file
        fs.writeFileSync(TUNNEL_URL_FILE, tunnelUrl);
        
        console.log('═══════════════════════════════════════════════');
        console.log('✅ CLOUDFLARE TUNNEL ACTIVE');
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('Webhook URL:', `${tunnelUrl}/webhook`);
        console.log('Saved to:', TUNNEL_URL_FILE);
        console.log('');
        console.log('To get the URL anytime:');
        console.log('cat /home/mvp/tunnel-url.txt');
        console.log('═══════════════════════════════════════════════');
      }
    }
  });

  tunnel.stderr.on('data', (data) => {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ERROR: ${data}`);
  });

  tunnel.on('close', (code) => {
    console.log(`[${new Date().toISOString()}] Tunnel process exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting tunnel in 5 seconds...');
      setTimeout(startTunnel, 5000);
    }
  });

  tunnel.on('error', (err) => {
    console.error('Failed to start tunnel:', err);
    setTimeout(startTunnel, 5000);
  });
}

// Start the tunnel
startTunnel();

// Keep the process running
process.on('SIGTERM', () => {
  console.log('Shutting down tunnel manager...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down tunnel manager...');
  process.exit(0);
});