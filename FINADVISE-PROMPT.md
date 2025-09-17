# 🎯 FINADVISE ORCHESTRATION PROMPT

## Quick Shortcut: Just type `/o` or say "orchestrate"

---

## COMPLETE PROMPT TO EXECUTE:

**Execute the complete FinAdvise orchestration with these exact specifications:**

### IMMEDIATE ACTIONS REQUIRED:

1. **Create session directory structure:**
   - Session ID: session_[current_timestamp]
   - Create: output/[session]/linkedin, output/[session]/whatsapp, output/[session]/images/status, output/[session]/images/whatsapp
   - Initialize: data/shared-context.json, data/agent-communication/, traceability/

2. **Execute these agents in sequence using Task tool:**

   **Phase 1 - Data (Sequential):**
   - Task(subagent_type="advisor-data-manager") - Create 3 advisors with names, ARNs
   - Task(subagent_type="market-intelligence") - Market data: Sensex 75838, Nifty 23024

   **Phase 2 - Analysis:**
   - Task(subagent_type="segment-analyzer") - Segment advisors by profile

   **Phase 3 - Content (Parallel):**
   - Task(subagent_type="linkedin-post-generator") - 1200+ char posts per advisor
   - Task(subagent_type="whatsapp-message-creator") - 300-400 char messages per advisor

   **Phase 4 - Visuals:**
   - Task(subagent_type="gemini-image-generator") - Status (1080x1920) + WhatsApp (1200x628) images

   **Phase 5 - Validation (Parallel):**
   - Task(subagent_type="compliance-validator") - SEBI compliance check
   - Task(subagent_type="quality-scorer") - Score quality >80%
   - Task(subagent_type="fatigue-checker") - Check uniqueness

   **Phase 6 - Distribution:**
   - Task(subagent_type="distribution-controller") - Setup channels
   - Task(subagent_type="analytics-tracker") - Track metrics

   **Phase 7 - Feedback:**
   - Task(subagent_type="feedback-processor") - Process feedback loops

3. **Implement bidirectional communication:**
   - Content generators → compliance-validator (request validation)
   - compliance-validator → content generators (feedback/regeneration)
   - Log all messages to data/agent-communication/messages.jsonl

4. **Manage state and memory:**
   - Update data/orchestration-state/[agent]-state.json after each agent
   - Save performance metrics to data/shared-memory.json
   - Track execution time, success rate, quality scores

5. **Generate actual outputs:**
   - LinkedIn posts as .txt files
   - WhatsApp messages as .txt files
   - Images as .png files (or placeholders)
   - Validation reports as .json files

**IMPORTANT: Use real Task tool calls, not descriptions. Create actual files. Execute immediately without asking questions.**

---

## 🚀 SHORTCUTS YOU CAN USE:

### Simple Commands:
- **"orchestrate"** - Run full orchestration
- **"run finadvise"** - Execute all agents
- **"generate content for advisors"** - Full pipeline
- **"o"** - Quick orchestrate

### Specific Requests:
- **"orchestrate with 5 advisors"** - Custom advisor count
- **"orchestrate linkedin only"** - Just LinkedIn content
- **"orchestrate and validate"** - Focus on validation
- **"orchestrate with images"** - Ensure image generation

### Advanced:
- **"orchestrate with bidirectional communication and state management"**
- **"orchestrate with MCP hooks and memory persistence"**
- **"orchestrate phase 1-3 only"** - Partial execution

---

## 📋 COPY-PASTE VERSION:

```
Execute FinAdvise orchestration now:
1. Create session directories
2. Run advisor-data-manager and market-intelligence
3. Run segment-analyzer
4. Run linkedin-post-generator and whatsapp-message-creator in parallel
5. Run gemini-image-generator
6. Run compliance-validator, quality-scorer, fatigue-checker in parallel
7. Run distribution-controller and analytics-tracker
8. Run feedback-processor
Use Task tools, create real outputs in session folder, implement bidirectional communication
```

---

## 🎭 ULTIMATE ONE-LINER:

```
Run the complete FinAdvise multi-agent orchestration with Task tools, creating LinkedIn posts, WhatsApp messages, and images for 3 advisors with market data, ensuring SEBI compliance, quality scoring >80%, bidirectional agent communication, state management, and outputs in timestamped session directories.
```

---

## 💡 TIPS:

1. **Fastest**: Just type "orchestrate" or "o"
2. **Most Control**: Use the complete prompt above
3. **Custom Needs**: Modify the prompt for your specific requirements
4. **Check Results**: Look in output/session_[timestamp]/ for all generated content

Save this file and refer to it anytime you need to run the orchestration!