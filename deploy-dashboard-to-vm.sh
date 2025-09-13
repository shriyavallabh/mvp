#!/bin/bash

# Deploy Dashboard to VM Script
# Usage: ./deploy-dashboard-to-vm.sh <VM_IP>

if [ -z "$1" ]; then
    echo "Usage: $0 <VM_IP>"
    echo "Example: $0 165.232.177.173"
    exit 1
fi

VM_IP=$1
VM_USER="root"

echo "Deploying dashboard to VM at $VM_IP..."

# Create deployment package
echo "Creating deployment package..."
tar -czf dashboard-deploy.tar.gz \
    monitoring/dashboard \
    package.json \
    package-lock.json

# Copy to VM
echo "Copying files to VM..."
scp dashboard-deploy.tar.gz $VM_USER@$VM_IP:/tmp/

# Deploy on VM
echo "Installing on VM..."
ssh $VM_USER@$VM_IP << 'ENDSSH'
cd /home/mvp
tar -xzf /tmp/dashboard-deploy.tar.gz
cd monitoring/dashboard
npm install --production
pm2 stop monitoring-dashboard 2>/dev/null
pm2 delete monitoring-dashboard 2>/dev/null
pm2 start ecosystem.config.js
pm2 save
echo "Dashboard deployed successfully!"
ENDSSH

# Cleanup
rm dashboard-deploy.tar.gz

echo ""
echo "========================================="
echo "Dashboard deployed successfully!"
echo "Access at: http://$VM_IP:8080"
echo "Username: admin"
echo "Password: admin123"
echo "========================================="