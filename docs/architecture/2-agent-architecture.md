# 2. Agent Architecture

## 2.1 Agent Hierarchy
```yaml
Master_Controller:
  /content-engine:
    description: "Parent command orchestrating all operations"
    sub_agents:
      - content-orchestrator (Level 1)
        - content-strategist (Level 2)
        - fatigue-checker (Level 2)
        - content-generator (Level 2)
        - image-creator (Level 2)
        - compliance-validator (Level 2)
        - distribution-manager (Level 2)
      - approval-guardian (Level 1)
      - revision-handler (Level 1)
      - analytics-tracker (Level 1)
      - backup-restore (Level 1)
      - advisor-manager (Level 1)
```

## 2.2 Agent Communication Protocol

### 2.2.1 Inter-Agent Communication
```javascript
// Agent Message Format
{
  "agent_id": "content-strategist",
  "timestamp": "2025-01-15T20:30:00Z",
  "action": "GENERATE_TOPIC",
  "payload": {
    "advisor_arn": "ARN_12345",
    "client_segment": "young_professionals",
    "content_focus": "growth"
  },
  "context": {
    "session_id": "session_xyz",
    "parent_agent": "content-orchestrator",
    "priority": 1
  },
  "response_required": true
}
```

### 2.2.2 Agent State Management
```yaml
Agent_States:
  IDLE: Agent waiting for tasks
  PROCESSING: Agent executing task
  WAITING: Agent awaiting sub-agent response
  COMPLETED: Task finished successfully
  ERROR: Task failed with error
  RETRY: Attempting task retry
```

## 2.3 Agent Specifications

### 2.3.1 Content Orchestrator
```yaml
name: content-orchestrator
type: CONTROLLER
responsibilities:
  - Read active advisors from Google Sheets
  - Coordinate sub-agent execution
  - Manage workflow state
  - Handle error propagation
dependencies:
  - Google Sheets API
  - All Level 2 agents
execution_pattern: SEQUENTIAL
error_handling: RETRY_WITH_BACKOFF
max_retries: 3
```

### 2.3.2 Content Strategist
```yaml
name: content-strategist
type: GENERATOR
responsibilities:
  - Web scraping for trends
  - Topic selection algorithm
  - Content calendar management
  - Virality scoring
data_sources:
  - Financial news websites
  - Social media trends
  - Historical performance data
output_format:
  topic: string
  virality_score: float(0-1)
  references: array[url]
```

### 2.3.3 Compliance Validator
```yaml
name: compliance-validator
type: VALIDATOR
responsibilities:
  - SEBI guideline checking
  - Risk disclaimer verification
  - Prohibited content detection
  - Audit trail generation
validation_rules:
  - must_include_disclaimer: true
  - prohibited_terms: ["guaranteed", "assured returns"]
  - required_elements: ["ARN", "risk statement"]
output:
  compliance_score: float(0-1)
  violations: array[string]
  recommendations: array[string]
```

### 2.3.4 Approval Guardian
```yaml
name: approval-guardian
type: AUTONOMOUS
activation_time: "23:00"
responsibilities:
  - Quality assessment
  - Iterative improvement
  - Auto-approval decisions
quality_metrics:
  fatigue_score: ">0.8"
  compliance_score: "=1.0"
  quality_score: ">0.8"
  relevance_score: ">0.8"
max_iterations: 3
fallback_strategy: NONE  # No templates, only regeneration
```

---
