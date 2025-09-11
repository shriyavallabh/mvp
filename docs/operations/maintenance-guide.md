# FinAdvise Content Engine - Maintenance Guide

## PM2 Process Management

### Basic PM2 Commands
```bash
# View all processes
pm2 status

# View detailed process info
pm2 show <process-name>

# View real-time logs
pm2 logs
pm2 logs <process-name> --lines 100

# Restart processes
pm2 restart all
pm2 restart <process-name>

# Stop processes
pm2 stop all
pm2 stop <process-name>

# Delete processes
pm2 delete <process-name>

# Save current process list
pm2 save

# Resurrect saved process list
pm2 resurrect
```

### PM2 Ecosystem Management
```bash
# Start ecosystem
pm2 start ecosystem.content.config.js

# Reload ecosystem with zero downtime
pm2 reload ecosystem.content.config.js

# Update PM2
npm install pm2@latest -g
pm2 update
```

### PM2 Monitoring
```bash
# Interactive monitoring
pm2 monit

# Web-based monitoring (if pm2-web installed)
pm2 web

# Process metrics
pm2 info <process-name>

# Memory/CPU snapshot
pm2 describe <process-name>
```

## Log Rotation and Cleanup

### PM2 Log Rotation
```bash
# Install pm2-logrotate
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'  # Daily at midnight

# Manual log rotation
pm2 flush  # Clear all logs
pm2 flush <process-name>  # Clear specific process logs
```

### Custom Log Cleanup
```bash
# Create cleanup script
cat > /home/mvp/scripts/cleanup-logs.sh << 'EOF'
#!/bin/bash

# Remove logs older than 7 days
find /home/mvp/logs -name "*.log" -mtime +7 -delete

# Compress logs older than 1 day
find /home/mvp/logs -name "*.log" -mtime +1 -exec gzip {} \;

# Clean PM2 logs
pm2 flush

# Clean system logs
journalctl --vacuum-time=7d

# Report disk usage
df -h /home/mvp
EOF

chmod +x /home/mvp/scripts/cleanup-logs.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/mvp/scripts/cleanup-logs.sh
```

### Log Archival
```bash
# Archive logs to Google Drive
cat > /home/mvp/scripts/archive-logs.sh << 'EOF'
#!/bin/bash

DATE=$(date +%Y%m%d)
ARCHIVE_DIR="/home/mvp/archives"
mkdir -p $ARCHIVE_DIR

# Create archive
tar -czf $ARCHIVE_DIR/logs-$DATE.tar.gz /home/mvp/logs/*.log

# Upload to Google Drive (requires rclone setup)
rclone copy $ARCHIVE_DIR/logs-$DATE.tar.gz gdrive:backups/logs/

# Remove local archive after successful upload
if [ $? -eq 0 ]; then
    rm $ARCHIVE_DIR/logs-$DATE.tar.gz
fi
EOF

chmod +x /home/mvp/scripts/archive-logs.sh
```

## Backup and Recovery Procedures

### Automated Backup Setup
```bash
# Create backup script
cat > /home/mvp/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/mvp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup configurations
tar -czf $BACKUP_DIR/config-$DATE.tar.gz \
    /home/mvp/.env \
    /home/mvp/config/ \
    /home/mvp/ecosystem.*.js

# Backup agents
tar -czf $BACKUP_DIR/agents-$DATE.tar.gz /home/mvp/agents/

# Backup templates
tar -czf $BACKUP_DIR/templates-$DATE.tar.gz /home/mvp/templates/

# Backup Google Sheets data (export as JSON)
node /home/mvp/scripts/export-sheets.js > $BACKUP_DIR/sheets-$DATE.json

# Upload to Google Drive
rclone copy $BACKUP_DIR/ gdrive:backups/daily/

# Keep only last 7 local backups
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/mvp/scripts/backup.sh

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /home/mvp/scripts/backup.sh
```

### Recovery Procedures

#### Full System Recovery
```bash
# 1. Restore from backup
cd /home/mvp
tar -xzf /path/to/backup/config-YYYYMMDD.tar.gz
tar -xzf /path/to/backup/agents-YYYYMMDD.tar.gz
tar -xzf /path/to/backup/templates-YYYYMMDD.tar.gz

# 2. Restore environment variables
cp /home/mvp/.env.backup /home/mvp/.env

# 3. Reinstall dependencies
npm install

# 4. Restore PM2 processes
pm2 resurrect

# 5. Verify services
pm2 status
curl http://localhost:5001/health
```

#### Partial Recovery (Specific Component)
```bash
# Restore specific agent
tar -xzf backup.tar.gz agents/controllers/content-orchestrator.js

# Restore configuration
tar -xzf backup.tar.gz config/production_config.js

# Restart affected service
pm2 restart content-orchestrator
```

#### Database Recovery (Google Sheets)
```bash
# Import from backup
node /home/mvp/scripts/import-sheets.js < /path/to/sheets-backup.json

# Verify data
node /home/mvp/scripts/verify-sheets.js
```

## Session Token Refresh Process

### Claude Session Token
```bash
# 1. Check current session status
node -e "
const { exec } = require('child_process');
exec('claude /test --message \"Hello\"', (err, stdout) => {
    if (err) {
        console.log('Session expired or invalid');
    } else {
        console.log('Session active');
    }
});
"

# 2. Refresh session token
# Manual process - requires browser login
echo "Steps to refresh Claude session:"
echo "1. Login to Claude.ai in browser"
echo "2. Open Developer Tools > Application > Cookies"
echo "3. Find sessionKey cookie"
echo "4. Update .env file with new token"

# 3. Update environment variable
nano /home/mvp/.env
# Update: CLAUDE_SESSION_TOKEN=<new-token>

# 4. Restart processes
pm2 restart all

# 5. Verify new session
node /home/mvp/scripts/test-claude.js
```

### API Token Rotation
```bash
# Google API tokens
# 1. Refresh OAuth token
node /home/mvp/scripts/refresh-google-token.js

# 2. Update WhatsApp token
# Get new token from Meta Business Platform
# Update in .env file

# 3. Rotate Gemini API key (if needed)
# Generate new key from Google Cloud Console
# Update in .env file

# 4. Restart services after token updates
pm2 restart all
```

## Performance Optimization

### Memory Management
```bash
# Monitor memory usage
watch -n 5 'free -m'

# Find memory leaks
pm2 install pm2-memory-monitor

# Set memory limits in ecosystem file
module.exports = {
  apps: [{
    name: 'content-orchestrator',
    script: './agents/controllers/content-orchestrator.js',
    max_memory_restart: '500M',
    // ...
  }]
};

# Clear Node.js cache
npm cache clean --force

# Optimize garbage collection
node --expose-gc --max-old-space-size=512 app.js
```

### Disk Space Management
```bash
# Check disk usage
df -h
du -sh /home/mvp/*

# Clean Docker (if used)
docker system prune -a

# Clean package manager cache
npm cache clean --force
apt-get clean

# Remove old kernels (Ubuntu)
apt-get autoremove --purge

# Find large files
find /home/mvp -type f -size +100M -exec ls -lh {} \;
```

### Process Optimization
```bash
# CPU usage monitoring
htop
pm2 monit

# Optimize PM2
pm2 set pm2:max_memory_restart 500M
pm2 set pm2-logrotate:max_size 10M

# Enable cluster mode for scaling
pm2 start app.js -i max  # Use all CPU cores
pm2 start app.js -i 2    # Use 2 instances
```

## Security Maintenance

### Regular Security Updates
```bash
# System updates
apt-get update
apt-get upgrade
apt-get dist-upgrade

# Node.js updates
npm audit
npm audit fix
npm update

# Check for vulnerabilities
npm audit --production

# Update PM2
npm install pm2@latest -g
pm2 update
```

### SSL Certificate Renewal
```bash
# Check certificate expiry
echo | openssl s_client -servername domain.com -connect domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Renew Let's Encrypt certificate
certbot renew

# Restart services after renewal
pm2 restart all
```

### Access Control
```bash
# Review SSH keys
cat ~/.ssh/authorized_keys

# Check active connections
netstat -tnpa | grep ESTABLISHED

# Review firewall rules
ufw status verbose

# Audit user accounts
cat /etc/passwd | grep -E '/home|/bin/bash'
```

## Health Checks

### Daily Health Check Script
```bash
cat > /home/mvp/scripts/health-check.sh << 'EOF'
#!/bin/bash

echo "=== System Health Check ==="
echo "Date: $(date)"

echo -e "\n--- Process Status ---"
pm2 status

echo -e "\n--- Memory Usage ---"
free -m

echo -e "\n--- Disk Usage ---"
df -h

echo -e "\n--- API Health ---"
curl -s http://localhost:5001/health | jq .

echo -e "\n--- Recent Errors ---"
grep ERROR /home/mvp/logs/*.log | tail -10

echo -e "\n--- Cache Metrics ---"
curl -s http://localhost:8080/api/cache/metrics | jq .

echo "=== Check Complete ==="
EOF

chmod +x /home/mvp/scripts/health-check.sh
```

### Automated Monitoring
```bash
# Setup monitoring with PM2
pm2 install pm2-health
pm2 install pm2-auto-pull

# Configure health endpoint monitoring
pm2 set pm2-health:http true
pm2 set pm2-health:port 9615
```

## Troubleshooting Common Issues

### Process Won't Start
```bash
# Check logs for errors
pm2 logs <process-name> --err

# Check file permissions
ls -la /home/mvp/agents/

# Verify dependencies
npm list

# Clear PM2
pm2 kill
pm2 start ecosystem.content.config.js
```

### High CPU Usage
```bash
# Identify CPU-intensive process
top -c
pm2 monit

# Profile Node.js application
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Restart with CPU limit
pm2 start app.js --max-memory-restart 500M --kill-timeout 3000
```

### Memory Leaks
```bash
# Monitor memory growth
pm2 install pm2-memory-monitor

# Generate heap snapshot
kill -USR2 <pid>

# Analyze with Chrome DevTools
node --inspect app.js
```

## Maintenance Calendar

### Daily Tasks
- Log rotation check
- Process status verification
- Error log review
- Cache cleanup (if needed)

### Weekly Tasks
- System updates check
- Performance metrics review
- Backup verification
- Security audit

### Monthly Tasks
- Full system backup
- Session token refresh
- API quota review
- Capacity planning

### Quarterly Tasks
- Security updates
- Dependency updates
- Performance optimization
- Disaster recovery test

---

*Last Updated: 2025-09-09*
*Version: 1.0*