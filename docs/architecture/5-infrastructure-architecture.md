# 5. Infrastructure Architecture

## 5.1 Deployment Architecture
```yaml
DigitalOcean_VM:
  specifications:
    OS: Ubuntu 22.04 LTS
    CPU: 1 vCPU
    RAM: 1GB
    Storage: 25GB SSD
    Network: 1TB transfer
    Location: BLR1 (Bangalore)
    Cost: $6/month
    
  security:
    firewall_rules:
      - port: 22 (SSH)
      - port: 5000 (Webhook)
      - port: 8080 (Dashboard)
    authentication: SSH key only
    updates: Automated security patches
    
  monitoring:
    uptime_monitoring: DigitalOcean native
    resource_monitoring: PM2 metrics
    log_aggregation: /home/mvp/logs/
```

## 5.2 Process Management (PM2)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'webhook-server',
      script: 'webhook_server.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'claude-session',
      script: 'maintain_session.js',
      instances: 1,
      cron_restart: '0 0 * * *',  // Daily restart
      autorestart: true
    }
  ],
  
  deploy: {
    production: {
      user: 'mvp',
      host: 'VM_IP',
      ref: 'origin/main',
      repo: 'git@github.com:user/finadvise.git',
      path: '/home/mvp',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js'
    }
  }
};
```

## 5.3 Scheduling Architecture
```yaml
Cron_Jobs:
  evening_generation:
    schedule: "30 20 * * *"  # 8:30 PM daily
    command: "claude /content-engine --generate"
    timeout: 1800  # 30 minutes
    
  auto_approval:
    schedule: "0 23 * * *"   # 11:00 PM daily
    command: "claude /approval-guardian --auto"
    timeout: 600   # 10 minutes
    
  morning_distribution:
    schedule: "0 5 * * *"    # 5:00 AM daily
    command: "claude /content-engine --distribute"
    timeout: 3600  # 60 minutes
    
  daily_backup:
    schedule: "0 2 * * *"    # 2:00 AM daily
    command: "claude /backup-restore --backup"
    timeout: 300   # 5 minutes
```

---
