#!/bin/bash

# ================================================
# PERMANENT WhatsApp Solution Deployment
# This script deploys the complete WhatsApp messaging system
# ================================================

set -e  # Exit on error

echo "================================================"
echo "DEPLOYING PERMANENT WHATSAPP SOLUTION"
echo "================================================"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

VM_IP="143.110.191.97"
VM_USER="root"
LOCAL_DIR=$(pwd)

# Function to check VM connectivity
check_vm_connection() {
    echo "Checking VM connectivity..."
    if ping -c 1 -W 2 $VM_IP > /dev/null 2>&1; then
        echo "✅ VM is reachable via network"
        
        # Try SSH
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VM_USER@$VM_IP "echo 'SSH OK'" > /dev/null 2>&1; then
            echo "✅ SSH connection successful"
            return 0
        else
            echo "⚠️  SSH not working, will provide manual instructions"
            return 1
        fi
    else
        echo "❌ Cannot reach VM"
        return 1
    fi
}

# Create deployment package
create_deployment_package() {
    echo ""
    echo "Creating deployment package..."
    
    # Create temp directory
    TEMP_DIR="/tmp/whatsapp-deploy-$(date +%s)"
    mkdir -p $TEMP_DIR
    
    # Copy necessary files
    cp -r agents/services/whatsapp-service.js $TEMP_DIR/ 2>/dev/null || true
    cp webhook-server-permanent.js $TEMP_DIR/
    cp package.json $TEMP_DIR/ 2>/dev/null || true
    
    # Create setup script
    cat > $TEMP_DIR/setup.sh << 'SETUP_SCRIPT'
#!/bin/bash

echo "Setting up WhatsApp service on VM..."

# Navigate to project directory
cd /home/mvp

# Create necessary directories
mkdir -p agents/services
mkdir -p data
mkdir -p logs/whatsapp
mkdir -p config

# Copy WhatsApp service
cp /tmp/whatsapp-deploy/whatsapp-service.js agents/services/ 2>/dev/null || true
cp /tmp/whatsapp-deploy/webhook-server-permanent.js .

# Install dependencies if needed
if ! npm list axios > /dev/null 2>&1; then
    npm install axios --save
fi

if ! npm list express > /dev/null 2>&1; then
    npm install express body-parser cors --save
fi

# Create advisor data file
cat > data/advisors.json << 'EOF'
[
  {
    "arn": "ARN_001",
    "name": "Shruti Petkar",
    "phone": "9673758777",
    "whatsapp": "919673758777",
    "client_segment": "families",
    "tone": "friendly",
    "content_focus": "balanced",
    "active": true,
    "payment_status": "paid"
  },
  {
    "arn": "ARN_002",
    "name": "Shri Avalok Petkar",
    "phone": "9765071249",
    "whatsapp": "919765071249",
    "client_segment": "entrepreneurs",
    "tone": "professional",
    "content_focus": "growth",
    "active": true,
    "payment_status": "paid"
  },
  {
    "arn": "ARN_003",
    "name": "Vidyadhar Petkar",
    "phone": "8975758513",
    "whatsapp": "918975758513",
    "client_segment": "retirees",
    "tone": "educational",
    "content_focus": "safety",
    "active": true,
    "payment_status": "paid"
  }
]
EOF

# Update environment variables
if ! grep -q "WHATSAPP_TEST_MODE" /home/mvp/.env 2>/dev/null; then
    echo "" >> /home/mvp/.env
    echo "# WhatsApp Configuration" >> /home/mvp/.env
    echo "WHATSAPP_TEST_MODE=true" >> /home/mvp/.env
    echo "WEBHOOK_PORT=5001" >> /home/mvp/.env
    echo "WEBHOOK_SECRET=finadvise-secret-2024" >> /home/mvp/.env
fi

# Stop old webhook server if running
pm2 stop webhook-server 2>/dev/null || true
pm2 delete webhook-server 2>/dev/null || true

# Start new webhook server
pm2 start webhook-server-permanent.js --name whatsapp-webhook --watch false

# Save PM2 configuration
pm2 save

echo "✅ WhatsApp service setup complete!"
SETUP_SCRIPT
    
    chmod +x $TEMP_DIR/setup.sh
    
    # Create tarball
    cd $TEMP_DIR
    tar -czf whatsapp-deploy.tar.gz *
    mv whatsapp-deploy.tar.gz $LOCAL_DIR/
    cd $LOCAL_DIR
    
    echo "✅ Deployment package created: whatsapp-deploy.tar.gz"
    
    # Cleanup
    rm -rf $TEMP_DIR
}

# Deploy to VM via SSH
deploy_via_ssh() {
    echo ""
    echo "Deploying to VM via SSH..."
    
    # Copy deployment package
    scp -o StrictHostKeyChecking=no whatsapp-deploy.tar.gz $VM_USER@$VM_IP:/tmp/
    
    # Extract and run setup
    ssh $VM_USER@$VM_IP << 'REMOTE_COMMANDS'
cd /tmp
rm -rf whatsapp-deploy
mkdir whatsapp-deploy
tar -xzf whatsapp-deploy.tar.gz -C whatsapp-deploy/
cd whatsapp-deploy
chmod +x setup.sh
./setup.sh

# Test the service
sleep 3
curl -s http://localhost:5001/health | python3 -m json.tool

# Show PM2 status
pm2 list

echo ""
echo "Deployment complete on VM!"
REMOTE_COMMANDS
}

# Manual deployment instructions
show_manual_instructions() {
    echo ""
    echo "================================================"
    echo "MANUAL DEPLOYMENT INSTRUCTIONS"
    echo "================================================"
    echo ""
    echo "Since SSH is not working, follow these steps:"
    echo ""
    echo "1. Access VM via DigitalOcean Console:"
    echo "   - Go to https://cloud.digitalocean.com"
    echo "   - Click on your droplet (143.110.191.97)"
    echo "   - Click 'Access' → 'Launch Droplet Console'"
    echo ""
    echo "2. In the console, run these commands:"
    echo ""
    echo "   cd /home/mvp"
    echo ""
    echo "3. Create the WhatsApp service file:"
    echo "   cat > agents/services/whatsapp-service.js << 'EOF'"
    cat agents/services/whatsapp-service.js | head -50
    echo "   ... (copy full file content)"
    echo "   EOF"
    echo ""
    echo "4. Create the webhook server:"
    echo "   cat > webhook-server-permanent.js << 'EOF'"
    cat webhook-server-permanent.js | head -50
    echo "   ... (copy full file content)"
    echo "   EOF"
    echo ""
    echo "5. Run the setup:"
    echo "   npm install axios express body-parser cors"
    echo "   pm2 stop webhook-server"
    echo "   pm2 start webhook-server-permanent.js --name whatsapp-webhook"
    echo "   pm2 save"
    echo ""
    echo "6. Test the service:"
    echo "   curl http://localhost:5001/health"
    echo ""
}

# Create test script
create_test_script() {
    cat > test-whatsapp-permanent.sh << 'TEST_SCRIPT'
#!/bin/bash

echo "Testing WhatsApp Service..."
echo ""

VM_IP="143.110.191.97"

# Test health
echo "1. Testing health endpoint..."
curl -s http://$VM_IP:5001/health | python3 -m json.tool

echo ""
echo "2. Testing service status..."
curl -s http://$VM_IP:5001/status | python3 -m json.tool

echo ""
echo "3. Sending test message to Shruti Petkar..."
curl -X POST http://$VM_IP:5001/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "919673758777",
    "message": "Test message from permanent WhatsApp solution",
    "advisor_name": "Shruti Petkar"
  }'

echo ""
echo ""
echo "4. Sending messages to all advisors..."
curl -X POST http://$VM_IP:5001/send-bulk \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "phone": "919673758777",
        "message": "Dear Shruti, your family financial planning update is ready."
      },
      {
        "phone": "919765071249",
        "message": "Dear Avalok, new investment opportunities for entrepreneurs."
      },
      {
        "phone": "918975758513",
        "message": "Dear Vidyadhar, important retirement planning update."
      }
    ]
  }'

echo ""
echo "Test complete!"
TEST_SCRIPT
    
    chmod +x test-whatsapp-permanent.sh
    echo "✅ Test script created: test-whatsapp-permanent.sh"
}

# Main execution
echo "Starting deployment process..."

# Create deployment package
create_deployment_package

# Check VM connection and deploy
if check_vm_connection; then
    deploy_via_ssh
    
    echo ""
    echo "================================================"
    echo "TESTING THE DEPLOYMENT"
    echo "================================================"
    
    # Create and run test script
    create_test_script
    ./test-whatsapp-permanent.sh
    
else
    show_manual_instructions
    create_test_script
    
    echo ""
    echo "================================================"
    echo "IMPORTANT: MANUAL DEPLOYMENT REQUIRED"
    echo "================================================"
    echo ""
    echo "Package created: whatsapp-deploy.tar.gz"
    echo "Test script created: test-whatsapp-permanent.sh"
    echo ""
    echo "After manual deployment, run:"
    echo "  ./test-whatsapp-permanent.sh"
fi

echo ""
echo "================================================"
echo "NEXT STEPS FOR PRODUCTION"
echo "================================================"
echo ""
echo "1. Get WhatsApp Business API credentials:"
echo "   - Go to https://business.facebook.com"
echo "   - Set up WhatsApp Business Platform"
echo "   - Get Access Token and Phone Number ID"
echo ""
echo "2. Add credentials to VM:"
echo "   ssh root@$VM_IP"
echo "   echo 'WHATSAPP_BEARER_TOKEN=your-token' >> /home/mvp/.env"
echo "   echo 'WHATSAPP_PHONE_NUMBER_ID=your-id' >> /home/mvp/.env"
echo "   echo 'WHATSAPP_TEST_MODE=false' >> /home/mvp/.env"
echo "   pm2 restart whatsapp-webhook"
echo ""
echo "3. The system will automatically:"
echo "   - Queue messages for reliable delivery"
echo "   - Retry failed messages with exponential backoff"
echo "   - Log all messages for audit"
echo "   - Handle rate limiting"
echo ""
echo "Deployment script completed at: $(date '+%Y-%m-%d %H:%M:%S')"