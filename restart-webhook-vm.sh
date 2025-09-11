#!/bin/bash

echo "🔄 RESTARTING WEBHOOK WITH NODE.JS 18"
echo "======================================"
echo ""

export SSHPASS='Story32Webhook2024!'
VM_IP="159.89.166.94"

sshpass -e ssh -o StrictHostKeyChecking=no root@$VM_IP << 'RESTART'

cd /root/webhook

echo "1. Stopping old PM2 processes..."
pm2 kill

echo "2. Reinstalling PM2 with new Node.js..."
npm install -g pm2

echo "3. Starting webhook..."
pm2 start webhook.js --name story-3.2

echo "4. Checking status..."
pm2 list
sleep 3

echo "5. Checking logs..."
pm2 logs story-3.2 --lines 10 --nostream

echo "6. Testing webhook..."
curl -s "http://localhost/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=VM_WORKING"

echo ""
echo "7. Checking health endpoint..."
curl -s "http://localhost/health" | python3 -m json.tool

RESTART

echo ""
echo "✅ Testing from outside..."
curl -s "http://$VM_IP/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=EXTERNAL_SUCCESS"
echo ""
curl -s "http://$VM_IP/health" | python3 -m json.tool