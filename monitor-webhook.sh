#!/bin/bash

echo "🔍 Monitoring webhook deployment..."
echo "=================================="
echo ""

WEBHOOK_URL="https://hubix.duckdns.org"
TEST_CHALLENGE="MONITORING_TEST"

for i in {1..20}; do
    echo "Attempt $i/20 - $(date '+%H:%M:%S')"
    
    # Test health endpoint
    HEALTH=$(curl -s "$WEBHOOK_URL/health" 2>/dev/null)
    if [[ $? -eq 0 && "$HEALTH" == *"healthy"* ]]; then
        echo "✅ Health endpoint working!"
        echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
        echo ""
    else
        echo "❌ Health endpoint not ready"
    fi
    
    # Test webhook verification
    WEBHOOK_TEST=$(curl -s "$WEBHOOK_URL/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=$TEST_CHALLENGE" 2>/dev/null)
    if [[ "$WEBHOOK_TEST" == "$TEST_CHALLENGE" ]]; then
        echo "🎉 WEBHOOK IS WORKING!"
        echo "=================================="
        echo ""
        echo "📱 Meta Configuration:"
        echo "   Callback URL: $WEBHOOK_URL/webhook"
        echo "   Verify Token: jarvish_webhook_2024"
        echo ""
        echo "✅ Ready for Meta verification!"
        exit 0
    else
        echo "⏳ Webhook verification not ready yet"
        echo "   Response: $WEBHOOK_TEST"
    fi
    
    echo ""
    if [[ $i -lt 20 ]]; then
        echo "Waiting 30 seconds..."
        sleep 30
    fi
done

echo "⚠️ Webhook may need more time to initialize"
echo "Check manually: curl $WEBHOOK_URL/health"