# Manual Deployment Guide - Story 3.1 & Initial Advisors

## Quick Start - Adding Your 3 Advisors

### Advisor Information
1. **Shruti Petkar** - 9673758777 (Families segment, Friendly tone)
2. **Shri Avalok Petkar** - 9765071249 (Entrepreneurs segment, Professional tone)  
3. **Vidyadhar Petkar** - 8975758513 (Retirees segment, Educational tone)

All advisors are marked as **PAID** and **ACTIVE** - ready for immediate testing!

## Step 1: Access Your VM

Since SSH is not working, use DigitalOcean Console:

1. Login to DigitalOcean
2. Go to your droplet (143.110.191.97)
3. Click "Access" → "Launch Droplet Console"

## Step 2: Fix SSH Access (If Needed)

In the console, run:
```bash
# Check SSH status
systemctl status ssh

# If not running, start it
systemctl start ssh
systemctl enable ssh

# Check if port 22 is listening
netstat -tlnp | grep :22

# If firewall is blocking
ufw allow 22
ufw allow 2222
ufw reload

# Restart SSH
systemctl restart ssh
```

## Step 3: Deploy Story 3.1 Components

### Option A: If SSH Works Again
From your local machine:
```bash
./deploy-story-3.1.sh
```

### Option B: Manual Deployment via Console

In the DigitalOcean console:

```bash
cd /home/mvp

# Create necessary directories
mkdir -p cache/templates cache/images
mkdir -p templates monitoring
mkdir -p docs/operations
mkdir -p tests/performance tests/integration

# Create cache-manager.js
cat > agents/utils/cache-manager.js << 'EOF'
# [Paste the cache-manager.js content here]
EOF

# Create analytics.js
cat > agents/utils/analytics.js << 'EOF'
# [Paste the analytics.js content here]
EOF

# Create alert-config.js
cat > monitoring/alert-config.js << 'EOF'
# [Paste the alert-config.js content here]
EOF

# Set permissions
chmod +x agents/utils/*.js
chmod +x monitoring/*.js
```

## Step 4: Add Your 3 Advisors

### Method 1: Via Google Sheets (Recommended)

1. Open your Google Sheet (the one configured in Story 1.3)
2. Go to the "Advisors" tab
3. Add these rows:

| ARN | Name | WhatsApp | Email | Client Segment | Tone | Content Focus | Brand Colors | Logo URL | Auto Send | Active | Subscription Status | Plan | Payment Status |
|-----|------|----------|--------|----------------|------|---------------|--------------|----------|-----------|---------|---------------------|-------|----------------|
| ARN_001 | Shruti Petkar | 9673758777 | shruti@example.com | families | friendly | balanced | #4A90E2,#7ED321 | https://example.com/logo1.png | TRUE | TRUE | active | premium | paid |
| ARN_002 | Shri Avalok Petkar | 9765071249 | avalok@example.com | entrepreneurs | professional | growth | #FF6B6B,#4ECDC4 | https://example.com/logo2.png | TRUE | TRUE | active | premium | paid |
| ARN_003 | Vidyadhar Petkar | 8975758513 | vidyadhar@example.com | retirees | educational | safety | #2E7D32,#FFC107 | https://example.com/logo3.png | TRUE | TRUE | active | premium | paid |

### Method 2: Via Script on VM

```bash
cd /home/mvp

# Create advisor addition script
cat > scripts/add-advisors.js << 'EOF'
const advisors = [
    {
        arn: 'ARN_001',
        name: 'Shruti Petkar',
        whatsapp: '9673758777',
        client_segment: 'families',
        tone: 'friendly',
        content_focus: 'balanced',
        active: true,
        subscription_status: 'active',
        payment_status: 'paid'
    },
    {
        arn: 'ARN_002',
        name: 'Shri Avalok Petkar',
        whatsapp: '9765071249',
        client_segment: 'entrepreneurs',
        tone: 'professional',
        content_focus: 'growth',
        active: true,
        subscription_status: 'active',
        payment_status: 'paid'
    },
    {
        arn: 'ARN_003',
        name: 'Vidyadhar Petkar',
        whatsapp: '8975758513',
        client_segment: 'retirees',
        tone: 'educational',
        content_focus: 'safety',
        active: true,
        subscription_status: 'active',
        payment_status: 'paid'
    }
];

// Save to local file
const fs = require('fs');
fs.writeFileSync('data/advisors.json', JSON.stringify(advisors, null, 2));
console.log('Advisors saved to data/advisors.json');

// If Google Sheets is configured, add there too
// [Google Sheets integration code]
EOF

# Run the script
node scripts/add-advisors.js
```

## Step 5: Test Content Generation

### Test for Individual Advisor
```bash
cd /home/mvp

# Test for Shruti Petkar
node -e "
const ContentOrchestrator = require('./agents/controllers/content-orchestrator');
const orchestrator = new ContentOrchestrator();
orchestrator.processAdvisor({
    arn: 'ARN_001',
    name: 'Shruti Petkar',
    whatsapp: '9673758777'
}).then(console.log).catch(console.error);
"

# Check logs
pm2 logs content-orchestrator --lines 50
```

### Test All 3 Advisors
```bash
# Create test script
cat > test-advisors.sh << 'EOF'
#!/bin/bash
echo "Testing content generation for 3 advisors..."

for ARN in ARN_001 ARN_002 ARN_003; do
    echo "Processing $ARN..."
    node agents/controllers/content-orchestrator.js --advisor=$ARN
    sleep 5
done

echo "Test complete. Check pm2 logs for results."
EOF

chmod +x test-advisors.sh
./test-advisors.sh
```

## Step 6: Configure Automated Schedule

The system should already be configured to:
- Generate content at 8:30 PM
- Auto-approve at 11:00 PM
- Send messages at 5:00 AM

Verify the schedule:
```bash
pm2 status
pm2 describe evening-generation
pm2 describe morning-distribution
```

## Step 7: Monitor First Run

### Tonight at 8:30 PM
```bash
# Watch the generation live
pm2 logs content-orchestrator --timestamp

# Check if content is generated for all 3 advisors
grep "ARN_001\|ARN_002\|ARN_003" logs/content-orchestrator.log
```

### Tomorrow at 5:00 AM
```bash
# Check distribution logs
pm2 logs distribution-manager --timestamp

# Verify WhatsApp messages sent
grep "WhatsApp sent" logs/distribution.log
```

## Important Configuration

### Update WhatsApp Numbers
Make sure the WhatsApp Business API is configured to send to Indian numbers (+91):

```bash
# In /home/mvp/.env
WHATSAPP_COUNTRY_CODE=91
WHATSAPP_TEST_MODE=false

# Format numbers correctly
# 9673758777 → +919673758777
```

### Set Content Preferences
You can customize content for each advisor:

- **Shruti (Families)**: Balanced content about family financial planning
- **Avalok (Entrepreneurs)**: Growth-focused business investment content
- **Vidyadhar (Retirees)**: Safety-focused retirement planning content

## Troubleshooting

### If Content Not Generating
```bash
# Check orchestrator
pm2 restart content-orchestrator
pm2 logs content-orchestrator --err

# Check Google Sheets connection
node scripts/test-sheets-connection.js

# Verify advisor data
cat data/advisors.json
```

### If WhatsApp Not Sending
```bash
# Check webhook server
pm2 status webhook-server
curl http://localhost:5001/health

# Check distribution manager
pm2 logs distribution-manager --err

# Test WhatsApp API
curl -X POST http://localhost:5001/test-whatsapp \
  -d '{"phone":"9673758777","message":"Test message"}'
```

### Manual Trigger for Testing
```bash
# Trigger evening generation now
pm2 trigger evening-generation

# Trigger morning distribution now  
pm2 trigger morning-distribution

# Force content for specific advisor
curl -X POST http://localhost:5001/webhook \
  -d '{"advisor":"ARN_001","action":"generate"}'
```

## Expected Results

After successful deployment:

1. **Tonight 8:30 PM**: Content generated for all 3 advisors
2. **Tonight 11:00 PM**: Content auto-approved
3. **Tomorrow 5:00 AM**: WhatsApp messages sent to:
   - Shruti: 9673758777
   - Avalok: 9765071249
   - Vidyadhar: 8975758513

## Support

If you need help:
1. Check logs: `pm2 logs --lines 100`
2. Review operations guide: `cat docs/operations/troubleshooting.md`
3. Check system status: `pm2 monit`

---

**Note**: All 3 advisors are configured as PAID customers with ACTIVE subscriptions. No payment processing needed for testing!