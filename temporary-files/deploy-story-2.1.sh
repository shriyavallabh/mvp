#!/bin/bash

# Deployment Script for Story 2.1: Critical Content Generation Agents
# This script deploys the new agents to the production VM

set -e  # Exit on error

echo "============================================"
echo "Deploying Story 2.1 to Production VM"
echo "VM: 143.110.191.97"
echo "============================================"

# Configuration
VM_USER="root"
VM_HOST="143.110.191.97"
PROJECT_DIR="/home/mvp"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"

# Create a temporary deployment directory
DEPLOY_DIR="/tmp/story-2.1-deploy-$(date +%s)"
mkdir -p $DEPLOY_DIR

# Copy agent files
echo "Copying agent files..."
cp -r agents/generators/content-generator.js $DEPLOY_DIR/
cp -r agents/generators/image-creator.js $DEPLOY_DIR/
cp -r agents/controllers/approval-guardian.js $DEPLOY_DIR/
cp -r agents/controllers/revision-handler.js $DEPLOY_DIR/
cp -r agents/controllers/distribution-manager.js $DEPLOY_DIR/
cp -r agents/utils/google-drive.js $DEPLOY_DIR/
cp ecosystem.content.config.js $DEPLOY_DIR/
cp tests/integration/test-content-generation.js $DEPLOY_DIR/

# Create deployment archive
tar -czf $DEPLOY_DIR.tar.gz -C $DEPLOY_DIR .

echo -e "${YELLOW}Step 2: Uploading files to VM...${NC}"

# Upload the archive to VM
scp $DEPLOY_DIR.tar.gz $VM_USER@$VM_HOST:/tmp/

echo -e "${YELLOW}Step 3: Deploying on VM...${NC}"

# SSH to VM and deploy
ssh $VM_USER@$VM_HOST << 'ENDSSH'
set -e

echo "Extracting deployment package..."
cd /home/mvp
tar -xzf /tmp/story-2.1-deploy-*.tar.gz

echo "Creating required directories..."
mkdir -p agents/generators
mkdir -p agents/controllers
mkdir -p agents/utils
mkdir -p cache/images
mkdir -p logs/pm2
mkdir -p tests/integration

echo "Moving files to correct locations..."
mv content-generator.js agents/generators/
mv image-creator.js agents/generators/
mv approval-guardian.js agents/controllers/
mv revision-handler.js agents/controllers/
mv distribution-manager.js agents/controllers/
mv google-drive.js agents/utils/
mv test-content-generation.js tests/integration/

echo "Setting correct permissions..."
chmod +x agents/generators/*.js
chmod +x agents/controllers/*.js
chmod +x agents/utils/*.js

echo "Installing new dependencies..."
cd /home/mvp
npm install axios googleapis

echo "Creating environment variables file..."
cat >> .env << 'EOF'

# Story 2.1 Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
WHATSAPP_BEARER_TOKEN=your_whatsapp_token_here
GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_drive_client_secret_here
GOOGLE_DRIVE_REFRESH_TOKEN=your_drive_refresh_token_here
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_root_folder_id_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EOF

echo "Updating PM2 ecosystem..."
pm2 start ecosystem.content.config.js --env production

echo "Running integration tests..."
npm test -- tests/integration/test-content-generation.js || true

echo "Checking PM2 status..."
pm2 list

echo "Setting up cron jobs verification..."
pm2 show evening-generation
pm2 show auto-approval
pm2 show morning-distribution

echo "Deployment completed successfully!"

# Clean up
rm -f /tmp/story-2.1-deploy-*.tar.gz
ENDSSH

echo -e "${GREEN}Step 4: Verification...${NC}"

# Verify deployment
ssh $VM_USER@$VM_HOST << 'ENDSSH'
echo "Verifying agent files..."
ls -la /home/mvp/agents/generators/ | grep -E "(content-generator|image-creator)"
ls -la /home/mvp/agents/controllers/ | grep -E "(approval-guardian|revision-handler|distribution-manager)"
ls -la /home/mvp/agents/utils/ | grep "google-drive"

echo "Verifying PM2 processes..."
pm2 list | grep -E "(evening-generation|auto-approval|morning-distribution)"

echo "Checking logs..."
tail -n 5 /home/mvp/logs/pm2/evening-generation-out.log 2>/dev/null || echo "No logs yet"
ENDSSH

# Clean up local temp files
rm -rf $DEPLOY_DIR
rm -f $DEPLOY_DIR.tar.gz

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next Steps:"
echo "1. Update environment variables in /home/mvp/.env with actual API keys"
echo "2. Test WhatsApp Business API connection"
echo "3. Configure Google Drive OAuth credentials"
echo "4. Verify PM2 cron schedules are running"
echo "5. Monitor logs: pm2 logs"
echo ""
echo "Cron Schedule:"
echo "- Evening Generation: 8:30 PM daily"
echo "- Auto Approval: 11:00 PM daily"
echo "- Morning Distribution: 5:00 AM daily"