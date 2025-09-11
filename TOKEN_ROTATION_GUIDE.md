# WhatsApp Access Token Rotation Guide

## CRITICAL: Immediate Action Required

The current WhatsApp access token has been exposed in source code and must be rotated immediately.

## Steps to Rotate Token

1. **Login to Meta Business Manager**
   - Go to https://business.facebook.com
   - Navigate to your WhatsApp Business Account

2. **Generate New Access Token**
   - Go to Settings > System Users
   - Select your system user
   - Click "Generate New Token"
   - Select WhatsApp permissions:
     - whatsapp_business_messaging
     - whatsapp_business_management
   - Generate and copy the new token

3. **Update .env File**
   ```bash
   # Replace the old token with the new one
   WHATSAPP_ACCESS_TOKEN=your_new_token_here
   ```

4. **Verify New Token Works**
   ```bash
   # Test with a simple API call
   curl -X GET "https://graph.facebook.com/v21.0/574744175733556" \
     -H "Authorization: Bearer YOUR_NEW_TOKEN"
   ```

5. **Invalidate Old Token**
   - In Meta Business Manager, find the old token
   - Click "Revoke" to invalidate it immediately

## Prevention Measures

1. Never commit tokens to source control
2. Always use environment variables
3. Add .env to .gitignore
4. Use secret management tools in production
5. Rotate tokens regularly (every 90 days minimum)

## After Rotation

Once the token is rotated:
1. Update all .env files across environments
2. Restart all services using the token
3. Verify all integrations are working
4. Document the rotation date

Last Rotation: [TO BE FILLED AFTER ROTATION]
Next Rotation Due: [90 DAYS FROM ROTATION DATE]