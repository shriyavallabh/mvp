#!/bin/bash

# Universal Agent Audio Hook
# Triggers audio announcements for any agent execution

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_NAME="$1"
EVENT_TYPE="${2:-start}"  # start or complete

if [ -z "$AGENT_NAME" ]; then
  echo "❌ Usage: $0 <agent-name> [start|complete]"
  exit 1
fi

# Execute audio announcement
node "$SCRIPT_DIR/agent-audio-announcer.js" "$EVENT_TYPE" "$AGENT_NAME"
