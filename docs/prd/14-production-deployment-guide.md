# 14. Production Deployment Guide

## 14.1 DigitalOcean VM Setup
```bash
# 1. Create Droplet
- Size: Basic ($6/month)
- Region: Bangalore
- OS: Ubuntu 22.04 LTS
- Authentication: SSH keys

# 2. Initial Setup Commands
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs python3 python3-pip
npm install -g @anthropic-ai/claude-cli pm2
pip3 install flask requests

# 3. Claude Session Setup
mkdir -p ~/.claude
# Copy session.json from local machine
nano ~/.claude/session.json

# 4. Start Services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 14.2 Webhook Integration
```javascript
// Google Apps Script for instant triggers
function onReviewResponse(e) {
  const response = e.values[0];
  const VM_URL = 'http://YOUR_VM_IP:5000/trigger';
  
  UrlFetchApp.fetch(VM_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      action: response.includes('Change') ? 'revise' : 'approve',
      data: response
    })
  });
}
```

## 14.3 Monitoring & Maintenance
- **Health Check:** `http://VM_IP:5000/health`
- **PM2 Dashboard:** `pm2 monit`
- **Logs:** `pm2 logs --lines 100`
- **Session Refresh:** Check monthly
- **Backup:** Daily to GitHub
