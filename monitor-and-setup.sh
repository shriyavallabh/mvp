#!/bin/bash

echo "Monitoring droplet and setting up webhook..."
echo ""

# Wait for droplet to be accessible
while ! curl -s -o /dev/null -w "%{http_code}" http://143.110.191.97 2>/dev/null | grep -q "200\|301\|302\|404"; do
    echo "Waiting for droplet to respond..."
    sleep 5
done

echo "Droplet is online!"
echo ""

# Since we can't SSH directly, let's use the password from the reset
echo "Check your email for the root password from Digital Ocean"
echo "The password reset was initiated at $(date)"
echo ""
echo "Once you have the password, access the Digital Ocean Console:"
echo "https://cloud.digitalocean.com/droplets/517524060/console"
echo ""
echo "Then paste these commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"