---
description: Intelligent codebase cleanup - sweeps temporary files to timestamped archive
---

# Sweeper Agent - Intelligent Codebase Cleanup

**Color**: 🟡 Yellow
**Model**: Claude Sonnet 4.5
**Execution Time**: ~2-5 minutes
**Safety**: NEVER deletes (always archives)

## What This Does

The **Sweeper Agent** is your intelligent codebase janitor that executes cleanup with archiving:

1. **Detects active work** (protects files being edited in other terminals)
2. **Reads PLOT.md** (project bible - knows file history)
3. **Scans entire codebase** recursively (millions of tokens, no problem)
4. **Categorizes every file** (production, temporary, debug, communication)
5. **Creates sweep plan** (what to move, what to keep)
6. **Archives non-essential files** (moves to `archive/swept/<timestamp>/`)
7. **Updates PLOT.md** (logs sweep session for future reference)
8. **Creates restoration script** (easy rollback if needed)

### File Categories

```
┌─────────────────────────────────────────────────────┐
│  PRODUCTION CODE (Keep in main codebase)            │
│  ────────────────────────────────────────────────   │
│  ✅ app/ - Next.js application code                 │
│  ✅ components/ - React components                  │
│  ✅ agents/ - Agent implementations                 │
│  ✅ .claude/commands/ - Slash commands              │
│  ✅ tests/ - Playwright tests                       │
│  ✅ scripts/ - Active utility scripts               │
│  ✅ data/ - Application data                        │
│  ✅ package.json, tsconfig.json, vercel.json        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ESSENTIAL DOCUMENTATION (Keep)                      │
│  ────────────────────────────────────────────────   │
│  ✅ CLAUDE.md - Project documentation               │
│  ✅ PLOT.md - Project bible (session logs)          │
│  ✅ README.md - Project readme                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  TEMPORARY FILES (Sweep to archive)                  │
│  ────────────────────────────────────────────────   │
│  🧹 debug-*.js, test-*.js, check-*.js               │
│  🧹 Backup files (*.backup, *.old)                  │
│  🧹 Temporary test scripts                           │
│  🧹 One-off analysis scripts                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  COMMUNICATION FILES (Sweep to archive)              │
│  ────────────────────────────────────────────────   │
│  🧹 Step-by-step guides (not in CLAUDE.md)          │
│  🧹 Deployment checklists                            │
│  🧹 Progress reports, summaries                      │
│  🧹 Implementation guides (redundant)                │
│  🧹 Status update MD files                           │
└─────────────────────────────────────────────────────┘
```

## Why This Is Critical

### The Problem
Codebases accumulate **"garbage" files** over time:
- ❌ Debug scripts from troubleshooting sessions
- ❌ Temporary test files
- ❌ Communication MD files (guides, checklists)
- ❌ Backup files (*.old, *.backup)
- ❌ One-off analysis scripts

**Impact**:
- Confusing (what's production vs temporary?)
- Slower searches (grep finds irrelevant files)
- Deployment bloat (unnecessary files in repo)
- Context pollution (Claude reads temp files as important)

### The Solution
**Intelligent cleanup** that:
- ✅ Uses PLOT.md as source of truth
- ✅ Never deletes (always preserves in archive)
- ✅ Categorizes intelligently
- ✅ Creates restoration script
- ✅ Updates project bible
- ✅ **Protects active work** (see Concurrent Session Protection below)

## Usage

### Execute Sweep (Basic)
```bash
/sweep
```

**What happens**:
- Scans entire codebase
- Categorizes all files
- Shows sweep plan
- Moves non-essential files to `archive/swept/<timestamp>/`
- Updates PLOT.md with sweep log
- Creates restoration script

### With Custom Session ID
```bash
/sweep session_cleanup_oct_2025
```

## Concurrent Session Protection

**Problem**: Multiple Claude Code terminals running in parallel could interfere with each other if sweeper moves files being actively edited.

**Solution**: The sweeper agent has built-in concurrent session protection with **three safety layers**:

### 🔒 Safety Layer 1: Git Status Check
```
Protects: Files with uncommitted changes
Method: Runs `git status --porcelain` before sweep
Result: All modified/staged files are NEVER swept
```

**Example**:
- Terminal 1: Editing `app/dashboard/page.tsx` (uncommitted)
- Terminal 2: Runs `/sweep`
- **Result**: `app/dashboard/page.tsx` is protected and kept

### ⏱️ Safety Layer 2: Recent Modification Check (CRITICAL)
```
Protects: Files modified in last 15 minutes
Method: Checks file modification timestamp IMMEDIATELY BEFORE MOVING EACH FILE
Result: Recently touched files are NEVER swept
```

**IMPLEMENTATION REQUIREMENT**:
```javascript
// ❌ WRONG: Check once at start of sweep
const modifiedFiles = checkAllModificationTimes(); // 18:00:00
// ... 5 minutes pass ...
moveFiles(filesToSweep); // 18:05:00 - files modified at 18:04:00 will be swept!

// ✅ CORRECT: Check right before moving each file
for (const file of filesToSweep) {
  const modTime = getFileModificationTime(file); // Check NOW
  const ageInMinutes = (Date.now() - modTime) / 1000 / 60;

  if (ageInMinutes < 15) {
    console.log(`🔒 Protected: ${file} (modified ${ageInMinutes.toFixed(1)} min ago)`);
    continue; // Skip this file
  }

  moveFileToArchive(file); // Safe to move
}
```

**Example**:
- Terminal 1: Just saved `components/Header.tsx` (3 minutes ago)
- Terminal 2: Runs `/sweep`
- **Result**: `components/Header.tsx` is protected and kept

**Why 15 minutes?**
- 10 minutes was too short (agent might still be working on file)
- 15 minutes gives buffer for multi-step edits
- Safer to keep file than risk sweeping active work

### 📖 Safety Layer 3: PLOT.md Mention Check
```
Protects: Files referenced in recent PLOT.md sessions
Method: Parses PLOT.md for file mentions
Result: Files logged as "actively used" are NEVER swept
```

**Example**:
- Terminal 1: Context Preserver logged work on `agents/deploy-agent.js`
- Terminal 2: Runs `/sweep`
- **Result**: `agents/deploy-agent.js` is protected and kept

### 🛡️ Multi-Terminal Safety Guarantee

**Scenario**: 3-4 Claude Code terminals running in parallel

```
Terminal 1: Editing signup flow (app/signup/page.tsx)
Terminal 2: Debugging authentication (lib/auth.ts)
Terminal 3: Writing tests (tests/auth.spec.js)
Terminal 4: Runs /sweep to clean up old debug files

Result:
✅ Terminal 4's sweep PROTECTS all files from Terminals 1-3
✅ Only genuinely unused files (old debug scripts, communication MD) are swept
✅ Zero interference with active work
```

### Protected Files Report

During execution, sweeper shows exactly what's protected:

```
🔒 Protected Files (Active Work):
   Recently modified (15 min): 5 files
   Git uncommitted changes: 12 files
   Mentioned in PLOT.md: 8 files
```

## Execution Flow

### Phase 1: Read Project Documentation & Detect Active Work (30 sec)
```
📖 Reading project documentation...
   ✅ PLOT.md (project bible)
   ✅ CLAUDE.md (project docs)
   ✅ .gitignore (ignore patterns)

🔒 Detecting active work (concurrent sessions protection)...
   🔒 Git changes detected: 12 file(s) protected
   📖 PLOT.md analysis: 8 file reference(s) found

   ✅ Concurrent session protection: ACTIVE
   ⏱️  Files modified in last 15 minutes: WILL BE PROTECTED
```

### Phase 2: Scan Codebase (30 sec)
```
🔍 Scanning codebase recursively...
   ✅ Found 350 files

Scans all files except:
   - node_modules/
   - .git/
   - .next/
   - archive/
   - output/
```

### Phase 3: Intelligent Categorization (1 min)
```
🏷️  Categorizing 350 files...

📊 Categorization Results:
   Production Code: 180 files
   Essential Docs: 3 files
   Temporary: 25 files
   Debug/Troubleshooting: 30 files
   Communication: 40 files
   Unknown: 2 files

🔒 Protected Files (Active Work):
   Recently modified (15 min): 5 files
   Git uncommitted changes: 12 files
   Mentioned in PLOT.md: 8 files
```

**Categorization Logic**:
- Checks file path (app/, agents/, components/)
- Checks file name patterns (debug-*.js, *-GUIDE.md)
- Checks PLOT.md (file history and purpose)
- Uses AI intelligence for edge cases

### Phase 4: Sweep Plan & Review (30 sec)
```
📋 Creating sweep plan...

📊 Sweep Plan:
   To Sweep (move to archive): 95 files
   To Keep (in main codebase): 183 files
   To Review (manual decision): 2 files

🧹 Files to Sweep:
   📄 debug-signup.js
   📄 test-clerk-error.js
   📄 DEPLOYMENT-CHECKLIST.md
   📄 SETUP-GUIDE.md
   ... and 91 more
```

### Phase 5: Execute Sweep with Per-File Protection (30 sec)
```
🧹 Moving 95 files to archive...
   🔒 Protected: COMPLETE-SEQUENTIAL-GUIDE.md (modified 2.3 min ago)
   ✅ Moved 10/94 files
   🔒 Protected: debug-active.js (modified 8.1 min ago)
   ✅ Moved 20/94 files
   ...
   ✅ All files moved to: archive/swept/sweep_1234567890/
   🔒 Total protected during move: 3 files
```

**CRITICAL SAFETY CHECK**:
Before moving EACH file, the agent MUST:
1. Get current file modification time (`stat -f "%m" filename`)
2. Calculate age in minutes: `(current_time - mod_time) / 60`
3. If age < 15 minutes: SKIP file (protect it)
4. If age >= 15 minutes: Safe to move

This prevents sweeping files that other agents are actively editing.

### Phase 6: Reporting & Documentation (30 sec)
```
📝 Updating PLOT.md...
   ✅ Updated PLOT.md with sweep log

📜 Creating restoration script...
   ✅ Created restore.sh

📄 Generating sweep report...
   ✅ Sweep report: archive/swept/sweep_1234567890/sweep-report.md
```

## Output

### Archive Structure
```
archive/swept/sweep_1234567890/
├── sweep-report.md           # Detailed sweep report
├── restore.sh                # Restoration script (chmod +x)
├── debug-signup.js           # Swept file 1
├── test-clerk-error.js       # Swept file 2
├── DEPLOYMENT-CHECKLIST.md   # Swept file 3
└── ...                       # All swept files
```

### Sweep Report (sweep-report.md)
```markdown
# Sweep Report - sweep_1234567890

**Generated**: 2025-10-08T09:00:00.000Z
**Archive Location**: `archive/swept/sweep_1234567890`

---

## Summary

**Files Scanned**: 350
**Files Swept**: 95
**Files Kept**: 183
**Files to Review**: 2

---

## Swept Files

### Temporary Files (25)
- `temp-test.js`
- `backup-old.js`
...

### Debug/Troubleshooting (30)
- `debug-signup.js`
- `check-clerk-issue.js`
...

### Communication Files (40)
- `DEPLOYMENT-CHECKLIST.md`
- `SETUP-GUIDE.md`
...

---

## Restoration

To restore all swept files:
```bash
bash archive/swept/sweep_1234567890/restore.sh
```

To restore specific file:
```bash
cp archive/swept/sweep_1234567890/<file> ./<file>
```
```

### PLOT.md Update
```markdown
---

## Sweep Session - sweep_1234567890

**Date**: 2025-10-08T09:00:00.000Z
**Files Swept**: 95

### Swept Categories:
- **Temporary**: 25 files
- **Debug/Troubleshooting**: 30 files
- **Communication**: 40 files

### Archive Location:
`archive/swept/sweep_1234567890`

### Restoration:
`bash archive/swept/sweep_1234567890/restore.sh`

See full report: `archive/swept/sweep_1234567890/sweep-report.md`
```

## Safety Features

### 1. Concurrent Session Protection
```
✅ Protects files with git changes (uncommitted/staged)
✅ Protects recently modified files (last 15 minutes - checked per-file before move)
✅ Protects files mentioned in PLOT.md sessions
✅ Safe to run while other terminals are active
✅ Zero interference with parallel work
```

### 2. NEVER Deletes
```
❌ Files are NEVER deleted
✅ Files are moved to timestamped archive
✅ Original directory structure preserved
✅ Easy restoration anytime
```

### 3. Restoration Script
```
✅ Auto-generated restore.sh script
✅ One command to restore all files
✅ Can restore individual files
```

### 4. Protected Files
```
🔒 NEVER touches:
   - package.json
   - tsconfig.json
   - .env (and variants)
   - vercel.json
   - CLAUDE.md
   - PLOT.md
   - app/
   - components/
   - agents/
   - .claude/
   - tests/
   - data/
```

## When to Use

### Ideal Times
- ✅ **After major feature**: Clean up debug scripts
- ✅ **Weekly maintenance**: Keep codebase tidy
- ✅ **Before deployment**: Remove clutter
- ✅ **Repository cleanup**: Organize before sharing
- ✅ **Onboarding prep**: Clear temporary files

### Not Needed When
- ❌ Fresh project (< 50 files)
- ❌ Active debugging (keep debug scripts)
- ❌ Mid-feature development (wait until complete)

## Common Workflows

### Workflow 1: Regular Maintenance
```bash
# Every 1-2 weeks
/sweep                    # Execute sweep
```

### Workflow 2: Pre-Deployment Cleanup
```bash
# Before deploying to production
/sweep                    # Clean codebase
/deploy                   # Deploy with clean code
```

### Workflow 3: Restore Accidentally Swept File
```bash
# Oops, swept something important
ls archive/swept/         # Find session
cp archive/swept/sweep_*/path/to/file ./path/to/file
```

## Troubleshooting

### Accidentally Swept Important File
**Solution**: Restore from archive
```bash
# Find the sweep session
ls -la archive/swept/

# Restore all files
bash archive/swept/sweep_1234567890/restore.sh

# OR restore specific file
cp archive/swept/sweep_1234567890/important-file.js ./
```

### Unknown Files Category
**Solution**: Manually categorize in PLOT.md
```bash
# Edit PLOT.md
# Add entry: "file-name.js - Purpose: Production code for X"
# Re-run sweep
/sweep execute
```

### Too Many Files Swept
**Solution**: Restore from archive and update PLOT.md
```bash
# Restore swept files
bash archive/swept/sweep_*/restore.sh

# Update PLOT.md with file purposes
# Add entry: "file-name.js - Purpose: Production code for X"
# Re-run sweep
/sweep
```

### Sweep Took Too Long
**Note**: This is normal for large codebases
```
350 files: ~2 minutes
1000 files: ~5 minutes
5000 files: ~10 minutes

The agent scans EVERY file to categorize intelligently.
```

### Swept File That Was Being Edited
**Problem**: Another agent was working on a file, but sweep moved it to archive

**Root Cause**: Agent didn't check file modification time immediately before moving

**Solution**:
1. Restore the file immediately:
   ```bash
   cp archive/swept/sweep_*/FILENAME ./FILENAME
   ```

2. Update sweep implementation to check modification time per-file:
   ```bash
   # Before moving each file:
   FILE_AGE=$(( ($(date +%s) - $(stat -f "%m" "$file")) / 60 ))
   if [ $FILE_AGE -lt 15 ]; then
     echo "🔒 Protected: $file (modified ${FILE_AGE} min ago)"
     continue
   fi
   ```

3. Increase protection window from 10 to 15 minutes (done in this update)

**Prevention**: Future sweeps will check modification time RIGHT BEFORE moving each file, not just at start

## Best Practices

1. **Document important files**: Add to PLOT.md so agent understands file purposes
2. **Run weekly**: Keep codebase consistently clean
3. **Check archive**: Review swept files in archive before deleting archive folder
4. **Restore if needed**: Use restoration script if accidentally swept important files
5. **Update PLOT.md**: Log file purposes and decisions to help future sweeps

## Integration with Other Agents

### Context Preserver + Sweeper
```bash
# Context Preserver logs to PLOT.md
/context-preserver

# Sweeper reads PLOT.md to understand file purposes
/sweep
```

### Deploy + Sweeper
```bash
# Clean codebase before deployment
/sweep

# Deploy with clean code
/deploy
```

## PLOT.md - The Project Bible

**What is PLOT.md?**
- Continuously updated project chronicle
- Session logs from Context Preserver
- Sweep logs from Sweeper Agent
- File purposes and decisions
- Source of truth for both agents

**How Sweeper Uses PLOT.md**:
1. Reads file history
2. Understands file purposes
3. Makes intelligent categorization decisions
4. Avoids sweeping actively used files

**Example PLOT.md Entry**:
```markdown
## Session - context_1234567890
**Files Modified**:
- `scripts/custom-deploy.js` - Deployment script for Vercel

**Purpose**: Production deployment automation
**Keep**: Yes (actively used)
```

When Sweeper sees this, it knows `custom-deploy.js` is production code, not debug.

---

**Created**: 2025-10-08
**Author**: Sweeper Agent System
**Version**: 1.0.0
**Status**: Production Ready ✅
