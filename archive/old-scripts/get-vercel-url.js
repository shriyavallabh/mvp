#!/usr/bin/env node
/**
 * Get actual Vercel deployment URL and test webhook
 */

const VERCEL_TOKEN = 'jAxr7wRF6lKNvkRLCU6HPMsg';
const PROJECT_ID = 'prj_QQAial59AHSd44kXyY1fGkPk3rkA';
const TEAM_ID = 'team_kgmzsZJ64NGLaTPyLRBWV3vz';

async function getDeployments() {
    const url = `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&limit=5`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`
        }
    });

    const data = await response.json();

    console.log('🔍 Recent Deployments:\n');

    if (data.deployments && data.deployments.length > 0) {
        data.deployments.forEach((dep, i) => {
            console.log(`${i + 1}. ${dep.url}`);
            console.log(`   State: ${dep.state}`);
            console.log(`   Created: ${new Date(dep.createdAt).toLocaleString()}`);
            if (dep.aliasAssigned) {
                console.log(`   Alias: ${dep.aliasAssigned}`);
            }
            console.log('');
        });

        const latestProduction = data.deployments.find(d => d.target === 'production' && d.state === 'READY');

        if (latestProduction) {
            console.log('✅ PRODUCTION DEPLOYMENT:');
            console.log(`   URL: https://${latestProduction.url}`);
            console.log('');
            console.log('🔧 USE THIS URL FOR WEBHOOK:');
            console.log(`   https://${latestProduction.url}/api/webhook`);
            console.log('');

            // Test webhook
            console.log('🧪 Testing webhook...\n');
            const webhookUrl = `https://${latestProduction.url}/api/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=finadvise-webhook-2024`;

            try {
                const testResponse = await fetch(webhookUrl);
                const testResult = await testResponse.text();

                if (testResult === 'test123') {
                    console.log('✅ Webhook is working correctly!');
                    console.log('   Response: test123\n');
                } else {
                    console.log('⚠️  Webhook response:', testResult);
                }
            } catch (error) {
                console.log('❌ Webhook test failed:', error.message);
            }
        } else {
            console.log('⚠️  No production deployment found');
            console.log('   Run: vercel --prod');
        }
    } else {
        console.log('❌ No deployments found');
        console.log('   Run: vercel --prod');
    }
}

getDeployments();
