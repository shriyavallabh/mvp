# Learning System Folder Structure

## Overview

Every orchestration session creates its own learning folder with timestamped organization. This ensures complete isolation and traceability for each execution.

## Folder Structure

```
learning/
├── status-index.json                      # Global learning status tracking
├── backups/                               # Agent file backups before updates
├── archived/                              # Old learning files (auto-archived after 30 days)
├── 2025-09-17-14-30-45/                   # Session-specific folder (YYYY-MM-DD-HH-MM-SS)
│   ├── learning-2025-09-17-14-30-45.md   # Main learning file for this session
│   ├── agent-insights/                    # Individual agent learning details
│   │   ├── gemini-image-generator.json
│   │   ├── linkedin-post-generator.json
│   │   └── ...
│   └── session-summary.json               # Session metadata and statistics
├── 2025-09-17-15-45-22/                   # Another session folder
│   ├── learning-2025-09-17-15-45-22.md
│   └── ...
└── application-reports/                   # Learning agent reports
    ├── application-report-2025-09-17.md
    └── ...
```

## Session Learning File Example

**File**: `learning/2025-09-17-14-30-45/learning-2025-09-17-14-30-45.md`

```markdown
# Learning Log - Session 2025-09-17-14-30-45

## Session Information
- **Session ID**: 2025-09-17-14-30-45
- **Workflow ID**: finadvise-content-generation
- **Date**: 2025-09-17
- **Time**: 14-30-45
- **Status**: READY_FOR_REVIEW
- **Applied**: false

## Agent Learnings

This file captures all learnings, issues, errors, and improvements discovered during this execution session.

### Learning Categories:
- **🔧 Technical Issues**: API errors, memory issues, performance problems
- **🔄 Process Improvements**: Workflow optimizations, timing adjustments
- **📊 Quality Insights**: Content quality patterns, validation insights
- **🤝 Communication Issues**: Agent coordination problems, message handling
- **💡 Feature Requests**: New capabilities discovered during execution

---

## Detailed Learnings by Agent

### GEMINI-IMAGE-GENERATOR - 🔧 Technical Issues
**Timestamp**: 2025-09-17T14:32:15.000Z
**Type**: 🔧 Technical Issues

API rate limit exceeded during peak hours. Implemented exponential backoff strategy.

### LINKEDIN-POST-GENERATOR - 📊 Quality Insights
**Timestamp**: 2025-09-17T14:35:22.000Z
**Type**: 📊 Quality Insights

Posts with 1200+ characters show 40% better engagement than shorter posts.

## Learning Session Summary
- **Total Learnings**: 2 agents contributed
- **Session Status**: Execution completed
- **Next Action**: Run learning agent to apply these insights

---
*Learning file ready for processing by Learning Agent*
```

## Status Lifecycle

Each learning file goes through these states:

1. **PENDING**: Created when session starts
2. **READY_FOR_REVIEW**: Session completed, ready for learning agent
3. **APPLIED**: Learning agent has processed and applied insights
4. **ARCHIVED**: Moved to archive after 30 days (optional)

## Files Created Per Session

### Main Learning File
- **Location**: `learning/{sessionId}/learning-{sessionId}.md`
- **Content**: All agent learnings aggregated
- **Status**: Tracked in status-index.json

### Agent-Specific Details
- **Location**: `learning/{sessionId}/agent-insights/`
- **Content**: Detailed JSON files for each agent's learnings
- **Purpose**: Granular analysis for learning agent

### Session Metadata
- **Location**: `learning/{sessionId}/session-summary.json`
- **Content**: Session statistics, timing, success metrics
- **Purpose**: Performance tracking and optimization

## Learning Status Index

**File**: `learning/status-index.json`

```json
{
  "lastUpdated": "2025-09-17T14:45:30.000Z",
  "files": {
    "learning-2025-09-17-14-30-45.md": {
      "path": "learning/2025-09-17-14-30-45/learning-2025-09-17-14-30-45.md",
      "status": "READY_FOR_REVIEW",
      "lastUpdated": "2025-09-17T14:35:30.000Z",
      "sessionId": "2025-09-17-14-30-45",
      "size": 2048
    }
  },
  "statistics": {
    "PENDING": 0,
    "READY_FOR_REVIEW": 1,
    "APPLIED": 15,
    "ARCHIVED": 8
  }
}
```

## Commands for Managing Learning Files

### Scan All Learning Files
```bash
node learning-status-manager.js scan
```

### List Files by Status
```bash
node learning-status-manager.js status READY_FOR_REVIEW
```

### Update File Status
```bash
node learning-status-manager.js update learning-2025-09-17-14-30-45.md APPLIED "Processed by learning agent"
```

### Generate Status Report
```bash
node learning-status-manager.js report
```

### Archive Old Files
```bash
node learning-status-manager.js archive 30
```

## Integration with Orchestration

1. **Session Start**: Ultra transparency manager creates session folder
2. **During Execution**: Agents capture learnings via `captureAgentLearning()`
3. **Session End**: Learning file status updated to READY_FOR_REVIEW
4. **Learning Agent**: Processes ready files and applies insights
5. **Status Update**: Files marked as APPLIED after processing

## Benefits of This Structure

### ✅ **Complete Isolation**
- Each session has its own folder
- No conflicts between concurrent executions
- Easy to trace learnings to specific sessions

### ✅ **Timestamped Organization**
- Chronological ordering by folder name
- Easy to find recent vs old learnings
- Natural archiving by date ranges

### ✅ **Granular Tracking**
- Individual agent insights preserved
- Session-level metadata available
- Global status index for management

### ✅ **Scalable Management**
- Automatic archiving of old files
- Status-based querying and filtering
- Batch operations for maintenance

This structure ensures that every orchestration session creates a complete learning record while maintaining organized, scalable storage for long-term system improvement.