# Agent Infrastructure Deployment Guide

## Story 1.4 Deployment to Production VM (143.110.191.97)

### Prerequisites
- SSH access to VM at 143.110.191.97
- Node.js and npm installed on VM
- PM2 process manager installed
- Existing infrastructure from Stories 1.1-1.3

### Deployment Steps

#### 1. Package the Agent Infrastructure
On your local machine:
```bash
# Create deployment archive
tar -czf agent-infrastructure.tar.gz \
  agents/ \
  scripts/trigger-*.sh \
  tests/ \
  package.json
```

#### 2. Transfer to VM
```bash
# Copy archive to VM (adjust SSH key path as needed)
scp -i ~/.ssh/your-key.pem agent-infrastructure.tar.gz root@143.110.191.97:/home/mvp/
```

#### 3. Extract and Install on VM
SSH into the VM and run:
```bash
ssh root@143.110.191.97

# Navigate to project directory
cd /home/mvp

# Backup existing files if any
mkdir -p backups/$(date +%Y%m%d)
cp -r agents backups/$(date +%Y%m%d)/ 2>/dev/null || true

# Extract new agent infrastructure
tar -xzf agent-infrastructure.tar.gz

# Set permissions for scripts
chmod +x scripts/trigger-*.sh

# Install Node.js dependencies
npm install
```

#### 4. Configure Environment
Create/update `.env` file on VM:
```bash
cat > /home/mvp/.env << 'EOF'
NODE_ENV=production
LOG_LEVEL=INFO
GOOGLE_SHEETS_ID=<your-sheets-id>
GOOGLE_CREDENTIALS_PATH=/home/mvp/config/google-credentials.json
EOF
```

#### 5. Set Up PM2 Process Management
Create PM2 ecosystem file for agents:
```bash
cat > /home/mvp/ecosystem.agents.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'content-orchestrator',
      script: '/home/mvp/agents/controllers/content-orchestrator.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'INFO'
      },
      error_file: '/home/mvp/logs/orchestrator-error.log',
      out_file: '/home/mvp/logs/orchestrator-out.log',
      log_file: '/home/mvp/logs/orchestrator-combined.log',
      time: true
    }
  ]
};
EOF
```

#### 6. Integrate with Existing Infrastructure

Update the webhook server to integrate with agents:
```python
# Add to /home/mvp/scripts/webhook_server.py

import subprocess
import json

def trigger_content_generation(advisor_arn):
    """Trigger content generation workflow for an advisor"""
    try:
        result = subprocess.run(
            ['/home/mvp/scripts/trigger-orchestrator.sh', '--advisor', advisor_arn],
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            'success': result.returncode == 0,
            'output': result.stdout,
            'error': result.stderr
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Add new webhook endpoint
@app.route('/trigger-agents', methods=['POST'])
def trigger_agents():
    data = request.get_json()
    advisor_arn = data.get('advisor_arn')
    
    if not advisor_arn:
        return jsonify({'error': 'advisor_arn required'}), 400
    
    result = trigger_content_generation(advisor_arn)
    return jsonify(result)
```

#### 7. Start Services
```bash
# Start agent orchestrator with PM2
pm2 start ecosystem.agents.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Restart webhook server to load new endpoints
pm2 restart webhook-server
```

#### 8. Verify Deployment
Run tests to ensure everything is working:
```bash
# Test individual agents
/home/mvp/scripts/trigger-orchestrator.sh --test
/home/mvp/scripts/trigger-advisor-manager.sh --test
/home/mvp/scripts/trigger-strategist.sh --test
/home/mvp/scripts/trigger-fatigue-checker.sh --test
/home/mvp/scripts/trigger-compliance.sh --test

# Run integration tests
cd /home/mvp && npm test

# Check PM2 status
pm2 status

# Monitor logs
pm2 logs content-orchestrator
tail -f /home/mvp/logs/*.log
```

### Integration Points with Existing Infrastructure

1. **Google Sheets (Story 1.3)**
   - Advisor Manager reads/writes to Advisors tab
   - Fatigue Checker reads from Content tab
   - Configure credentials at `/home/mvp/config/google-credentials.json`

2. **Webhook Server (Story 1.3)**
   - New endpoint: `POST /trigger-agents`
   - Triggers content generation workflow
   - Returns status and results

3. **PM2 Process Manager (Story 1.2)**
   - Manages agent processes
   - Auto-restart on failure
   - Log rotation and monitoring

4. **Claude CLI Integration (Story 1.2)**
   - Trigger scripts use Claude session token
   - Individual agent testing via CLI
   - Located in `/home/mvp/scripts/`

### Post-Deployment Checklist

- [ ] All agent files deployed to `/home/mvp/agents/`
- [ ] Trigger scripts executable in `/home/mvp/scripts/`
- [ ] Node dependencies installed
- [ ] Environment variables configured
- [ ] PM2 managing content-orchestrator process
- [ ] Webhook server updated with agent endpoints
- [ ] Google Sheets credentials configured
- [ ] Integration tests passing
- [ ] Logs being generated in `/home/mvp/logs/`
- [ ] Agents responding to test commands

### Troubleshooting

1. **Agent won't start**
   - Check logs: `pm2 logs content-orchestrator`
   - Verify Node.js version: `node --version` (should be 18+)
   - Check dependencies: `npm list`

2. **Google Sheets errors**
   - Verify credentials file exists
   - Check GOOGLE_SHEETS_ID in .env
   - Ensure service account has access to sheet

3. **Webhook integration issues**
   - Check webhook server logs: `pm2 logs webhook-server`
   - Verify port 5000 is accessible
   - Test endpoint: `curl -X POST http://localhost:5000/trigger-agents -H "Content-Type: application/json" -d '{"advisor_arn":"ARN_12345"}'`

### Rollback Procedure
If issues occur:
```bash
# Stop agents
pm2 stop content-orchestrator

# Restore backup
cd /home/mvp
rm -rf agents
cp -r backups/$(date +%Y%m%d)/agents .

# Restart services
pm2 restart all
```

### Success Criteria
- ✅ All 11 tasks from Story 1.4 functional on VM
- ✅ Integration with Google Sheets working
- ✅ Webhook endpoints responding
- ✅ PM2 managing processes
- ✅ Logs generating properly
- ✅ Test suite passing (96%+ success rate)