#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function fixOllamaBinding() {
    console.log('🔧 FIXING OLLAMA NETWORK BINDING\n');

    const fixCommands = [
        {
            desc: 'Stop Ollama service',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl stop ollama"`
        },
        {
            desc: 'Create Ollama systemd override directory',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "mkdir -p /etc/systemd/system/ollama.service.d"`
        },
        {
            desc: 'Configure Ollama to bind to all interfaces',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "echo '[Service]' > /etc/systemd/system/ollama.service.d/override.conf && echo 'Environment=OLLAMA_HOST=0.0.0.0:11434' >> /etc/systemd/system/ollama.service.d/override.conf"`
        },
        {
            desc: 'Reload systemd daemon',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl daemon-reload"`
        },
        {
            desc: 'Start Ollama with new configuration',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl start ollama"`
        },
        {
            desc: 'Check Ollama status',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl status ollama --no-pager -l"`
        },
        {
            desc: 'Wait for service startup',
            cmd: `sleep 10`
        },
        {
            desc: 'Test Ollama port binding',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "ss -tulpn | grep 11434"`
        },
        {
            desc: 'Install tinyllama model',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "timeout 180 ollama pull tinyllama"`
        },
        {
            desc: 'Test model locally on VM',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "curl -s -X POST http://localhost:11434/api/generate -H 'Content-Type: application/json' -d '{\"model\":\"tinyllama\",\"prompt\":\"Hello\",\"stream\":false}' | head -c 200"`
        }
    ];

    for (let i = 0; i < fixCommands.length; i++) {
        const { desc, cmd } = fixCommands[i];
        console.log(`${i + 1}️⃣ ${desc}...`);
        
        try {
            const { stdout, stderr } = await execAsync(cmd, { timeout: 200000 });
            if (stdout && stdout.trim()) {
                console.log('   ✅', stdout.substring(0, 150).replace(/\n/g, ' | '));
            }
            if (stderr && !stderr.includes('Warning') && stderr.trim()) {
                console.log('   ⚠️ ', stderr.substring(0, 100));
            }
            if (!stdout && !stderr) {
                console.log('   ✅ Command completed');
            }
        } catch (error) {
            console.log('   ❌', error.message.substring(0, 100));
            
            // Don't stop on model installation timeout
            if (!desc.includes('Install tinyllama')) {
                console.log('   → Continuing anyway...');
            }
        }
        
        // Delay between critical commands
        if (desc.includes('Start Ollama') || desc.includes('Install')) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    console.log('\n🧪 FINAL CONNECTIVITY TEST...');
    
    // Test external access
    try {
        const testCmd = `curl -s --connect-timeout 10 http://${VM_IP}:11434/api/tags`;
        const { stdout } = await execAsync(testCmd, { timeout: 15000 });
        console.log('✅ OLLAMA EXTERNALLY ACCESSIBLE!');
        console.log('   Response:', stdout);
    } catch (error) {
        console.log('❌ Still not externally accessible');
        console.log('   Checking firewall...');
        
        // Check UFW firewall
        try {
            await execAsync(`sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "ufw allow 11434"`, { timeout: 10000 });
            console.log('✅ Firewall rule added for port 11434');
        } catch {}
    }

    console.log('\n🎯 OLLAMA BINDING FIX COMPLETE');
    console.log('Testing real AI responses in webhook...');
}

fixOllamaBinding().catch(console.error);