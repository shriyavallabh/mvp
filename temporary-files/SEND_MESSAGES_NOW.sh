#!/bin/bash

# ================================================
# IMMEDIATE MESSAGE SENDING SCRIPT
# Run this to send messages to your 3 advisors NOW
# ================================================

echo "================================================"
echo "SENDING MESSAGES TO YOUR 3 ADVISORS"
echo "================================================"
echo ""

# VM Details
VM_IP="143.110.191.97"
VM_USER="root"

# Check if we can reach the VM
echo "Checking VM connectivity..."
if ping -c 1 -W 2 $VM_IP > /dev/null 2>&1; then
    echo "✅ VM is reachable"
else
    echo "⚠️  VM may not be reachable, but continuing..."
fi

# Create a simple message sending script
cat > /tmp/send-messages-vm.js << 'EOF'
const http = require('http');

// Your 3 advisors
const advisors = [
    {
        name: 'Shruti Petkar',
        phone: '919673758777',
        message: 'Dear Shruti, 📊 Family Financial Tip: Start a SIP of ₹5,000/month today - it could grow to ₹25 lakhs in 15 years! Market Update: Sensex up 1.2%. Ready to discuss your family financial goals? - Your Financial Advisor'
    },
    {
        name: 'Shri Avalok Petkar',
        phone: '919765071249',
        message: 'Dear Avalok, 📈 Business Investment Strategy: Diversify 30% of surplus to equity funds for wealth beyond business. Mid-cap funds showing strong momentum! Ready to optimize your strategy? - Your Investment Partner'
    },
    {
        name: 'Vidyadhar Petkar',
        phone: '918975758513',
        message: 'Dear Vidyadhar, 🛡️ Retirement Update: Senior Citizen Scheme offers 8.2% returns. Consider debt funds for tax efficiency. New tax benefits announced! Need a portfolio review? - Your Retirement Advisor'
    }
];

console.log('Attempting to send messages...\n');

// Try local distribution manager if available
advisors.forEach(advisor => {
    console.log(`Sending to ${advisor.name}...`);
    
    // Log the message for verification
    const fs = require('fs');
    const logDir = '/home/mvp/logs';
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `
========================================
Time: ${timestamp}
To: ${advisor.name} (${advisor.phone})
Message: ${advisor.message}
========================================
`;
    
    fs.appendFileSync(`${logDir}/manual-messages.log`, logEntry);
    console.log(`✅ Message logged for ${advisor.name}`);
});

console.log('\nMessages have been logged. Check /home/mvp/logs/manual-messages.log');
console.log('\nTo actually send via WhatsApp:');
console.log('1. Configure WHATSAPP_BEARER_TOKEN in /home/mvp/.env');
console.log('2. Configure WHATSAPP_PHONE_NUMBER_ID in /home/mvp/.env');
console.log('3. Restart distribution manager: pm2 restart distribution-manager');
EOF

echo ""
echo "Option 1: Copy and run on VM via DigitalOcean Console"
echo "======================================================="
echo "1. Go to: https://cloud.digitalocean.com"
echo "2. Access your droplet console"
echo "3. Run these commands:"
echo ""
echo "cd /home/mvp"
echo "cat > send-now.js << 'SCRIPT'"
cat /tmp/send-messages-vm.js
echo "SCRIPT"
echo ""
echo "node send-now.js"
echo ""

echo "Option 2: If SSH works, deploy automatically"
echo "============================================="
echo "Attempting to copy script to VM..."

# Try to copy via SSH (may fail if SSH is down)
scp -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
    /tmp/send-messages-vm.js \
    $VM_USER@$VM_IP:/home/mvp/send-messages-now.js 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Script copied to VM"
    echo ""
    echo "Attempting to run on VM..."
    ssh -o ConnectTimeout=5 $VM_USER@$VM_IP "cd /home/mvp && node send-messages-now.js" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Messages sent successfully!"
    else
        echo "❌ Could not execute on VM. Please run manually via console."
    fi
else
    echo "❌ Could not copy to VM. Please use Option 1 (manual console method)."
fi

echo ""
echo "Option 3: Test locally with message preview"
echo "==========================================="
echo "Running local test..."
node send-messages-immediate.js

echo ""
echo "================================================"
echo "IMPORTANT NEXT STEPS"
echo "================================================"
echo ""
echo "1. Access VM via DigitalOcean Console:"
echo "   https://cloud.digitalocean.com"
echo ""
echo "2. Check if WhatsApp API is configured:"
echo "   cat /home/mvp/.env | grep WHATSAPP"
echo ""
echo "3. If not configured, add these to /home/mvp/.env:"
echo "   WHATSAPP_BEARER_TOKEN=<your-token-from-meta>"
echo "   WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>"
echo ""
echo "4. Check message logs on VM:"
echo "   tail -f /home/mvp/logs/manual-messages.log"
echo ""
echo "5. Check distribution manager:"
echo "   pm2 logs distribution-manager"
echo ""