#!/usr/bin/env node
/**
 * Automated Vercel Deployment Script
 * Usage: node scripts/deploy-to-vercel.js
 *
 * This script programmatically deploys to Vercel without manual intervention.
 */

const { execSync } = require('child_process');
require('dotenv').config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_QQAial59AHSd44kXyY1fGkPk3rkA';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found in .env file');
  console.error('Get your token from: https://vercel.com/account/tokens');
  process.exit(1);
}

console.log('🚀 Starting automated Vercel deployment...\n');

try {
  // Step 1: Check git status
  console.log('📋 Checking git status...');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });

  if (gitStatus.trim()) {
    console.log('📦 Uncommitted changes detected. Committing...');
    execSync('git add .', { stdio: 'inherit' });

    const commitMessage = process.argv[2] || 'chore: automated deployment';
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } else {
    console.log('✅ No uncommitted changes.');
  }

  // Step 2: Push to GitHub (triggers Vercel auto-deploy)
  console.log('\n🔄 Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('\n✅ Pushed to GitHub successfully!');
  console.log('🎯 Vercel is now auto-deploying...');
  console.log('\n📊 Monitor deployment:');
  console.log('   Dashboard: https://vercel.com/dashboard');
  console.log('   Logs: vercel logs --follow');
  console.log('   Production URL: https://finadvise-webhook.vercel.app');

  // Optional: Wait for deployment to complete
  console.log('\n⏳ Waiting 30 seconds for deployment to start...');
  execSync('sleep 30', { stdio: 'inherit' });

  console.log('📊 Fetching latest deployment status...');
  execSync('vercel ls --token=$VERCEL_TOKEN', { stdio: 'inherit' });

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n✅ Automated deployment complete!');
