#!/bin/bash

# Pre-tool Setup Hook
# Initializes environment before tool execution

set -e

# Create necessary directories
mkdir -p data/orchestration-state
mkdir -p data/agent-communication
mkdir -p data/audio-feedback
mkdir -p logs/orchestration
mkdir -p orchestration/state
mkdir -p output
mkdir -p traceability

# Set permissions
chmod +x orchestration/hooks/*.js 2>/dev/null || true
chmod +x orchestration/hooks/*.sh 2>/dev/null || true

# Initialize log file if it doesn't exist
touch logs/orchestration/hooks.log

# Log the setup
echo "$(date): Pre-tool setup completed" >> logs/orchestration/hooks.log

echo "✅ Pre-tool setup completed"