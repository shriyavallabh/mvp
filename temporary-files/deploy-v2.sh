#!/bin/bash

# FinAdvise WhatsApp V2 Deployment Script
# Production-ready deliverability engine deployment

set -e

echo "========================================="
echo "FinAdvise WhatsApp V2 Deployment"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Please copy .env.v2.template to .env and configure all values"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=(
    "WHATSAPP_APP_ID"
    "WHATSAPP_BUSINESS_ACCOUNT_ID"
    "WHATSAPP_PHONE_NUMBER_ID"
    "WHATSAPP_ACCESS_TOKEN"
    "WHATSAPP_WEBHOOK_VERIFY_TOKEN"
)

echo -e "${YELLOW}Validating environment variables...${NC}"
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}ERROR: $var is not set in .env${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Environment variables validated${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create required directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs data generated-images template-images public/daily
echo -e "${GREEN}✓ Directories created${NC}"

# Initialize database
echo -e "${YELLOW}Initializing database...${NC}"
node -e "require('./services/database').initialize().then(() => console.log('Database initialized'))"
echo -e "${GREEN}✓ Database initialized${NC}"

# Subscribe to webhooks
echo -e "${YELLOW}Subscribing to WhatsApp webhooks...${NC}"
node app-v2.js subscribe
echo -e "${GREEN}✓ Webhook subscription complete${NC}"

# Check template status
echo -e "${YELLOW}Checking template status...${NC}"
node app-v2.js templates
echo ""

# Stop existing PM2 processes
echo -e "${YELLOW}Stopping existing services...${NC}"
pm2 stop ecosystem.v2.config.js 2>/dev/null || true
pm2 delete ecosystem.v2.config.js 2>/dev/null || true
echo -e "${GREEN}✓ Existing services stopped${NC}"

# Start services with PM2
echo -e "${YELLOW}Starting V2 services...${NC}"
pm2 start ecosystem.v2.config.js
pm2 save
echo -e "${GREEN}✓ Services started${NC}"

# Show status
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
pm2 status

echo ""
echo "Next steps:"
echo "1. Configure webhook URL in Meta App Dashboard:"
echo "   ${WEBHOOK_PUBLIC_URL:-https://your-domain.com}/webhooks/whatsapp"
echo "2. Verify webhook with token: ${WHATSAPP_WEBHOOK_VERIFY_TOKEN:0:20}..."
echo "3. Create/approve required templates if not already done"
echo "4. Import contacts: node app-v2.js import-contacts contacts.json"
echo "5. Run test: node app-v2.js test-send +919876543210"
echo ""
echo "Monitor logs:"
echo "  pm2 logs whatsapp-webhook-v2"
echo "  pm2 logs campaign-scheduler"
echo ""
echo "View dashboard:"
echo "  pm2 monit"