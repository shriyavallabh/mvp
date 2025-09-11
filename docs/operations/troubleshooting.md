# FinAdvise Content Engine - Troubleshooting Guide

## Quick Diagnostics

### System Status Check
```bash
# One-command health check
echo "=== QUICK DIAGNOSTICS ===" && \
pm2 status && \
echo -e "\n=== MEMORY ===" && free -m | grep Mem && \
echo -e "\n=== DISK ===" && df -h | grep /dev && \
echo -e "\n=== RECENT ERRORS ===" && \
grep -i error /home/mvp/logs/*.log | tail -5 && \
echo -e "\n=== API STATUS ===" && \
curl -s http://localhost:5001/health | jq '.status'
```

## Common Problems and Solutions

### 1. Content Not Generating

#### Symptoms
- No content appearing in Google Sheets
- Advisors not receiving morning messages
- Empty content fields

#### Diagnosis
```bash
# Check orchestrator status
pm2 status content-orchestrator
pm2 logs content-orchestrator --err --lines 50

# Verify Claude session
node -e "const {execSync} = require('child_process'); 
try { 
  execSync('claude /test --message test'); 
  console.log('✓ Claude session active'); 
} catch(e) { 
  console.log('✗ Claude session expired'); 
}"

# Check API keys
grep -E "CLAUDE|GEMINI|WHATSAPP" /home/mvp/.env | cut -d'=' -f1
```

#### Solutions
1. **Claude session expired:**
   ```bash
   # Update session token in .env
   nano /home/mvp/.env
   # Update CLAUDE_SESSION_TOKEN
   pm2 restart content-orchestrator
   ```

2. **API rate limit:**
   ```bash
   # Check rate limit status
   grep "rate limit" /home/mvp/logs/*.log | tail -10
   # Wait for reset or reduce batch size
   ```

3. **Process crashed:**
   ```bash
   pm2 restart content-orchestrator
   pm2 save
   ```

### 2. WhatsApp Messages Not Sending

#### Symptoms
- Advisors not receiving messages
- Distribution manager errors
- Webhook not responding

#### Diagnosis
```bash
# Check distribution manager
pm2 logs distribution-manager --lines 50

# Test webhook
curl http://localhost:5001/health

# Check tunnel
pm2 logs cloudflare-tunnel --lines 20
curl https://$(cat /home/mvp/tunnel-url.txt)/webhook
```

#### Solutions
1. **Webhook down:**
   ```bash
   pm2 restart webhook-server
   pm2 logs webhook-server --lines 20
   ```

2. **Tunnel disconnected:**
   ```bash
   pm2 restart cloudflare-tunnel
   # Wait 30 seconds for reconnection
   cat /home/mvp/tunnel-url.txt
   ```

3. **WhatsApp API token expired:**
   ```bash
   # Update token from Meta Business Platform
   nano /home/mvp/.env
   # Update WHATSAPP_BEARER_TOKEN
   pm2 restart distribution-manager
   ```

### 3. High Memory Usage

#### Symptoms
- System slowdown
- PM2 auto-restarts
- Out of memory errors

#### Diagnosis
```bash
# Check memory usage
free -m
pm2 monit

# Find memory hogs
ps aux --sort=-%mem | head -10

# Check for memory leaks
pm2 describe content-orchestrator | grep -E "memory|restart"
```

#### Solutions
1. **Clear caches:**
   ```bash
   rm -rf /home/mvp/cache/*
   rm -rf /tmp/*
   pm2 flush
   ```

2. **Restart processes:**
   ```bash
   pm2 restart all
   pm2 reset all  # Reset restart counters
   ```

3. **Increase memory limits:**
   ```bash
   # Edit ecosystem file
   nano /home/mvp/ecosystem.content.config.js
   # Increase max_memory_restart values
   pm2 reload ecosystem.content.config.js
   ```

### 4. Google Sheets Connection Errors

#### Symptoms
- Cannot read advisor data
- Cannot update content
- Authentication errors

#### Diagnosis
```bash
# Test Google Sheets connection
node -e "
const {google} = require('googleapis');
// Test connection script
console.log('Testing Google Sheets...');
"

# Check credentials
ls -la /home/mvp/credentials/*.json

# Check OAuth token
grep "GOOGLE" /home/mvp/.env
```

#### Solutions
1. **Refresh OAuth token:**
   ```bash
   node /home/mvp/scripts/refresh-google-token.js
   pm2 restart advisor-manager
   ```

2. **API quota exceeded:**
   ```bash
   # Wait for quota reset (usually midnight PST)
   # Or implement exponential backoff
   ```

3. **Credentials issue:**
   ```bash
   # Re-run setup
   node /home/mvp/setup-google-drive-oauth.js
   ```

### 5. Content Quality Issues

#### Symptoms
- Low approval rates
- Poor content quality
- Repetitive content

#### Diagnosis
```bash
# Check approval rates
cat /home/mvp/logs/analytics.json | jq '.business.approvals'

# Check fatigue scores
grep "fatigue_score" /home/mvp/logs/*.log | tail -20

# Review recent content
pm2 logs content-generator --lines 50 | grep "generated"
```

#### Solutions
1. **Adjust quality thresholds:**
   ```bash
   nano /home/mvp/agents/controllers/approval-guardian.js
   # Adjust thresholds
   pm2 restart approval-guardian
   ```

2. **Clear template cache:**
   ```bash
   rm -rf /home/mvp/cache/templates/*
   pm2 restart content-strategist
   ```

3. **Update prompts:**
   ```bash
   nano /home/mvp/agents/generators/content-generator.js
   # Improve prompt engineering
   pm2 restart content-generator
   ```

### 6. API Errors

#### Symptoms
- Frequent API failures
- Circuit breaker triggered
- Timeout errors

#### Diagnosis
```bash
# Check API error rates
grep -E "API|error" /home/mvp/logs/*.log | tail -30

# Check circuit breaker status
grep "circuit" /home/mvp/logs/error-handler.log | tail -10

# Test specific APIs
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

#### Solutions
1. **Reset circuit breaker:**
   ```bash
   node -e "
   const ErrorHandler = require('./agents/utils/error-handler');
   const handler = new ErrorHandler();
   handler.resetCircuitBreaker('gemini-api');
   console.log('Circuit breaker reset');
   "
   ```

2. **Implement retry logic:**
   ```bash
   # Already implemented in error-handler.js
   # Adjust retry configuration if needed
   ```

3. **Use fallback strategies:**
   ```bash
   # Enable cache fallback
   # Reduce API calls
   ```

### 7. Cron Jobs Not Running

#### Symptoms
- Evening generation not starting
- Morning distribution not happening
- Auto-approval not triggering

#### Diagnosis
```bash
# Check PM2 cron status
pm2 status | grep cron

# Check cron logs
pm2 logs evening-generation --lines 20
pm2 logs morning-distribution --lines 20

# Verify cron syntax
crontab -l
```

#### Solutions
1. **Restart PM2 cron:**
   ```bash
   pm2 restart ecosystem.content.config.js
   pm2 save
   ```

2. **Fix cron schedule:**
   ```bash
   nano /home/mvp/ecosystem.content.config.js
   # Verify cron_restart values
   pm2 reload ecosystem.content.config.js
   ```

3. **Manual trigger:**
   ```bash
   # Manually trigger generation
   node /home/mvp/agents/controllers/content-orchestrator.js --generate
   ```

## Error Code Reference

### System Errors
- `ECONNREFUSED`: Service not running or port blocked
- `ETIMEDOUT`: Network timeout, check connectivity
- `ENOENT`: File not found, check paths
- `EACCES`: Permission denied, check file permissions
- `ENOMEM`: Out of memory, restart or upgrade

### API Errors
- `401`: Authentication failed, check API keys
- `403`: Authorization failed, check permissions
- `429`: Rate limit exceeded, implement backoff
- `500`: Server error, retry with backoff
- `503`: Service unavailable, check status page

### Application Errors
- `VALIDATION_ERROR`: Input validation failed
- `CIRCUIT_OPEN`: Circuit breaker triggered
- `SESSION_EXPIRED`: Claude session needs refresh
- `QUOTA_EXCEEDED`: API quota limit reached
- `APPROVAL_FAILED`: Content quality below threshold

## Debug Commands

### Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=*
pm2 restart all --update-env

# Enable verbose logging
export LOG_LEVEL=debug
pm2 restart all --update-env
```

### Trace Specific Issues
```bash
# Trace network issues
tcpdump -i any -w network.pcap host api.whatsapp.com

# Trace file operations
strace -e file pm2 logs content-orchestrator

# Monitor system calls
strace -p $(pm2 pid content-orchestrator)
```

### Performance Profiling
```bash
# CPU profiling
node --prof agents/controllers/content-orchestrator.js
node --prof-process isolate-*.log > cpu-profile.txt

# Memory profiling
node --expose-gc --trace-gc agents/controllers/content-orchestrator.js

# Heap snapshot
kill -USR2 $(pm2 pid content-orchestrator)
```

## Emergency Procedures

### System Unresponsive
```bash
# Emergency restart
pm2 kill
pm2 resurrect

# If PM2 won't respond
killall node
pm2 start ecosystem.content.config.js
```

### Data Corruption
```bash
# Restore from backup
cd /home/mvp
tar -xzf /backups/latest/backup.tar.gz

# Verify data integrity
node /home/mvp/scripts/verify-data.js
```

### Complete Failure
```bash
# Failover to backup VM
# 1. Update DNS to backup VM IP
# 2. Restore latest backup on new VM
# 3. Update webhook URL in Meta Business
# 4. Restart all services
```

## Monitoring Scripts

### Real-time Error Monitor
```bash
tail -f /home/mvp/logs/*.log | grep -i error --line-buffered
```

### Performance Monitor
```bash
watch -n 5 'pm2 status && echo && free -m && echo && df -h'
```

### API Monitor
```bash
while true; do 
  curl -s http://localhost:5001/health | jq '.status'
  sleep 30
done
```

## Contact Support

### Escalation Path
1. Check this troubleshooting guide
2. Check recent logs for errors
3. Try emergency procedures
4. Contact technical lead
5. Contact development team

### Information to Provide
- Error messages from logs
- Output of quick diagnostics
- Recent changes made
- Time when issue started
- Number of advisors affected

### Log Collection for Support
```bash
# Create support bundle
tar -czf support-bundle-$(date +%Y%m%d).tar.gz \
  /home/mvp/logs/*.log \
  /home/mvp/.pm2/logs/*.log \
  /home/mvp/ecosystem.*.js \
  /home/mvp/.env
```

---

*Last Updated: 2025-09-09*
*Version: 1.0*