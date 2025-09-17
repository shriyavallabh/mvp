---
description: Apply learnings from completed orchestration sessions to improve agent performance
---

# 🧠 Learning Agent - Continuous System Improvement

## Purpose

The Learning Agent processes completed orchestration sessions and applies captured learnings to improve agent descriptions and system performance. This creates a continuous improvement cycle where each execution makes the system smarter.

## What This Command Does

### **Phase 1: Learning Discovery (30 seconds)**
- Scans `learning/` directory for files with "READY_FOR_REVIEW" status
- Loads and parses learning content from completed sessions
- Categorizes learnings by type and impact
- Prioritizes learnings for application

### **Phase 2: Impact Analysis (1-2 minutes)**
- Analyzes which agents would benefit from each learning
- Determines system-wide vs agent-specific improvements
- Plans implementation strategy
- Creates backup of current agent descriptions

### **Phase 3: Agent Updates (2-3 minutes)**
- Updates agent description files in `.claude/agents/`
- Applies insights to improve instructions and capabilities
- Enhances error handling and edge case management
- Updates tool usage patterns and best practices

### **Phase 4: Documentation (30 seconds)**
- Updates learning file status from "READY_FOR_REVIEW" to "APPLIED"
- Creates learning application report
- Documents all changes made
- Updates agent change logs

## Learning Types Processed

**🔧 Technical Issues**
- API rate limits and timeout patterns
- Memory and performance optimizations
- Error handling improvements
- Integration solutions

**🔄 Process Improvements**
- Workflow timing optimizations
- Agent dependency management
- Communication protocol enhancements
- Parallel execution opportunities

**📊 Quality Insights**
- Content quality patterns
- Validation rule refinements
- Scoring algorithm improvements
- User preference patterns

**🤝 Communication Issues**
- Inter-agent message handling
- Coordination problem solutions
- Feedback loop optimizations
- State synchronization improvements

**💡 Feature Requests**
- New capability discoveries
- Enhanced functionality needs
- Integration opportunities
- User experience improvements

## Example Learning Application

```
Learning Session: 2025-09-17-14-30-45
Agent: gemini-image-generator
Issue: API rate limit exceeded during peak hours
Learning Applied: Added exponential backoff and queue management
Result: 95% reduction in rate limit errors
```

## Learning Status Lifecycle

1. **PENDING**: Fresh learning file from new session
2. **READY_FOR_REVIEW**: Session completed, ready for processing
3. **APPLIED**: Learnings reviewed and applied to agents
4. **ARCHIVED**: Old learnings no longer relevant

## Output Generated

**Learning Application Report**: `learning/application-report-[timestamp].md`
- Session overview and statistics
- Agent updates made with justifications
- System improvements implemented
- Deferred items requiring manual review

**Agent Backups**: `learning/backups/[timestamp]/`
- Backup of all agent files before updates
- Allows rollback if needed
- Maintains change history

## Quality Assurance

- ✅ Backs up agent files before modification
- ✅ Validates changes don't break functionality
- ✅ Tests critical agent paths after updates
- ✅ Maintains compatibility with orchestration
- ✅ Documents all changes for traceability

## Cross-Agent Learning vs User Learning

**Cross-Agent Learning (Automated)**
- Technical performance optimizations
- API usage improvements
- Error handling enhancements
- Process efficiency gains

**User Learning (Requires Manual Review)**
- Business strategy adjustments
- Content tone preferences
- Brand guideline updates
- Compliance rule changes

## Usage Examples

**Process All Pending Learnings**
```
/learning-agent
```

**Review Specific Session**
```
/learning-agent --session 2025-09-17-14-30-45
```

**Generate Report Only**
```
/learning-agent --report-only
```

## Success Indicators

You'll know it's working when you see:
- 🔍 "Scanning for learning files..."
- 📋 "Found [X] learning sessions ready for review"
- 🔄 "Applying learning: [specific insight]"
- ✅ "Agent [name] updated: [improvement]"
- 📊 "Learning application report generated"

## Continuous Improvement Cycle

1. **Execute Orchestration** → Captures learnings during execution
2. **Review Learnings** → Learning agent processes insights
3. **Apply Improvements** → Agent descriptions updated
4. **Better Performance** → Next executions benefit from learnings
5. **Repeat** → Continuous system evolution

This command transforms your FinAdvise system into a self-improving AI that gets better with each execution.