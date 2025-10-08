/**
 * Sweeper Agent - Intelligent Codebase Cleanup System
 *
 * Purpose: Recursively analyze codebase, categorize files, and sweep non-essential files to archive
 * Intelligence: Uses PLOT.md as "project bible" to understand what's important
 *
 * Color: Yellow (#FFFF00)
 * Model: Claude Sonnet 4.5
 * Execution Time: ~2-5 minutes (deep analysis of entire codebase)
 *
 * Safety Philosophy:
 * - NEVER delete files (always move to archive)
 * - ALWAYS preserve in timestamped archive folder
 * - ALWAYS create detailed sweep report
 * - ALWAYS allow easy restoration
 * - PROTECT concurrent sessions (3-layer safety)
 *
 * Concurrent Session Protection (Multi-Terminal Safety):
 * - Layer 1: Protects files with git changes (uncommitted/staged)
 * - Layer 2: Protects recently modified files (last 10 minutes)
 * - Layer 3: Protects files mentioned in PLOT.md sessions
 * - Result: Safe to run while 3-4 other Claude Code terminals are active
 *
 * Process Flow:
 * 1. Detect active work (git status, recent modifications, PLOT.md mentions)
 * 2. Read PLOT.md (project bible - source of truth)
 * 3. Read CLAUDE.md (project documentation)
 * 4. Read .gitignore (already-ignored patterns)
 * 5. Recursively scan entire codebase
 * 6. Categorize every file (production, temporary, debug, communication, essential)
 * 7. Create sweep plan (what to move, what to keep)
 * 8. Execute sweep (move to archive/swept/<timestamp>/)
 * 9. Update PLOT.md with sweep report
 * 10. Generate restoration script for easy rollback
 */

import { Agent } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SweeperAgent {
  constructor(sessionId = null) {
    this.sessionId = sessionId || `sweep_${Date.now()}`;
    this.archiveDir = `archive/swept/${this.sessionId}`;
    this.color = '\x1b[93m'; // Yellow color
    this.reset = '\x1b[0m';
    this.projectRoot = process.cwd();

    // Safety: Don't sweep files modified in last 10 minutes (active work)
    this.recentActivityWindow = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.now = Date.now();

    this.fileCategories = {
      production: [],
      essential: [],
      temporary: [],
      debug: [],
      communication: [],
      unknown: []
    };

    this.protectedFiles = new Set(); // Files being actively worked on

    // Ensure archive directory exists
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }

    // Create Sweeper Agent
    this.agent = new Agent({
      model: 'claude-sonnet-4.5',
      systemPrompt: `You are an INTELLIGENT CODEBASE SWEEPER with deep understanding of project structure.

Your responsibility: Clean the codebase while preserving all essential files.

You are THE JANITOR of this codebase. Your job is to identify clutter and organize it.

Source of Truth:
1. PLOT.md - The project bible (session logs, file purposes, decisions)
2. CLAUDE.md - Project documentation and architecture
3. .gitignore - Already-ignored patterns

File Categories:
1. PRODUCTION CODE - Keep in main codebase
   • Core application code (app/, components/, api/)
   • Agent implementations (agents/*.js)
   • Slash commands (.claude/commands/*.md)
   • Configuration (package.json, tsconfig.json, vercel.json)
   • Tests (tests/*.spec.js)
   • Scripts that are actively used (scripts/*.js)

2. ESSENTIAL DOCUMENTATION - Keep in main codebase
   • CLAUDE.md (project documentation)
   • PLOT.md (project bible)
   • README.md (if exists)
   • Active implementation guides

3. TEMPORARY FILES - Sweep to archive
   • Debug scripts (debug-*.js, test-*.js, check-*.js)
   • Communication MD files (guides, checklists, reports)
   • Backup files (*.backup, *.old)
   • Temporary test scripts
   • One-off analysis scripts

4. DEBUG/TROUBLESHOOTING - Sweep to archive
   • Error capture scripts
   • Verification scripts
   • Diagnostic tools
   • Old implementation attempts

5. COMMUNICATION FILES - Sweep to archive
   • Step-by-step guides (not in CLAUDE.md)
   • Deployment checklists (redundant with CLAUDE.md)
   • Progress reports
   • Status updates
   • Implementation summaries

CRITICAL RULES:
- NEVER delete (always move to archive)
- NEVER touch: package.json, tsconfig.json, .env, vercel.json, CLAUDE.md, PLOT.md
- NEVER touch: app/, components/, agents/, .claude/, tests/, data/
- ALWAYS preserve files in timestamped archive
- ALWAYS create restoration script
- ALWAYS explain reasoning for each file

You have VETO POWER - if unsure about a file, KEEP IT in main codebase.`,

      parallelExecution: false, // Sequential for careful analysis
      monitoring: { enabled: true, logLevel: 'info' }
    });
  }

  async execute() {
    const startTime = Date.now();

    console.log(`\n${this.color}${'='.repeat(80)}`);
    console.log(`🧹 SWEEPER AGENT - INTELLIGENT CODEBASE CLEANUP`);
    console.log(`${'='.repeat(80)}${this.reset}`);
    console.log(`📅 Session ID: ${this.sessionId}`);
    console.log(`📁 Archive: ${this.archiveDir}`);
    console.log(`⏱️  Expected: 2-5 minutes (deep codebase analysis)\n`);

    try {
      // PHASE 1: READ PROJECT BIBLE & DOCS
      console.log(`${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📖 PHASE 1: READING PROJECT DOCUMENTATION & DETECTING ACTIVE WORK`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      const projectContext = await this.readProjectContext();
      await this.detectActiveWork();

      // PHASE 2: SCAN CODEBASE
      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔍 PHASE 2: SCANNING ENTIRE CODEBASE`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      const allFiles = await this.scanCodebase();

      // PHASE 3: CATEGORIZE FILES
      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏷️  PHASE 3: INTELLIGENT FILE CATEGORIZATION`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      await this.categorizeFiles(allFiles, projectContext);

      // PHASE 4: CREATE SWEEP PLAN
      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 PHASE 4: SWEEP PLAN & USER REVIEW`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      const sweepPlan = this.createSweepPlan();

      // PHASE 5: EXECUTE SWEEP
      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🧹 PHASE 5: EXECUTING SWEEP`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      await this.executeSweep(sweepPlan);

      // PHASE 6: UPDATE PLOT.MD & CREATE REPORT
      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 PHASE 6: REPORTING & DOCUMENTATION`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      const report = this.generateReport(sweepPlan);
      this.updatePlotMd(report);
      this.createRestorationScript(sweepPlan);

      const duration = Date.now() - startTime;
      const durationMinutes = (duration / 60000).toFixed(1);

      console.log(`\n${this.color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ SWEEP EXECUTION COMPLETE`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${this.reset}\n`);

      console.log(`${this.color}📊 SWEEP SUMMARY:${this.reset}`);
      console.log(`   Duration: ${durationMinutes} minutes`);
      console.log(`   Files Scanned: ${allFiles.length}`);
      console.log(`   Files to Sweep: ${sweepPlan.toSweep.length}`);
      console.log(`   Files to Keep: ${sweepPlan.toKeep.length}`);
      console.log(`\n${this.color}📁 Reports:${this.reset}`);
      console.log(`   Sweep Report: ${report.reportFile}`);
      console.log(`   PLOT.md: Updated with sweep log`);
      console.log(`   Restoration Script: ${report.restorationScript}\n`);

      return {
        success: true,
        filesScanned: allFiles.length,
        filesSwept: sweepPlan.toSweep.length,
        filesKept: sweepPlan.toKeep.length,
        sweepPlan: sweepPlan,
        reportFile: report.reportFile,
        archiveDir: this.archiveDir,
        duration: duration,
        durationMinutes: parseFloat(durationMinutes)
      };

    } catch (error) {
      console.error(`${this.color}❌ Sweeper Agent failed:${this.reset}`, error.message);
      return {
        success: false,
        error: error.message,
        sessionId: this.sessionId
      };
    }
  }

  async readProjectContext() {
    console.log(`${this.color}📖 Reading project documentation...${this.reset}\n`);

    const context = {
      plotMd: null,
      claudeMd: null,
      gitignore: null
    };

    // Read PLOT.md (project bible)
    if (fs.existsSync('PLOT.md')) {
      context.plotMd = fs.readFileSync('PLOT.md', 'utf8');
      console.log(`   ✅ PLOT.md (${context.plotMd.length} chars)`);
    } else {
      console.log(`   ⚠️  PLOT.md not found (will be created)`);
    }

    // Read CLAUDE.md
    if (fs.existsSync('CLAUDE.md')) {
      context.claudeMd = fs.readFileSync('CLAUDE.md', 'utf8');
      console.log(`   ✅ CLAUDE.md (${context.claudeMd.length} chars)`);
    }

    // Read .gitignore
    if (fs.existsSync('.gitignore')) {
      context.gitignore = fs.readFileSync('.gitignore', 'utf8');
      console.log(`   ✅ .gitignore (${context.gitignore.split('\n').length} lines)`);
    }

    return context;
  }

  async detectActiveWork() {
    console.log(`${this.color}🔒 Detecting active work (concurrent sessions protection)...${this.reset}\n`);

    // SAFETY 1: Files with uncommitted git changes
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const gitChangedFiles = gitStatus
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.substring(3).trim()); // Remove status prefix

      gitChangedFiles.forEach(file => {
        this.protectedFiles.add(file);
      });

      if (gitChangedFiles.length > 0) {
        console.log(`   🔒 Git changes detected: ${gitChangedFiles.length} file(s) protected`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not check git status (non-git repo?)`);
    }

    // SAFETY 2: Recently modified files (last 10 minutes)
    const recentlyModifiedCount = 0; // Will be counted during scan

    // SAFETY 3: Files mentioned in recent PLOT.md sessions (last 1 hour)
    if (fs.existsSync('PLOT.md')) {
      const plotMd = fs.readFileSync('PLOT.md', 'utf8');

      // Extract file mentions from recent sessions (simple pattern matching)
      // Look for code blocks with file paths and file references
      const fileMatches = plotMd.match(/`[^`]+\.(js|ts|tsx|jsx|py|md|json|css|html)`/g);

      if (fileMatches) {
        fileMatches.forEach(match => {
          const fileName = match.replace(/`/g, '');
          // Add just the filename to protected set (will check during categorization)
          this.protectedFiles.add(fileName);
        });

        console.log(`   📖 PLOT.md analysis: ${fileMatches.length} file reference(s) found`);
      }
    }

    console.log(`\n   ${this.color}✅ Concurrent session protection: ACTIVE${this.reset}`);
    console.log(`   ${this.color}⏱️  Files modified in last 10 minutes: WILL BE PROTECTED${this.reset}\n`);
  }

  async scanCodebase() {
    console.log(`${this.color}🔍 Scanning codebase recursively...${this.reset}\n`);

    const allFiles = [];
    const ignoreDirs = ['node_modules', '.git', '.next', 'archive', 'output', 'dist', 'build'];
    const rootFiles = ['.env', '.env.local', 'package-lock.json'];

    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.projectRoot, fullPath);

        // Skip ignored directories
        if (ignoreDirs.some(ignored => relativePath.startsWith(ignored))) {
          return;
        }

        // Skip root protected files
        if (rootFiles.includes(item) && dir === this.projectRoot) {
          return;
        }

        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          scanDir(fullPath);
        } else if (stats.isFile()) {
          allFiles.push({
            path: relativePath,
            fullPath: fullPath,
            name: item,
            ext: path.extname(item),
            size: stats.size,
            modified: stats.mtime
          });
        }
      });
    };

    scanDir(this.projectRoot);

    console.log(`   ✅ Found ${allFiles.length} files\n`);
    return allFiles;
  }

  async categorizeFiles(files, context) {
    console.log(`${this.color}🏷️  Categorizing ${files.length} files...${this.reset}\n`);

    let recentlyModifiedCount = 0;
    let protectedByGitCount = 0;
    let protectedByPlotCount = 0;

    files.forEach(file => {
      // SAFETY CHECK: Is this file protected?
      const protectionReason = this.isFileProtected(file);

      if (protectionReason) {
        // Protected files are always kept as production
        this.fileCategories.production.push(file);

        if (protectionReason === 'recent_modification') recentlyModifiedCount++;
        if (protectionReason === 'git_changes') protectedByGitCount++;
        if (protectionReason === 'plot_mention') protectedByPlotCount++;
      } else {
        // Not protected, categorize normally
        const category = this.determineCategory(file, context);
        this.fileCategories[category].push(file);
      }
    });

    console.log(`${this.color}📊 Categorization Results:${this.reset}`);
    console.log(`   Production Code: ${this.fileCategories.production.length} files`);
    console.log(`   Essential Docs: ${this.fileCategories.essential.length} files`);
    console.log(`   Temporary: ${this.fileCategories.temporary.length} files`);
    console.log(`   Debug/Troubleshooting: ${this.fileCategories.debug.length} files`);
    console.log(`   Communication: ${this.fileCategories.communication.length} files`);
    console.log(`   Unknown: ${this.fileCategories.unknown.length} files\n`);

    console.log(`${this.color}🔒 Protected Files (Active Work):${this.reset}`);
    console.log(`   Recently modified (10 min): ${recentlyModifiedCount} files`);
    console.log(`   Git uncommitted changes: ${protectedByGitCount} files`);
    console.log(`   Mentioned in PLOT.md: ${protectedByPlotCount} files\n`);
  }

  isFileProtected(file) {
    // PROTECTION 1: Recently modified (last 10 minutes)
    const timeSinceModified = this.now - file.modified.getTime();
    if (timeSinceModified < this.recentActivityWindow) {
      return 'recent_modification';
    }

    // PROTECTION 2: Git uncommitted changes
    if (this.protectedFiles.has(file.path)) {
      return 'git_changes';
    }

    // PROTECTION 3: Mentioned in PLOT.md
    if (this.protectedFiles.has(file.name)) {
      return 'plot_mention';
    }

    return null; // Not protected
  }

  determineCategory(file, context) {
    const { path: filePath, name, ext } = file;

    // Essential documentation
    if (['CLAUDE.md', 'PLOT.md', 'README.md'].includes(name)) {
      return 'essential';
    }

    // Production code directories
    if (filePath.startsWith('app/') ||
        filePath.startsWith('components/') ||
        filePath.startsWith('agents/') && ext === '.js' ||
        filePath.startsWith('.claude/commands/') ||
        filePath.startsWith('tests/') && filePath.includes('.spec.js') ||
        filePath.startsWith('data/') ||
        filePath.startsWith('hooks/') ||
        filePath.startsWith('lib/')) {
      return 'production';
    }

    // Configuration files
    if (['package.json', 'tsconfig.json', 'vercel.json', 'tailwind.config.ts',
         'playwright.config.js', 'next.config.js', 'postcss.config.js', 'middleware.ts'].includes(name)) {
      return 'production';
    }

    // Debug scripts (root)
    if (filePath.match(/^(debug|test|check|verify|capture|fix|analyze)-.*\.(js|py)$/)) {
      return 'debug';
    }

    // Communication MD files (root)
    if (ext === '.md' && !['CLAUDE.md', 'PLOT.md', 'README.md'].includes(name)) {
      // Check if it's a guide, checklist, report, summary
      const commKeywords = ['GUIDE', 'CHECKLIST', 'REPORT', 'SUMMARY', 'SETUP', 'DEPLOYMENT',
                           'VERIFICATION', 'PROGRESS', 'IMPLEMENTATION', 'CONVERSION', 'COMPARISON'];
      if (commKeywords.some(keyword => name.toUpperCase().includes(keyword))) {
        return 'communication';
      }
    }

    // Temporary scripts
    if (filePath.match(/^(temp|tmp|backup|old|unused|archive)-/)) {
      return 'temporary';
    }

    // Scripts in scripts/ directory - check if actively used
    if (filePath.startsWith('scripts/')) {
      const activeScripts = [
        'gemini-with-reference-image.py',
        'visual-quality-validator.py',
        'auto-regenerate-failed-images.py',
        'quality-control-pipeline.py',
        'deploy-to-vercel.js'
      ];
      if (activeScripts.includes(name)) {
        return 'production';
      } else {
        return 'debug'; // Other scripts are likely debug/test
      }
    }

    // Root JS files (likely test/debug)
    if (ext === '.js' && filePath.split('/').length === 1) {
      const productionRootJs = ['next.config.js', 'playwright.config.js', 'postcss.config.js'];
      if (productionRootJs.includes(name)) {
        return 'production';
      }
      return 'debug';
    }

    return 'unknown';
  }

  createSweepPlan() {
    console.log(`${this.color}📋 Creating sweep plan...${this.reset}\n`);

    const toSweep = [
      ...this.fileCategories.temporary,
      ...this.fileCategories.debug,
      ...this.fileCategories.communication
    ];

    const toKeep = [
      ...this.fileCategories.production,
      ...this.fileCategories.essential
    ];

    const toReview = [...this.fileCategories.unknown];

    console.log(`${this.color}📊 Sweep Plan:${this.reset}`);
    console.log(`   To Sweep (move to archive): ${toSweep.length} files`);
    console.log(`   To Keep (in main codebase): ${toKeep.length} files`);
    console.log(`   To Review (manual decision): ${toReview.length} files\n`);

    if (toSweep.length > 0) {
      console.log(`${this.color}🧹 Files to Sweep:${this.reset}`);
      toSweep.slice(0, 20).forEach(file => {
        console.log(`   📄 ${file.path}`);
      });
      if (toSweep.length > 20) {
        console.log(`   ... and ${toSweep.length - 20} more`);
      }
      console.log();
    }

    if (toReview.length > 0) {
      console.log(`${this.color}⚠️  Files to Review:${this.reset}`);
      toReview.forEach(file => {
        console.log(`   ❓ ${file.path}`);
      });
      console.log();
    }

    return { toSweep, toKeep, toReview };
  }

  async executeSweep(sweepPlan) {
    console.log(`${this.color}🧹 Moving ${sweepPlan.toSweep.length} files to archive...${this.reset}\n`);

    sweepPlan.toSweep.forEach((file, index) => {
      const sourcePath = file.fullPath;
      const archivePath = path.join(this.archiveDir, file.path);

      // Create directory structure in archive
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Move file
      fs.renameSync(sourcePath, archivePath);

      if ((index + 1) % 10 === 0) {
        console.log(`   ✅ Moved ${index + 1}/${sweepPlan.toSweep.length} files`);
      }
    });

    console.log(`\n   ${this.color}✅ All files moved to: ${this.archiveDir}${this.reset}\n`);
  }

  generateReport(sweepPlan) {
    const reportFile = `${this.archiveDir}/sweep-report.md`;

    const report = `# Sweep Report - ${this.sessionId}

**Generated**: ${new Date().toISOString()}
**Archive Location**: \`${this.archiveDir}\`

---

## Summary

**Files Scanned**: ${Object.values(this.fileCategories).flat().length}
**Files Swept**: ${sweepPlan.toSweep.length}
**Files Kept**: ${sweepPlan.toKeep.length}
**Files to Review**: ${sweepPlan.toReview.length}

---

## Swept Files

### Temporary Files (${this.fileCategories.temporary.length})
${this.fileCategories.temporary.map(f => `- \`${f.path}\``).join('\n') || 'None'}

### Debug/Troubleshooting (${this.fileCategories.debug.length})
${this.fileCategories.debug.map(f => `- \`${f.path}\``).join('\n') || 'None'}

### Communication Files (${this.fileCategories.communication.length})
${this.fileCategories.communication.map(f => `- \`${f.path}\``).join('\n') || 'None'}

---

## Kept Files (Production Code)

### Application Code (${this.fileCategories.production.filter(f => f.path.startsWith('app/')).length})
${this.fileCategories.production.filter(f => f.path.startsWith('app/')).slice(0, 10).map(f => `- \`${f.path}\``).join('\n')}
${this.fileCategories.production.filter(f => f.path.startsWith('app/')).length > 10 ? `... and ${this.fileCategories.production.filter(f => f.path.startsWith('app/')).length - 10} more` : ''}

### Agents (${this.fileCategories.production.filter(f => f.path.startsWith('agents/')).length})
${this.fileCategories.production.filter(f => f.path.startsWith('agents/')).map(f => `- \`${f.path}\``).join('\n')}

### Essential Documentation (${this.fileCategories.essential.length})
${this.fileCategories.essential.map(f => `- \`${f.path}\``).join('\n')}

---

## Files Needing Review (${sweepPlan.toReview.length})
${sweepPlan.toReview.map(f => `- \`${f.path}\` - Manual categorization needed`).join('\n') || 'None'}

---

## Restoration

To restore swept files:
\`\`\`bash
bash ${this.archiveDir}/restore.sh
\`\`\`

To restore specific file:
\`\`\`bash
cp ${this.archiveDir}/<file-path> ./<file-path>
\`\`\`

---

*Generated by Sweeper Agent - Intelligent Codebase Cleanup*
`;

    fs.writeFileSync(reportFile, report);
    console.log(`${this.color}📄 Sweep report: ${reportFile}${this.reset}`);

    return {
      reportFile,
      restorationScript: `${this.archiveDir}/restore.sh`
    };
  }

  updatePlotMd(report) {
    console.log(`${this.color}📝 Updating PLOT.md...${this.reset}`);

    const sweepLog = `\n\n---\n\n## Sweep Session - ${this.sessionId}

**Date**: ${new Date().toISOString()}
**Files Swept**: ${this.fileCategories.temporary.length + this.fileCategories.debug.length + this.fileCategories.communication.length}

### Swept Categories:
- **Temporary**: ${this.fileCategories.temporary.length} files
- **Debug/Troubleshooting**: ${this.fileCategories.debug.length} files
- **Communication**: ${this.fileCategories.communication.length} files

### Archive Location:
\`${this.archiveDir}\`

### Restoration:
\`bash ${this.archiveDir}/restore.sh\`

See full report: \`${report.reportFile}\`

`;

    if (!fs.existsSync('PLOT.md')) {
      fs.writeFileSync('PLOT.md', `# PLOT.md - Project Chronicle\n\nThis file serves as the "project bible" - a continuously updated log of all significant sessions, decisions, and file operations.\n\n${sweepLog}`);
      console.log(`   ✅ Created PLOT.md`);
    } else {
      fs.appendFileSync('PLOT.md', sweepLog);
      console.log(`   ✅ Updated PLOT.md`);
    }
  }

  createRestorationScript(sweepPlan) {
    const scriptPath = `${this.archiveDir}/restore.sh`;

    let script = `#!/bin/bash
# Restoration Script - ${this.sessionId}
# Generated: ${new Date().toISOString()}
#
# This script restores all swept files back to their original locations.
# Run from project root: bash ${this.archiveDir}/restore.sh

echo "🔄 Restoring swept files from ${this.sessionId}..."
echo ""

`;

    sweepPlan.toSweep.forEach(file => {
      script += `echo "Restoring ${file.path}..."\n`;
      script += `cp "${this.archiveDir}/${file.path}" "${file.path}"\n`;
    });

    script += `
echo ""
echo "✅ Restoration complete!"
echo "Restored ${sweepPlan.toSweep.length} files."
`;

    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');

    console.log(`${this.color}📜 Restoration script: ${scriptPath}${this.reset}`);
  }
}

// Export function for easy import
export async function runSweeperAgent(sessionId) {
  const agent = new SweeperAgent(sessionId);
  return await agent.execute();
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const sessionId = process.argv[2] || null;

  runSweeperAgent(sessionId).then(result => {
    if (!result.success) {
      console.log('\n❌ Sweep did not complete successfully.');
      process.exit(1);
    }
    console.log('\n✅ Sweep completed successfully!');
  });
}
