#!/usr/bin/env node

/**
 * PRODUCTION TUNNEL MANAGER
 * Maintains persistent tunnel with auto-restart
 * Saves tunnel URL to file for persistence
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TUNNEL_URL_FILE = path.join(__dirname, 'tunnel-url.txt');
const LOG_FILE = path.join(__dirname, 'tunnel.log');
const PID_FILE = path.join(__dirname, 'tunnel.pid');

let tunnelProcess = null;
let currentTunnelUrl = null;
let restartAttempts = 0;

console.log('🔒 PRODUCTION TUNNEL MANAGER');
console.log('=' .repeat(70));

// Save current process PID
fs.writeFileSync(PID_FILE, process.pid.toString());

function startTunnel() {
    console.log(`[${new Date().toISOString()}] Starting tunnel...`);
    
    tunnelProcess = spawn('cloudflared', [
        'tunnel',
        '--url', 'http://localhost:3000',
        '--metrics', '127.0.0.1:20243'
    ], {
        stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let urlFound = false;
    
    tunnelProcess.stdout.on('data', (data) => {
        const output = data.toString();
        fs.appendFileSync(LOG_FILE, output);
        
        // Extract tunnel URL
        if (!urlFound && output.includes('trycloudflare.com')) {
            const match = output.match(/https:\/\/[^\s]+\.trycloudflare\.com/);
            if (match) {
                currentTunnelUrl = match[0];
                urlFound = true;
                
                // Save URL
                fs.writeFileSync(TUNNEL_URL_FILE, currentTunnelUrl);
                
                console.log('\n✅ TUNNEL ACTIVE:');
                console.log(`   ${currentTunnelUrl}`);
                console.log('   Saved to:', TUNNEL_URL_FILE);
                console.log('\n⚠️  UPDATE META WEBHOOK URL TO:');
                console.log(`   ${currentTunnelUrl}/webhook\n`);
                
                restartAttempts = 0; // Reset on success
            }
        }
    });
    
    tunnelProcess.stderr.on('data', (data) => {
        fs.appendFileSync(LOG_FILE, `ERROR: ${data}`);
        console.error('Tunnel error:', data.toString());
    });
    
    tunnelProcess.on('exit', (code) => {
        console.log(`[${new Date().toISOString()}] Tunnel exited with code ${code}`);
        
        if (restartAttempts < 10) {
            restartAttempts++;
            console.log(`Restarting tunnel (attempt ${restartAttempts}/10)...`);
            setTimeout(startTunnel, 5000); // Wait 5 seconds before restart
        } else {
            console.error('❌ Max restart attempts reached. Manual intervention required.');
            process.exit(1);
        }
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down tunnel...');
    if (tunnelProcess) {
        tunnelProcess.kill();
    }
    fs.unlinkSync(PID_FILE);
    process.exit(0);
});

// Monitor tunnel health
setInterval(() => {
    if (tunnelProcess && !tunnelProcess.killed) {
        // Check if tunnel is responding
        require('http').get(`http://127.0.0.1:20243/metrics`, (res) => {
            if (res.statusCode !== 200) {
                console.log('Tunnel health check failed, restarting...');
                tunnelProcess.kill();
            }
        }).on('error', () => {
            console.log('Tunnel not responding, restarting...');
            tunnelProcess.kill();
        });
    }
}, 30000); // Check every 30 seconds

// Start tunnel
startTunnel();

console.log('Production tunnel manager running. Press Ctrl+C to stop.');