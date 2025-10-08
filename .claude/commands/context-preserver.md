---
description: Preserve terminal context and generate portable prompt for fresh sessions
---

# Context Preservation Agent

**Color**: ⚪ White
**Model**: Claude Sonnet 4.5
**Execution Time**: ~45-60 seconds

## What This Does

When you're approaching Claude Code's token limit (200K tokens), this agent:

1. **Analyzes Complete Conversation History** - Reviews all messages in current terminal
2. **Extracts Work Context** - Identifies what you were working on, decisions made, progress status
3. **Checks File Changes** - Runs `git status` and `git diff` to see modifications
4. **Reads Project State** - Reviews CLAUDE.md and current project configuration
5. **Generates Portable Prompt** - Creates a copy-paste ready prompt for the new terminal

## Why You Need This

### The Problem
- Claude Code has 200K token limit
- Long conversations hit this limit, requiring fresh terminal
- Manual context recreation wastes 5-10 minutes
- Risk of forgetting important details or decisions
- Productivity loss from re-explaining project context

### The Solution
This agent creates a **perfect handoff prompt** that includes:
- ✅ Session summary (what you were doing)
- ✅ Completed tasks
- ✅ In-progress work
- ✅ File changes with explanations
- ✅ Technical decisions made
- ✅ Next steps
- ✅ Copy-paste ready prompt for new terminal

## Usage

### Basic (Auto Session ID)
```bash
/context-preserver
```

### With Custom Session ID
```bash
/context-preserver session_my_work_123
```

## What You Get

The agent creates a comprehensive file at:
```
data/context-preservation/portable-prompt-<session-id>.txt
```

### File Structure

```markdown
# Context Preservation - Session <id>

## 🎯 PROJECT: JarvisDaily
[Project summary]

## 📋 SESSION SUMMARY
- Duration: X minutes
- Main Objective: What you were trying to do
- Status: Completed / In Progress / Blocked

## ✅ COMPLETED IN THIS SESSION
1. Task 1
2. Task 2
3. Task 3

## 🚧 IN PROGRESS
- Current task details
- Status and blockers

## 📁 FILES CHANGED
- file1.tsx: Description of changes
- file2.js: Description of changes

## 🔧 TECHNICAL CONTEXT
- Decisions made
- Environment details
- Current branch

## ⚠️ IMPORTANT NOTES
- Critical information
- Preferences stated
- Gotchas discovered

## 🎯 NEXT STEPS
1. First action
2. Second action
3. Third action

## 📋 COPY-PASTE PROMPT FOR NEW TERMINAL
┌───────────────────────────────────────┐
│ READY TO COPY AND PASTE:              │
└───────────────────────────────────────┘

[Concise, actionable prompt that includes
all context needed to continue work]
```

## Example Output

```markdown
## 📋 COPY-PASTE PROMPT FOR NEW TERMINAL

I was working on JarvisDaily and hit the token limit. Here's the context:

**What I was doing**: Improving the CLAUDE.md file to add Next.js architecture
details and common development workflows.

**What's completed**:
- Enhanced project overview with tech stack
- Added Next.js & React patterns section
- Created Common Development Workflows section
- Improved troubleshooting with 7 specific solutions

**What's in progress**: Creating a Context Preservation Agent to avoid
token limit issues in future sessions.

**Files modified**:
- CLAUDE.md (916 lines, comprehensive update)
- agents/context-preserver-agent.js (new, being created)

**Next steps**:
1. Create slash command for context-preserver agent
2. Test the agent with current conversation
3. Document the agent in CLAUDE.md
4. Commit changes to git

**Technical context**: Using Claude Agent SDK pattern with parallel
subagents for faster execution. Following market-intelligence-sdk.js
structure.

Please help me complete the context-preserver agent implementation
and test it with this current session.
```

## When to Use

### Ideal Times
- ✅ **Token Usage**: 150K+ tokens used (75%+ capacity)
- ✅ **Long Session**: Worked for 30+ minutes
- ✅ **Complex Changes**: Modified multiple files
- ✅ **Important Decisions**: Made architectural choices
- ✅ **Before Breaks**: Ending work session, want to resume later

### Not Needed When
- ❌ Just started fresh terminal (< 10K tokens)
- ❌ Simple one-file changes
- ❌ Quick questions or info lookups
- ❌ Running automated commands only

## How It Works (Technical)

### Architecture
```
Context Preserver Agent (Claude Sonnet 4.5)
├── Subagent 1: Conversation Analyzer (parallel)
│   └── Reviews all messages, extracts tasks & decisions
├── Subagent 2: File Change Analyzer (parallel)
│   └── Runs git status/diff, identifies modifications
└── Subagent 3: Project State Analyzer (parallel)
    └── Reads CLAUDE.md, checks branch, deployment status

All 3 run simultaneously → Combined into portable prompt
```

### Execution Flow
1. **Initialize** (5s): Create session, setup output directory
2. **Parallel Analysis** (30-40s): Run 3 subagents simultaneously
3. **Synthesis** (5-10s): Combine results into comprehensive prompt
4. **Output** (5s): Save file + display in terminal
5. **Total**: ~45-60 seconds

### Output Location
```
data/context-preservation/
├── portable-prompt-context_1234567890.txt
├── portable-prompt-context_1234567891.txt
└── ...
```

## Agent Implementation

**File**: `agents/context-preserver-agent.js`
**Class**: `ContextPreserverAgent`
**Dependencies**:
- `@anthropic-ai/claude-agent-sdk`
- `fs`, `path` (Node.js built-ins)
- `child_process` (for git commands)

**Key Features**:
- Parallel subagent execution (3x faster)
- Automatic git status/diff analysis
- CLAUDE.md parsing for project context
- Fallback mode if analysis fails
- Terminal output display for immediate copy-paste

## Tips

### Best Practices
1. **Run before token limit**: Use at 150K tokens, not 199K
2. **Review output**: Read the generated prompt before copying
3. **Edit if needed**: Add session-specific notes manually
4. **Save session ID**: Note it down if you need to reference later
5. **Commit first**: If you have uncommitted changes, commit them before running

### Common Workflows

**Scenario 1: Long Implementation Session**
```bash
# After 30 minutes of work, multiple file changes
/context-preserver
# Copy prompt → Open new terminal → Paste → Continue
```

**Scenario 2: Complex Debugging**
```bash
# Tried multiple approaches, made decisions
/context-preserver session_debug_auth_issue
# Captures all attempts and learnings
```

**Scenario 3: End of Day**
```bash
# Want to resume tomorrow
/context-preserver session_dashboard_feature
# Perfect handoff for next session
```

## Troubleshooting

### Agent Fails or Times Out
- **Fallback mode activates** automatically
- Basic prompt generated with git status
- Manually add context notes to fallback file

### Can't Find Output File
```bash
ls -la data/context-preservation/
# Should show portable-prompt-*.txt files
```

### Prompt Too Long
- Edit the generated file
- Keep only essential context
- Remove duplicate information

### Prompt Missing Details
- Run the agent again with more specific task description
- Manually add missing context to the generated file

## Related Commands

- `/state-manager`: Manages session state across agents
- `/learning-agent`: Extracts learnings from completed sessions
- `/o`: Full 14-agent content generation pipeline

## Monitoring & Logs

The agent logs to console in real-time:
```
⚪ CONTEXT PRESERVATION AGENT
📅 Session ID: context_1234567890
🎯 Analyzing conversation, files, and project state...
⏱️  Expected: ~45-60 seconds

✅ Context Preservation completed
⏱️  Duration: 47.3s
📁 Saved to: data/context-preservation/portable-prompt-context_1234567890.txt

📋 NEXT STEPS:
1. Read the generated file
2. Copy the "COPY-PASTE PROMPT" section
3. Open a fresh terminal
4. Paste and continue!
```

---

**Created**: 2025-10-08
**Author**: Context Preservation System
**Version**: 1.0.0
**Status**: Production Ready ✅
