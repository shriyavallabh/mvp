# Common Clerk Signup Errors - Troubleshooting Guide

## Most Likely Causes:

### 1. Password Requirements Not Met
**Symptoms**: Generic "Failed to create account" error
**Solution**: Check Clerk Dashboard → User & Authentication → Email, Phone, Username → Password Settings
- Minimum length (default: 8)
- Requires uppercase
- Requires numbers  
- Requires special characters

### 2. Email Domain Restrictions
**Symptoms**: Signup fails silently
**Solution**: Check Clerk Dashboard → Restrictions
- Allowed email domains
- Blocked email domains
- Test emails (@example.com) might be blocked

### 3. Phone Number Format Issues
**Symptoms**: "Invalid phone number" or generic error
**Solution**: 
- Clerk expects international format: +919876543210
- Our code sends: "919876543210" (no +)
- **FIX NEEDED**: Add + prefix

### 4. Email Verification Required
**Symptoms**: Account created but verification needed
**Solution**: Clerk Dashboard → Email Settings → Disable "Email Verification"

### 5. Test Mode Restrictions
**Symptoms**: Only certain emails work
**Solution**: Clerk test instances may have restrictions on email domains

### 6. API Key Mismatch
**Symptoms**: All signups fail
**Solution**: Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY matches the instance

## Quick Fixes to Try:

1. **Try a real email domain** (not @example.com or @test.com)
2. **Check password has uppercase + numbers + 8+ chars**
3. **Verify Clerk Dashboard "Email Verification" is OFF**

