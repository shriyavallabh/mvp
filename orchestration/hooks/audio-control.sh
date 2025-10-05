#!/bin/bash

# Audio Control Script - Easy ON/OFF switching for agent audio announcements
# Usage: ./audio-control.sh [on|off|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/audio-config.json"
HOOKS_FILE="$(cd "$SCRIPT_DIR/../.." && pwd)/.claude/hooks.yaml"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_status() {
  echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   Audio Announcement System Status${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

  # Check audio-config.json
  if grep -q '"enabled": true' "$CONFIG_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} audio-config.json: ${GREEN}ENABLED${NC}"
  else
    echo -e "${RED}✗${NC} audio-config.json: ${RED}DISABLED${NC}"
  fi

  # Check hooks.yaml
  if grep -q 'enabled: true.*# Set to false to disable' "$HOOKS_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} hooks.yaml: ${GREEN}ENABLED${NC}"
  else
    echo -e "${RED}✗${NC} hooks.yaml: ${RED}DISABLED${NC}"
  fi

  echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
  echo ""
  echo "Voice: Samantha (Professional Female)"
  echo "Rate: 200 words/minute"
  echo "Volume: 0.8"
  echo ""
}

turn_on() {
  echo -e "${YELLOW}🔊 Enabling audio announcements...${NC}"

  # Enable in audio-config.json
  if [ -f "$CONFIG_FILE" ]; then
    sed -i.bak 's/"enabled": false/"enabled": true/' "$CONFIG_FILE"
    echo -e "${GREEN}✓${NC} Enabled in audio-config.json"
  fi

  # Enable in hooks.yaml
  if [ -f "$HOOKS_FILE" ]; then
    sed -i.bak 's/enabled: false  # Set to false to disable/enabled: true  # Set to false to disable/' "$HOOKS_FILE"
    echo -e "${GREEN}✓${NC} Enabled in hooks.yaml"
  fi

  echo ""
  echo -e "${GREEN}✓ Audio announcements are now ENABLED${NC}"
  echo -e "${BLUE}Agent triggers will be announced with Samantha voice${NC}"
  echo ""

  # Test announcement
  say -v Samantha -r 200 "Audio announcements are now enabled. All agent executions will be announced."
}

turn_off() {
  echo -e "${YELLOW}🔇 Disabling audio announcements...${NC}"

  # Disable in audio-config.json
  if [ -f "$CONFIG_FILE" ]; then
    sed -i.bak 's/"enabled": true/"enabled": false/' "$CONFIG_FILE"
    echo -e "${GREEN}✓${NC} Disabled in audio-config.json"
  fi

  # Disable in hooks.yaml
  if [ -f "$HOOKS_FILE" ]; then
    sed -i.bak 's/enabled: true  # Set to false to disable/enabled: false  # Set to false to disable/' "$HOOKS_FILE"
    echo -e "${GREEN}✓${NC} Disabled in hooks.yaml"
  fi

  echo ""
  echo -e "${GREEN}✓ Audio announcements are now DISABLED${NC}"
  echo -e "${BLUE}Agents will run silently${NC}"
  echo ""
}

test_audio() {
  echo -e "${YELLOW}🔊 Testing audio system...${NC}"
  echo ""

  say -v Samantha -r 200 "Testing FinAdvise audio announcement system. Market Intelligence is gathering latest market data."
  sleep 1
  say -v Samantha -r 200 "Market Intelligence has completed market analysis."

  echo ""
  echo -e "${GREEN}✓ Audio test complete${NC}"
}

# Main script logic
case "$1" in
  on|enable)
    turn_on
    ;;
  off|disable)
    turn_off
    ;;
  status)
    show_status
    ;;
  test)
    test_audio
    ;;
  *)
    echo -e "${BLUE}Audio Control for FinAdvise Agent System${NC}"
    echo ""
    echo "Usage: $0 [on|off|status|test]"
    echo ""
    echo "Commands:"
    echo "  on      - Enable audio announcements"
    echo "  off     - Disable audio announcements"
    echo "  status  - Show current audio status"
    echo "  test    - Test audio system"
    echo ""
    show_status
    ;;
esac
