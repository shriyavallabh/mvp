#!/bin/bash

# Advisor Manager Trigger Script
# Usage: ./trigger-advisor-manager.sh [--test] [--action ACTION] [--arn ARN]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AGENT_PATH="$PROJECT_DIR/agents/managers/advisor-manager.js"

# Check if agent file exists
if [ ! -f "$AGENT_PATH" ]; then
    echo "Error: Advisor manager agent not found at $AGENT_PATH"
    exit 1
fi

# Parse command line arguments
TEST_MODE=false
ACTION=""
ADVISOR_ARN=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            TEST_MODE=true
            shift
            ;;
        --action)
            ACTION="$2"
            shift 2
            ;;
        --arn)
            ADVISOR_ARN="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--test] [--action ACTION] [--arn ARN]"
            echo "  --test       Run in test mode"
            echo "  --action     Specify action (list, create, update, delete)"
            echo "  --arn        Specify advisor ARN"
            echo "  --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --test"
            echo "  $0 --action list"
            echo "  $0 --action update --arn ARN_12345"
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
echo "Starting Advisor Manager..."
echo "==========================="

if [ "$TEST_MODE" = true ]; then
    echo "Running in TEST mode"
    node "$AGENT_PATH" --test
else
    if [ -n "$ACTION" ]; then
        echo "Executing action: $ACTION"
        if [ -n "$ADVISOR_ARN" ]; then
            node "$AGENT_PATH" --action "$ACTION" --arn "$ADVISOR_ARN"
        else
            node "$AGENT_PATH" --action "$ACTION"
        fi
    else
        echo "Starting advisor manager in daemon mode"
        node "$AGENT_PATH"
    fi
fi

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "==========================="
    echo "Advisor Manager completed successfully"
else
    echo "==========================="
    echo "Advisor Manager failed with exit code: $exit_code"
fi

exit $exit_code