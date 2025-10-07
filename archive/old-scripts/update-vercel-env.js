#!/usr/bin/env node
/**
 * Update or create Vercel environment variables
 */

require('dotenv').config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'jAxr7wRF6lKNvkRLCU6HPMsg';
const PROJECT_ID = 'prj_QQAial59AHSd44kXyY1fGkPk3rkA';
const TEAM_ID = 'team_kgmzsZJ64NGLaTPyLRBWV3vz';

const desiredEnvVars = {
    'WHATSAPP_PHONE_NUMBER_ID': '792411637295195',
    'WHATSAPP_BUSINESS_ACCOUNT_ID': '1502194177669589',
    'WHATSAPP_ACCESS_TOKEN': 'EAAMADo1n9VMBPig8H4zoZCOvEAZAihn0RWir4QsqjaDwqwZAZC5ZCeSZBputO7BqMGmictvxsQ5lnW4WZB3fJOegaKxf3PkvcZAHcZCpKYBYaJ2KCZC57QpXwhAiZCJPJ8YZAPsq2o2LMJen32XjjeasSbLqIljgaPxkHJA8ZBUYZBoqYkcYZBELrkq5xZBZA3VjZAkZARngQZDZD',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN': 'finadvise-webhook-2024',
    'WHATSAPP_APP_SECRET': '57183e372dff09aa046032867bf3dde3'
};

async function listExistingEnvVars() {
    const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
    });

    const data = await response.json();
    return data.envs || [];
}

async function deleteEnvVar(envId) {
    const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${envId}?teamId=${TEAM_ID}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
    });

    return response.ok;
}

async function createEnvVar(key, value) {
    const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview', 'development']
        })
    });

    const result = await response.json();
    return { ok: response.ok, data: result };
}

async function main() {
    console.log('🔍 Checking existing Vercel environment variables...\n');

    const existing = await listExistingEnvVars();

    console.log('📋 Current environment variables:');
    existing.forEach(env => {
        console.log(`   • ${env.key} (ID: ${env.id})`);
    });

    console.log('\n🔄 Updating/Creating variables...\n');

    const results = [];

    for (const [key, value] of Object.entries(desiredEnvVars)) {
        const existingVar = existing.find(e => e.key === key);

        if (existingVar) {
            console.log(`🔄 ${key}: Found existing, updating...`);

            // Delete old
            const deleted = await deleteEnvVar(existingVar.id);
            if (!deleted) {
                console.log(`   ❌ Failed to delete old variable`);
                results.push({ key, success: false });
                continue;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            // Create new
            const { ok, data } = await createEnvVar(key, value);
            if (ok) {
                console.log(`   ✅ Updated successfully`);
                results.push({ key, success: true, action: 'updated' });
            } else {
                console.log(`   ❌ Failed to create:`, data.error?.message);
                results.push({ key, success: false });
            }
        } else {
            console.log(`➕ ${key}: Creating new...`);

            const { ok, data } = await createEnvVar(key, value);
            if (ok) {
                console.log(`   ✅ Created successfully`);
                results.push({ key, success: true, action: 'created' });
            } else {
                console.log(`   ❌ Failed:`, data.error?.message);
                results.push({ key, success: false });
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Success: ${successful}/5`);
    console.log(`❌ Failed: ${failed}/5`);

    if (successful === 5) {
        console.log('\n🎉 ALL ENVIRONMENT VARIABLES CONFIGURED!');
        console.log('\n✅ Your webhook is now configured with:');
        console.log('   • WHATSAPP_PHONE_NUMBER_ID');
        console.log('   • WHATSAPP_BUSINESS_ACCOUNT_ID');
        console.log('   • WHATSAPP_ACCESS_TOKEN');
        console.log('   • WHATSAPP_WEBHOOK_VERIFY_TOKEN');
        console.log('   • WHATSAPP_APP_SECRET');

        console.log('\n🔜 NEXT STEPS:');
        console.log('   1. Deploy to production:');
        console.log('      vercel --prod');
        console.log('');
        console.log('   2. Configure webhook in Meta:');
        console.log('      URL: https://jarvisdaily.com/api/webhook');
        console.log('      Token: finadvise-webhook-2024');
        console.log('');
        console.log('   3. Test webhook:');
        console.log('      curl "https://jarvisdaily.com/api/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=finadvise-webhook-2024"');
        console.log('');
        console.log('   4. Create WhatsApp template:');
        console.log('      node create-template-meta-direct.js');
    }

    console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
