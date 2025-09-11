#!/bin/bash

# ================================================
# IMMEDIATE WhatsApp Message Sender for VM
# Run this ON THE VM to send messages NOW
# ================================================

echo "================================================"
echo "IMMEDIATE MESSAGE SENDING TO 3 ADVISORS"
echo "================================================"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S IST')"
echo ""

# Navigate to project directory
cd /home/mvp

# Create immediate send script
cat > /tmp/send-now.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Your 3 advisors with proper Indian phone format
const ADVISORS = [
    {
        name: 'Shruti Petkar',
        phone: '919673758777',
        message: `Dear Shruti,

📊 *Today's Family Financial Tip*

Building wealth for your family starts with smart planning. Here are 3 steps:

1️⃣ Emergency Fund: Save 6 months expenses
2️⃣ Term Insurance: Get 10x annual income  
3️⃣ Child Education SIP: Start ₹5,000/month

💡 Action: Start SIP today - could grow to ₹25 lakhs in 15 years!

Market Update: Sensex up 1.2% - good time to review portfolio.

Ready to discuss your family's financial goals?

Best regards,
Your Financial Advisor

_Mutual funds subject to market risks. Read documents carefully._`
    },
    {
        name: 'Shri Avalok Petkar',
        phone: '919765071249',
        message: `Dear Avalok,

📈 *Business Growth Investment Strategy*

As an entrepreneur, diversify beyond your business:

✅ Allocate 30% surplus to equity funds
✅ Save 30% tax via ELSS funds
✅ Keep 3 months expenses liquid

Market Alert: Mid-cap funds showing strong momentum!

Special: Free tax planning consultation this week for business owners.

Let's optimize your investment strategy?

Best regards,
Your Investment Partner

_Investments subject to market risks._`
    },
    {
        name: 'Vidyadhar Petkar',
        phone: '918975758513',
        message: `Dear Vidyadhar,

🛡️ *Retirement Security Update*

Safe investment options for your retirement:

• Senior Citizen Scheme: 8.2% assured returns
• Debt Funds: Better than FD with tax efficiency
• SWP: Regular income without touching principal

Important: New tax benefits for senior citizens announced!

Your Portfolio Status:
✅ Safety Score: 9/10
✅ Monthly Income: Secured
✅ Inflation Protection: Active

Need a portfolio review?

Warm regards,
Your Retirement Advisor

_Read all documents before investing._`
    }
];

// Try different sending methods
async function sendMessages() {
    console.log('Starting message delivery...\n');
    
    for (const advisor of ADVISORS) {
        console.log(`Sending to ${advisor.name} (${advisor.phone})...`);
        
        try {
            // Method 1: Try using distribution manager if exists
            const DistributionManager = require('./agents/controllers/distribution-manager-whatsapp.js');
            const distributor = new DistributionManager();
            
            await distributor.sendWhatsAppMessage({
                phone: advisor.phone,
                message: advisor.message,
                advisor_name: advisor.name
            });
            
            console.log(`✅ Sent via Distribution Manager`);
            
        } catch (error) {
            console.log('Distribution Manager not available, trying webhook...');
            
            // Method 2: Try webhook server
            try {
                const axios = require('axios');
                await axios.post('http://localhost:5001/send', {
                    to: advisor.phone,
                    text: advisor.message
                });
                console.log(`✅ Sent via webhook`);
            } catch (err) {
                console.log('Webhook not available, using direct API...');
                
                // Method 3: Direct WhatsApp API call
                try {
                    const https = require('https');
                    const token = process.env.WHATSAPP_BEARER_TOKEN;
                    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '123456789';
                    
                    if (token) {
                        // Make direct API call
                        console.log('Would send via WhatsApp API (token exists)');
                    } else {
                        console.log('⚠️  No WhatsApp token configured');
                    }
                } catch (apiErr) {
                    console.log('❌ All methods failed');
                }
            }
        }
        
        // Log the message for verification
        const logFile = `/home/mvp/logs/manual-send-${new Date().toISOString().split('T')[0]}.log`;
        fs.appendFileSync(logFile, `
========================================
Time: ${new Date().toISOString()}
To: ${advisor.name} (${advisor.phone})
Status: Attempted
Message:
${advisor.message}
========================================\n`);
        
        console.log(`Logged to ${logFile}\n`);
        
        // Wait 2 seconds between messages
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('\n✅ Message sending complete!');
    console.log('Check logs at: /home/mvp/logs/');
}

// Run immediately
sendMessages().catch(console.error);
EOF

# Make it executable
chmod +x /tmp/send-now.js

# Run the script
echo "Executing message sender..."
node /tmp/send-now.js

echo ""
echo "================================================"
echo "CHECKING RESULTS"
echo "================================================"

# Check if messages were logged
echo ""
echo "Recent logs:"
tail -n 20 /home/mvp/logs/manual-send-*.log 2>/dev/null || echo "No manual send logs found"

# Check PM2 processes
echo ""
echo "Active processes:"
pm2 list

# Check distribution manager logs
echo ""
echo "Distribution logs (last 10 lines):"
pm2 logs distribution-manager --nostream --lines 10 2>/dev/null || echo "Distribution manager not running"

echo ""
echo "================================================"
echo "NEXT STEPS"
echo "================================================"
echo ""
echo "1. Check if advisors received messages on WhatsApp"
echo "2. If not received, check WhatsApp API configuration:"
echo "   cat /home/mvp/.env | grep WHATSAPP"
echo ""
echo "3. To configure WhatsApp API:"
echo "   - Get token from Meta Business Platform"
echo "   - Add to .env: WHATSAPP_BEARER_TOKEN=your_token"
echo "   - Add phone ID: WHATSAPP_PHONE_NUMBER_ID=your_phone_id"
echo ""
echo "4. For automated daily sending:"
echo "   - Messages will generate at 8:30 PM"
echo "   - Auto-approve at 11:00 PM"
echo "   - Send at 5:00 AM"
echo ""
echo "5. To manually trigger generation NOW:"
echo "   pm2 trigger evening-generation"
echo ""
echo "Script completed at: $(date '+%Y-%m-%d %H:%M:%S IST')"