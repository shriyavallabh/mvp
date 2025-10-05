#!/bin/bash

# Test script to demonstrate agent audio announcements
# This simulates agent execution triggers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧪 Testing Agent Audio Announcement System"
echo "=========================================="
echo ""

# Test individual agents
AGENTS=(
  "market-intelligence"
  "advisor-data-manager"
  "segment-analyzer"
  "linkedin-post-generator-enhanced"
  "whatsapp-message-creator"
  "compliance-validator"
  "quality-scorer"
  "distribution-controller"
)

echo "Testing 8 sample agents..."
echo ""

for agent in "${AGENTS[@]}"; do
  echo "▶ Triggering: $agent"

  # Agent start
  bash "$SCRIPT_DIR/universal-agent-hook.sh" "$agent" start
  sleep 2

  # Agent complete
  bash "$SCRIPT_DIR/universal-agent-hook.sh" "$agent" complete
  sleep 1

  echo ""
done

echo "✓ Audio test complete!"
echo ""
echo "To control audio announcements:"
echo "  ./orchestration/hooks/audio-control.sh on     # Enable audio"
echo "  ./orchestration/hooks/audio-control.sh off    # Disable audio"
echo "  ./orchestration/hooks/audio-control.sh status # Check status"
