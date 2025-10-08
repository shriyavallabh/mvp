/**
 * Context Preservation Agent with Claude Agent SDK
 *
 * Purpose: Extract conversation context and generate portable prompt for fresh terminals
 * Avoids: Token limit exhaustion, context loss, manual recap effort
 *
 * Color: White (#FFFFFF)
 * Model: Claude Sonnet 4.5
 * Execution Time: ~45-60 seconds
 */

import { Agent } from '@anthropic-ai/claude-agent-sdk';
import fs from 'fs';
import path from 'path';

export class ContextPreserverAgent {
  constructor(sessionId = null) {
    this.sessionId = sessionId || `context_${Date.now()}`;
    this.outputDir = `data/context-preservation`;
    this.color = '\x1b[97m'; // White color
    this.reset = '\x1b[0m';

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Create Agent SDK instance
    this.agent = new Agent({
      model: 'claude-sonnet-4.5',

      systemPrompt: `You are an expert Context Preservation Agent specializing in conversation analysis and context extraction.

Your Mission:
Extract all critical context from the current terminal session and generate a comprehensive, copy-paste ready prompt that allows seamless continuation in a fresh terminal.

Session ID: ${this.sessionId}
Output: ${this.outputDir}/portable-prompt-${this.sessionId}.txt

You have access to:
1. Complete conversation history (all messages in this terminal)
2. CLAUDE.md file (project documentation)
3. Current file states (what was modified)
4. Git status (uncommitted changes)
5. Recent commands executed

Your output MUST include:
1. **Project Context**: What is JarvisDaily, current architecture
2. **Work Session Summary**: What was being worked on in this session
3. **Completed Tasks**: List of what was accomplished
4. **In-Progress Tasks**: What was being worked on when context limit hit
5. **File Changes**: Which files were created/modified
6. **Current State**: Git status, uncommitted changes, build status
7. **Next Steps**: What should happen next in the fresh terminal
8. **Environment Context**: Important environment variables, API configurations
9. **Critical Decisions**: Any architectural decisions or approach changes made
10. **Portable Prompt**: A ready-to-paste prompt for the new terminal

CRITICAL RULES:
- Be COMPREHENSIVE but CONCISE - include only actionable information
- Avoid repeating project setup info already in CLAUDE.md
- Focus on SESSION-SPECIFIC context that would be lost
- Generate output in markdown format for readability
- End with a boxed "COPY-PASTE PROMPT" section`,

      // Enable parallel processing for faster analysis
      parallelExecution: true,

      // Subagents for thorough analysis
      subagents: [
        {
          name: 'conversation_analyzer',
          systemPrompt: `Analyze the conversation history:
- Identify main tasks discussed
- Extract technical decisions made
- Note any blockers or issues encountered
- Identify completed vs in-progress work
- Extract user preferences and requirements`,
          parallelExecution: true
        },
        {
          name: 'file_change_analyzer',
          systemPrompt: `Analyze file changes in this session:
- Read git status and git diff
- Identify new files created
- Identify modified files
- Check for uncommitted changes
- Note any build or test results`,
          parallelExecution: true
        },
        {
          name: 'project_state_analyzer',
          systemPrompt: `Analyze current project state:
- Read CLAUDE.md for project overview
- Check current git branch
- Verify deployment status
- Check test status
- Identify any environment issues`,
          parallelExecution: true
        }
      ],

      // Auto context management
      contextWindow: 'auto',

      // Error handling with retry
      errorRecovery: {
        maxRetries: 2,
        backoff: 'exponential',
        retryConditions: ['rate_limit', 'timeout', 'server_error']
      },

      // Monitoring
      monitoring: {
        enabled: true,
        logLevel: 'info'
      }
    });
  }

  async execute() {
    const startTime = Date.now();

    console.log(`\n${this.color}${'='.repeat(70)}`);
    console.log(`⚪ CONTEXT PRESERVATION AGENT`);
    console.log(`${'='.repeat(70)}${this.reset}`);
    console.log(`📅 Session ID: ${this.sessionId}`);
    console.log(`🎯 Analyzing conversation, files, and project state...`);
    console.log(`⏱️  Expected: ~45-60 seconds\n`);

    try {
      // Run agent with parallel subagents
      const result = await this.agent.run({
        task: `ANALYZE CURRENT TERMINAL SESSION AND GENERATE PORTABLE CONTEXT

You are analyzing a Claude Code terminal session that is approaching token limits.
The user needs to start a FRESH terminal but continue their work seamlessly.

STEP 1: ANALYZE CONVERSATION HISTORY
- Review all messages in this terminal session
- Identify what the user was trying to accomplish
- Note any technical decisions or approaches discussed
- Extract key requirements or constraints mentioned
- Identify completed tasks vs work in progress

STEP 2: ANALYZE FILE CHANGES
- Run 'git status' to see modified/new files
- Run 'git diff' to see actual changes made
- Check if there are uncommitted changes
- Note any build or test results

STEP 3: READ PROJECT DOCUMENTATION
- Read CLAUDE.md to understand the project
- Note current architecture and tech stack
- Identify relevant commands and workflows

STEP 4: GENERATE PORTABLE PROMPT

Create a comprehensive prompt file with these sections:

\`\`\`markdown
# Context Preservation - Session ${this.sessionId}
Generated: ${new Date().toISOString()}

---

## 🎯 PROJECT: JarvisDaily
[Brief 2-3 sentence reminder of what the project is]

## 📋 SESSION SUMMARY
**Duration**: [Estimate based on conversation]
**Main Objective**: [What was the user trying to accomplish]
**Status**: [Completed / In Progress / Blocked]

## ✅ COMPLETED IN THIS SESSION
1. [Task 1 - with brief description]
2. [Task 2 - with brief description]
3. [etc.]

## 🚧 IN PROGRESS (When Context Limit Hit)
**Current Task**: [Detailed description of what was being worked on]
**Status**: [e.g., "Halfway through implementing X", "Debugging Y"]
**Blockers**: [Any issues encountered]

## 📁 FILES CHANGED
\`\`\`
[Output of git status]
\`\`\`

**Key Changes**:
- \`file1.tsx\`: [What changed and why]
- \`file2.js\`: [What changed and why]
- \`file3.md\`: [What changed and why]

## 🔧 TECHNICAL CONTEXT
**Decisions Made**:
- [Decision 1: e.g., "Decided to use X approach instead of Y because..."]
- [Decision 2]

**Environment**:
- Node version: [if relevant]
- Important env vars: [if any were discussed]
- Current branch: [from git]

## ⚠️ IMPORTANT NOTES
- [Any critical information the user mentioned]
- [Any preferences or constraints stated]
- [Any warnings or gotchas discovered]

## 🎯 NEXT STEPS
In the fresh terminal, you should:
1. [First thing to do]
2. [Second thing to do]
3. [etc.]

## 📦 UNCOMMITTED CHANGES
[If there are any uncommitted changes, note them here]
[Suggest whether to commit them or continue working]

---

## 📋 COPY-PASTE PROMPT FOR NEW TERMINAL

┌─────────────────────────────────────────────────────────────┐
│ PASTE THIS INTO YOUR NEW CLAUDE CODE TERMINAL:              │
└─────────────────────────────────────────────────────────────┘

I was working on JarvisDaily and hit the token limit. Here's the context:

**What I was doing**: [Concise summary]

**What's completed**: [Brief list]

**What's in progress**: [Current task details]

**Files modified**: [List of key files]

**Next steps**: [What should happen next]

**Technical context**: [Any important decisions or constraints]

Please review the changes I made and help me continue with [specific next task].

[Add any specific questions or requests here]

---
\`\`\`

Save this comprehensive analysis to: ${this.outputDir}/portable-prompt-${this.sessionId}.txt

CRITICAL: Make the "COPY-PASTE PROMPT" section PERFECT - it should give the new terminal ALL the context needed in a concise, actionable format.`,

        outputDir: this.outputDir
      });

      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(1);

      const outputFile = `${this.outputDir}/portable-prompt-${this.sessionId}.txt`;

      console.log(`\n${this.color}✅ Context Preservation completed${this.reset}`);
      console.log(`⏱️  Duration: ${durationSeconds}s`);
      console.log(`📁 Saved to: ${outputFile}`);

      // Update PLOT.md with session log
      this.updatePlotMd(outputFile);

      console.log(`\n${this.color}${'='.repeat(70)}`);
      console.log(`📋 NEXT STEPS:`);
      console.log(`1. Read the generated file: cat ${outputFile}`);
      console.log(`2. Copy the "COPY-PASTE PROMPT" section`);
      console.log(`3. Open a fresh terminal`);
      console.log(`4. Paste the prompt and continue your work!`);
      console.log(`${'='.repeat(70)}${this.reset}\n`);

      // Display the portable prompt in the terminal
      if (fs.existsSync(outputFile)) {
        console.log(`${this.color}${'─'.repeat(70)}`);
        console.log(`📄 PORTABLE PROMPT (Ready to Copy):`);
        console.log(`${'─'.repeat(70)}${this.reset}\n`);

        const promptContent = fs.readFileSync(outputFile, 'utf8');
        console.log(promptContent);

        console.log(`\n${this.color}${'─'.repeat(70)}${this.reset}\n`);
      }

      return {
        success: true,
        duration: duration,
        durationSeconds: parseFloat(durationSeconds),
        outputFile: outputFile,
        sessionId: this.sessionId,
        plotMdUpdated: true,
        message: 'Context preserved successfully. Copy the prompt above and paste into a new terminal.'
      };

    } catch (error) {
      console.error(`${this.color}❌ Context Preservation failed:${this.reset}`, error.message);

      // Create a basic fallback prompt
      const fallbackPrompt = this.createFallbackPrompt();
      const fallbackFile = `${this.outputDir}/portable-prompt-${this.sessionId}-fallback.txt`;

      fs.writeFileSync(fallbackFile, fallbackPrompt);

      console.log(`${this.color}⚠️  Created fallback prompt: ${fallbackFile}${this.reset}`);

      return {
        success: false,
        error: error.message,
        fallbackUsed: true,
        outputFile: fallbackFile,
        sessionId: this.sessionId
      };
    }
  }

  createFallbackPrompt() {
    const timestamp = new Date().toISOString();
    const gitStatus = this.getGitStatus();

    return `# Context Preservation - Session ${this.sessionId} (FALLBACK)
Generated: ${timestamp}

---

## ⚠️ FALLBACK MODE
The Context Preservation Agent encountered an error. This is a basic prompt.
Review your recent work manually and add details below.

## 📋 GIT STATUS
\`\`\`
${gitStatus}
\`\`\`

## 🎯 PROJECT
JarvisDaily - WhatsApp content distribution platform for financial advisors
- Frontend: Next.js 15, Clerk auth, shadcn/ui
- Backend: 14 AI agents, Meta WhatsApp API
- Domain: jarvisdaily.com

## 📋 COPY-PASTE PROMPT FOR NEW TERMINAL

┌─────────────────────────────────────────────────────────────┐
│ PASTE THIS INTO YOUR NEW CLAUDE CODE TERMINAL:              │
└─────────────────────────────────────────────────────────────┘

I was working on JarvisDaily and hit the token limit.

**Current state**:
${gitStatus}

**What I need help with**: [ADD YOUR CONTEXT HERE]

Please review CLAUDE.md for project details and help me continue.

---

## 📝 MANUAL CONTEXT NOTES
Add your own notes here about what you were working on:
-
-
-

---
`;
  }

  getGitStatus() {
    try {
      const { execSync } = require('child_process');
      return execSync('git status --short', { encoding: 'utf8' }).trim() || 'No changes';
    } catch (error) {
      return 'Unable to fetch git status';
    }
  }

  updatePlotMd(outputFile) {
    try {
      const gitStatus = this.getGitStatus();
      const gitDiff = this.getGitDiff();

      const sessionLog = `\n\n---\n\n## Context Preservation Session - ${this.sessionId}

**Date**: ${new Date().toISOString()}
**Type**: Terminal context handoff
**Output**: \`${outputFile}\`

### Session Overview:
This session captured the complete context of a terminal session approaching token limits, enabling seamless continuation in a fresh terminal.

### Files Modified:
\`\`\`
${gitStatus || 'No uncommitted changes'}
\`\`\`

### Change Summary:
\`\`\`
${gitDiff || 'No diff available'}
\`\`\`

### Purpose:
Preserve conversation context to avoid token limit issues and enable seamless terminal handoff.

### Restoration:
See portable prompt: \`${outputFile}\`

`;

      if (!fs.existsSync('PLOT.md')) {
        const plotMdHeader = `# PLOT.md - Project Chronicle

This file serves as the "project bible" - a continuously updated log of all significant sessions, decisions, and file operations.

It is used by:
- **Context Preserver Agent**: Logs terminal sessions for continuity
- **Sweeper Agent**: Understands file purposes and history
- **Future Claude instances**: Learns what has been done before

---

`;
        fs.writeFileSync('PLOT.md', plotMdHeader + sessionLog);
        console.log(`${this.color}📝 Created PLOT.md${this.reset}`);
      } else {
        fs.appendFileSync('PLOT.md', sessionLog);
        console.log(`${this.color}📝 Updated PLOT.md${this.reset}`);
      }
    } catch (error) {
      console.error(`${this.color}⚠️  Failed to update PLOT.md:${this.reset}`, error.message);
    }
  }

  getGitDiff() {
    try {
      const { execSync } = require('child_process');
      return execSync('git diff --stat', { encoding: 'utf8' }).trim() || 'No changes';
    } catch (error) {
      return 'Unable to fetch git diff';
    }
  }
}

// Export function for easy import
export async function runContextPreserver(sessionId) {
  const agent = new ContextPreserverAgent(sessionId);
  return await agent.execute();
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const sessionId = process.argv[2] || null;
  runContextPreserver(sessionId).then(result => {
    if (!result.success) {
      process.exit(1);
    }
  });
}
