# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**JarvisDaily** (jarvisdaily.com) - Full-stack WhatsApp content distribution platform for financial advisors. Combines Next.js 15 web application with AI-powered content generation and Meta WhatsApp Direct API delivery.

**Tech Stack**:
- **Frontend**: Next.js 15.5.4 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Authentication**: Clerk (email/password + Google/LinkedIn OAuth)
- **Content Engine**: 14 AI agents orchestrated via Claude Code
- **Deployment**: Vercel (🚨 **MANUAL DEPLOY ONLY** - NOT connected to GitHub auto-deploy)
- **APIs**: Meta WhatsApp Business, Gemini 2.5 Flash, Cloudinary

**Official Domain**: jarvisdaily.com (aliases: finadvise-webhook.vercel.app)
**Content Standard**: Grammy-level (minimum 9.0/10 virality score)
**Content Strategy**: 1 asset per advisor per day (LinkedIn + WhatsApp + Status image)
**Delivery**: Meta Direct API (saves ₹28,788/year vs AiSensy)

## Core Commands

### Development & Build
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Build production Next.js bundle
npm test                 # Run Playwright tests (462 comprehensive tests)
npm run test:report      # View test results HTML report
```

### Content Generation (AI Agent Pipeline)
```bash
/o                               # Execute 14-agent pipeline (2-3 min, Grammy-level content)
node run-finadvise-mvp.js        # Quick MVP test run
node execute-finadvise-mvp.js    # Full orchestration with image generation
```

### Context Management & Codebase Cleanup
```bash
/context-preserver               # Generate portable prompt for fresh terminal (45-60s)
/sweep                           # Preview codebase cleanup (dry run)
/sweep execute                   # Execute cleanup - archives non-essential files
```

### WhatsApp Delivery (Meta Direct API)
```bash
node send-via-meta-direct.js         # Send daily messages
node check-meta-limits.js            # Check Meta account limits
vercel logs --follow                 # Monitor webhook events in real-time
```

### Deployment & CI
```bash
# 🚨 CRITICAL: Vercel is NOT connected to GitHub auto-deploy
# MUST deploy manually using Vercel CLI after every git push

# Full deployment workflow (REQUIRED):
git add . && git commit -m "feat: description"
git push origin main  # Push to GitHub for version control
VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes

# Quick manual deploy (if code already committed):
VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes

# Verify deployment:
vercel logs --follow
curl -sI https://jarvisdaily.com/signup | grep -E "age|x-vercel-cache"
```

## 🤖 SESSION AUTOMATION RULES

**CRITICAL: Claude Code should NEVER ask user to do these manually. Automate everything.**

### Automatic Deployment Protocol
🚨 **CRITICAL: Vercel is NOT connected to GitHub - MUST deploy manually every time**

When completing any feature, page, or fix:
1. ✅ **Run tests first**: `npx playwright test` (ensure passing, or fix failures)
2. ✅ **Commit automatically**: `git add . && git commit -m "feat: [clear description]"`
3. ✅ **Push to GitHub**: `git push origin main` (for version control only)
4. ✅ **Deploy to Vercel manually**: Use the command below (REQUIRED - not optional)
5. ✅ **Verify deployment**: `vercel logs --follow` or check dashboard
6. ❌ **NEVER ask user**: "Would you like me to deploy this?" - Just do it.

**Required Vercel Deploy Command** (use after every git push):
```bash
VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes
```

### Credentials & Environment Variables
**Claude Code has automatic access via .env - NEVER ask user for these:**

#### How to Use Credentials in Code
```javascript
// Node.js: require('dotenv').config();
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;
const clerkSecret = process.env.CLERK_SECRET_KEY;

// Python: load_dotenv()
gemini_key = os.getenv('GEMINI_API_KEY')
```

#### Automatic Credential Handling
- ✅ **All tokens already configured** in `.env` - use them directly
- ✅ **Never ask user** for: WhatsApp tokens, Gemini API key, Clerk keys, Cloudinary credentials
- ✅ **If a NEW variable is needed**: Add it to `.env` automatically using fs.appendFileSync()

### Programmatic Operations
**Always use API/CLI automation:**
- ✅ Vercel: Use `vercel --prod` CLI with credentials (🚨 REQUIRED after every change - NOT connected to GitHub)
- ✅ Git: Use `git` commands directly in Bash tool
- ✅ Testing: Run `npx playwright test` programmatically
- ❌ NEVER: Ask user to "manually deploy", "manually set env var", "manually push"

**Vercel Deployment Credentials** (stored in .env):
```bash
VERCEL_ORG_ID=team_kgmzsZJ64NGLaTPyLRBWV3vz
VERCEL_PROJECT_ID=prj_QQAial59AHSd44kXyY1fGkPk3rkA
VERCEL_TOKEN=cDuZRc8rAyugRDuJiNkBX3Hx
```

**Vercel Project Name**: `finadvise-webhook` (NOT "mvp")
**GitHub Repo**: `shriyavallabh/mvp`
**Production Domain**: `jarvisdaily.com`

### MCP (Model Context Protocol) Tools
**Available MCP servers:**
- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint errors
- `mcp__ide__executeCode` - Run code in Jupyter kernel (for Python agents)

**Use proactively**: Check diagnostics after editing TypeScript files

### Session Memory & Context
**What Claude Code automatically knows in EVERY session:**
- ✅ All files in the project, CLAUDE.md contents, git history
- ✅ Environment variables in `.env` (knows they exist)
- ✅ Package dependencies, project structure

**What Claude Code does NOT remember:**
- ❌ Previous conversation history from other terminals
- ❌ Verbal instructions from past sessions

**Best Practice**: If explaining the same thing in multiple sessions, **add it to CLAUDE.md**.

### Production URLs
- **Landing**: https://jarvisdaily.com
- **Signup**: https://jarvisdaily.com/signup
- **Dashboard**: https://jarvisdaily.com/dashboard (protected)
- **Webhook**: https://jarvisdaily.com/api/webhook

## Architecture

### System Overview
```
JarvisDaily Platform
├── Frontend (Next.js 15 App Router): /, /signup, /sign-in, /dashboard
├── API Routes: /api/webhook (WhatsApp), /api/dashboard, /api/image
├── Content Generation: 14 AI agents (data → content → validation → distribution)
└── WhatsApp Flow: Notification → Button click → Webhook → Content delivery
```

### Directory Structure (Condensed)
```
/
├── app/                        # Next.js 15 App Router (pages + API routes)
├── components/ui/              # shadcn/ui components (54 components)
├── scripts/                    # Python/Node utility scripts
├── .claude/commands/           # Slash commands (27 agents)
├── data/                       # advisors.json, shared-memory.json
├── output/                     # Generated content (gitignored)
├── tests/                      # Playwright tests (462 tests)
├── middleware.ts               # Clerk auth middleware
├── playwright.config.js        # Test config with Vercel bypass
└── .env                        # Environment variables (gitignored)
```

### Critical Files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with ClerkProvider |
| `app/api/webhook/route.ts` | WhatsApp webhook handler |
| `app/api/razorpay/create-subscription/route.ts` | Razorpay subscription creation |
| `app/api/razorpay/webhook/route.ts` | Razorpay payment webhooks |
| `lib/razorpay.js` | Razorpay client (subscriptions, webhooks) |
| `middleware.ts` | Route protection (Clerk) |
| `.claude/commands/o.md` | Main orchestration (14 agents) |
| `playwright.config.js` | Test config with Vercel bypass |

### Agent System (14 Agents via /o)
**Execution**: Each agent runs via `Task` tool, takes 2-3 minutes total

**Phases**:
1. **Infrastructure**: mcp-coordinator, state-manager, advisor-data-manager, market-intelligence
2. **Content**: segment-analyzer, linkedin-post-generator, whatsapp-message-creator, status-image-designer
3. **Enhancement**: gemini-image-generator, brand-customizer
4. **Validation**: compliance-validator, quality-scorer, fatigue-checker
5. **Distribution**: distribution-controller (interactive menu)
6. **Monitoring**: analytics-tracker, feedback-processor

**Utility Agents**: context-preserver, deploy-agent, sweeper-agent

## Environment Configuration

**IMPORTANT: All credentials stored in `.env`. Claude Code has automatic access.**

### Key Environment Variables (All Verified Working)
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` - Meta WhatsApp API (✅ Permanent token)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` - Clerk auth (✅ Tested)
- `GEMINI_API_KEY`, `GEMINI_MODEL` - Gemini 2.5 Flash (Nano Banana model)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Image hosting
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Payment gateway (LIVE mode, KYC verified)
- `RAZORPAY_SOLO_PLAN_ID`, `RAZORPAY_PROFESSIONAL_PLAN_ID`, `RAZORPAY_ENTERPRISE_PLAN_ID` - Subscription plans (₹999/₹2,499/₹4,999)
- `RAZORPAY_WEBHOOK_SECRET` - Webhook signature verification
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - Database
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - SMS/WhatsApp backup
- `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID`, `VERCEL_TOKEN` - Deployment automation
- `CRON_SECRET` - Scheduled content generation

**Do NOT list full tokens in code - reference from process.env**

### Razorpay Payment Integration
- **Status**: ✅ LIVE mode (KYC verified)
- **Plans**: Solo (₹999/mo), Professional (₹2,499/mo), Enterprise (₹4,999/mo)
- **API Routes**: `/api/razorpay/create-subscription`, `/api/razorpay/webhook`
- **Client Library**: `lib/razorpay.js` (subscription management, customer creation, webhook verification)
- **Webhook**: `https://jarvisdaily.com/api/razorpay/webhook` (handles 68 events)
- **Database Sync**: Auto-updates Supabase `users` table on subscription events

### Vercel Configuration
- **GitHub Integration**: 🚨 **DISABLED** - NOT connected to GitHub auto-deploy (intentional)
- **Deployment Method**: Manual deployment via Vercel CLI (REQUIRED after every code change)
- **Project Name on Vercel**: `finadvise-webhook`
- **Production URL**: https://jarvisdaily.com (primary)
- **Project ID**: prj_QQAial59AHSd44kXyY1fGkPk3rkA
- **Org ID**: team_kgmzsZJ64NGLaTPyLRBWV3vz
- **Deployment Token**: cDuZRc8rAyugRDuJiNkBX3Hx (stored in .env as VERCEL_TOKEN)
- **Bot Protection Bypass**: ✅ Configured in playwright.config.js (secret: HDwq1ZyUioGQJmft3ckqNdm5mJPxT8S8)

**Why Manual Deploy?**: Vercel project is not connected to GitHub integration. This is a known configuration that has been used for past deployments. Every code change requires manual deployment using the Vercel CLI with the credentials above.

## Implementation Requirements

### Next.js & React Patterns
- **Server Components**: Default for `app/**/*.tsx`
- **Client Components**: Add `"use client"` directive
- **Auth Flow**: Use `auth()` from `@clerk/nextjs/server` for server, `useUser()` for client
- **API Routes**: Export GET/POST/PUT/DELETE from `app/api/*/route.ts`

### WhatsApp API Patterns (Meta Direct)
- **API Version**: v17.0+ (`https://graph.facebook.com/v17.0`)
- **Phone Format**: Include country code (e.g., `919765071249`)
- **Message Structure**: `messaging_product: "whatsapp"` required
- **Button Messages**: Use `interactive` type with `reply` buttons

**Example Button Message**:
```javascript
{
  messaging_product: "whatsapp",
  to: "919765071249",
  type: "interactive",
  interactive: {
    type: "button",
    body: { text: "Your content is ready!" },
    action: { buttons: [{ type: "reply", reply: { id: "retrieve_content", title: "Retrieve" }}]}
  }
}
```

**Webhook Handler Pattern**: GET for verification, POST for events. Validate signature, parse messages, check button_reply.id

### Viral Content Standards
- **Minimum Score**: 9.0/10 virality
- **Formula**: (Hook × Story × Emotion) + (Specificity × Simplicity) + CTA²
- **Character Limit**: 300-400 for WhatsApp, 2500-3000 for LinkedIn
- **Output Format**: Both JSON and TEXT files
- **Auto-regeneration**: If <9.0/10, regenerate (max 2 attempts), use emergency template if still failing

### Image Generation (Gemini 2.5 Flash)
- **Model**: `gemini-2.5-flash-image-preview`
- **Critical**: Use **reference image technique** for aspect ratio control
- **WhatsApp Status**: 1080×1920 pixels (9:16 vertical)
- **Process**: Create reference image → Upload to Gemini → Generate with prompt
- **Quality Control**: AI visual validation, auto-reject debug text/duplicates, regenerate with fixes

### Session Architecture
```javascript
sessionId: session_${timestamp}
outputDir: /output/session_*/
sharedMemory: /data/shared-memory.json
messageBus: /data/communication-channels/
```

## Deployment Strategy

### Vercel Deployment
🚨 **CRITICAL**: Manual deployment REQUIRED - NOT connected to GitHub

**Full Deployment Workflow**:
```bash
# 1. Commit changes to Git
git add . && git commit -m "feat: description"

# 2. Push to GitHub (for version control)
git push origin main

# 3. Deploy to Vercel manually (REQUIRED - code does NOT auto-deploy)
VERCEL_ORG_ID="team_kgmzsZJ64NGLaTPyLRBWV3vz" \
VERCEL_PROJECT_ID="prj_QQAial59AHSd44kXyY1fGkPk3rkA" \
vercel --prod --token="cDuZRc8rAyugRDuJiNkBX3Hx" --yes

# 4. Verify deployment
vercel logs --follow
curl -sI https://jarvisdaily.com/signup | grep -E "age|x-vercel-cache"
```

**Why Manual?**: Vercel project `finadvise-webhook` is intentionally NOT connected to GitHub auto-deploy. This has been the workflow for all past deployments.

### Testing Protocol
**462 tests** covering email signup, OAuth, complete flows

**Run tests**:
```bash
npx playwright test                    # All tests
npx playwright test tests/<file>       # Single file
npx playwright show-report             # View results
```

**Production Verification**:
- ✅ Signup page: https://jarvisdaily.com/signup
- ✅ Clerk auth working (email/OAuth)
- ✅ Webhook live: https://jarvisdaily.com/api/webhook
- ✅ Bot protection bypass configured

## Common Development Workflows

### Adding UI Component
```bash
npx shadcn@latest add <component-name>
# Import: import { ComponentName } from '@/components/ui/component-name'
```

### Creating API Route
1. Create `app/api/<route-name>/route.ts`
2. Export handler: `export async function GET(request: Request) { return NextResponse.json({ data }) }`
3. Access at: `https://jarvisdaily.com/api/<route-name>`

### Adding Protected Route
1. Create `app/<route-name>/page.tsx`
2. Add auth: `const { userId } = await auth(); if (!userId) redirect('/sign-in')`
3. Automatically protected by middleware.ts

### Running Content Pipeline
1. Run `/o` (14 agents, 2-3 min)
2. Check output: `output/session_<timestamp>/`
3. Verify quality: All scores ≥9.0/10
4. Choose distribution option

### Deploying Changes
```bash
# Automatic (recommended)
git push origin main

# Manual
vercel --prod

# Verify
vercel logs --follow
```

## File Management Rules

### Directory Organization
- **UI Components**: `components/ui/` (shadcn), `components/` (custom)
- **API Routes**: `app/api/`
- **Scripts**: `scripts/` (Python/Node)
- **Tests**: `tests/` (Playwright)
- **Data**: `data/` (JSON, state)
- **Output**: `output/` (generated content, gitignored)

### Naming Conventions
- **Components**: PascalCase (`DashboardClient.tsx`)
- **API Routes**: kebab-case (`webhook/route.ts`)
- **Scripts**: kebab-case (`deploy-to-vercel.js`)
- **Tests**: kebab-case with `.spec.js`

### What NOT to Create in Root
- ❌ Temporary test files (use `/tests/`)
- ❌ Debugging scripts (use `/scripts/` or `/archive/`)
- ❌ Duplicate/experiment files
- ✅ Only core config files: `package.json`, `.env`, `vercel.json`, `tsconfig.json`

## Common Issues & Solutions

### Build Errors (Next.js)
```bash
npx tsc --noEmit  # Check TypeScript errors
# Fix: Add imports, add types, remove unused variables
```

### Clerk Authentication Issues
1. Verify env vars in `.env` and Vercel dashboard
2. Check `middleware.ts` - ensure route in `isPublicRoute` if public
3. Verify Clerk dashboard matches production URLs
4. Clear browser cookies

### Playwright Tests Failing
```bash
# Verify bypass secret
grep "x-vercel-protection-bypass" playwright.config.js
# Run single test to debug
npx playwright test tests/<file>.spec.js --headed
```

### WhatsApp Webhook Not Working
1. Check logs: `vercel logs --follow`
2. Verify webhook URL: `https://jarvisdaily.com/api/webhook`
3. Test verification: Visit webhook with `hub.mode=subscribe&hub.verify_token=...`
4. Confirm `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in .env and Meta

## Key Learnings & Best Practices

### Image Generation with Gemini
**Critical**: Always use reference image technique
- ❌ **Wrong**: Text prompts alone ("generate 1080×1920")
- ✅ **Right**: Upload 1080×1920 reference + prompt
- **Why**: Gemini adopts aspect ratio from reference, not text

### Content Virality Formula
```
Virality = (Hook × Story × Emotion) + (Specificity × Simplicity) + CTA²
Hook: First 3 seconds grab attention
Story: Relatable narrative (Warikoo-style)
Emotion: Fear/hope/curiosity triggers
```

**Examples**:
- ❌ Low (4/10): "Invest in mutual funds for better returns"
- ✅ High (9.5/10): "My client saved ₹12.7 lakhs in taxes. Here's the exact SIP strategy 👇"

### Quality Regeneration
1. Generate → 2. Score (min 9.0/10) → 3. If <9.0: Regenerate (max 2x) → 4. If still <9.0: Use emergency template (9.5+/10)
**Result**: 100% quality guarantee, zero manual intervention

### WhatsApp Cost Optimization
- **Meta Direct**: ₹0 per message (first 1K free, then ₹0.44/msg)
- **AiSensy**: ₹1,099/month + per-message fees
- **Savings**: ₹28,788/year (500 advisors × 365 days)

### Testing Best Practices
462 comprehensive tests covering email signup, OAuth, complete flows. Bot protection bypass configured. Tests run against live deployment.
**Key insight**: More tests = fewer production bugs

### Session Isolation
- Each `/o` creates isolated session (`session_<timestamp>`)
- Shared memory: `data/shared-memory.json`
- Communication bus: `data/communication-channels/`
**Why**: Agents run in parallel without conflicts

### Context Preservation
**Problem**: 200K token limit exhausted in long sessions
**Solution**: `/context-preserver` agent (45-60s)
- Analyzes conversation, extracts context, generates portable prompt
- Use when: 150K+ tokens, long sessions (30+ min), complex changes
- Output: Copy-paste ready prompt for fresh terminal
**Result**: Zero context loss, 5-10 min saved per restart

## Quick Reference

### Most Common Commands
```bash
# Development
npm run dev                  # Start dev server
npm test                     # Run all tests

# Content Generation
/o                          # Run 14-agent pipeline (2-3 min)

# Context Management
/context-preserver          # Generate portable prompt for fresh terminal
/sweep execute              # Cleanup codebase (archives files)

# Deployment
/deploy                     # Testing + QA + deploy (RECOMMENDED)
git push origin main        # Auto-deploy to production

# Debugging
vercel logs --follow        # Watch production logs
npx tsc --noEmit           # Check TypeScript errors
```

### Most Important Files
| File | When to Edit |
|------|--------------|
| `app/layout.tsx` | App-wide settings, providers |
| `middleware.ts` | Protected routes |
| `.env` | API keys, environment variables |
| `.claude/commands/o.md` | Agent orchestration flow |
| `playwright.config.js` | Test URL or browser settings |

### Emergency Resources
- **Test Reports**: `playwright-report/index.html`
- **Session Logs**: `output/session_*/logs/`
- **Shared Memory**: `data/shared-memory.json`
- **Dashboards**: Clerk, Vercel, Meta Business (see production URLs above)
