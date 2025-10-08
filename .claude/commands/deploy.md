---
description: Comprehensive testing, QA sign-off, and automated production deployment
---

# Production Deploy Agent - Dual-Role Quality Gate System

**Color**: 🟢 Green
**Model**: Claude Sonnet 4.5
**Execution Time**: ~5-15 minutes

## What This Does

A **production-grade deployment agent** that embodies three critical roles:

1. **QA Tester**: Runs exhaustive test suites with zero tolerance for failures
2. **Developer**: Reviews feedback, suggests fixes if tests fail
3. **Release Manager**: Deploys ONLY after QA approval

### The Quality Gate System

```
┌─────────────────────────────────────────────────────┐
│  🧪 QA TESTER                                       │
│  Runs comprehensive tests:                          │
│  • Playwright integration tests (462 tests)         │
│  • TypeScript build validation                      │
│  • Accessibility compliance checks                  │
│  • Git status verification                          │
│                                                     │
│  Decision: APPROVE or REJECT                        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  IF REJECTED:                                       │
│  ❌ Create detailed issue report                    │
│  ❌ List required fixes                             │
│  ❌ BLOCK deployment                                │
│  ❌ User must fix and re-run                        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  IF APPROVED:                                       │
│  ✅ Commit changes to GitHub                        │
│  ✅ Push to main branch                             │
│  ✅ Trigger Vercel auto-deploy                      │
│  ✅ Wait for deployment completion                  │
│  ✅ Verify production URL                           │
│  ✅ Generate deployment report                      │
└─────────────────────────────────────────────────────┘
```

## Why This Is Critical

### The Problem
Most teams deploy blindly:
- ❌ Push code without running tests
- ❌ Hope nothing breaks in production
- ❌ Find out about bugs from angry users
- ❌ Scramble to fix issues at 2 AM

### The Solution
This agent is your **production gatekeeper**:
- ✅ **Zero tolerance**: 100% test pass rate required
- ✅ **Dual review**: QA + Release Manager roles
- ✅ **Automated**: No manual steps
- ✅ **Documented**: Full deployment report
- ✅ **Verified**: Checks production URL after deploy

## Usage

### Basic (Auto Session ID)
```bash
/deploy
```

### With Custom Session ID
```bash
/deploy session_feature_auth_fix
```

## Execution Phases

### Phase 1: QA Tester - Comprehensive Testing (3-8 min)

**Test Suite 1: Playwright Integration Tests**
- Runs all 462 Playwright tests
- Tests: Email signup, OAuth, error handling, complete flows
- Browser: Chromium (Desktop Chrome)
- Screenshots: On failure only
- Videos: On failure only

**Test Suite 2: TypeScript Build Validation**
- Runs `npx tsc --noEmit`
- Validates all TypeScript code
- Catches type errors before deployment

**Test Suite 3: Accessibility Audit**
- Basic WCAG 2.1 AA compliance checks
- Can be expanded with axe-core integration
- Ensures accessible UI for all users

**Test Suite 4: Git Status Check**
- Verifies uncommitted changes
- Shows `git diff --stat`
- Prepares for commit

### Phase 2: QA Sign-Off Decision (30 sec)

**QA Analyzes Results**:
```
Total Tests: 464
Passed: 464
Failed: 0
Pass Rate: 100%

Decision: ✅ APPROVED or ❌ REJECTED
```

**Approval Criteria** (ALL must be true):
- ✅ 100% test pass rate (zero failures)
- ✅ TypeScript build succeeds
- ✅ No console errors
- ✅ Accessibility checks pass

**If ANY test fails → AUTOMATIC REJECTION**

### Phase 3: Deployment (QA Approved Only) (2-5 min)

**Step 1: Commit Changes**
```bash
git add .
git commit -m "deploy: QA approved deployment"
```

**Step 2: Push to GitHub**
```bash
git push origin main
```

**Step 3: Vercel Auto-Deploy**
- GitHub push triggers Vercel
- Vercel builds and deploys
- Wait 45 seconds for completion

**Step 4: Verify Production**
```bash
curl -I https://jarvisdaily.com
vercel ls
```

### Phase 4: Post-Deployment Report (30 sec)

Generates comprehensive report:
- Test results summary
- QA decision with reasoning
- Deployment details
- Production URLs
- Next steps

## Output

### Success Scenario (QA Approved)

```
🟢 PRODUCTION DEPLOY AGENT - DUAL-ROLE QUALITY GATE SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 PHASE 1: QA TESTER - COMPREHENSIVE TEST EXECUTION

📋 Test Suite 1: Integration Tests (Playwright)
   Running: npx playwright test...
   ✅ Playwright tests completed
      Total: 462
      Passed: 462
      Failed: 0

📋 Test Suite 2: TypeScript Build Validation
   Running: npm run build...
   ✅ Build validation passed

📋 Test Suite 3: Accessibility Audit
   ✅ Basic accessibility checks passed

📋 Test Suite 4: Git Status & File Changes
   📁 Git Status: 3 file(s) changed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 PHASE 2: QA TESTER - TEST ANALYSIS & SIGN-OFF DECISION

🔍 QA Tester analyzing test results...

📊 Test Results Analysis:
   Total Tests: 464
   Passed: 464
   Failed: 0
   Pass Rate: 100.0%

✅ QA TESTER DECISION: APPROVED
   Reason: All tests passed (100% pass rate)
   Quality Gate: ✅ PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ QA APPROVED - PROCEEDING TO DEPLOYMENT

📋 QA APPROVAL SUMMARY:
All 464 tests passed successfully. Code quality meets production standards.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 PHASE 3: RELEASE MANAGER - PRODUCTION DEPLOYMENT

🚀 Release Manager initiating deployment...

📋 Step 1: Checking git status...
   3 file(s) to commit

📋 Step 2: Committing changes...
   ✅ Changes committed

📋 Step 3: Pushing to GitHub...
   ✅ Pushed to main branch

📋 Step 4: Waiting for Vercel deployment...
   ⏳ Vercel auto-deploy triggered (waiting 45 seconds)...
   ✅ Deployment initiated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 PHASE 4: POST-DEPLOYMENT VERIFICATION

🔍 Verifying production deployment...

📋 Checking Vercel deployment status...
[Vercel deployment list]

📋 Testing production URL accessibility...
HTTP/2 200

✅ Production deployment verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ DEPLOYMENT COMPLETE - ALL SYSTEMS GO!

📊 DEPLOYMENT SUMMARY:
   Duration: 7.3 minutes
   Tests Passed: 464/464
   QA Status: ✅ APPROVED
   Deployment: ✅ SUCCESSFUL
   Verification: ✅ VERIFIED

🌐 PRODUCTION URLs:
   Primary: https://jarvisdaily.com
   Alias: https://finadvise-webhook.vercel.app

📁 Deployment Report:
   data/deployments/deploy_1234567890/deployment-report.md
```

### Failure Scenario (QA Rejected)

```
❌ DEPLOYMENT REJECTED BY QA

📋 QA REJECTION REPORT:
Cannot deploy with 3 failing tests. Production requires 100% pass rate.

🔧 REQUIRED FIXES:
   1. Fix 3 failing test(s)
   2. Ensure 100% pass rate before deployment
   3. Review test output in playwright-report/index.html

⚠️  NEXT STEPS:
   1. Fix the issues listed above
   2. Run tests locally: npm test
   3. Re-run deploy agent: /deploy

❌ DEPLOYMENT ABORTED - FIX ISSUES AND TRY AGAIN
```

## Deployment Report

Location: `data/deployments/<session-id>/deployment-report.md`

### Report Structure

```markdown
# Deployment Report - deploy_1234567890

**Generated**: 2025-10-08T08:30:00.000Z
**QA Status**: ✅ APPROVED
**Deployment**: ✅ DEPLOYED

---

## Test Results

**Total Tests**: 464
**Passed**: 464
**Failed**: 0
**Pass Rate**: 100.0%

### Playwright Tests
- Total: 462
- Passed: 462
- Failed: 0

### Build Validation
- TypeScript: ✅ PASSED

### Accessibility
- Basic Checks: ✅ PASSED

---

## QA Decision

**APPROVED**: All 464 tests passed successfully. Code quality meets production standards.

---

## Deployment Details

**Status**: ✅ SUCCESSFUL
**Committed**: Yes
**Pushed to GitHub**: Yes
**Vercel Deployment**: Auto-triggered
**Production URL**: https://jarvisdaily.com
**Timestamp**: 2025-10-08T08:35:00.000Z

---

## Next Steps

✅ Deployment complete! Monitor production at:
- https://jarvisdaily.com
- Vercel Dashboard: https://vercel.com/dashboard
```

## When to Use

### Ideal Times
- ✅ **After feature completion**: New feature ready for production
- ✅ **Bug fixes**: Critical fixes that need immediate deployment
- ✅ **Before end of day**: Deploy stable changes before leaving
- ✅ **Weekly releases**: Scheduled production releases
- ✅ **Hotfix deployment**: Emergency production fixes

### Not Needed When
- ❌ **Work in progress**: Code not ready for production
- ❌ **Experimental changes**: Testing new approaches locally
- ❌ **Breaking changes**: Need feature flags or staged rollout

## Quality Standards

### Zero Tolerance Policy
This agent has **ZERO TOLERANCE** for failures:
- 1 failing test = Deployment BLOCKED
- TypeScript error = Deployment BLOCKED
- Accessibility violation = Deployment BLOCKED
- Any issue = Deployment BLOCKED

### Why This Matters
JarvisDaily handles **financial advisor data** - sensitive information that requires:
- 100% reliability
- Zero downtime
- Zero bugs in production
- Professional quality

## Architecture

### Dual-Role System
```
Role 1: QA Tester (Strict)
├── Run all test suites
├── Analyze results with scrutiny
├── REJECT if ANY issues found
└── APPROVE only if PERFECT (100%)

Role 2: Release Manager (Executor)
├── Waits for QA approval
├── Commits to GitHub
├── Pushes to main branch
├── Monitors Vercel deployment
└── Verifies production URL
```

### Technology Stack
- **Testing**: Playwright (462 tests)
- **Build**: TypeScript (tsc --noEmit)
- **Git**: Automated commit + push
- **CI/CD**: Vercel auto-deploy on main push
- **Verification**: curl + vercel CLI

## Environment Requirements

### Required in .env
```bash
VERCEL_TOKEN=your_token_here              # Vercel API token
VERCEL_PROJECT_ID=prj_XXX                 # Project ID (already set)
VERCEL_ORG_ID=team_XXX                    # Org ID (already set)
```

### Required Installed
- Node.js 22.x
- Playwright
- Vercel CLI
- Git

## Common Workflows

### Workflow 1: Feature Deployment
```bash
# 1. Complete feature development
# 2. Run deploy agent
/deploy session_new_dashboard_feature

# 3a. If QA approves → Deployed automatically
# 3b. If QA rejects → Fix issues and retry

# 4. Monitor production
vercel logs --follow
```

### Workflow 2: Hotfix Deployment
```bash
# 1. Fix critical bug
# 2. Deploy immediately
/deploy session_hotfix_auth_bug

# 3. Verify fix in production
curl https://jarvisdaily.com/api/auth
```

### Workflow 3: Weekly Release
```bash
# 1. Merge all feature branches
# 2. Run comprehensive deploy
/deploy session_weekly_release_v1_5

# 3. Send production URL to stakeholders
# https://jarvisdaily.com
```

## Troubleshooting

### Tests Fail Locally But Pass in Agent
- **Issue**: Environment differences
- **Solution**: Run `npm test` with same config as agent
- **Check**: `playwright.config.js` settings

### Deployment Succeeds But Site Not Updated
- **Issue**: Vercel caching
- **Solution**: Force rebuild in Vercel dashboard
- **Check**: `vercel ls` to see deployment status

### QA Approves But Deployment Fails
- **Issue**: Git push failed or network error
- **Solution**: Check git credentials, retry manually
- **Check**: `git status` and `git push origin main`

### Production URL Returns 404
- **Issue**: Vercel deployment incomplete
- **Solution**: Wait 2-3 minutes, check Vercel dashboard
- **Check**: `vercel logs` for errors

## Best Practices

1. **Run locally first**: `npm test` before `/deploy`
2. **Small deployments**: Deploy frequently, not big bangs
3. **Monitor logs**: Watch `vercel logs` after deployment
4. **Test production**: Manually verify critical flows
5. **Keep sessions**: Deployment reports for audit trail

## Related Commands

- `/context-preserver`: Save context before long deployment
- `/o`: Generate content (separate from deployment)
- `npm test`: Run tests locally before deployment
- `vercel logs`: Monitor production logs

## Security

### What Gets Committed
- ✅ Code changes
- ✅ Configuration updates
- ✅ Documentation updates
- ❌ .env file (gitignored)
- ❌ node_modules (gitignored)
- ❌ Secrets or tokens

### Deployment Safety
- GitHub push triggers Vercel
- Vercel builds in isolated environment
- Environment variables secure in Vercel dashboard
- No secrets exposed in commits

---

**Created**: 2025-10-08
**Author**: Deploy Agent System
**Version**: 1.0.0
**Status**: Production Ready ✅
