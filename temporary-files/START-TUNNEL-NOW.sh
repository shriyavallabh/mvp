#!/bin/bash

echo "🚀 STARTING CLOUDFLARE TUNNEL NOW!"
echo "This will expose port 3000 to the internet"
echo ""

# Start the tunnel
cloudflared tunnel --url http://localhost:3000 --hostname softball-one-realtor-telecom.trycloudflare.com