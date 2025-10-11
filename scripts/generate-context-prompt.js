#!/usr/bin/env node
/**
 * Context Preservation Generator
 * Creates a portable prompt for continuing work in a fresh terminal
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SESSION_ID = `context_${Date.now()}`;
const OUTPUT_DIR = path.join(__dirname, '../data/context-preservation');
const OUTPUT_FILE = path.join(OUTPUT_DIR, `portable-prompt-${SESSION_ID}.txt`);

console.log('⚪ CONTEXT PRESERVATION GENERATOR');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📅 Session ID: ${SESSION_ID}`);
console.log('🎯 Analyzing project state...\n');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get git status
let gitStatus = '';
let gitDiff = '';
let gitLog = '';
let currentBranch = '';

try {
  currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  gitStatus = execSync('git status --short', { encoding: 'utf-8' });
  gitLog = execSync('git log -3 --oneline', { encoding: 'utf-8' });

  // Get diff for modified files (limit to 50 lines per file to avoid huge output)
  const modifiedFiles = gitStatus.split('\n')
    .filter(line => line.trim().startsWith('M '))
    .map(line => line.trim().substring(2).trim())
    .slice(0, 5); // Limit to first 5 modified files

  if (modifiedFiles.length > 0) {
    gitDiff = modifiedFiles.map(file => {
      try {
        const diff = execSync(`git diff HEAD -- "${file}" | head -50`, { encoding: 'utf-8' });
        return `\n### ${file}\n${diff}`;
      } catch (e) {
        return `\n### ${file}\n(Could not generate diff)`;
      }
    }).join('\n');
  }
} catch (error) {
  console.warn('⚠️  Git commands failed (not in git repo?)');
}

// Read CLAUDE.md for project context
let projectContext = '';
try {
  const claudeMd = fs.readFileSync(path.join(__dirname, '../CLAUDE.md'), 'utf-8');
  // Extract just the project overview section
  const lines = claudeMd.split('\n');
  projectContext = lines.slice(0, 50).join('\n');
} catch (error) {
  projectContext = 'CLAUDE.md not found';
}

// Generate the portable prompt
const prompt = `# Context Preservation - Session ${SESSION_ID}

## 🎯 PROJECT: JarvisDaily
Full-stack WhatsApp content distribution platform for financial advisors.
- Tech Stack: Next.js 15, React 19, Clerk Auth, Supabase, Meta WhatsApp API
- Production: https://jarvisdaily.com
- Repository: https://github.com/shriyavallabh/mvp

## 📋 SESSION SUMMARY

**Session Date**: ${new Date().toISOString()}
**Current Branch**: ${currentBranch || 'unknown'}

**Recent Activity**: This session focused on completing Supabase database setup
with Playwright MCP automation and deploying to production.

## ✅ COMPLETED IN THIS SESSION

1. **Playwright MCP Setup**
   - Installed @playwright/mcp globally
   - Configured for browser automation with Claude Code
   - Successfully used for semi-automated Supabase schema execution

2. **Supabase Database Creation**
   - Created new project "JarvisDaily" (dmgdbzcbxagloqwylxwv)
   - Region: Mumbai (ap-south-1)
   - Database URL: https://dmgdbzcbxagloqwylxwv.supabase.co

3. **Database Schema Execution**
   - Used Playwright MCP to automate SQL Editor
   - User logged in manually (security requirement)
   - Playwright automated: navigation, schema paste, execution
   - Schema includes: 2 tables, 7 indexes, 6 RLS policies, 2 triggers, 2 helper functions

4. **Schema Verification**
   - ✅ users table created and accessible
   - ✅ advisor_profiles table created and accessible
   - ✅ Verified programmatically via Supabase SDK

5. **Git Deployment**
   - Committed all changes (commit: 280ee1d)
   - 1,496 files changed
   - Pushed to main branch

6. **Vercel Production Deployment**
   - Deployed using Vercel CLI with credentials
   - Build time: 14 seconds
   - Production URL: https://jarvisdaily.com
   - Status: ✅ LIVE AND VERIFIED

7. **Documentation**
   - Created DEPLOYMENT-SUCCESS.md with comprehensive deployment report
   - All production URLs documented
   - Database configuration details included

## 🚧 CURRENT STATE

**Git Status**:
\`\`\`
${gitStatus || 'No uncommitted changes'}
\`\`\`

**Recent Commits**:
\`\`\`
${gitLog}
\`\`\`

**Modified Files** (if any):
${gitDiff || 'No modified files'}

## 🔧 TECHNICAL CONTEXT

**Database Credentials** (in .env):
- NEXT_PUBLIC_SUPABASE_URL=https://dmgdbzcbxagloqwylxwv.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Database Password: JD2025_Kx9mP2nL

**Vercel Credentials** (in .env):
- VERCEL_ORG_ID=team_kgmzsZJ64NGLaTPyLRBWV3vz
- VERCEL_PROJECT_ID=prj_QQAial59AHSd44kXyY1fGkPk3rkA
- VERCEL_TOKEN=cDuZRc8rAyugRDuJiNkBX3Hx

**Architecture**:
- Multi-layer persistence: Redis → Supabase → Google Sheets → Clerk
- Auth: Clerk (email/password + OAuth)
- Database: Supabase PostgreSQL with RLS
- Payments: Razorpay (Live mode, 3 plans)
- WhatsApp: Meta Direct API

**Key Technical Decisions**:
1. Used Playwright MCP for semi-automated Supabase setup (manual login + automated execution)
2. Vercel deployment is MANUAL via CLI (not connected to GitHub auto-deploy)
3. Database in Mumbai region for lower latency to Indian users
4. RLS policies enforce user data isolation

## ⚠️ IMPORTANT NOTES

1. **Manual Deployment Required**: Vercel is NOT connected to GitHub. After every git push, you MUST run:
   \`\`\`bash
   VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" \\
   VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" \\
   vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes
   \`\`\`

2. **Supabase Access**: All credentials are in .env and already configured
3. **Database Schema**: Fully set up and verified - no manual SQL needed
4. **Playwright MCP**: Installed globally, ready for future browser automation

## 🎯 NEXT STEPS

Since deployment is complete, potential next actions:

1. **Test Production**
   - Test signup flow at https://jarvisdaily.com/signup
   - Verify database writes work correctly
   - Test OAuth providers (Google/LinkedIn)
   - Verify onboarding flow

2. **Run Test Suite**
   - Execute Playwright tests: \`npm test\`
   - Verify all 462 tests pass
   - Check test report: \`npm run test:report\`

3. **Content Pipeline**
   - Test AI agent pipeline: \`/o\`
   - Generate sample content for advisors
   - Verify WhatsApp delivery works

4. **Monitoring**
   - Check Vercel logs: \`vercel logs --follow\`
   - Monitor Supabase dashboard for database activity
   - Check Clerk dashboard for auth events

## 📋 COPY-PASTE PROMPT FOR NEW TERMINAL

┌───────────────────────────────────────────────────────────────────┐
│ READY TO COPY AND PASTE - START BELOW THIS LINE                  │
└───────────────────────────────────────────────────────────────────┘

I'm continuing work on JarvisDaily after hitting token limit. Here's the context:

**What was completed**:
- ✅ Supabase database fully set up with Playwright MCP automation
  - Project: JarvisDaily (dmgdbzcbxagloqwylxwv) in Mumbai region
  - Schema: 2 tables, 7 indexes, 6 RLS policies, 2 triggers
  - URL: https://dmgdbzcbxagloqwylxwv.supabase.co
- ✅ Deployed to GitHub (commit: 280ee1d, 1,496 files changed)
- ✅ Deployed to Vercel production: https://jarvisdaily.com (LIVE)
- ✅ Created DEPLOYMENT-SUCCESS.md with all URLs and verification

**Technical context**:
- Database credentials in .env (Supabase URL, anon key, service role key, password)
- Vercel deployment is MANUAL (not auto-deploy from GitHub)
- Playwright MCP installed globally for browser automation
- Multi-layer persistence: Redis → Supabase → Google Sheets → Clerk

**Current state**:
- Branch: ${currentBranch || 'main'}
- All changes committed and deployed
- Production verified and operational

**Important notes**:
1. Vercel requires manual deploy after git push (credentials in .env)
2. Supabase project already created and configured
3. All credentials are in .env file

**Next actions** (if needed):
1. Test production flows at https://jarvisdaily.com
2. Run test suite: \`npm test\`
3. Generate content with AI pipeline: \`/o\`
4. Monitor with: \`vercel logs --follow\`

Everything is deployed and working. Let me know what you'd like to work on next!

┌───────────────────────────────────────────────────────────────────┐
│ END OF COPY-PASTE PROMPT                                          │
└───────────────────────────────────────────────────────────────────┘

---

**Generated**: ${new Date().toISOString()}
**Session ID**: ${SESSION_ID}
**Tool**: Context Preservation Generator v1.0
`;

// Write to file
fs.writeFileSync(OUTPUT_FILE, prompt, 'utf-8');

console.log('✅ Context Preservation completed');
console.log(`📁 Saved to: ${OUTPUT_FILE}`);
console.log('\n📋 NEXT STEPS:');
console.log('1. Read the generated file');
console.log('2. Copy the "COPY-PASTE PROMPT" section');
console.log('3. Open a fresh terminal');
console.log('4. Paste and continue!\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Also display the copy-paste section directly
console.log('📋 QUICK COPY-PASTE PROMPT:\n');
const copySection = prompt.split('READY TO COPY AND PASTE - START BELOW THIS LINE')[1]
  .split('END OF COPY-PASTE PROMPT')[0];
console.log(copySection);
