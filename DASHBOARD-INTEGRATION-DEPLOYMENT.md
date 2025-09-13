# 🚀 STORY 3.2 DASHBOARD INTEGRATION - DEPLOYMENT GUIDE

## Overview
This guide covers deploying the new dashboard integration services (Task 7) alongside the existing production webhook without disrupting the working system.

## Architecture Summary
```
PRODUCTION WEBHOOK (UNTOUCHED):
├── webhook-meta-grade.js (port 3000) ✅ Meta-grade architecture
└── PM2: webhook-button-handler

NEW DASHBOARD SERVICES:
├── events-logger.js ✅ SQLite database with analytics
├── dashboard-api-server.js (port 3002) ✅ REST API endpoints  
└── websocket-server.js (port 3001) ✅ Real-time WebSocket server
```

## Prerequisites ✅
- [x] SQLite3, WebSocket, CORS packages installed (`npm install sqlite3 ws cors`)
- [x] Production webhook working on port 3000
- [x] PM2 installed and running
- [x] Ports 3001 and 3002 available

## Local Testing (Optional)

### 1. Test Events Logger
```bash
node -e "
const logger = require('./events-logger');
setTimeout(() => {
  logger.logButtonClick('919765071249', 'TEST_BUTTON', {test: true});
  console.log('✅ Events logger test complete');
  process.exit(0);
}, 1000);
"
```

### 2. Test Dashboard API Server
```bash
# Terminal 1: Start API server
node dashboard-api-server.js

# Terminal 2: Test endpoints
curl http://localhost:3002/api/webhook/health
curl http://localhost:3002/api/webhook/metrics
curl http://localhost:3002/api/webhook/conversations
```

### 3. Test WebSocket Server
```bash
# Terminal 1: Start WebSocket server
node websocket-server.js

# Terminal 2: Test connection (install wscat first: npm install -g wscat)
wscat -c ws://localhost:3001
# Send: {"type": "ping"}
# Expect: {"type": "pong", "timestamp": "..."}
```

## Production Deployment

### Step 1: Deploy Services with PM2
```bash
# Deploy dashboard integration services
pm2 start ecosystem.dashboard-integration.config.js

# Verify services are running
pm2 status

# Expected output:
# ├── dashboard-api-server (port 3002)
# ├── websocket-server (port 3001)
# └── webhook-button-handler (port 3000) ← Existing production
```

### Step 2: Verify Service Health
```bash
# Check dashboard API health
curl http://localhost:3002/api/webhook/health

# Check WebSocket server (if wscat installed)
wscat -c ws://localhost:3001 -x '{"type":"ping"}'
```

### Step 3: Test Integration with Production Webhook
```bash
# Send a button template to trigger event logging
node send-meta-grade-test.js

# Check that events were logged via dashboard API
curl http://localhost:3002/api/webhook/events/recent
```

## VM Deployment (Digital Ocean)

### Update Firewall Rules
```bash
# Add ports for dashboard integration
ufw allow 3001/tcp comment "WebSocket Server"
ufw allow 3002/tcp comment "Dashboard API"
ufw status
```

### Deploy on VM
```bash
# SSH to VM
ssh root@139.59.51.237

# Navigate to webhook directory
cd /home/mvp/webhook

# Copy new files (use scp/rsync)
# - events-logger.js
# - dashboard-api-server.js  
# - websocket-server.js
# - ecosystem.dashboard-integration.config.js

# Install dependencies
npm install sqlite3 ws cors

# Start dashboard integration services
pm2 start ecosystem.dashboard-integration.config.js

# Save PM2 configuration
pm2 save
```

## Story 4.2 Dashboard Connection

The dashboard can connect to these endpoints:

### REST API Endpoints (Port 3002)
```javascript
const dashboardApi = 'http://139.59.51.237:3002'; // Or VM IP

// Button analytics
GET ${dashboardApi}/api/webhook/metrics
GET ${dashboardApi}/api/webhook/metrics?days=30

// Conversation data  
GET ${dashboardApi}/api/webhook/conversations
GET ${dashboardApi}/api/webhook/conversations?limit=100

// Health check
GET ${dashboardApi}/api/webhook/health

// Real-time stats
GET ${dashboardApi}/api/webhook/stats/realtime

// Recent events
GET ${dashboardApi}/api/webhook/events/recent?limit=50
```

### WebSocket Connection (Port 3001)
```javascript
const ws = new WebSocket('ws://139.59.51.237:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'connection_established':
      console.log('Connected to webhook events stream');
      break;
    case 'new_events':
      console.log('New webhook events:', data.events);
      break;
    case 'button_click':
      console.log('Real-time button click:', data.data);
      break;
    case 'content_delivery':
      console.log('Real-time content delivery:', data.data);
      break;
  }
};

// Subscribe to specific events
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['button_clicks', 'content_delivery']
}));
```

## Monitoring & Logs

### PM2 Logs
```bash
# View dashboard API logs
pm2 logs dashboard-api-server

# View WebSocket logs  
pm2 logs websocket-server

# View all logs
pm2 logs
```

### Log Files Location
```
logs/
├── dashboard-api-combined.log
├── dashboard-api-error.log
├── dashboard-api-out.log
├── websocket-combined.log
├── websocket-error.log
└── websocket-out.log
```

### Database Location
```
data/
└── webhook_events.db  (SQLite database)
```

## Troubleshooting

### Service Won't Start
```bash
# Check port availability
lsof -i :3001
lsof -i :3002

# Check logs for errors
pm2 logs dashboard-api-server --lines 50
pm2 logs websocket-server --lines 50

# Restart services
pm2 restart dashboard-api-server
pm2 restart websocket-server
```

### Database Issues
```bash
# Check database file permissions
ls -la data/webhook_events.db

# Test database connection
node -e "
const logger = require('./events-logger');
logger.getDashboardMetrics().then(console.log).catch(console.error);
"
```

### API Connection Issues
```bash
# Test from dashboard server
curl -v http://localhost:3002/api/webhook/health

# Test from external
curl -v http://VM_IP:3002/api/webhook/health
```

## Safety Notes

✅ **Production webhook (webhook-meta-grade.js) remains untouched** except for 4 minimal logging lines
✅ **All new services run on separate ports** (3001, 3002)
✅ **Event logging is non-blocking** - webhook performance unaffected
✅ **Services can be stopped independently** without affecting production webhook
✅ **Database is isolated** in separate SQLite file

## Rollback Plan

If any issues occur:
```bash
# Stop dashboard integration services
pm2 stop dashboard-api-server
pm2 stop websocket-server

# Production webhook continues working normally on port 3000
# Remove event logging lines from webhook-meta-grade.js if needed
```

## Success Metrics

After deployment, verify:
- ✅ Production webhook still processes button clicks normally
- ✅ Dashboard API responds to all 5 endpoints
- ✅ WebSocket accepts connections and streams events
- ✅ Events are logged in SQLite database
- ✅ Story 4.2 dashboard can connect and retrieve data

## Next Steps

1. Deploy services using PM2 configuration
2. Test all endpoints and WebSocket connection
3. Integrate with Story 4.2 dashboard
4. Monitor logs for any issues
5. Set up automated backups for SQLite database

The dashboard integration is now ready for Story 4.2 connection! 🚀