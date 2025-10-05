#!/usr/bin/env node
/**
 * Configure Meta App with required fields for publishing
 */

const APP_ID = '100088701756168';
const ACCESS_TOKEN = 'EAAMADo1n9VMBPig8H4zoZCOvEAZAihn0RWir4QsqjaDwqwZAZC5ZCeSZBputO7BqMGmictvxsQ5lnW4WZB3fJOegaKxf3PkvcZAHcZCpKYBYaJ2KCZC57QpXwhAiZCJPJ8YZAPsq2o2LMJen32XjjeasSbLqIljgaPxkHJA8ZBUYZBoqYkcYZBELrkq5xZBZA3VjZAkZARngQZDZD';

async function configureApp() {
    console.log('⚙️  Configuring Meta App for Publishing\n');
    console.log('='.repeat(60));

    // Step 1: Set app domain
    console.log('\n1️⃣  Setting app domain to jarvisdaily.com...');

    const domainUrl = `https://graph.facebook.com/v17.0/${APP_ID}`;

    const domainPayload = {
        app_domains: ['jarvisdaily.com'],
        access_token: ACCESS_TOKEN
    };

    try {
        const domainResponse = await fetch(domainUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(domainPayload)
        });

        const domainResult = await domainResponse.json();

        if (domainResponse.ok) {
            console.log('   ✅ App domain configured: jarvisdaily.com');
        } else {
            console.log('   ⚠️  Domain configuration:', domainResult.error?.message || JSON.stringify(domainResult));
        }
    } catch (error) {
        console.log('   ❌ Error setting domain:', error.message);
    }

    // Step 2: Set Privacy Policy URL
    console.log('\n2️⃣  Setting Privacy Policy URL...');

    const privacyUrl = `https://graph.facebook.com/v17.0/${APP_ID}`;

    const privacyPayload = {
        privacy_policy_url: 'https://jarvisdaily.com/privacy',
        access_token: ACCESS_TOKEN
    };

    try {
        const privacyResponse = await fetch(privacyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(privacyPayload)
        });

        const privacyResult = await privacyResponse.json();

        if (privacyResponse.ok) {
            console.log('   ✅ Privacy Policy URL set: https://jarvisdaily.com/privacy');
        } else {
            console.log('   ⚠️  Privacy policy:', privacyResult.error?.message || JSON.stringify(privacyResult));
        }
    } catch (error) {
        console.log('   ❌ Error setting privacy policy:', error.message);
    }

    // Step 3: Set Terms of Service URL
    console.log('\n3️⃣  Setting Terms of Service URL...');

    const tosUrl = `https://graph.facebook.com/v17.0/${APP_ID}`;

    const tosPayload = {
        terms_of_service_url: 'https://jarvisdaily.com/terms',
        access_token: ACCESS_TOKEN
    };

    try {
        const tosResponse = await fetch(tosUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tosPayload)
        });

        const tosResult = await tosResponse.json();

        if (tosResponse.ok) {
            console.log('   ✅ Terms of Service URL set: https://jarvisdaily.com/terms');
        } else {
            console.log('   ⚠️  Terms of service:', tosResult.error?.message || JSON.stringify(tosResult));
        }
    } catch (error) {
        console.log('   ❌ Error setting terms of service:', error.message);
    }

    // Verify settings
    console.log('\n4️⃣  Verifying configuration...');

    const verifyUrl = `https://graph.facebook.com/v17.0/${APP_ID}?fields=app_domains,privacy_policy_url,terms_of_service_url&access_token=${ACCESS_TOKEN}`;

    try {
        const verifyResponse = await fetch(verifyUrl);
        const verifyData = await verifyResponse.json();

        console.log('\n📋 Current Configuration:');
        console.log(`   App Domains: ${verifyData.app_domains?.join(', ') || 'Not set'}`);
        console.log(`   Privacy Policy: ${verifyData.privacy_policy_url || 'Not set'}`);
        console.log(`   Terms of Service: ${verifyData.terms_of_service_url || 'Not set'}`);

        const allSet = verifyData.app_domains?.length > 0 &&
                      verifyData.privacy_policy_url &&
                      verifyData.terms_of_service_url;

        console.log('\n' + '='.repeat(60));

        if (allSet) {
            console.log('\n✅ SUCCESS! All required fields configured.');
            console.log('\n📝 NEXT STEPS:');
            console.log('   1. Create simple privacy and terms pages:');
            console.log('      • /api/privacy.js');
            console.log('      • /api/terms.js');
            console.log('   2. Deploy to Vercel');
            console.log('   3. Go to App Review dashboard');
            console.log('   4. Request permissions and submit for review');
        } else {
            console.log('\n⚠️  Some fields could not be set via API.');
            console.log('   You may need to set them manually in Meta dashboard.');
        }

    } catch (error) {
        console.log('   ❌ Error verifying:', error.message);
    }

    console.log('\n💡 IMPORTANT NOTES:');
    console.log('   • Privacy & Terms pages MUST be publicly accessible');
    console.log('   • Pages should be simple, clear policies');
    console.log('   • Meta will check these URLs during review');
    console.log('   • I can create basic pages for you if needed');
}

configureApp();
