# 🔧 DASHBOARD INTEGRATION - MAINTENANCE GUIDE

## Overview
This guide covers ongoing maintenance, monitoring, and troubleshooting for the Story 3.2 Task 7 dashboard integration services.

## 📊 Service Architecture Overview

### Production Services
```
PRODUCTION WEBHOOK (Port 3000):
├── webhook-meta-grade.js ✅ Meta-grade architecture
├── Status: PRODUCTION - DO NOT MODIFY
└── Enhancement: Minimal event logging (4 lines)

DASHBOARD INTEGRATION SERVICES:
├── events-logger.js ✅ SQLite database management
├── dashboard-api-server.js (Port 3002) ✅ REST API endpoints
├── websocket-server.js (Port 3001) ✅ Real-time streaming
└── Status: NEW - Safe to maintain/update
```

## 🔍 Daily Monitoring Checklist

### Service Health Check
```bash
# Check all services status
pm2 status

# Expected output should show:
# ├── webhook-button-handler (online) ← Production webhook
# ├── dashboard-api-server (online) ← New service  
# └── websocket-server (online) ← New service

# Quick health verification
curl -s http://localhost:3002/api/webhook/health | jq '.status'
# Should return: "healthy"
```

### Database Health Check
```bash
# Check SQLite database size and accessibility
ls -lh data/webhook_events.db

# Test database connectivity
node -e "
const logger = require('./events-logger');
logger.getDashboardMetrics().then(m => {
  console.log('✅ Database accessible - Events:', Object.values(m).reduce((a,b) => (a||0) + (b||0), 0));
}).catch(e => console.error('❌ Database error:', e.message));
"
```

### Performance Monitoring
```bash
# Check memory usage
pm2 show dashboard-api-server | grep -E "(memory|cpu)"
pm2 show websocket-server | grep -E "(memory|cpu)"

# Check log file sizes
ls -lh logs/dashboard-*
ls -lh logs/websocket-*
```

## 📈 Analytics & Metrics Monitoring

### Dashboard Data Verification
```bash
# Test all dashboard endpoints
echo "Testing Dashboard API endpoints..."

curl -s http://localhost:3002/api/webhook/metrics | jq '.success'
curl -s http://localhost:3002/api/webhook/conversations | jq '.success'  
curl -s http://localhost:3002/api/webhook/stats/realtime | jq '.success'

# All should return: true
```

### Database Growth Monitoring
```bash
# Monitor database growth over time
sqlite3 data/webhook_events.db "SELECT COUNT(*) as total_events FROM webhook_events;"
sqlite3 data/webhook_events.db "SELECT COUNT(*) as today_events FROM webhook_events WHERE date(timestamp) = date('now');"

# Create simple monitoring script
cat > check_db_growth.sh << 'EOF'
#!/bin/bash
DB_SIZE=$(ls -lh data/webhook_events.db | awk '{print $5}')
EVENT_COUNT=$(sqlite3 data/webhook_events.db "SELECT COUNT(*) FROM webhook_events;")
TODAY_EVENTS=$(sqlite3 data/webhook_events.db "SELECT COUNT(*) FROM webhook_events WHERE date(timestamp) = date('now');")

echo "📊 Database Status:"
echo "   Size: $DB_SIZE"
echo "   Total Events: $EVENT_COUNT"
echo "   Today's Events: $TODAY_EVENTS"
EOF
chmod +x check_db_growth.sh
```

## 🛠️ Common Maintenance Tasks

### Log Rotation
```bash
# Rotate PM2 logs (recommended weekly)
pm2 flush dashboard-api-server
pm2 flush websocket-server

# Archive old logs
mkdir -p logs/archive/$(date +%Y-%m)
mv logs/dashboard-*.log logs/archive/$(date +%Y-%m)/ 2>/dev/null || true
mv logs/websocket-*.log logs/archive/$(date +%Y-%m)/ 2>/dev/null || true
```

### Database Maintenance
```bash
# SQLite database optimization (monthly)
sqlite3 data/webhook_events.db "VACUUM;"
sqlite3 data/webhook_events.db "ANALYZE;"

# Clean old events (optional - keep last 90 days)
sqlite3 data/webhook_events.db "DELETE FROM webhook_events WHERE timestamp < datetime('now', '-90 days');"
```

### Service Restart (Zero Downtime)
```bash
# Restart dashboard services (production webhook unaffected)
pm2 restart dashboard-api-server --update-env
pm2 restart websocket-server --update-env

# Verify services are back online
sleep 5
curl -s http://localhost:3002/api/webhook/health
```

## ⚠️ Troubleshooting Common Issues

### Issue 1: Dashboard API Not Responding
**Symptoms:** Dashboard can't connect, API endpoints return errors

**Diagnosis:**
```bash
# Check if service is running
pm2 list | grep dashboard-api-server

# Check logs for errors  
pm2 logs dashboard-api-server --lines 50

# Test port accessibility
lsof -i :3002
curl -v http://localhost:3002/api/webhook/health
```

**Resolution:**
```bash
# Restart service
pm2 restart dashboard-api-server

# If port conflict, check what's using port 3002
lsof -i :3002
# Kill conflicting process if safe to do so

# Verify database connectivity
node -e "require('./events-logger').getDashboardMetrics().then(console.log)"
```

### Issue 2: WebSocket Connection Failures
**Symptoms:** Dashboard shows disconnected, real-time updates not working

**Diagnosis:**
```bash
# Check WebSocket server status
pm2 show websocket-server

# Test WebSocket connectivity (if wscat installed)
wscat -c ws://localhost:3001 -x '{"type":"ping"}'

# Check for port conflicts
lsof -i :3001
```

**Resolution:**
```bash
# Restart WebSocket server
pm2 restart websocket-server

# Test connection manually
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001');
ws.on('open', () => console.log('✅ WebSocket working'));
ws.on('error', (e) => console.error('❌ WebSocket error:', e.message));
"
```

### Issue 3: Database Connectivity Issues
**Symptoms:** Events not logging, API returns empty data

**Diagnosis:**
```bash
# Check database file exists and is readable
ls -la data/webhook_events.db

# Test database connectivity
sqlite3 data/webhook_events.db ".tables"
sqlite3 data/webhook_events.db "SELECT COUNT(*) FROM webhook_events LIMIT 1;"
```

**Resolution:**
```bash
# Check file permissions
chmod 664 data/webhook_events.db
chown $(whoami):$(whoami) data/webhook_events.db

# Recreate database if corrupted
mv data/webhook_events.db data/webhook_events.db.backup
node -e "require('./events-logger').init().then(() => console.log('✅ Database recreated'))"
```

### Issue 4: Production Webhook Affected
**Symptoms:** Button clicks not working, webhook errors

**Immediate Action:**
```bash
# Check production webhook logs
pm2 logs webhook-button-handler --lines 100

# If event logging causing issues, temporarily disable
# Edit webhook-meta-grade.js and comment out eventsLogger lines:
# // eventsLogger.logButtonClick(...)
# // eventsLogger.logTextMessage(...)
# // eventsLogger.logContentDelivery(...)

# Restart production webhook
pm2 restart webhook-button-handler
```

**Safety Note:** Production webhook can operate normally without event logging.

## 🔄 Update Procedures

### Updating Dashboard Services
```bash
# Safe update procedure (zero downtime for production webhook)

# 1. Test changes in development first
node test-dashboard-integration.js

# 2. Backup current database
cp data/webhook_events.db data/webhook_events.db.backup

# 3. Update service files
# (Make your changes to dashboard-api-server.js, websocket-server.js, etc.)

# 4. Restart services
pm2 restart dashboard-api-server
pm2 restart websocket-server

# 5. Verify everything works
curl http://localhost:3002/api/webhook/health
```

### Adding New API Endpoints
```bash
# 1. Add endpoint to dashboard-api-server.js
# 2. Add corresponding test to tests/dashboard-integration.test.js
# 3. Update API documentation in STORY-4.2-INTEGRATION-CHECKLIST.md
# 4. Test thoroughly before deployment
```

## 📊 Performance Optimization

### Database Performance
```bash
# Add indexes for frequently queried fields (if needed)
sqlite3 data/webhook_events.db "
CREATE INDEX IF NOT EXISTS idx_timestamp ON webhook_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_advisor_phone ON webhook_events(advisor_phone);
"
```

### Memory Optimization
```bash
# Monitor memory usage and set limits if needed
pm2 start dashboard-api-server --max-memory-restart 1G
pm2 start websocket-server --max-memory-restart 512M
```

### API Response Optimization
```javascript
// Add caching to frequently requested endpoints
// Example: Cache metrics for 30 seconds
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

app.get('/api/webhook/metrics', async (req, res) => {
  const cacheKey = `metrics_${req.query.days || 7}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }
  
  // ... existing logic ...
  
  cache.set(cacheKey, { data: response, timestamp: Date.now() });
  res.json(response);
});
```

## 🔐 Security Considerations

### Access Control
```bash
# Ensure only authorized access to API endpoints
# Consider adding authentication if exposed to internet

# Check firewall rules
ufw status | grep -E "(3001|3002)"

# API should only be accessible from dashboard server
```

### Database Security
```bash
# Ensure database file has proper permissions
chmod 640 data/webhook_events.db

# Consider encrypting sensitive data in database
# Regularly backup database to secure location
```

## 📅 Maintenance Schedule

### Daily Tasks
- [ ] Check service status via `pm2 status`
- [ ] Verify API health endpoint responds
- [ ] Monitor log file sizes

### Weekly Tasks  
- [ ] Rotate PM2 logs
- [ ] Check database growth
- [ ] Verify dashboard integration still working

### Monthly Tasks
- [ ] Optimize SQLite database (VACUUM, ANALYZE)
- [ ] Archive old log files
- [ ] Review and clean old events (optional)
- [ ] Performance review and optimization

### Quarterly Tasks
- [ ] Full backup of database and configurations
- [ ] Security review and updates
- [ ] Performance benchmarking
- [ ] Documentation updates

## 🚨 Emergency Procedures

### Complete Service Failure
```bash
# 1. Stop all dashboard services (preserve production webhook)
pm2 stop dashboard-api-server websocket-server

# 2. Check production webhook still working
curl https://6ecac5910ac8.ngrok-free.app/health

# 3. Investigate and fix issues
pm2 logs dashboard-api-server --lines 200
pm2 logs websocket-server --lines 200

# 4. Restart services when ready
pm2 start ecosystem.dashboard-integration.config.js
```

### Database Corruption
```bash
# 1. Stop services using database
pm2 stop dashboard-api-server websocket-server

# 2. Backup corrupted database
cp data/webhook_events.db data/webhook_events.db.corrupted

# 3. Restore from backup or recreate
cp data/webhook_events.db.backup data/webhook_events.db
# OR: rm data/webhook_events.db && node -e "require('./events-logger').init()"

# 4. Restart services
pm2 start dashboard-api-server websocket-server
```

## 📞 Support & Contacts

**Architecture Questions:** Consult Winston (Architect) via `/architect` command
**Integration Issues:** Reference `STORY-4.2-INTEGRATION-CHECKLIST.md`
**Production Webhook:** Meta-grade architecture - minimal modifications only

**Key Files for Reference:**
- `webhook-meta-grade.js` - Production webhook (minimal changes only)
- `dashboard-api-server.js` - Main API service
- `websocket-server.js` - Real-time streaming service  
- `events-logger.js` - Database management

**Safety Reminder:** The production webhook can operate independently of all dashboard services. If in doubt, prioritize production webhook stability over dashboard features.

The dashboard integration services are designed to enhance your system without compromising the rock-solid Meta-grade webhook architecture that's serving your production needs! 🚀