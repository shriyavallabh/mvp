#!/usr/bin/env node
/**
 * Automatically set Vercel environment variables
 * Uses Vercel API to configure all needed env vars for webhook
 */

require('dotenv').config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'jAxr7wRF6lKNvkRLCU6HPMsg';
const PROJECT_ID = 'prj_QQAial59AHSd44kXyY1fGkPk3rkA';
const TEAM_ID = 'team_kgmzsZJ64NGLaTPyLRBWV3vz';

const envVars = [
    {
        key: 'WHATSAPP_PHONE_NUMBER_ID',
        value: '792411637295195',
        type: 'encrypted',
        target: ['production', 'preview', 'development']
    },
    {
        key: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        value: '1502194177669589',
        type: 'encrypted',
        target: ['production', 'preview', 'development']
    },
    {
        key: 'WHATSAPP_ACCESS_TOKEN',
        value: 'EAAMADo1n9VMBPig8H4zoZCOvEAZAihn0RWir4QsqjaDwqwZAZC5ZCeSZBputO7BqMGmictvxsQ5lnW4WZB3fJOegaKxf3PkvcZAHcZCpKYBYaJ2KCZC57QpXwhAiZCJPJ8YZAPsq2o2LMJen32XjjeasSbLqIljgaPxkHJA8ZBUYZBoqYkcYZBELrkq5xZBZA3VjZAkZARngQZDZD',
        type: 'encrypted',
        target: ['production', 'preview', 'development']
    },
    {
        key: 'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
        value: 'finadvise-webhook-2024',
        type: 'encrypted',
        target: ['production', 'preview', 'development']
    },
    {
        key: 'WHATSAPP_APP_SECRET',
        value: '57183e372dff09aa046032867bf3dde3',
        type: 'encrypted',
        target: ['production', 'preview', 'development']
    }
];

async function setEnvVar(envVar) {
    const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(envVar)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ ${envVar.key}: Set successfully`);
            return { success: true, key: envVar.key };
        } else {
            // Check if it already exists
            if (result.error && result.error.code === 'ENV_ALREADY_EXISTS') {
                console.log(`⚠️  ${envVar.key}: Already exists, updating...`);

                // Get existing env var ID
                const listUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;
                const listResponse = await fetch(listUrl, {
                    headers: {
                        'Authorization': `Bearer ${VERCEL_TOKEN}`
                    }
                });
                const listData = await listResponse.json();

                const existing = listData.envs?.find(e => e.key === envVar.key);
                if (existing) {
                    // Delete old one
                    const deleteUrl = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${existing.id}?teamId=${TEAM_ID}`;
                    await fetch(deleteUrl, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${VERCEL_TOKEN}`
                        }
                    });

                    // Create new one
                    const retryResponse = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${VERCEL_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(envVar)
                    });

                    if (retryResponse.ok) {
                        console.log(`✅ ${envVar.key}: Updated successfully`);
                        return { success: true, key: envVar.key };
                    }
                }
            }

            console.log(`❌ ${envVar.key}: Failed`);
            console.log(`   Error:`, result.error?.message || JSON.stringify(result));
            return { success: false, key: envVar.key, error: result };
        }
    } catch (error) {
        console.log(`❌ ${envVar.key}: Error - ${error.message}`);
        return { success: false, key: envVar.key, error: error.message };
    }
}

async function main() {
    console.log('🚀 Setting up Vercel Environment Variables\n');
    console.log('=' .repeat(60));
    console.log(`Project: finadvise-webhook`);
    console.log(`Project ID: ${PROJECT_ID}`);
    console.log(`Team ID: ${TEAM_ID}`);
    console.log('=' .repeat(60) + '\n');

    const results = [];

    for (const envVar of envVars) {
        const result = await setEnvVar(envVar);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between calls
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Success: ${successful}/${envVars.length}`);
    console.log(`❌ Failed: ${failed}/${envVars.length}`);

    if (successful === envVars.length) {
        console.log('\n🎉 All environment variables set successfully!');
        console.log('\n🔜 Next steps:');
        console.log('   1. Deploy: vercel --prod');
        console.log('   2. Configure webhook in Meta');
        console.log('   3. Test: curl https://jarvisdaily.in/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=finadvise-webhook-2024');
    } else {
        console.log('\n⚠️  Some variables failed to set. Check errors above.');
    }

    console.log('\n' + '=' .repeat(60) + '\n');
}

main();
