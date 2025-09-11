# Agent Organization

## Directory Structure

The agent system follows a hierarchical organization pattern:

### `/controllers`
Master controller agents that orchestrate operations and manage sub-agent coordination.
- `content-orchestrator.js` - Main controller for content generation workflow

### `/generators` 
Agents responsible for generating content, strategies, and creative outputs.
- `content-strategist.js` - Topic selection and trend analysis

### `/validators`
Agents that validate content against various criteria and compliance rules.
- `fatigue-checker.js` - Prevents content repetition and monitors history
- `compliance-validator.js` - SEBI guideline checking and regulatory compliance

### `/managers`
Agents handling CRUD operations and data management.
- `advisor-manager.js` - Manages advisor data in Google Sheets

### `/utils`
Shared utilities and common functionality used across all agents.
- `communication.js` - Standardized inter-agent communication protocol
- `error-handler.js` - Error handling and retry logic
- `logger.js` - Structured logging infrastructure

## Agent Communication

All agents follow the standardized message protocol defined in `/utils/communication.js` with the following structure:
- agent_id: Unique identifier of sending agent
- timestamp: ISO 8601 timestamp
- action: Action being requested
- payload: Action-specific data
- context: Session and priority information
- response_required: Boolean flag for response expectation

## State Management

Each agent maintains state using the following lifecycle:
- IDLE: Waiting for tasks
- PROCESSING: Executing task
- WAITING: Awaiting sub-agent response
- COMPLETED: Task finished successfully
- ERROR: Task failed with error
- RETRY: Attempting task retry

## Testing

Individual agents can be triggered via Claude CLI for testing:
- `claude /content-orchestrator --test`
- `claude /advisor-manager --test`
- `claude /content-strategist --test`
- `claude /fatigue-checker --test`
- `claude /compliance-validator --test`

## Logging

All agent operations are logged to `/logs/[agent-name].log` with structured logging including:
- Timestamps
- Log levels (DEBUG, INFO, WARN, ERROR)
- Performance metrics
- Error traces