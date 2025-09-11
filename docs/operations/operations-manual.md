# FinAdvise Content Engine - Operations Manual

## System Architecture Overview

### Core Components
1. **Agent System**
   - Content Orchestrator: Main coordinator agent
   - Content Generator: Creates personalized content using Claude CLI
   - Image Creator: Generates visuals using Gemini API
   - Approval Guardian: Automated content approval at 11 PM
   - Distribution Manager: WhatsApp Business API integration
   - Revision Handler: Real-time content modifications

2. **Infrastructure**
   - DigitalOcean VM (Ubuntu 22.04 LTS, 1GB RAM)
   - PM2 Process Manager
   - Google Sheets Database
   - WhatsApp Business API
   - Cloudflare Tunnel for HTTPS

3. **Storage Systems**
   - Google Drive: Content backup and image storage
   - Local filesystem: Template and cache storage
   - Google Sheets: Advisor data and metrics

## Daily Operations Procedures

### Morning Routine (5:00 AM - 8:00 AM)
1. **Content Distribution Check**
   ```bash
   # Check distribution status
   pm2 logs distribution-manager --lines 100
   
   # Verify WhatsApp delivery
   grep "delivered" /home/mvp/logs/distribution.log | tail -20
   ```

2. **System Health Check**
   ```bash
   # Check all processes
   pm2 status
   
   # Verify memory usage
   pm2 monit
   
   # Check disk space
   df -h
   ```

3. **Review Overnight Alerts**
   - Check WhatsApp for critical alerts
   - Review email for warning notifications
   - Check dashboard at http://VM_IP:8080/dashboard

### Evening Routine (8:30 PM - 11:00 PM)
1. **Content Generation Monitoring**
   ```bash
   # Monitor generation progress
   pm2 logs content-orchestrator --lines 50
   
   # Check for errors
   grep ERROR /home/mvp/logs/*.log | tail -20
   ```

2. **Review Window (8:30 PM - 11:00 PM)**
   - Monitor WhatsApp for advisor revision requests
   - Check revision handler logs
   - Ensure approval guardian is ready for 11 PM

3. **Auto-Approval Verification (11:00 PM)**
   ```bash
   # Confirm auto-approval execution
   pm2 logs approval-guardian --lines 30
   
   # Check approval metrics
   cat /home/mvp/logs/analytics.json | jq '.business.approvals'
   ```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Content Generation Failures
**Symptoms:** Content not generated for advisors
**Check:**
```bash
# Check orchestrator logs
pm2 logs content-orchestrator --err --lines 100

# Verify Claude session
node /home/mvp/scripts/check-claude-session.js

# Check API keys
grep "API_KEY" /home/mvp/.env
```
**Solutions:**
- Refresh Claude session token
- Check API rate limits
- Restart orchestrator: `pm2 restart content-orchestrator`

#### 2. WhatsApp Delivery Issues
**Symptoms:** Messages not delivered
**Check:**
```bash
# Check distribution logs
pm2 logs distribution-manager --lines 100

# Verify webhook server
curl http://localhost:5001/health

# Check tunnel status
pm2 logs cloudflare-tunnel
```
**Solutions:**
- Restart webhook server: `pm2 restart webhook-server`
- Restart tunnel: `pm2 restart cloudflare-tunnel`
- Verify WhatsApp API token

#### 3. High Memory Usage
**Symptoms:** System slowdown, PM2 restarts
**Check:**
```bash
# Check memory usage
free -m
pm2 monit

# Find memory-hungry processes
ps aux --sort=-%mem | head -10
```
**Solutions:**
- Clear cache: `rm -rf /home/mvp/cache/*`
- Restart PM2: `pm2 restart all`
- If persistent: Upgrade VM RAM

#### 4. Google Sheets Connection Issues
**Symptoms:** Cannot read/write advisor data
**Check:**
```bash
# Test Google Sheets connection
node /home/mvp/scripts/test-sheets.js

# Check credentials
ls -la /home/mvp/credentials/
```
**Solutions:**
- Refresh OAuth tokens
- Check Google Sheets API quotas
- Verify service account credentials

## Alert Response Procedures

### Critical Alerts

#### API Failures >5 in 5 minutes
1. Check API service status
2. Verify API credentials
3. Check rate limits
4. Implement circuit breaker if needed
5. Switch to fallback mode if available

#### Content Generation >5 minutes
1. Check specific advisor causing delay
2. Verify Claude CLI session
3. Check for complex content requests
4. Consider skipping and marking for manual review

#### Memory Usage >90%
1. Immediate action required
2. Clear caches: `rm -rf /home/mvp/cache/*`
3. Restart non-critical processes
4. If critical: Scale VM immediately

#### Disk Usage >80%
1. Clean logs: `find /home/mvp/logs -mtime +7 -delete`
2. Clear old cache files
3. Archive old content to Google Drive
4. Consider expanding storage

### Warning Alerts

#### Error Rate >10%
1. Identify error patterns in logs
2. Check for systemic issues
3. Review recent deployments
4. Implement fixes for common errors

#### Approval Rate <50%
1. Review content quality
2. Check compliance validator
3. Verify fatigue checker thresholds
4. Adjust content generation parameters

## Performance Monitoring

### Key Metrics to Track
1. **System Metrics**
   - CPU usage: Target <75%
   - Memory usage: Target <80%
   - Disk I/O: Monitor for spikes

2. **Application Metrics**
   - Content generation time: Target <2 min/advisor
   - API response time: Target <1 second
   - Error rate: Target <5%

3. **Business Metrics**
   - Daily content generated: Track against targets
   - Approval rate: Target >80%
   - Distribution success: Target >95%
   - Advisor satisfaction: Target >4/5

### Monitoring Commands
```bash
# Real-time metrics
pm2 monit

# System resources
htop

# API performance
tail -f /home/mvp/logs/api-metrics.log

# Business metrics
curl http://localhost:8080/api/analytics/dashboard

# Cache performance
curl http://localhost:8080/api/cache/metrics
```

## Escalation Procedures

### Level 1: Operations Team
- Handle daily monitoring
- Respond to warning alerts
- Perform routine maintenance
- First-line troubleshooting

### Level 2: Technical Lead
- Handle critical alerts
- System recovery procedures
- Performance optimization
- Infrastructure scaling decisions

### Level 3: Development Team
- Code-level debugging
- API integration issues
- New feature deployment
- Architecture changes

### Emergency Contacts
- Technical Lead: [Contact Information]
- DevOps: [Contact Information]
- API Support: [Contact Information]
- Management: [Contact Information]

## Daily Checklist

### Morning (9:00 AM)
- [ ] Check PM2 status
- [ ] Review overnight alerts
- [ ] Verify content distribution
- [ ] Check system resources
- [ ] Review error logs

### Afternoon (2:00 PM)
- [ ] Monitor API quotas
- [ ] Check Google Sheets sync
- [ ] Review performance metrics
- [ ] Clear old logs if needed

### Evening (8:00 PM)
- [ ] Prepare for content generation
- [ ] Verify all agents running
- [ ] Check Claude session
- [ ] Monitor generation start

### Night (11:00 PM)
- [ ] Confirm auto-approval
- [ ] Check for failed content
- [ ] Verify next day's schedule
- [ ] Set morning distribution

## Best Practices

1. **Always backup before changes**
   ```bash
   # Backup config
   cp -r /home/mvp/config /home/mvp/config.backup.$(date +%Y%m%d)
   ```

2. **Test in development first**
   - Never deploy directly to production
   - Use staging environment for testing

3. **Document all changes**
   - Update this manual
   - Log in change management system
   - Notify team of significant changes

4. **Regular maintenance windows**
   - Schedule during low-usage periods
   - Notify advisors in advance
   - Have rollback plan ready

5. **Security practices**
   - Never share credentials
   - Rotate API keys regularly
   - Monitor for unauthorized access
   - Keep systems updated

## Appendix

### Useful Scripts Location
- `/home/mvp/scripts/` - Operational scripts
- `/home/mvp/tests/` - Testing utilities
- `/home/mvp/monitoring/` - Monitoring tools

### Log Files Location
- `/home/mvp/logs/` - Application logs
- `/var/log/` - System logs
- PM2 logs: `~/.pm2/logs/`

### Configuration Files
- `/home/mvp/.env` - Environment variables
- `/home/mvp/ecosystem.*.js` - PM2 configs
- `/home/mvp/config/` - Application configs

---

*Last Updated: 2025-09-09*
*Version: 1.0*