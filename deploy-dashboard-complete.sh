#!/bin/bash

# Dashboard Deployment Script for VM
# VM IP: 159.89.166.94

VM_IP="159.89.166.94"
VM_USER="root"

echo "========================================="
echo "DEPLOYING MONITORING DASHBOARD TO VM"
echo "========================================="
echo "VM IP: $VM_IP"
echo ""

# Create deployment package
echo "1. Creating deployment package..."
tar -czf dashboard-deploy.tar.gz monitoring/dashboard package.json package-lock.json

echo "✓ Dashboard package created"

# Create deployment script
cat > deploy-dashboard-vm.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

echo "Installing Dashboard on VM..."

# Create directory structure
mkdir -p /root/monitoring
cd /root

# Extract dashboard files
echo "Extracting dashboard files..."
tar -xzf dashboard-deploy.tar.gz

# Install dependencies
echo "Installing dependencies..."
cd /root
npm install

# Install additional packages needed for dashboard
npm install express ejs bcrypt express-session connect-flash socket.io googleapis pm2 chart.js

# Create PM2 ecosystem file for dashboard
cat > /root/monitoring/dashboard/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'monitoring-dashboard',
    script: '/root/monitoring/dashboard/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      PORT: 8080,
      NODE_ENV: 'production',
      SESSION_SECRET: 'finadvise-dashboard-2024-secure-secret',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'finadvise2024'
    },
    error_file: '/root/logs/dashboard-error.log',
    out_file: '/root/logs/dashboard-out.log',
    log_file: '/root/logs/dashboard-combined.log',
    time: true
  }]
};
PM2_CONFIG

# Create logs directory
mkdir -p /root/logs

# Stop any existing dashboard instance
pm2 stop monitoring-dashboard 2>/dev/null || true
pm2 delete monitoring-dashboard 2>/dev/null || true

# Start dashboard with PM2
echo "Starting dashboard with PM2..."
cd /root/monitoring/dashboard
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
pm2 status

echo ""
echo "========================================="
echo "DASHBOARD DEPLOYMENT COMPLETE!"
echo "========================================="
echo "Dashboard URL: http://$VM_IP:8080"
echo "Username: admin"
echo "Password: finadvise2024"
echo ""
echo "To view logs: pm2 logs monitoring-dashboard"
echo "To restart: pm2 restart monitoring-dashboard"
echo "========================================="
DEPLOY_SCRIPT

echo ""
echo "2. Copying files to VM..."
echo "   Please enter the root password when prompted"
echo ""

# Copy files to VM
scp -o StrictHostKeyChecking=no dashboard-deploy.tar.gz ${VM_USER}@${VM_IP}:/root/
scp -o StrictHostKeyChecking=no deploy-dashboard-vm.sh ${VM_USER}@${VM_IP}:/root/

echo ""
echo "3. Executing deployment on VM..."
echo ""

# Execute deployment script on VM
ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} "bash /root/deploy-dashboard-vm.sh"

# Check if dashboard is accessible
echo ""
echo "4. Verifying dashboard accessibility..."
sleep 3

# Test dashboard endpoint
if curl -s -o /dev/null -w "%{http_code}" http://${VM_IP}:8080/auth/login | grep -q "200\|302"; then
    echo "✓ Dashboard is accessible!"
    echo ""
    echo "========================================="
    echo "DEPLOYMENT SUCCESSFUL!"
    echo "========================================="
    echo ""
    echo "🎉 Dashboard is now live at:"
    echo "   http://${VM_IP}:8080"
    echo ""
    echo "📝 Login Credentials:"
    echo "   Username: admin"
    echo "   Password: finadvise2024"
    echo ""
    echo "📊 Features Available:"
    echo "   - System Health Monitoring"
    echo "   - Live Agent Execution Viewer"
    echo "   - Advisor Management"
    echo "   - Content Approval Interface"
    echo "   - Analytics Dashboard"
    echo "   - Log Viewer"
    echo "   - Backup/Restore Tools"
    echo ""
    echo "🔧 Management Commands (on VM):"
    echo "   pm2 status                    - Check status"
    echo "   pm2 logs monitoring-dashboard  - View logs"
    echo "   pm2 restart monitoring-dashboard - Restart"
    echo ""
    echo "========================================="
else
    echo "⚠️  Dashboard may still be starting up..."
    echo "   Try accessing in a few seconds:"
    echo "   http://${VM_IP}:8080"
fi

# Cleanup local files
rm -f dashboard-deploy.tar.gz deploy-dashboard-vm.sh

echo ""
echo "Deployment script complete!"