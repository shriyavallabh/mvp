# MSG91 SMS OTP Setup Guide

## ✅ Code Integration: COMPLETE

I've already integrated MSG91 into your codebase. Now you just need to get your credentials and we'll test!

---

## Step-by-Step: Get MSG91 Credentials

### STEP 1: Create MSG91 Account (5 minutes)

1. **Go to**: https://control.msg91.com/signup/

2. **Fill the form**:
   - Name: Your name
   - Email: Your email
   - Mobile: **9765071249** (without +91)
   - Company: JarvisDaily
   - Password: Create a strong password

3. **Click "Create Free Account"**

4. **Verify your email**:
   - Check your inbox (and spam folder)
   - Click the verification link

5. **Verify your mobile**:
   - MSG91 will send you an OTP on +919765071249
   - Enter the OTP to verify

✅ **You'll get 100 FREE SMS credits** for testing!

---

### STEP 2: Get Your Auth Key (2 minutes)

1. **After login**, go to: https://control.msg91.com/app/settings/api

2. **You'll see "Auth Key"** displayed on the page
   - It looks like: `376025AabcdefghijklmnopqrP1234567`
   - **COPY THIS KEY**

3. **Send me this Auth Key** and I'll add it to the .env file

---

### STEP 3: Create OTP Template (OPTIONAL - Can do later)

**Note**: For testing, you can skip this. MSG91 has a default template. But for production, you should create your own.

1. **Go to**: https://control.msg91.com/app/templates

2. **Click "Create Template"**

3. **Fill the form**:
   - Template Name: `JarvisDaily OTP`
   - Template Type: **Transactional**
   - Message: `Your JarvisDaily OTP is {#var#}. Valid for 5 minutes. Do not share this code.`
   - Variable: `{#var#}` (this will be replaced with actual OTP)

4. **Submit** and wait for approval (usually instant)

5. **Copy the Template ID** (you'll get this after approval)

---

### STEP 4: DLT Registration (Required for Production in India)

**What is DLT?**
- Do Not Call (DND) Registry mandated by TRAI (Telecom Regulatory Authority of India)
- Required for sending commercial SMS in India
- **Takes 2-3 days for approval**

**For now**: Skip this. MSG91 will work without DLT for testing.

**For production**: Follow this guide: https://help.msg91.com/article/177-dlt-registration

---

## What I Need From You

Once you complete STEP 1 and STEP 2, send me:

1. ✅ **MSG91 Auth Key**: `376025A...` (from the API settings page)
2. ⚠️ **Template ID** (optional - only if you created a template)

I'll then:
- Update the `.env` file with your credentials
- Test sending OTP to +919765071249
- Verify you receive the SMS
- Confirm the full OTP flow works

---

## Current Status

### ✅ What's Already Done

1. **MSG91 Service Created**: `/lib/msg91-service.ts`
   - Send OTP function
   - Verify OTP function
   - Resend OTP function

2. **API Route Updated**: `/app/api/auth/send-otp/route.ts`
   - Now uses MSG91 instead of Twilio
   - Graceful error handling
   - OTP still stored in memory for verification

3. **Environment Variables Ready**: `.env`
   - Placeholders added for MSG91 credentials
   - Just need your actual Auth Key

4. **Verify OTP Route**: `/app/api/auth/verify-otp/route.ts`
   - No changes needed
   - Uses local storage (works perfectly)

### ⏳ What We're Waiting For

1. You to create MSG91 account
2. You to get the Auth Key
3. I'll add it to .env
4. We test and verify OTP works!

---

## MSG91 vs Twilio Comparison

| Feature | MSG91 | Twilio |
|---------|-------|--------|
| **Cost per SMS** | ₹0.15-0.25 | ₹0.60-0.80 |
| **Setup Time** | 10 minutes | 24-48 hours |
| **Trial Credits** | 100 SMS free | $15 (~₹1,250) |
| **India Focus** | ✅ Yes | ❌ No |
| **Verification** | None needed | Phone verification |
| **Production Ready** | ✅ Immediate | ⏳ After approval |

**Winner**: MSG91 for Indian numbers!

---

## Testing Plan (Once You Give Me Auth Key)

**Test 1: Send OTP**
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919765071249"}'
```

**Expected**:
- Response: `{"success": true, "message": "OTP sent successfully", "debug": "123456"}`
- You receive SMS on +919765071249 within 5 seconds

**Test 2: Verify OTP**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919765071249", "otp": "123456"}'
```

**Expected**:
- Response: `{"success": true, "phoneVerified": true}`

**Test 3: Test Invalid OTP**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919765071249", "otp": "000000"}'
```

**Expected**:
- Response: `{"error": "Invalid OTP. Please check and try again."}`

---

## Pricing Estimates for JarvisDaily

### Scenario 1: Development/Testing
- 100 OTP requests/day for testing
- Cost: **FREE** (using trial credits)

### Scenario 2: Early Production (100 users/month)
- 100 signups = 100 OTPs
- Some users retry = 150 OTPs total
- Cost: **150 × ₹0.20 = ₹30/month**

### Scenario 3: Growth (500 users/month)
- 500 signups = 500 OTPs
- Retries/resends = 750 OTPs total
- Cost: **750 × ₹0.20 = ₹150/month**

### Scenario 4: Scale (5,000 users/month)
- 5,000 signups = 5,000 OTPs
- Retries = 7,500 OTPs total
- Cost: **7,500 × ₹0.20 = ₹1,500/month**

**Extremely affordable!**

---

## Next Steps

### Immediate (Today):

1. **You**: Create MSG91 account (5 min)
2. **You**: Get Auth Key (2 min)
3. **You**: Send me the Auth Key
4. **Me**: Add to .env and test
5. **Both**: Verify OTP arrives on your phone
6. **Both**: Test complete flow
7. ✅ **DONE**: Phase 1.1 complete!

### After Testing:

1. Create proper OTP template in MSG91
2. Set up DLT registration (for production compliance)
3. Add rate limiting (prevent spam)
4. Move to Phase 1.2 (Signup Page UI)

---

## Support

**MSG91 Documentation**: https://docs.msg91.com/
**MSG91 Support**: support@msg91.com
**Phone**: 1800-102-7007 (India)

**If you have issues**:
- Check spam folder for verification email
- Ensure mobile number is correct (+919765071249)
- Try different browser if signup fails

---

## Ready?

**Let me know when you have**:
✅ Created MSG91 account
✅ Got the Auth Key

Then I'll immediately:
1. Add your Auth Key to `.env`
2. Restart the dev server
3. Test sending OTP to your phone
4. Verify it works end-to-end

**This should take 5-10 minutes total!** 🚀

---

*Generated with [Claude Code](https://claude.com/claude-code)*
