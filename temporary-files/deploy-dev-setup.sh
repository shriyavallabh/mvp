#!/bin/bash

# Deploy Development Environment Setup to VM
# Story 1.2: Development Environment Setup
# This script copies and executes the setup script on the remote VM

set -e

# Configuration
VM_IP="143.110.191.97"
VM_USER="mvp"
SETUP_SCRIPT="setup-dev-environment.sh"

echo "==================================================="
echo "Deploying Development Environment Setup to VM"
echo "==================================================="
echo ""
echo "Target VM: $VM_USER@$VM_IP"
echo ""

# Check if setup script exists
if [ ! -f "$SETUP_SCRIPT" ]; then
    echo "Error: $SETUP_SCRIPT not found in current directory"
    exit 1
fi

# Copy setup script to VM
echo "Copying setup script to VM..."
scp -i ~/.ssh/id_ed25519_do "$SETUP_SCRIPT" "$VM_USER@$VM_IP:~/"

if [ $? -eq 0 ]; then
    echo "✓ Setup script copied successfully"
else
    echo "✗ Failed to copy setup script"
    exit 1
fi

# Execute setup script on VM
echo ""
echo "Executing setup script on VM..."
echo "You may be prompted for sudo password during installation"
echo ""

ssh -i ~/.ssh/id_ed25519_do "$VM_USER@$VM_IP" "chmod +x ~/$SETUP_SCRIPT && ~/$SETUP_SCRIPT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Setup script executed successfully"
else
    echo ""
    echo "✗ Setup script execution failed"
    exit 1
fi

# Run verification
echo ""
echo "Running verification on VM..."
ssh -i ~/.ssh/id_ed25519_do "$VM_USER@$VM_IP" "~/verify-installation.sh"

echo ""
echo "==================================================="
echo "Deployment Complete!"
echo "==================================================="
echo ""
echo "Next steps:"
echo "1. SSH into the VM: ssh $VM_USER@$VM_IP"
echo "2. Complete manual PM2 startup configuration"
echo "3. Add Claude session token to ~/.env"
echo "4. Source .bashrc or re-login for environment changes"
echo ""