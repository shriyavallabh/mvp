#!/usr/bin/env node
/**
 * Setup guide for using Meta Cloud API directly (no AiSensy needed)
 * Saves ₹2,399/month while keeping all functionality
 */

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 DITCH AISENSY - USE META CLOUD API DIRECTLY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💰 COST COMPARISON\n');
console.log('With AiSensy:');
console.log('  • Monthly: ₹2,399 (Pro plan)');
console.log('  • Per message: ₹0.22 (utility template)');
console.log('  • Total for 4 advisors: ₹2,425/month\n');

console.log('Direct Meta API:');
console.log('  • Monthly: ₹0 (FREE!)');
console.log('  • Per message: ₹0.22 (same as AiSensy)');
console.log('  • Total for 4 advisors: ₹26/month\n');

console.log('💸 SAVINGS: ₹2,373/month = ₹28,476/year\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 SETUP STEPS (30 minutes one-time)\n');

console.log('STEP 1: Create Meta Business Account (5 min)');
console.log('─────────────────────────────────────────────');
console.log('1. Go to: https://business.facebook.com');
console.log('2. Click "Create Account"');
console.log('3. Fill in business details:');
console.log('   • Business name: JarvisDaily');
console.log('   • Your name: [Your name]');
console.log('   • Email: [Your business email]');
console.log('4. Verify email\n');

console.log('STEP 2: Create Meta App (5 min)');
console.log('─────────────────────────────────────────────');
console.log('1. Go to: https://developers.facebook.com/apps');
console.log('2. Click "Create App"');
console.log('3. Choose "Business" type');
console.log('4. Fill in:');
console.log('   • App name: JarvisDaily WhatsApp');
console.log('   • Contact email: [Your email]');
console.log('   • Business account: [Select your business]');
console.log('5. Click "Create App"\n');

console.log('STEP 3: Add WhatsApp Product (5 min)');
console.log('─────────────────────────────────────────────');
console.log('1. In App Dashboard → Click "Add Product"');
console.log('2. Find "WhatsApp" → Click "Set Up"');
console.log('3. Two options:\n');
console.log('   Option A: Use Test Number (for testing)');
console.log('   ✅ FREE test number provided by Meta');
console.log('   ✅ Can send to 5 verified phone numbers');
console.log('   ✅ Perfect for testing with your 4 advisors');
console.log('   ❌ Shows "Test" badge in WhatsApp\n');
console.log('   Option B: Use Production Number');
console.log('   ✅ Professional (no test badge)');
console.log('   ⚠️ Need to verify phone number ownership');
console.log('   ⚠️ Slightly more setup\n');

console.log('STEP 4: Get Access Token (5 min)');
console.log('─────────────────────────────────────────────');
console.log('1. In WhatsApp product → "Getting Started"');
console.log('2. Find "Temporary access token" section');
console.log('3. Copy the token (valid for 24 hours)\n');
console.log('For PERMANENT token:');
console.log('4. Go to "Business Settings" → "System Users"');
console.log('5. Create system user with Admin role');
console.log('6. Generate token with permissions:');
console.log('   • whatsapp_business_messaging');
console.log('   • whatsapp_business_management');
console.log('7. Save token securely in .env\n');

console.log('STEP 5: Get Required IDs (2 min)');
console.log('─────────────────────────────────────────────');
console.log('1. Phone Number ID:');
console.log('   • In WhatsApp → "Getting Started"');
console.log('   • Copy "Phone number ID"');
console.log('   • Add to .env as WHATSAPP_PHONE_NUMBER_ID\n');
console.log('2. WhatsApp Business Account ID:');
console.log('   • In WhatsApp → "Getting Started"');
console.log('   • Copy "WhatsApp Business Account ID"');
console.log('   • Add to .env as WHATSAPP_BUSINESS_ACCOUNT_ID\n');

console.log('STEP 6: Configure Webhook (5 min)');
console.log('─────────────────────────────────────────────');
console.log('1. In WhatsApp → "Configuration"');
console.log('2. Click "Edit" on Webhook');
console.log('3. Set:');
console.log('   • Callback URL: https://your-app.vercel.app/api/webhook');
console.log('   • Verify token: finadvise-webhook-2024');
console.log('   • Subscribe to: "messages"');
console.log('4. Click "Verify and Save"\n');

console.log('STEP 7: Update .env File (2 min)');
console.log('─────────────────────────────────────────────');
console.log('Add these variables to .env:\n');
console.log('WHATSAPP_PHONE_NUMBER_ID=574744175733556');
console.log('WHATSAPP_BUSINESS_ACCOUNT_ID=<your_waba_id>');
console.log('WHATSAPP_ACCESS_TOKEN=<your_permanent_token>');
console.log('WHATSAPP_WEBHOOK_VERIFY_TOKEN=finadvise-webhook-2024');
console.log('WHATSAPP_APP_SECRET=<your_app_secret>\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TESTING\n');

console.log('1. Create template via Meta API:');
console.log('   node create-template-meta-direct.js\n');

console.log('2. Send test message:');
console.log('   node send-via-meta-direct.js\n');

console.log('3. Click button → Check webhook logs:');
console.log('   vercel logs --follow\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ WHAT YOU GET WITHOUT AISENSY\n');

console.log('✅ Same functionality:');
console.log('  • Send WhatsApp templates');
console.log('  • Receive button clicks via webhook');
console.log('  • Send free-flow messages');
console.log('  • Track delivery status\n');

console.log('✅ Better features:');
console.log('  • FREE webhooks (AiSensy charges extra)');
console.log('  • Direct Meta API access (no middleman)');
console.log('  • Full control over implementation');
console.log('  • No monthly subscription\n');

console.log('⚠️ What you lose:');
console.log('  • Visual template builder (use code instead)');
console.log('  • Contact management UI (use your database)');
console.log('  • Analytics dashboard (build your own)');
console.log('  • Support team (use Meta docs + forums)\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 RECOMMENDATION\n');

console.log('For 4 advisors: DITCH AISENSY ✅');
console.log('  • You have technical skills');
console.log('  • Small scale (4 contacts)');
console.log('  • Save ₹28,476/year');
console.log('  • Same functionality\n');

console.log('Consider AiSensy only if:');
console.log('  ❌ Non-technical team needs to manage');
console.log('  ❌ Scaling to 100+ advisors (UI becomes valuable)');
console.log('  ❌ Need client-facing dashboard');
console.log('  ❌ Want managed service with support\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 NEXT STEPS\n');

console.log('1. Create Meta Business Account (if you don\'t have)');
console.log('2. Create Meta App with WhatsApp product');
console.log('3. Get access token and IDs');
console.log('4. Update .env file');
console.log('5. Test template creation: node create-template-meta-direct.js');
console.log('6. Test sending: node send-via-meta-direct.js');
console.log('7. Cancel AiSensy subscription (save ₹2,399/month!)');
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
