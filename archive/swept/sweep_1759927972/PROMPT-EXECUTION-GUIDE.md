# JARVISDAILY PROMPT EXECUTION GUIDE

**Purpose:** This guide shows you which prompts can run in parallel to save time, which must be sequential, and what prerequisites each prompt needs.

---

## **QUICK START: PARALLEL VS SEQUENTIAL**

### **✅ CAN RUN IN PARALLEL (Save Time!)**

**Parallel Group 1 - Phase 0 (Landing Page):**
- ✅ Prompts 0.1, 0.2, 0.3, 0.4, 0.5, 0.6 can all run in parallel
- ⚠️ Only 0.7 (Deploy) must be sequential (after 0.1-0.6 complete)
- **Time savings:** 6 days → 2 days

**Parallel Group 2 - Phase 1 Setup (Authentication APIs):**
- ✅ Prompt 1.1 (Twilio OTP API) - Independent terminal
- ✅ Prompt 1.4 (Google OAuth) - Independent terminal
- ❌ Prompt 1.2, 1.3, 1.5 must be sequential (depend on 1.1)
- **Time savings:** Minimal (1.1 and 1.4 can overlap)

**Parallel Group 3 - Phase 3 Components (Dashboard):**
- ✅ Prompt 3.2 (Content Cards) - Independent terminal
- ✅ Prompt 3.3 (Toast/Copy) - Independent terminal
- ✅ Prompt 3.5 (Upgrade + Settings) - Independent terminal
- ❌ Prompt 3.1 (Layout) must be done first
- ❌ Prompt 3.4 (History) depends on 3.2
- ❌ Prompt 3.6 (Deploy) must be last
- **Time savings:** 5 days → 3 days

**Parallel Group 4 - Phase 5 Setup (Content + Delivery):**
- ✅ Prompt 5.1 (Vercel Cron setup) - Independent terminal
- ✅ Prompt 5.3 (AiSensy setup) - Independent terminal
- ❌ Prompt 5.2, 5.4, 5.5 must be sequential
- **Time savings:** 1 day

---

## **❌ MUST BE SEQUENTIAL (Dependencies)**

**Sequential Chain 1 - Database & Auth:**
- 2.1 (Supabase DB) → 2.2 (v0 Design) → 2.3 (Onboarding Implementation) → 2.4 (Route Protection) → 2.5 (Deploy)

**Sequential Chain 2 - Payment Flow:**
- 4.1 (Razorpay Setup) → 4.2 (Checkout) → 4.3 (Webhooks) → 4.4 (Deploy)

**Sequential Chain 3 - Content Pipeline:**
- 5.2 (Content Generator) → 5.4 (Complete Flow) → 5.5 (Test & Deploy)

---

## **DETAILED DEPENDENCY MATRIX**

### **PHASE 0: LANDING PAGE (7 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **0.1** Hero Updates | ✅ Yes | None | 0.7 | Group 1 |
| **0.2** Pricing Quantity | ✅ Yes | None | 0.7 | Group 1 |
| **0.3** Content Explainer | ✅ Yes | None | 0.7 | Group 1 |
| **0.4** Example Content | ✅ Yes | None | 0.7 | Group 1 |
| **0.5** Trial Badges | ✅ Yes | None | 0.7 | Group 1 |
| **0.6** ROI Calculator | ✅ Yes | None | 0.7 | Group 1 |
| **0.7** Deploy | ❌ No | 0.1-0.6 | Phase 1 | Sequential |

**Execution Strategy:**
```bash
# Open 6 terminals simultaneously
Terminal 1: Run Prompt 0.1
Terminal 2: Run Prompt 0.2
Terminal 3: Run Prompt 0.3
Terminal 4: Run Prompt 0.4
Terminal 5: Run Prompt 0.5
Terminal 6: Run Prompt 0.6

# After all complete, run in single terminal:
Terminal 7: Run Prompt 0.7 (Deploy)
```

**Time Estimate:**
- Sequential: 7 days (1 day each)
- Parallel: 2 days (1 day for Group 1, 1 day for Deploy)
- **Time Saved: 5 days**

---

### **PHASE 1: AUTHENTICATION (5 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **1.1** Twilio OTP API | ✅ Yes | .env exists | 1.2, 1.3, 1.5 | Group 2A |
| **1.2** Signup Page | ❌ No | 1.1 | 1.5 | Sequential |
| **1.3** Sign-In Page | ❌ No | 1.1 | 1.5 | Sequential |
| **1.4** Google OAuth | ✅ Yes | Clerk setup | 1.5 | Group 2B |
| **1.5** Test & Deploy | ❌ No | 1.2, 1.3, 1.4 | Phase 2 | Sequential |

**Execution Strategy:**
```bash
# Start in parallel:
Terminal 1: Run Prompt 1.1 (Twilio OTP API)
Terminal 2: Run Prompt 1.4 (Google OAuth) - can start immediately

# After 1.1 completes, run sequentially:
Terminal 1: Run Prompt 1.2 (Signup Page)
Terminal 1: Run Prompt 1.3 (Sign-In Page)

# After all complete:
Terminal 1: Run Prompt 1.5 (Test & Deploy)
```

**Time Estimate:**
- Sequential: 5 days
- Parallel: 4 days (1.1 and 1.4 overlap)
- **Time Saved: 1 day**

---

### **PHASE 2: ONBOARDING (5 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **2.1** Supabase DB | ✅ Yes | None | 2.3, 2.4, 2.5 | Must Do First |
| **2.2** v0 Design | ✅ Yes | None | 2.3 | Can Overlap with 2.1 |
| **2.3** Onboarding Impl | ❌ No | 2.1, 2.2 | 2.4, 2.5 | Sequential |
| **2.4** Route Protection | ❌ No | 2.3 | 2.5 | Sequential |
| **2.5** Test & Deploy | ❌ No | 2.1-2.4 | Phase 3 | Sequential |

**Execution Strategy:**
```bash
# Start in parallel:
Terminal 1: Run Prompt 2.1 (Supabase DB setup)
Terminal 2: Run Prompt 2.2 (v0 Design) - can work simultaneously

# After both complete, run sequentially:
Terminal 1: Run Prompt 2.3 (Onboarding Implementation)
Terminal 1: Run Prompt 2.4 (Route Protection)
Terminal 1: Run Prompt 2.5 (Test & Deploy)
```

**Time Estimate:**
- Sequential: 5 days
- Parallel: 4 days (2.1 and 2.2 overlap)
- **Time Saved: 1 day**

---

### **PHASE 3: DASHBOARD (6 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **3.1** Dashboard Layout | ✅ Yes | Supabase (2.1) | 3.2-3.6 | Must Do First |
| **3.2** Content Cards | ❌ No | 3.1 | 3.4 | Group 3A |
| **3.3** Copy + Toast | ✅ Yes | 3.1 (can copy code) | None | Group 3B |
| **3.4** History View | ❌ No | 3.1, 3.2 | 3.6 | Sequential |
| **3.5** Upgrade + Settings | ✅ Yes | 3.1 (can copy layout) | 3.6 | Group 3C |
| **3.6** Test & Deploy | ❌ No | 3.1-3.5 | Phase 4 | Sequential |

**Execution Strategy:**
```bash
# First, run layout:
Terminal 1: Run Prompt 3.1 (Dashboard Layout)

# After 3.1 completes, run in parallel:
Terminal 1: Run Prompt 3.2 (Content Cards)
Terminal 2: Run Prompt 3.3 (Copy + Toast) - independent
Terminal 3: Run Prompt 3.5 (Upgrade + Settings) - independent

# After 3.2 completes:
Terminal 1: Run Prompt 3.4 (History View)

# After all complete:
Terminal 1: Run Prompt 3.6 (Test & Deploy)
```

**Time Estimate:**
- Sequential: 6 days
- Parallel: 4 days (3.2, 3.3, 3.5 overlap; then 3.4; then 3.6)
- **Time Saved: 2 days**

---

### **PHASE 4: RAZORPAY PAYMENTS (4 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **4.1** Razorpay Setup | ✅ Yes | None | 4.2-4.4 | Must Do First |
| **4.2** Checkout Flow | ❌ No | 4.1 | 4.3, 4.4 | Sequential |
| **4.3** Webhooks | ❌ No | 4.1, 4.2 | 4.4 | Sequential |
| **4.4** Test & Deploy | ❌ No | 4.1-4.3 | Phase 5 | Sequential |

**Execution Strategy:**
```bash
# All must run sequentially:
Terminal 1: Run Prompt 4.1 (Razorpay Setup - account creation)
Terminal 1: Run Prompt 4.2 (Checkout Flow)
Terminal 1: Run Prompt 4.3 (Webhook Handler)
Terminal 1: Run Prompt 4.4 (Test & Deploy)
```

**Time Estimate:**
- Sequential: 4 days
- Parallel: 4 days (no parallelization possible)
- **Time Saved: 0 days**

**Note:** 4.1 can be done while waiting for other phases (e.g., during Phase 3)

---

### **PHASE 5: CONTENT GENERATION + AISENSY (5 PROMPTS)**

| Prompt | Can Run Solo? | Depends On | Blocks | Parallel Group |
|--------|---------------|------------|--------|----------------|
| **5.1** Vercel Cron Setup | ✅ Yes | None | 5.2, 5.4 | Group 5A |
| **5.2** 14-Agent Pipeline | ❌ No | 5.1 | 5.4, 5.5 | Sequential |
| **5.3** AiSensy Setup | ✅ Yes | None | 5.4 | Group 5B |
| **5.4** Complete Flow | ❌ No | 5.1, 5.2, 5.3 | 5.5 | Sequential |
| **5.5** Test & Deploy | ❌ No | 5.1-5.4 | None | Sequential |

**Execution Strategy:**
```bash
# Start in parallel:
Terminal 1: Run Prompt 5.1 (Vercel Cron Setup)
Terminal 2: Run Prompt 5.3 (AiSensy Setup) - independent

# After 5.1 completes:
Terminal 1: Run Prompt 5.2 (14-Agent Pipeline)

# After all complete:
Terminal 1: Run Prompt 5.4 (Complete Flow)
Terminal 1: Run Prompt 5.5 (Test & Deploy)
```

**Time Estimate:**
- Sequential: 5 days
- Parallel: 4 days (5.1 and 5.3 overlap)
- **Time Saved: 1 day**

---

## **OVERALL TIME OPTIMIZATION**

### **Sequential Execution (One Prompt at a Time):**
- Phase 0: 7 days
- Phase 1: 5 days
- Phase 2: 5 days
- Phase 3: 6 days
- Phase 4: 4 days
- Phase 5: 5 days
- **Total: 32 days**

### **Parallel Execution (This Guide):**
- Phase 0: 2 days (saved 5 days)
- Phase 1: 4 days (saved 1 day)
- Phase 2: 4 days (saved 1 day)
- Phase 3: 4 days (saved 2 days)
- Phase 4: 4 days (saved 0 days)
- Phase 5: 4 days (saved 1 day)
- **Total: 22 days**

### **⚡ TIME SAVED: 10 DAYS (31% faster)**

---

## **CROSS-PHASE PARALLELIZATION**

You can also work on multiple phases simultaneously if you have the resources:

### **Super Parallel Strategy (3+ Developers):**

**Week 1:**
- Developer 1: Phase 0 (2 days) → Phase 1 (4 days)
- Developer 2: Phase 4.1 (Razorpay account setup - 1 day) → Phase 5.3 (AiSensy - 1 day) → Wait
- Developer 3: Phase 2.1 (Supabase - 1 day) → Phase 2.2 (v0 Design - 1 day) → Wait

**Week 2:**
- Developer 1: Phase 1 continues (2 days) → Phase 2 (4 days)
- Developer 2: Phase 3.1 (Layout - 1 day) → Phase 3.3, 3.5 (3 days)
- Developer 3: Phase 2.3-2.5 (3 days) → Phase 3.2, 3.4 (3 days)

**Week 3:**
- Developer 1: Phase 4 (4 days)
- Developer 2: Phase 3.6 (Deploy - 1 day) → Phase 5.1-5.2 (3 days)
- Developer 3: Phase 5.4-5.5 (2 days)

**Total: ~15 days with 3 developers**

---

## **PREREQUISITES FOR EACH PROMPT**

To run ANY prompt in isolation (different terminal/context), you need:

### **Universal Prerequisites (ALL Prompts):**
1. ✅ `.env` file with all API keys
2. ✅ `package.json` with dependencies installed
3. ✅ Next.js 15.5.4 project initialized
4. ✅ Git repository initialized
5. ✅ Vercel account connected
6. ✅ Understanding of project structure

### **Phase-Specific Prerequisites:**

**Phase 0 (Landing Page):**
- ✅ `app/page.tsx` exists (v0 design already integrated)
- ✅ Tailwind + Shadcn UI configured
- ✅ Black/gold theme in `tailwind.config.ts`

**Phase 1 (Authentication):**
- ✅ Clerk account setup (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
- ✅ Twilio account (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
- ✅ Vercel KV for OTP storage (optional: can use in-memory for testing)

**Phase 2 (Onboarding):**
- ✅ Supabase account (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ Cloudinary account (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)
- ✅ Clerk authentication working (from Phase 1)

**Phase 3 (Dashboard):**
- ✅ Supabase database tables created (from Phase 2.1)
- ✅ User authentication working (from Phase 1)
- ✅ Shadcn UI components installed

**Phase 4 (Payments):**
- ✅ Razorpay account (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- ✅ Supabase subscriptions table (from Phase 2.1)
- ✅ Dashboard exists (from Phase 3)

**Phase 5 (Content + Delivery):**
- ✅ AiSensy account (AISENSY_API_KEY, AISENSY_WHATSAPP_NUMBER)
- ✅ Gemini API key (GEMINI_API_KEY)
- ✅ Python 3.x installed (for content generation)
- ✅ 14-agent pipeline files exist (`orchestrate-finadvise.py`, `/agents/*`)
- ✅ Supabase content table created

---

## **RECOMMENDED EXECUTION ORDER**

### **Option A: Solo Developer (Fastest)**
Follow the parallel strategy above:
1. Phase 0 in parallel (6 terminals) → 2 days
2. Phase 1 with some parallel → 4 days
3. Phase 2 with some parallel → 4 days
4. Phase 3 with max parallel → 4 days
5. Phase 4 sequentially → 4 days
6. Phase 5 with some parallel → 4 days
**Total: 22 days**

### **Option B: 2 Developers (Balanced)**
- Dev 1: Phases 0, 1, 2 (10 days)
- Dev 2: Phases 4.1 (setup), 5.1, 5.3 (setup) in advance (3 days), then Phase 3 (4 days), then Phase 4 (3 days), then Phase 5 (2 days)
**Total: ~12 days**

### **Option C: 3+ Developers (Maximum Speed)**
- Dev 1: Frontend (Phases 0, 1, 3)
- Dev 2: Backend (Phases 2, 5)
- Dev 3: Payments (Phase 4)
**Total: ~15 days** (with coordination overhead)

---

## **COMMON PITFALLS TO AVOID**

### **1. Running Dashboard Before Supabase**
❌ **DON'T:** Start Phase 3 before Phase 2.1 completes
✅ **DO:** Ensure Supabase tables exist first

### **2. Skipping Environment Variables**
❌ **DON'T:** Start coding without `.env` configured
✅ **DO:** Set up ALL environment variables first

### **3. Forgetting to Deploy After Each Phase**
❌ **DON'T:** Wait until Phase 5 to deploy
✅ **DO:** Deploy after each phase (0.7, 1.5, 2.5, 3.6, 4.4, 5.5)

### **4. Not Testing Webhooks Locally**
❌ **DON'T:** Deploy webhooks without local testing
✅ **DO:** Use ngrok to test webhooks locally first

### **5. Parallelizing Dependent Prompts**
❌ **DON'T:** Run 3.4 (History) before 3.2 (Content Cards) completes
✅ **DO:** Check dependency matrix above

---

## **CHECKLIST: BEFORE STARTING ANY PROMPT**

```
[ ] Read the CONTEXT section of the prompt
[ ] Verify all prerequisites are met
[ ] Check dependency matrix (is this prompt blocked?)
[ ] Ensure environment variables are set
[ ] Have the required accounts (Twilio, Razorpay, etc.)
[ ] Know which files will be created/modified
[ ] Have a backup/git commit before starting
[ ] Know what the deliverable should look like
```

---

## **NEXT STEPS**

1. **Read this guide completely**
2. **Decide your execution strategy** (Solo? Team? How many terminals?)
3. **Set up all prerequisites** (accounts, environment variables)
4. **Follow the parallel execution strategy** for your chosen path
5. **Track progress** using the dependency matrix
6. **Deploy after each phase** to catch issues early

Good luck! 🚀
