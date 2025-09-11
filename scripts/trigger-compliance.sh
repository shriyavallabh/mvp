#!/bin/bash

# Compliance Validator Trigger Script
# Usage: ./trigger-compliance.sh [--test] [--content "content text"] [--advisor ARN]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AGENT_PATH="$PROJECT_DIR/agents/validators/compliance-validator.js"

# Check if agent file exists
if [ ! -f "$AGENT_PATH" ]; then
    echo "Error: Compliance validator agent not found at $AGENT_PATH"
    exit 1
fi

# Parse command line arguments
TEST_MODE=false
CONTENT=""
ADVISOR_ARN=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            TEST_MODE=true
            shift
            ;;
        --content)
            CONTENT="$2"
            shift 2
            ;;
        --advisor)
            ADVISOR_ARN="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--test] [--content \"content text\"] [--advisor ARN]"
            echo "  --test       Run in test mode"
            echo "  --content    Content text to validate for compliance"
            echo "  --advisor    Specify advisor ARN"
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
echo "Starting Compliance Validator..."
echo "================================"

if [ "$TEST_MODE" = true ]; then
    echo "Running in TEST mode"
    node "$AGENT_PATH" --test
else
    if [ -n "$CONTENT" ]; then
        echo "Validating content for compliance"
        if [ -n "$ADVISOR_ARN" ]; then
            echo "Advisor: $ADVISOR_ARN"
            node "$AGENT_PATH" --content "$CONTENT" --advisor "$ADVISOR_ARN"
        else
            node "$AGENT_PATH" --content "$CONTENT"
        fi
    elif [ -n "$ADVISOR_ARN" ]; then
        echo "Generating compliance report for advisor: $ADVISOR_ARN"
        node "$AGENT_PATH" --advisor "$ADVISOR_ARN" --report
    else
        echo "Starting compliance validator in daemon mode"
        node "$AGENT_PATH"
    fi
fi

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "================================"
    echo "Compliance Validator completed successfully"
else
    echo "================================"
    echo "Compliance Validator failed with exit code: $exit_code"
fi

exit $exit_code