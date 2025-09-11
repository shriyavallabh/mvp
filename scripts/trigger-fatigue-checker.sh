#!/bin/bash

# Fatigue Checker Trigger Script
# Usage: ./trigger-fatigue-checker.sh [--test] [--advisor ARN] [--topic "topic text"]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AGENT_PATH="$PROJECT_DIR/agents/validators/fatigue-checker.js"

# Check if agent file exists
if [ ! -f "$AGENT_PATH" ]; then
    echo "Error: Fatigue checker agent not found at $AGENT_PATH"
    exit 1
fi

# Parse command line arguments
TEST_MODE=false
ADVISOR_ARN=""
TOPIC=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            TEST_MODE=true
            shift
            ;;
        --advisor)
            ADVISOR_ARN="$2"
            shift 2
            ;;
        --topic)
            TOPIC="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--test] [--advisor ARN] [--topic \"topic text\"]"
            echo "  --test       Run in test mode"
            echo "  --advisor    Specify advisor ARN"
            echo "  --topic      Topic text to check for fatigue"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Export environment variables if config exists
if [ -f "$PROJECT_DIR/config/.env" ]; then
    export $(cat "$PROJECT_DIR/config/.env" | grep -v '^#' | xargs)
fi

# Run the agent
echo "Starting Fatigue Checker..."
echo "==========================="

if [ "$TEST_MODE" = true ]; then
    echo "Running in TEST mode"
    node "$AGENT_PATH" --test
else
    if [ -n "$ADVISOR_ARN" ] && [ -n "$TOPIC" ]; then
        echo "Checking fatigue for advisor: $ADVISOR_ARN"
        echo "Topic: $TOPIC"
        node "$AGENT_PATH" --advisor "$ADVISOR_ARN" --topic "$TOPIC"
    elif [ -n "$ADVISOR_ARN" ]; then
        echo "Generating fatigue report for advisor: $ADVISOR_ARN"
        node "$AGENT_PATH" --advisor "$ADVISOR_ARN" --report
    else
        echo "Starting fatigue checker in daemon mode"
        node "$AGENT_PATH"
    fi
fi

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "==========================="
    echo "Fatigue Checker completed successfully"
else
    echo "==========================="
    echo "Fatigue Checker failed with exit code: $exit_code"
fi

exit $exit_code