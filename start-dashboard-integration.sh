#!/bin/bash
# STORY 3.2 DASHBOARD INTEGRATION - STARTUP SCRIPT
# Quick startup for dashboard integration services

echo "🚀 STARTING DASHBOARD INTEGRATION SERVICES"
echo "=========================================="

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Install with: npm install -g pm2"
    exit 1
fi

# Check if required dependencies are installed
echo "🔧 Checking dependencies..."
if ! npm list sqlite3 ws cors &> /dev/null; then
    echo "📦 Installing required dependencies..."
    npm install sqlite3 ws cors
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start dashboard integration services
echo "🌐 Starting Dashboard API Server (port 3002)..."
pm2 start ecosystem.dashboard-integration.config.js

# Check status
echo ""
echo "📊 Service Status:"
pm2 status | grep -E "(dashboard-api-server|websocket-server)"

echo ""
echo "✅ DASHBOARD INTEGRATION SERVICES STARTED"
echo "=========================================="
echo "📊 Dashboard API Server: http://localhost:3002"
echo "🔌 WebSocket Server: ws://localhost:3001"
echo ""
echo "🧪 Test with: node test-dashboard-integration.js"
echo "📋 View logs: pm2 logs dashboard-api-server"
echo "🔄 Stop services: pm2 stop dashboard-api-server websocket-server"
echo ""
echo "🔗 Ready for Story 4.2 Dashboard connection!"