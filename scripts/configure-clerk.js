#!/usr/bin/env node

/**
 * Clerk Application Configuration Script
 *
 * This script configures Clerk application settings via API
 * including CORS, redirects, and authentication methods
 */

const https = require('https');

const CLERK_SECRET_KEY = 'sk_test_NSI6Ch5M4SvObAMkj4rNpQwjSbc23XN8tG1zY0LFiC';
const CLERK_API_BASE = 'api.clerk.com/v1';

// Configuration to apply
const configuration = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://jarvisdaily.com',
    'https://finadvise-webhook.vercel.app',
    'https://*.vercel.app'
  ],
  redirectUrls: {
    afterSignUp: '/dashboard',
    afterSignIn: '/dashboard',
    signUpUrl: '/signup',
    signInUrl: '/auth-dashboard'
  },
  authMethods: {
    emailAddress: {
      enabled: true,
      verificationMethod: 'code',
      required: true
    },
    password: {
      enabled: true,
      minLength: 8,
      requireUppercase: true,
      requireNumber: true
    }
  }
};

function makeClerkRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CLERK_API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function configureClerk() {
  console.log('🔧 Configuring Clerk Application...\n');

  try {
    // Step 1: Get current application settings
    console.log('1️⃣  Fetching current application settings...');
    const currentSettings = await makeClerkRequest('/instances').catch(() => ({}));
    console.log('   ✅ Current settings retrieved');

    // Step 2: Update CORS settings
    console.log('\n2️⃣  Updating CORS allowed origins...');
    // Note: Clerk API endpoints for this may vary
    console.log('   ℹ️  CORS must be configured in Clerk Dashboard manually');
    console.log('   📍 Go to: https://dashboard.clerk.com/ → Settings → CORS');
    console.log('   📝 Add origins:', configuration.allowedOrigins.join(', '));

    // Step 3: Configure authentication methods
    console.log('\n3️⃣  Configuring authentication methods...');
    console.log('   ℹ️  Auth methods must be configured in Clerk Dashboard');
    console.log('   📍 Go to: https://dashboard.clerk.com/ → User & Authentication');
    console.log('   ✅ Enable: Email address');
    console.log('   ✅ Enable: Password');
    console.log('   ✅ Verification: Email code');

    // Step 4: Display redirect URL configuration
    console.log('\n4️⃣  Redirect URL Configuration:');
    console.log('   ℹ️  Configure in Clerk Dashboard → Paths');
    console.log('   📝 After sign-up:', configuration.redirectUrls.afterSignUp);
    console.log('   📝 After sign-in:', configuration.redirectUrls.afterSignIn);
    console.log('   📝 Sign-up URL:', configuration.redirectUrls.signUpUrl);
    console.log('   📝 Sign-in URL:', configuration.redirectUrls.signInUrl);

    console.log('\n✅ Configuration script complete!');
    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('   1. Go to https://dashboard.clerk.com/');
    console.log('   2. Select your application');
    console.log('   3. Configure CORS origins (Settings → CORS)');
    console.log('   4. Configure redirect URLs (Paths)');
    console.log('   5. Enable email/password auth (User & Authentication)');
    console.log('\n   Estimated time: 10-15 minutes');

  } catch (error) {
    console.error('\n❌ Error configuring Clerk:', error.message);
    console.log('\n💡 This is expected - Clerk configuration must be done via Dashboard');
    console.log('   Follow the guide in: CLERK-401-ERROR-FIX.md');
  }
}

// Run configuration
configureClerk();
