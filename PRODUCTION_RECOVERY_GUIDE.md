# Production Recovery Guide - SSH & Service Failures

## 🔴 Root Cause of SSH Failure

### What Happened to Your VM:
1. **SSH daemon (sshd) was not running** - The service that accepts SSH connections was stopped
2. **Port 22 was not listening** - Even if sshd was running, it wasn't bound to the port
3. **Possible causes:**
   - Incomplete VM provisioning from DigitalOcean
   - Corrupted SSH configuration during initial setup
   - Security update that disabled SSH
   - Firewall rule blocking port 22 internally

### Why This is Critical:
- Without SSH, you lose ALL remote access
- Can't deploy updates
- Can't fix issues
- Can't monitor logs

## 🛡️ Prevention Measures Now Implemented

### 1. **SSH Keeper Service**
```bash
systemctl status ssh-keeper
```
- Runs continuously checking if SSH is active
- Auto-restarts SSH if it stops
- Runs even if SSH config is broken

### 2. **Multiple SSH Ports**
- **Port 22** - Standard SSH
- **Port 2222** - Backup SSH port
- If one port fails, use the other:
```bash
ssh -p 2222 root@143.110.191.97
```

### 3. **Automated Monitoring**
Every minute:
- Checks if SSH is running
- Checks if port 22 is listening
- Restarts SSH if needed

Every 5 minutes:
- Checks webhook health
- Restarts webhook if down

Every 10 minutes:
- Checks disk space (cleans if >80%)
- Checks memory usage (restarts services if >90%)
- Verifies SSH status

### 4. **Fail2ban Protection**
- Prevents brute force attacks
- Blocks IPs after 5 failed attempts
- Reduces risk of SSH compromise

## 🚨 Emergency Recovery Procedures

### If SSH Fails Again:

#### Method 1: Use Backup Port
```bash
ssh -p 2222 -i ~/.ssh/id_ed25519_do root@143.110.191.97
```

#### Method 2: DigitalOcean Console Recovery
```bash
# Reset root password
doctl compute droplet-action password-reset 517524060

# Power cycle
doctl compute droplet-action power-cycle 517524060

# After reboot, the ssh-keeper service will auto-start SSH
```

#### Method 3: Recovery Console
1. Go to DigitalOcean dashboard
2. Click your droplet
3. Access → Recovery Console
4. Boot from Recovery ISO
5. Mount your disk and fix SSH:
```bash
mount /dev/vda1 /mnt
chroot /mnt
systemctl enable ssh
systemctl start ssh
```

#### Method 4: Snapshot Recovery
```bash
# Create regular snapshots (preventive)
doctl compute droplet-action snapshot 517524060 --snapshot-name "backup-$(date +%Y%m%d)"

# Restore from snapshot if needed
doctl compute droplet create recovered-vm --image <snapshot-id> --size s-1vcpu-1gb --region blr1
```

## 📊 Monitoring Commands

### Check System Health
```bash
ssh root@143.110.191.97 "/root/emergency_recovery.sh"
```

### View SSH Monitor Logs
```bash
ssh root@143.110.191.97 "tail -f /var/log/ssh_monitor.log"
```

### View Webhook Monitor Logs
```bash
ssh root@143.110.191.97 "tail -f /var/log/webhook_monitor.log"
```

### Check All Services
```bash
ssh root@143.110.191.97 "systemctl status ssh ssh-keeper fail2ban && pm2 status"
```

## 🔧 Configuration Files

### SSH Configuration
- Main: `/etc/ssh/sshd_config`
- Backup: `/etc/ssh/sshd_config.backup`
- Production: `/etc/ssh/sshd_config.d/99-production.conf`

### Monitoring Scripts
- SSH Check: `/usr/local/bin/check_ssh.sh`
- Webhook Check: `/usr/local/bin/check_webhook.sh`
- System Health: `/usr/local/bin/system_health.sh`
- Emergency Recovery: `/root/emergency_recovery.sh`

### Service Files
- SSH Keeper: `/etc/systemd/system/ssh-keeper.service`
- PM2: `/etc/systemd/system/pm2-root.service`

## 🎯 Best Practices for Production

### 1. Regular Snapshots
```bash
# Weekly snapshot cron
0 0 * * 0 doctl compute droplet-action snapshot 517524060 --snapshot-name "weekly-$(date +\%Y\%m\%d)"
```

### 2. Monitor Alerts
Set up DigitalOcean monitoring:
- CPU > 80% for 5 minutes
- Memory > 90% for 5 minutes
- Disk > 80% usage
- Network drops

### 3. Test Recovery
Monthly:
- Test backup SSH port
- Verify monitoring scripts
- Check log rotation
- Test emergency recovery script

### 4. Security Updates
```bash
# Safe update procedure
ssh root@143.110.191.97 "
  apt update
  apt list --upgradable
  # Review updates, especially SSH-related
  apt upgrade -y
  systemctl status ssh
"
```

## 📝 Incident Response Checklist

When SSH fails:

- [ ] Try standard port 22
- [ ] Try backup port 2222
- [ ] Check DigitalOcean dashboard for VM status
- [ ] Power cycle via doctl
- [ ] Check email for alerts
- [ ] Use recovery console if needed
- [ ] Run emergency recovery script
- [ ] Document what caused the failure
- [ ] Update monitoring rules

## 🔄 Automatic Recovery Features

Your VM now has:
1. **Self-healing SSH** - Auto-restarts every 30 seconds if down
2. **Dual-port access** - Ports 22 and 2222
3. **Disk space management** - Auto-cleans when >80% full
4. **Memory management** - Restarts services when >90% used
5. **Log rotation** - Prevents disk fill from logs
6. **Service persistence** - PM2 and systemd ensure services restart
7. **Boot recovery** - All services start automatically on reboot

## 💡 Why This Won't Happen Again

1. **SSH Keeper Service** - Constantly monitors and restarts SSH
2. **Multiple Access Points** - Two SSH ports + DigitalOcean console
3. **Proactive Monitoring** - Issues detected and fixed automatically
4. **Fail-safes** - Multiple recovery mechanisms
5. **Hardened Configuration** - Production-ready settings

## 📞 Emergency Contacts

- **DigitalOcean Support**: Use dashboard ticket system
- **Your Email**: shriyavallabh.ap@gmail.com (for alerts)
- **VM IP**: 143.110.191.97
- **Droplet ID**: 517524060

## Summary

The SSH failure was caused by the SSH daemon not running on port 22. This has been fixed with:
- Automatic SSH monitoring and restart
- Backup SSH port (2222)
- Multiple recovery mechanisms
- Comprehensive monitoring

Your production server is now hardened against SSH failures and will auto-recover from most issues.