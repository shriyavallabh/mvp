#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const VM_IP = '159.89.166.94';

async function deployOllamaFixed() {
    console.log('🚀 DEPLOYING OLLAMA WITH PHI MODEL\n');

    const commands = [
        {
            desc: 'Install Ollama',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "curl -fsSL https://ollama.ai/install.sh | sh"`
        },
        {
            desc: 'Enable Ollama service',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl enable ollama"`
        },
        {
            desc: 'Start Ollama service',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl start ollama"`
        },
        {
            desc: 'Check Ollama status',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl status ollama --no-pager"`
        },
        {
            desc: 'Configure Ollama host binding',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "echo 'OLLAMA_HOST=0.0.0.0:11434' >> /etc/environment"`
        },
        {
            desc: 'Restart Ollama with new config',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "systemctl restart ollama"`
        },
        {
            desc: 'Wait for Ollama startup',
            cmd: `sleep 10`
        },
        {
            desc: 'Install phi model',
            cmd: `sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "timeout 300 ollama run phi"`
        }
    ];

    for (let i = 0; i < commands.length; i++) {
        const { desc, cmd } = commands[i];
        console.log(`${i + 1}️⃣ ${desc}...`);
        
        try {
            const { stdout, stderr } = await execAsync(cmd, { timeout: 320000 });
            if (stdout) {
                console.log('   ✅', stdout.substring(0, 200).replace(/\n/g, ' '));
            }
            if (stderr && !stderr.includes('Warning')) {
                console.log('   ⚠️ ', stderr.substring(0, 100));
            }
        } catch (error) {
            console.log('   ❌', error.message.substring(0, 100));
            if (desc.includes('Install phi') || desc.includes('Ollama')) {
                console.log('   → Continuing anyway...');
            }
        }
        
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🧪 TESTING INSTALLATION...');
    
    // Test Ollama API
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
        console.log('Testing Ollama API...');
        const { stdout } = await execAsync(`curl -s http://${VM_IP}:11434/api/tags`, { timeout: 10000 });
        console.log('✅ Ollama API response:', stdout);
    } catch (error) {
        console.log('❌ Ollama API test failed');
    }

    // Test phi model
    try {
        console.log('Testing phi model...');
        const testCmd = `curl -s -X POST http://${VM_IP}:11434/api/generate -H "Content-Type: application/json" -d '{"model":"phi","prompt":"Hello","stream":false}'`;
        const { stdout } = await execAsync(testCmd, { timeout: 30000 });
        console.log('✅ Phi model test:', stdout.substring(0, 100));
    } catch (error) {
        console.log('❌ Phi model test failed:', error.message);
    }

    console.log('\n🎯 DEPLOYMENT COMPLETE');
    console.log('Now restarting webhook to connect to real AI...');
    
    // Restart webhook
    try {
        await execAsync(`sshpass -p 'droplet' ssh -o StrictHostKeyChecking=no root@${VM_IP} "cd /root/webhook && pm2 restart all"`, { timeout: 15000 });
        console.log('✅ Webhook restarted with AI connection');
    } catch (error) {
        console.log('⚠️  Webhook restart issue:', error.message);
    }
}

deployOllamaFixed().catch(console.error);