# Archive Index

This folder contains temporary, troubleshooting, and deprecated files that are no longer actively used but kept for reference.

## Structure

```
archive/
├── old-scripts/          # Deprecated scripts from Meta setup & testing
│   ├── Meta API setup scripts (check-meta-limits.js, setup-meta-direct.js, etc.)
│   ├── Template creation scripts (create-template-meta-direct.js, etc.)
│   ├── WhatsApp sending scripts (send-via-meta-direct.js, etc.)
│   ├── Test scripts (test-aisensy-single.js, test-cloudinary.js, etc.)
│   └── Vercel setup scripts (setup-vercel-env.js, update-vercel-env.js, etc.)
│
└── troubleshooting/      # Temporary files created during development
    ├── test-server.js            # Local test server (replaced by Vercel)
    ├── orchestrate-with-agents.js # Old orchestration attempt (replaced by /o)
    └── old-audio-hooks/          # Redundant audio hook implementations
        ├── agent-completion-audio.js
        ├── agent-start-audio.js
        ├── enhanced-agent-audio.js
        ├── safe-agent-audio.js
        ├── task-audio-bridge.js
        └── trigger-audio.js
```

## Active Files in Root (Keep These)

**Core Orchestration:**
- `execute-finadvise-mvp.js` - MVP execution script
- `run-finadvise-mvp.js` - Quick test run
- `orchestrate-complete.js` - Complete orchestration
- `orchestrate-finadvise.py` - Python orchestration with session management

**Configuration:**
- `next.config.js` - Next.js config
- `playwright.config.js` - E2E testing config

## Active Audio System (Keep These)

**Hooks (orchestration/hooks/):**
- `detect-task-agent.js` ✅ **NEW** - Detects Task tool agents and triggers audio
- `agent-audio-announcer.js` - Core audio announcement engine
- `audio-config.json` - Audio configuration
- `universal-agent-hook.sh` - Universal agent hook wrapper

## Files Moved to Archive (Oct 7, 2024)

### From Root:
- `test-server.js` → `archive/troubleshooting/` (Reason: Vercel used instead)
- `orchestrate-with-agents.js` → `archive/troubleshooting/` (Reason: Replaced by `/o` command)

### From orchestration/hooks/:
- `agent-completion-audio.js` → `archive/troubleshooting/old-audio-hooks/`
- `agent-start-audio.js` → `archive/troubleshooting/old-audio-hooks/`
- `enhanced-agent-audio.js` → `archive/troubleshooting/old-audio-hooks/`
- `safe-agent-audio.js` → `archive/troubleshooting/old-audio-hooks/`
- `task-audio-bridge.js` → `archive/troubleshooting/old-audio-hooks/`
- `trigger-audio.js` → `archive/troubleshooting/old-audio-hooks/`

**Reason:** All replaced by `detect-task-agent.js` which properly intercepts Task tool calls

## Notes

- Do NOT delete these files - they contain working implementations that may be referenced
- Before creating new troubleshooting files, use `archive/troubleshooting/`
- Keep CLAUDE.md updated with any new temporary files created
