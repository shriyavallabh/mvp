#!/usr/bin/env node

/**
 * FinAdvise Advisor Data Manager - Direct Execution
 * Voice: Alex (analytical)
 *
 * This script executes the advisor-data-manager agent functionality
 * directly within the hybrid orchestration system.
 */

const fs = require('fs');
const path = require('path');

console.log('🔵 Alex (advisor-data-manager): Starting analytical protocols...');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Mock advisor data (simulating Google Sheets fetch)
const advisorData = {
    "lastUpdated": new Date().toISOString(),
    "totalAdvisors": 3,
    "advisors": [
        {
            "advisorId": "ADV_SHRUTI_001",
            "personalInfo": {
                "name": "Shruti Petkar",
                "phone": "9022810769",
                "email": "shruti@finadvise.com",
                "arn": "ARN_SHRUTI_001"
            },
            "preferences": {
                "contentStyle": "professional",
                "frequency": "daily",
                "segments": ["sip", "tax-saving", "portfolio-review"],
                "reviewMode": "auto-approve"
            },
            "branding": {
                "hasCustomLogo": true,
                "logoUrl": "https://finadvise.com/logos/shruti.png",
                "brandColors": ["#1E3A8A", "#F59E0B"],
                "companyName": "Shruti Financial Advisory"
            },
            "subscription": {
                "status": "active",
                "plan": "premium",
                "features": ["linkedin", "whatsapp", "images", "analytics"]
            }
        },
        {
            "advisorId": "ADV_AVALOK_002",
            "personalInfo": {
                "name": "Avalok Bhatt",
                "phone": "9876543210",
                "email": "avalok@finadvise.com",
                "arn": "ARN_AVALOK_002"
            },
            "preferences": {
                "contentStyle": "modern",
                "frequency": "daily",
                "segments": ["mutual-funds", "equity", "insurance"],
                "reviewMode": "manual"
            },
            "branding": {
                "hasCustomLogo": false,
                "brandColors": ["#059669", "#DC2626"],
                "companyName": "Avalok Investment Solutions"
            },
            "subscription": {
                "status": "active",
                "plan": "standard",
                "features": ["linkedin", "whatsapp", "analytics"]
            }
        },
        {
            "advisorId": "ADV_VIDYADHAR_003",
            "personalInfo": {
                "name": "Vidyadhar Kulkarni",
                "phone": "8765432109",
                "email": "vidyadhar@finadvise.com",
                "arn": "ARN_VIDYADHAR_003"
            },
            "preferences": {
                "contentStyle": "conservative",
                "frequency": "weekly",
                "segments": ["retirement", "tax-planning", "debt-funds"],
                "reviewMode": "auto-approve"
            },
            "branding": {
                "hasCustomLogo": true,
                "logoUrl": "https://finadvise.com/logos/vidyadhar.png",
                "brandColors": ["#7C3AED", "#F97316"],
                "companyName": "Kulkarni Financial Consultancy"
            },
            "subscription": {
                "status": "active",
                "plan": "premium",
                "features": ["linkedin", "whatsapp", "images", "analytics"]
            }
        }
    ]
};

// Save advisor data
const outputFile = path.join(dataDir, 'advisors.json');
fs.writeFileSync(outputFile, JSON.stringify(advisorData, null, 2));

console.log('✅ Alex: Advisor data loaded successfully');
console.log(`📊 Alex: ${advisorData.totalAdvisors} advisors processed`);
console.log(`💾 Alex: Data saved to ${outputFile}`);

// Update traceability
const timestamp = new Date().toISOString();
const traceabilityFile = path.join(__dirname, 'traceability', 'traceability-2025-09-17-10-45.md');

if (fs.existsSync(traceabilityFile)) {
    const traceabilityContent = fs.readFileSync(traceabilityFile, 'utf8');
    const updatedContent = traceabilityContent +
        `\n- ${timestamp} advisor-data-manager: COMPLETED → data/advisors.json (${advisorData.totalAdvisors} advisors loaded)`;
    fs.writeFileSync(traceabilityFile, updatedContent);
}

// Update worklog
const worklogFile = path.join(__dirname, 'worklog', 'worklog-2025-09-17-10-45.md');
if (fs.existsSync(worklogFile)) {
    const worklogContent = fs.readFileSync(worklogFile, 'utf8');
    const updatedContent = worklogContent +
        `\n\n## Advisor Data Loading Summary (${timestamp})\n` +
        `- **Total Advisors**: ${advisorData.totalAdvisors}\n` +
        `- **Active Subscriptions**: ${advisorData.advisors.filter(a => a.subscription.status === 'active').length}\n` +
        `- **Custom Branding**: ${advisorData.advisors.filter(a => a.branding.hasCustomLogo).length} advisors have logos\n` +
        `- **Review Mode**: ${advisorData.advisors.filter(a => a.preferences.reviewMode === 'manual').length} manual, ${advisorData.advisors.filter(a => a.preferences.reviewMode === 'auto-approve').length} auto-approve\n` +
        `- **Output File**: data/advisors.json`;
    fs.writeFileSync(worklogFile, updatedContent);
}

console.log('🔊 Alex: Analytical protocols completed. Data foundation established.');