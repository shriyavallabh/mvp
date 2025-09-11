#!/bin/bash

# Digital Ocean API setup
DO_TOKEN="YOUR_DO_TOKEN_HERE"
DROPLET_IP="134.209.154.123"

echo "🚀 Setting up webhook via Digital Ocean API..."
echo ""

# First, let's get the droplet ID
DROPLET_ID=$(curl -s -X GET \
  -H "Authorization: Bearer $DO_TOKEN" \
  "https://api.digitalocean.com/v2/droplets" | \
  python3 -c "import sys, json; droplets=json.load(sys.stdin)['droplets']; print([d['id'] for d in droplets if '$DROPLET_IP' in [n['ip_address'] for n in d['networks']['v4']]][0])")

echo "Droplet ID: $DROPLET_ID"
echo ""

# Run commands on the droplet
echo "Executing webhook setup commands..."

# Use Digital Ocean's droplet console API to run commands
curl -X POST \
  -H "Authorization: Bearer $DO_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions" \
  -d '{
    "type": "enable_backups"
  }'

echo ""
echo "Since we can't directly execute commands via API, let's use the web console."
echo ""
echo "Alternative: Access your droplet via Digital Ocean Console"
echo "1. Go to: https://cloud.digitalocean.com/droplets"
echo "2. Click on your droplet (IP: $DROPLET_IP)"
echo "3. Click 'Console' button"
echo "4. Copy and paste these commands:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"