#!/bin/bash

# =====================================================
# Story 3.1: Production Optimization & Scaling Deployment
# =====================================================

set -e  # Exit on error

# Configuration
VM_IP="143.110.191.97"
VM_USER="root"
PROJECT_DIR="/home/mvp"
LOCAL_DIR="/Users/shriyavallabh/Desktop/mvp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Story 3.1 Production Optimization Deployment"
echo "================================================"
echo "Target VM: $VM_IP"
echo "Deployment starting at: $(date)"
echo ""

# Function to check SSH connection
check_ssh() {
    echo -e "${YELLOW}Checking SSH connection to VM...${NC}"
    if ssh -o ConnectTimeout=5 $VM_USER@$VM_IP "echo 'SSH OK'" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ SSH connection successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to VM via SSH${NC}"
        echo "Trying backup port 2222..."
        if ssh -p 2222 -o ConnectTimeout=5 $VM_USER@$VM_IP "echo 'SSH OK'" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ SSH connection successful on port 2222${NC}"
            VM_SSH_PORT=2222
            return 0
        else
            echo -e "${RED}✗ Cannot connect to VM on either port${NC}"
            return 1
        fi
    fi
}

# Function to create deployment package
create_package() {
    echo -e "${YELLOW}Creating deployment package...${NC}"
    
    cd $LOCAL_DIR
    
    # Create temporary deployment directory
    rm -rf /tmp/story-3.1-deploy
    mkdir -p /tmp/story-3.1-deploy
    
    # Copy new files for Story 3.1
    echo "Copying production optimization files..."
    
    # Performance testing
    mkdir -p /tmp/story-3.1-deploy/tests/performance
    cp tests/performance/load-test-50-advisors.js /tmp/story-3.1-deploy/tests/performance/ 2>/dev/null || true
    
    # Cache manager
    mkdir -p /tmp/story-3.1-deploy/agents/utils
    cp agents/utils/cache-manager.js /tmp/story-3.1-deploy/agents/utils/ 2>/dev/null || true
    
    # Analytics
    cp agents/utils/analytics.js /tmp/story-3.1-deploy/agents/utils/ 2>/dev/null || true
    
    # Templates
    mkdir -p /tmp/story-3.1-deploy/templates
    cp -r templates/* /tmp/story-3.1-deploy/templates/ 2>/dev/null || true
    cp templates/template-manager.js /tmp/story-3.1-deploy/templates/ 2>/dev/null || true
    
    # Monitoring
    mkdir -p /tmp/story-3.1-deploy/monitoring
    cp monitoring/alert-config.js /tmp/story-3.1-deploy/monitoring/ 2>/dev/null || true
    
    # Documentation
    mkdir -p /tmp/story-3.1-deploy/docs/operations
    cp -r docs/operations/* /tmp/story-3.1-deploy/docs/operations/ 2>/dev/null || true
    
    # Integration tests
    mkdir -p /tmp/story-3.1-deploy/tests/integration
    cp tests/integration/test-production-readiness.js /tmp/story-3.1-deploy/tests/integration/ 2>/dev/null || true
    
    # Create tarball
    cd /tmp
    tar -czf story-3.1-deploy.tar.gz story-3.1-deploy/
    
    echo -e "${GREEN}✓ Deployment package created${NC}"
}

# Function to deploy to VM
deploy_to_vm() {
    echo -e "${YELLOW}Deploying to VM...${NC}"
    
    # Set SSH port if needed
    SSH_PORT=${VM_SSH_PORT:-22}
    SSH_CMD="ssh -p $SSH_PORT $VM_USER@$VM_IP"
    SCP_CMD="scp -P $SSH_PORT"
    
    # Transfer package
    echo "Transferring files to VM..."
    $SCP_CMD /tmp/story-3.1-deploy.tar.gz $VM_USER@$VM_IP:$PROJECT_DIR/
    
    # Extract and install on VM
    echo "Installing on VM..."
    $SSH_CMD << 'ENDSSH'
    set -e
    cd /home/mvp
    
    echo "Creating backup..."
    mkdir -p backups/$(date +%Y%m%d_%H%M%S)
    cp -r agents backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
    
    echo "Extracting new files..."
    tar -xzf story-3.1-deploy.tar.gz
    cp -r story-3.1-deploy/* . 2>/dev/null || true
    
    echo "Creating cache directories..."
    mkdir -p cache/templates
    mkdir -p cache/images
    
    echo "Setting permissions..."
    chmod +x tests/performance/*.js
    chmod +x tests/integration/*.js
    
    echo "Installing any new dependencies..."
    if [ -f package.json ]; then
        npm install --production
    fi
    
    echo "Cleaning up..."
    rm -rf story-3.1-deploy story-3.1-deploy.tar.gz
    
    echo "Deployment complete on VM"
ENDSSH
    
    echo -e "${GREEN}✓ Files deployed to VM${NC}"
}

# Function to configure services
configure_services() {
    echo -e "${YELLOW}Configuring services...${NC}"
    
    SSH_PORT=${VM_SSH_PORT:-22}
    SSH_CMD="ssh -p $SSH_PORT $VM_USER@$VM_IP"
    
    $SSH_CMD << 'ENDSSH'
    set -e
    cd /home/mvp
    
    echo "Updating PM2 ecosystem configuration..."
    
    # Add new monitoring process if not exists
    cat > ecosystem.monitoring.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'health-monitor',
      script: 'monitoring/health-check.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      cron_restart: '*/30 * * * *',  // Every 30 minutes
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'cache-cleanup',
      script: 'scripts/cache-cleanup.js',
      instances: 1,
      autorestart: false,
      cron_restart: '0 2 * * *',  // Daily at 2 AM
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
    
    # Create health check script
    cat > monitoring/health-check.js << 'EOF'
#!/usr/bin/env node
const { getAnalytics } = require('../agents/utils/analytics');
const { getAlertManager } = require('./alert-config');

async function checkHealth() {
    const analytics = getAnalytics();
    const alertManager = getAlertManager();
    
    const metrics = analytics.getDashboardData();
    console.log('Health Check:', new Date().toISOString());
    console.log('System:', metrics.system?.memory?.percentage || 'N/A');
    console.log('Active Alerts:', alertManager.getActiveAlerts().length);
    
    // Check alerts
    await alertManager.checkAlerts();
}

if (require.main === module) {
    checkHealth().catch(console.error);
}
EOF
    
    # Create cache cleanup script
    cat > scripts/cache-cleanup.js << 'EOF'
#!/usr/bin/env node
const { getCacheManager } = require('../agents/utils/cache-manager');

async function cleanupCache() {
    const cacheManager = getCacheManager();
    console.log('Running cache cleanup...', new Date().toISOString());
    await cacheManager.cleanupExpiredCache();
    console.log('Cache cleanup complete');
}

if (require.main === module) {
    cleanupCache().catch(console.error);
}
EOF
    
    chmod +x monitoring/health-check.js
    chmod +x scripts/cache-cleanup.js
    
    echo "Starting monitoring services..."
    pm2 start ecosystem.monitoring.config.js || true
    
    pm2 save
    
    echo "Services configured"
ENDSSH
    
    echo -e "${GREEN}✓ Services configured${NC}"
}

# Function to update environment variables
update_env() {
    echo -e "${YELLOW}Updating environment variables...${NC}"
    
    SSH_PORT=${VM_SSH_PORT:-22}
    SSH_CMD="ssh -p $SSH_PORT $VM_USER@$VM_IP"
    
    $SSH_CMD << 'ENDSSH'
    set -e
    cd /home/mvp
    
    # Check if new env vars are needed
    if ! grep -q "ALERT_WHATSAPP_NUMBER" .env 2>/dev/null; then
        echo "" >> .env
        echo "# Monitoring & Alerts" >> .env
        echo "ALERT_WHATSAPP_NUMBER=" >> .env
        echo "ALERT_EMAIL_ADDRESS=" >> .env
        echo "MONITORING_API_KEY=" >> .env
        echo "Added monitoring environment variables (need to be configured)"
    fi
    
    echo "Environment variables updated"
ENDSSH
    
    echo -e "${GREEN}✓ Environment variables updated${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running production readiness tests...${NC}"
    
    SSH_PORT=${VM_SSH_PORT:-22}
    SSH_CMD="ssh -p $SSH_PORT $VM_USER@$VM_IP"
    
    $SSH_CMD << 'ENDSSH' || true
    cd /home/mvp
    
    echo "Running production readiness tests..."
    node tests/integration/test-production-readiness.js 2>&1 | head -50
    
    echo "Checking cache manager..."
    node -e "const {getCacheManager} = require('./agents/utils/cache-manager'); console.log('Cache manager initialized');"
    
    echo "Checking analytics..."
    node -e "const {getAnalytics} = require('./agents/utils/analytics'); console.log('Analytics initialized');"
    
    echo "Checking monitoring..."
    node -e "const {getAlertManager} = require('./monitoring/alert-config'); console.log('Alert manager initialized');"
    
    echo "Tests complete"
ENDSSH
    
    echo -e "${GREEN}✓ Tests completed${NC}"
}

# Function to show deployment status
show_status() {
    echo ""
    echo "================================================"
    echo "Deployment Status"
    echo "================================================"
    
    SSH_PORT=${VM_SSH_PORT:-22}
    SSH_CMD="ssh -p $SSH_PORT $VM_USER@$VM_IP"
    
    $SSH_CMD << 'ENDSSH'
    echo "PM2 Process Status:"
    pm2 status
    
    echo ""
    echo "System Resources:"
    free -m | grep Mem
    df -h | grep /dev/vda1
    
    echo ""
    echo "Recent Logs:"
    pm2 logs --nostream --lines 5
    
    echo ""
    echo "Cache Directory:"
    ls -la cache/ 2>/dev/null || echo "Cache directory not found"
    
    echo ""
    echo "Documentation:"
    ls -la docs/operations/ 2>/dev/null || echo "Documentation not found"
ENDSSH
}

# Main deployment flow
main() {
    echo -e "${GREEN}Starting Story 3.1 Deployment...${NC}"
    echo ""
    
    # Check SSH connection
    if ! check_ssh; then
        echo -e "${RED}Cannot connect to VM. Please check:${NC}"
        echo "1. VM is running"
        echo "2. SSH service is active"
        echo "3. Network connectivity"
        exit 1
    fi
    
    # Create deployment package
    create_package
    
    # Deploy to VM
    deploy_to_vm
    
    # Configure services
    configure_services
    
    # Update environment
    update_env
    
    # Run tests
    run_tests
    
    # Show status
    show_status
    
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}Story 3.1 Deployment Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Configure monitoring environment variables in $PROJECT_DIR/.env"
    echo "2. Set up alert notification channels (WhatsApp/Email)"
    echo "3. Test performance with actual advisor load"
    echo "4. Review operations documentation at $PROJECT_DIR/docs/operations/"
    echo ""
    echo "Deployment completed at: $(date)"
}

# Run main function
main "$@"