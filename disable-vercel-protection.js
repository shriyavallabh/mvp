#!/usr/bin/env node
/**
 * Disable Vercel Deployment Protection so webhook can be accessed publicly
 */

const VERCEL_TOKEN = 'jAxr7wRF6lKNvkRLCU6HPMsg';
const PROJECT_ID = 'prj_QQAial59AHSd44kXyY1fGkPk3rkA';
const TEAM_ID = 'team_kgmzsZJ64NGLaTPyLRBWV3vz';

async function disableProtection() {
    console.log('🔓 Disabling Vercel Deployment Protection...\n');

    const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}?teamId=${TEAM_ID}`;

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ssoProtection: null,
                passwordProtection: null
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Protection disabled successfully!\n');
            console.log('📋 Project settings updated:');
            console.log(`   SSO Protection: ${result.ssoProtection ? 'Enabled' : 'Disabled'}`);
            console.log(`   Password Protection: ${result.passwordProtection ? 'Enabled' : 'Disabled'}`);
            console.log('\n🔜 Next: Webhook should now be publicly accessible');
            console.log('   Test: curl https://finadvise-webhook-dlhggfyvu-shriyavallabhs-projects.vercel.app/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=finadvise-webhook-2024');
        } else {
            console.log('❌ Failed to update project settings');
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

disableProtection();
