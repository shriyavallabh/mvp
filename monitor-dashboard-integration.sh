#!/bin/bash
# DASHBOARD INTEGRATION MONITORING SCRIPT
# Run this periodically to check system health

echo "🔍 DASHBOARD INTEGRATION HEALTH CHECK"
echo "======================================="
echo "⏰ $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

# Function to log results
log_status() {
    if [ "$1" = "OK" ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((SUCCESS++))
    elif [ "$1" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
        ((WARNINGS++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((ERRORS++))
    fi
}

# Check PM2 services
echo "📊 PM2 SERVICE STATUS:"
echo "----------------------"

if command -v pm2 &> /dev/null; then
    # Check production webhook
    if pm2 list | grep -q "webhook-button-handler.*online"; then
        log_status "OK" "Production webhook running"
    else
        log_status "ERROR" "Production webhook not running"
    fi
    
    # Check dashboard API server
    if pm2 list | grep -q "dashboard-api-server.*online"; then
        log_status "OK" "Dashboard API server running"
    else
        log_status "ERROR" "Dashboard API server not running"
    fi
    
    # Check WebSocket server
    if pm2 list | grep -q "websocket-server.*online"; then
        log_status "OK" "WebSocket server running"
    else
        log_status "ERROR" "WebSocket server not running"
    fi
else
    log_status "ERROR" "PM2 not installed"
fi

echo ""

# Check API endpoints
echo "🌐 API ENDPOINT HEALTH:"
echo "----------------------"

# Check dashboard API health
if curl -s --max-time 5 http://localhost:3002/api/webhook/health > /dev/null 2>&1; then
    HEALTH_STATUS=$(curl -s --max-time 5 http://localhost:3002/api/webhook/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_status "OK" "Dashboard API responding (healthy)"
    else
        log_status "WARN" "Dashboard API responding but status: $HEALTH_STATUS"
    fi
else
    log_status "ERROR" "Dashboard API not responding"
fi

# Check metrics endpoint
if curl -s --max-time 5 http://localhost:3002/api/webhook/metrics > /dev/null 2>&1; then
    log_status "OK" "Metrics endpoint responding"
else
    log_status "ERROR" "Metrics endpoint not responding"
fi

# Check conversations endpoint
if curl -s --max-time 5 http://localhost:3002/api/webhook/conversations > /dev/null 2>&1; then
    log_status "OK" "Conversations endpoint responding"
else
    log_status "ERROR" "Conversations endpoint not responding"
fi

echo ""

# Check database
echo "💾 DATABASE STATUS:"
echo "------------------"

if [ -f "data/webhook_events.db" ]; then
    DB_SIZE=$(ls -lh data/webhook_events.db | awk '{print $5}')
    log_status "OK" "Database file exists ($DB_SIZE)"
    
    # Test database connectivity
    if command -v sqlite3 &> /dev/null; then
        if EVENT_COUNT=$(sqlite3 data/webhook_events.db "SELECT COUNT(*) FROM webhook_events;" 2>/dev/null); then
            log_status "OK" "Database accessible ($EVENT_COUNT total events)"
            
            # Check today's events
            TODAY_EVENTS=$(sqlite3 data/webhook_events.db "SELECT COUNT(*) FROM webhook_events WHERE date(timestamp) = date('now');" 2>/dev/null)
            if [ "$TODAY_EVENTS" -gt 0 ]; then
                log_status "OK" "Active event logging ($TODAY_EVENTS events today)"
            else
                log_status "WARN" "No events logged today"
            fi
        else
            log_status "ERROR" "Database connection failed"
        fi
    else
        log_status "WARN" "SQLite3 not available for database testing"
    fi
else
    log_status "ERROR" "Database file missing"
fi

echo ""

# Check WebSocket connectivity
echo "🔌 WEBSOCKET STATUS:"
echo "-------------------"

if command -v wscat &> /dev/null; then
    if timeout 5s wscat -c ws://localhost:3001 -x '{"type":"ping"}' 2>/dev/null | grep -q "pong"; then
        log_status "OK" "WebSocket server responding"
    else
        log_status "ERROR" "WebSocket server not responding"
    fi
else
    # Alternative test without wscat
    if lsof -i :3001 > /dev/null 2>&1; then
        log_status "OK" "WebSocket port listening"
    else
        log_status "ERROR" "WebSocket port not listening"
    fi
fi

echo ""

# Check log files
echo "📋 LOG FILE STATUS:"
echo "------------------"

LOG_DIR="logs"
if [ -d "$LOG_DIR" ]; then
    # Check log file sizes
    for LOG_FILE in dashboard-api-combined.log websocket-combined.log; do
        if [ -f "$LOG_DIR/$LOG_FILE" ]; then
            LOG_SIZE=$(ls -lh "$LOG_DIR/$LOG_FILE" | awk '{print $5}')
            # Warn if log file is over 100MB
            LOG_SIZE_BYTES=$(ls -l "$LOG_DIR/$LOG_FILE" | awk '{print $5}')
            if [ "$LOG_SIZE_BYTES" -gt 104857600 ]; then
                log_status "WARN" "$LOG_FILE is large ($LOG_SIZE) - consider rotation"
            else
                log_status "OK" "$LOG_FILE size normal ($LOG_SIZE)"
            fi
        else
            log_status "WARN" "$LOG_FILE not found"
        fi
    done
else
    log_status "WARN" "Logs directory not found"
fi

echo ""

# Check production webhook health (if accessible)
echo "🚀 PRODUCTION WEBHOOK:"
echo "---------------------"

WEBHOOK_URL="https://6ecac5910ac8.ngrok-free.app/health"
if curl -s --max-time 10 "$WEBHOOK_URL" > /dev/null 2>&1; then
    WEBHOOK_STATUS=$(curl -s --max-time 10 "$WEBHOOK_URL" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$WEBHOOK_STATUS" = "healthy" ]; then
        log_status "OK" "Production webhook healthy"
    else
        log_status "WARN" "Production webhook status: $WEBHOOK_STATUS"
    fi
else
    log_status "WARN" "Production webhook not accessible (may be normal)"
fi

echo ""

# Check disk space
echo "💽 DISK SPACE:"
echo "--------------"

DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    log_status "OK" "Disk usage: $DISK_USAGE%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    log_status "WARN" "Disk usage: $DISK_USAGE% (getting high)"
else
    log_status "ERROR" "Disk usage: $DISK_USAGE% (critically high)"
fi

echo ""

# Summary
echo "📊 HEALTH CHECK SUMMARY:"
echo "========================"
echo -e "${GREEN}✅ Success: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Errors: $ERRORS${NC}"
echo ""

TOTAL_CHECKS=$((SUCCESS + WARNINGS + ERRORS))
SUCCESS_RATE=$(( SUCCESS * 100 / TOTAL_CHECKS ))

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS HEALTHY ($SUCCESS_RATE% success rate)${NC}"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS DETECTED ($SUCCESS_RATE% success rate)${NC}"
    echo "Review warnings above and consider taking action."
    exit 1
else
    echo -e "${RED}❌ ERRORS DETECTED ($SUCCESS_RATE% success rate)${NC}"
    echo "Immediate attention required for critical errors."
    exit 2
fi