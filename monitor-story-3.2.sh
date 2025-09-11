#!/bin/bash

# Story 3.2: Production Monitoring Script
# ========================================
# Monitor webhook health, performance, and advisor engagement

set -e

# Configuration
WEBHOOK_URL="https://hubix.duckdns.org"
VM_IP="139.59.51.237"
ALERT_THRESHOLD_RESPONSE_TIME=3000  # milliseconds
ALERT_THRESHOLD_ERROR_RATE=5  # percent

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Dashboard header
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         STORY 3.2 - CLICK-TO-UNLOCK MONITORING              ║${NC}"
    echo -e "${CYAN}║                  Production Dashboard                        ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check webhook health
check_webhook_health() {
    echo -e "${BLUE}🏥 Webhook Health Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Test webhook endpoint
    START_TIME=$(date +%s%N)
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$WEBHOOK_URL/health" 2>/dev/null || echo "000")
    END_TIME=$(date +%s%N)
    
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
    BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
    
    RESPONSE_TIME=$(( ($END_TIME - $START_TIME) / 1000000 ))
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "  Status: ${GREEN}✅ HEALTHY${NC}"
        echo -e "  Response Time: ${GREEN}${RESPONSE_TIME}ms${NC}"
        
        # Parse JSON response
        if command -v jq &> /dev/null; then
            SERVICE=$(echo "$BODY" | jq -r '.service // "Unknown"')
            UPTIME=$(echo "$BODY" | jq -r '.uptime // "0"')
            CONVERSATIONS=$(echo "$BODY" | jq -r '.stats.conversations // "0"')
            CLICKS=$(echo "$BODY" | jq -r '.stats.button_clicks // "0"')
            
            echo -e "  Service: $SERVICE"
            echo -e "  Uptime: $(printf '%02d:%02d:%02d' $(($UPTIME/3600)) $(($UPTIME%3600/60)) $(($UPTIME%60)))"
            echo -e "  Active Conversations: $CONVERSATIONS"
            echo -e "  Total Button Clicks: $CLICKS"
        else
            echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "  (Install jq for better formatting)"
        fi
    else
        echo -e "  Status: ${RED}❌ UNHEALTHY${NC}"
        echo -e "  HTTP Code: ${RED}$HTTP_CODE${NC}"
        echo -e "  ${RED}⚠️ ALERT: Webhook is not responding properly!${NC}"
    fi
    
    # Check response time threshold
    if [ "$RESPONSE_TIME" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
        echo -e "  ${YELLOW}⚠️ WARNING: Response time exceeds ${ALERT_THRESHOLD_RESPONSE_TIME}ms${NC}"
    fi
    
    echo ""
}

# Check CRM analytics
check_crm_analytics() {
    echo -e "${BLUE}📊 CRM Analytics${NC}"
    echo "━━━━━━━━━━━━━━━━"
    
    ANALYTICS_RESPONSE=$(curl -s "$WEBHOOK_URL/crm/analytics" 2>/dev/null || echo "{}")
    
    if [ -n "$ANALYTICS_RESPONSE" ] && [ "$ANALYTICS_RESPONSE" != "{}" ]; then
        if command -v jq &> /dev/null; then
            TOTAL_CONVOS=$(echo "$ANALYTICS_RESPONSE" | jq -r '.total_conversations // "0"')
            BUTTON_CLICKS=$(echo "$ANALYTICS_RESPONSE" | jq -r '.button_clicks // "0"')
            ACTIVE_ADVISORS=$(echo "$ANALYTICS_RESPONSE" | jq -r '.active_advisors // "0"')
            
            # Button stats
            UNLOCK_IMAGES=$(echo "$ANALYTICS_RESPONSE" | jq -r '.button_stats.UNLOCK_IMAGES // "0"')
            UNLOCK_CONTENT=$(echo "$ANALYTICS_RESPONSE" | jq -r '.button_stats.UNLOCK_CONTENT // "0"')
            UNLOCK_UPDATES=$(echo "$ANALYTICS_RESPONSE" | jq -r '.button_stats.UNLOCK_UPDATES // "0"')
            
            echo -e "  Active Advisors: ${GREEN}$ACTIVE_ADVISORS${NC}"
            echo -e "  Total Conversations: $TOTAL_CONVOS"
            echo -e "  Total Button Clicks: $BUTTON_CLICKS"
            echo ""
            echo -e "  ${CYAN}Button Click Distribution:${NC}"
            echo -e "    📸 Images: $UNLOCK_IMAGES clicks"
            echo -e "    📝 Content: $UNLOCK_CONTENT clicks"
            echo -e "    📊 Updates: $UNLOCK_UPDATES clicks"
            
            # Calculate engagement rate
            if [ "$ACTIVE_ADVISORS" -gt 0 ] && [ "$BUTTON_CLICKS" -gt 0 ]; then
                ENGAGEMENT_RATE=$(( $BUTTON_CLICKS * 100 / ($ACTIVE_ADVISORS * 3) ))
                echo ""
                echo -e "  Engagement Rate: ${GREEN}${ENGAGEMENT_RATE}%${NC}"
            fi
        else
            echo "$ANALYTICS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "  No analytics data available"
        fi
    else
        echo -e "  ${YELLOW}No analytics data available${NC}"
    fi
    
    echo ""
}

# Check PM2 services
check_pm2_services() {
    echo -e "${BLUE}🔧 Service Status (PM2)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━"
    
    PM2_STATUS=$(ssh -o ConnectTimeout=5 root@$VM_IP "pm2 list --no-color" 2>/dev/null || echo "Unable to connect")
    
    if [[ "$PM2_STATUS" == *"Unable to connect"* ]]; then
        echo -e "  ${RED}❌ Cannot connect to VM${NC}"
        echo -e "  Please check SSH connection to $VM_IP"
    else
        echo "$PM2_STATUS" | grep -E "story-3.2|daily-sender|crm" || echo "  No Story 3.2 services found"
    fi
    
    echo ""
}

# Check recent logs
check_recent_logs() {
    echo -e "${BLUE}📝 Recent Webhook Activity${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    LOGS=$(ssh -o ConnectTimeout=5 root@$VM_IP "pm2 logs story-3.2-webhook --nostream --lines 5 2>/dev/null | grep -E '✅|❌|📨|🔘'" 2>/dev/null || echo "")
    
    if [ -n "$LOGS" ]; then
        echo "$LOGS" | tail -5
    else
        echo "  No recent activity or unable to fetch logs"
    fi
    
    echo ""
}

# Test webhook verification
test_webhook_verification() {
    echo -e "${BLUE}🔍 Testing Webhook Verification${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    CHALLENGE="test_$(date +%s)"
    VERIFY_RESPONSE=$(curl -s "$WEBHOOK_URL/webhook?hub.mode=subscribe&hub.verify_token=jarvish_webhook_2024&hub.challenge=$CHALLENGE" 2>/dev/null)
    
    if [ "$VERIFY_RESPONSE" = "$CHALLENGE" ]; then
        echo -e "  Verification: ${GREEN}✅ PASSED${NC}"
        echo -e "  Webhook is correctly configured for Meta"
    else
        echo -e "  Verification: ${RED}❌ FAILED${NC}"
        echo -e "  Expected: $CHALLENGE"
        echo -e "  Received: $VERIFY_RESPONSE"
        echo -e "  ${RED}⚠️ Meta webhook verification will fail!${NC}"
    fi
    
    echo ""
}

# Performance metrics
check_performance() {
    echo -e "${BLUE}⚡ Performance Metrics${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━"
    
    # Test multiple endpoints
    endpoints=("/webhook" "/health" "/crm/analytics")
    total_time=0
    count=0
    
    for endpoint in "${endpoints[@]}"; do
        START=$(date +%s%N)
        curl -s "$WEBHOOK_URL$endpoint" > /dev/null 2>&1
        END=$(date +%s%N)
        TIME=$(( ($END - $START) / 1000000 ))
        total_time=$(( $total_time + $TIME ))
        count=$(( $count + 1 ))
        
        if [ $TIME -lt 1000 ]; then
            COLOR=$GREEN
        elif [ $TIME -lt 3000 ]; then
            COLOR=$YELLOW
        else
            COLOR=$RED
        fi
        
        printf "  %-20s ${COLOR}%4dms${NC}\n" "$endpoint:" "$TIME"
    done
    
    avg_time=$(( $total_time / $count ))
    echo "  ────────────────────"
    
    if [ $avg_time -lt 1000 ]; then
        COLOR=$GREEN
        STATUS="Excellent"
    elif [ $avg_time -lt 2000 ]; then
        COLOR=$YELLOW
        STATUS="Good"
    else
        COLOR=$RED
        STATUS="Poor"
    fi
    
    printf "  %-20s ${COLOR}%4dms${NC} ($STATUS)\n" "Average:" "$avg_time"
    
    echo ""
}

# Check disk usage
check_disk_usage() {
    echo -e "${BLUE}💾 Disk Usage${NC}"
    echo "━━━━━━━━━━━━━"
    
    DISK_USAGE=$(ssh -o ConnectTimeout=5 root@$VM_IP "df -h / | tail -1" 2>/dev/null || echo "")
    
    if [ -n "$DISK_USAGE" ]; then
        USED=$(echo "$DISK_USAGE" | awk '{print $3}')
        AVAIL=$(echo "$DISK_USAGE" | awk '{print $4}')
        PERCENT=$(echo "$DISK_USAGE" | awk '{print $5}')
        
        # Remove % sign for comparison
        PERCENT_NUM=${PERCENT%\%}
        
        if [ "$PERCENT_NUM" -lt 70 ]; then
            COLOR=$GREEN
        elif [ "$PERCENT_NUM" -lt 85 ]; then
            COLOR=$YELLOW
        else
            COLOR=$RED
        fi
        
        echo -e "  Used: $USED / Available: $AVAIL"
        echo -e "  Usage: ${COLOR}${PERCENT}${NC}"
        
        if [ "$PERCENT_NUM" -gt 85 ]; then
            echo -e "  ${RED}⚠️ WARNING: Disk space running low!${NC}"
        fi
    else
        echo "  Unable to check disk usage"
    fi
    
    echo ""
}

# Generate summary
generate_summary() {
    echo -e "${CYAN}📈 Summary & Recommendations${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Collect all status
    if [[ $(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL/health") == "200" ]]; then
        echo -e "  ✅ Webhook is operational"
    else
        echo -e "  ❌ Webhook needs attention"
        echo -e "     → Check PM2 logs: ssh root@$VM_IP 'pm2 logs story-3.2-webhook'"
        echo -e "     → Restart service: ssh root@$VM_IP 'pm2 restart story-3.2-webhook'"
    fi
    
    # Check if daily sender is scheduled
    CRON_CHECK=$(ssh -o ConnectTimeout=5 root@$VM_IP "pm2 list | grep daily-sender" 2>/dev/null || echo "")
    if [[ "$CRON_CHECK" == *"online"* ]] || [[ "$CRON_CHECK" == *"stopped"* ]]; then
        echo -e "  ✅ Daily sender is configured"
    else
        echo -e "  ⚠️ Daily sender may need configuration"
        echo -e "     → Setup: ssh root@$VM_IP 'cd /home/mvp/webhook && pm2 start daily-utility-sender.js --name daily-sender --cron \"0 5 * * *\"'"
    fi
    
    echo ""
    echo -e "${GREEN}Quick Actions:${NC}"
    echo "  • View logs: ssh root@$VM_IP 'pm2 logs story-3.2-webhook'"
    echo "  • Restart webhook: ssh root@$VM_IP 'pm2 restart story-3.2-webhook'"
    echo "  • Test daily send: ssh root@$VM_IP 'cd /home/mvp/webhook && node daily-utility-sender.js --test 919022810769'"
    echo "  • Check CRM data: ssh root@$VM_IP 'sqlite3 /home/mvp/data/crm.db \"SELECT COUNT(*) FROM button_clicks;\"'"
    
    echo ""
}

# Continuous monitoring mode
continuous_mode() {
    while true; do
        show_header
        check_webhook_health
        check_crm_analytics
        check_performance
        check_disk_usage
        
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "Refreshing in 30 seconds... (Press Ctrl+C to exit)"
        sleep 30
    done
}

# Main execution
main() {
    MODE=${1:-"once"}
    
    if [ "$MODE" = "--continuous" ] || [ "$MODE" = "-c" ]; then
        continuous_mode
    else
        show_header
        check_webhook_health
        test_webhook_verification
        check_crm_analytics
        check_pm2_services
        check_performance
        check_disk_usage
        check_recent_logs
        generate_summary
        
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "Run with ${GREEN}--continuous${NC} flag for real-time monitoring"
    fi
}

# Run main function
main "$@"