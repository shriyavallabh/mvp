#!/usr/bin/env node

/**
 * Advisor Data Manager - Session-Isolated Execution
 * Phase 1, Agent #1 of FinAdvise Orchestration Pipeline
 * Session: session_1759383378
 */

const fs = require('fs');
const path = require('path');

// Session Configuration
const SESSION_ID = 'session_1759383378';
const SESSION_OUTPUT = `/Users/shriyavallabh/Desktop/mvp/output/${SESSION_ID}`;
const SESSION_SHARED_MEMORY = `/Users/shriyavallabh/Desktop/mvp/data/shared-memory/${SESSION_ID}`;
const SESSION_LEARNINGS = `/Users/shriyavallabh/Desktop/mvp/learnings/sessions/${SESSION_ID}`;

// Ensure directories exist
[SESSION_OUTPUT, SESSION_SHARED_MEMORY, SESSION_LEARNINGS].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔵 ADVISOR DATA MANAGER - Phase 1, Agent #1');
console.log(`📁 Session: ${SESSION_ID}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Initialize traceability
const traceabilityFile = path.join(SESSION_LEARNINGS, 'traceability.md');
const timestamp = new Date().toISOString();

function logTrace(message) {
  const entry = `- [${timestamp}] advisor-data-manager: ${message}\n`;
  fs.appendFileSync(traceabilityFile, entry);
}

// Start traceability
if (!fs.existsSync(traceabilityFile)) {
  fs.writeFileSync(traceabilityFile, `# Traceability Matrix - ${SESSION_ID}\n\n`);
}
logTrace(`STARTED (Session: ${SESSION_ID})`);

try {
  // Load advisor data from local file
  console.log('📊 Loading advisor data from data/advisors.json...\n');
  const advisorsPath = '/Users/shriyavallabh/Desktop/mvp/data/advisors.json';
  const advisorsRaw = fs.readFileSync(advisorsPath, 'utf8');
  const advisors = JSON.parse(advisorsRaw);

  // Process each advisor
  const processedAdvisors = [];
  const brandingStats = {
    withLogos: 0,
    withColors: 0,
    withTaglines: 0,
    totalAUM: 0
  };

  const warnings = [];
  const learnings = [];

  advisors.forEach(advisor => {
    // Validate required fields
    if (!advisor.phone) {
      warnings.push(`${advisor.id}: Missing phone number`);
    }
    if (!advisor.arn) {
      warnings.push(`${advisor.id}: Missing ARN`);
    }
    if (!advisor.activeSubscription) {
      warnings.push(`${advisor.id}: Inactive subscription - excluding from processing`);
      return;
    }

    // Extract branding information
    const branding = advisor.branding || {};
    if (branding.logo) brandingStats.withLogos++;
    if (branding.primaryColor && branding.secondaryColor) brandingStats.withColors++;
    if (branding.tagline) brandingStats.withTaglines++;

    // Structure advisor profile
    const profile = {
      advisorId: advisor.id,
      personalInfo: {
        name: advisor.name,
        phone: advisor.phone,
        email: advisor.email,
        arn: advisor.arn
      },
      businessInfo: {
        firmName: advisor.firmName || advisor.name,
        advisorType: advisor.advisorType || 'Standard',
        experience: advisor.experience || 'Not specified',
        aum: advisor.aum || '₹0 Crores',
        clientCount: advisor.clientCount || 0
      },
      segmentInfo: {
        primarySegment: advisor.advisorType || 'Silver',
        clientDemographics: advisor.clientDemographics || [],
        focusAreas: advisor.focusAreas || []
      },
      customization: {
        brandName: branding.brandName || advisor.name,
        logoUrl: branding.logo || null,
        brandColors: {
          primary: branding.primaryColor || '#1A73E8',
          secondary: branding.secondaryColor || '#34A853'
        },
        tagline: branding.tagline || 'Building Wealth Together',
        disclaimer: branding.disclaimer || null
      },
      preferences: {
        contentStyle: advisor.preferences?.contentStyle || 'professional',
        approvalMode: advisor.preferences?.approvalMode || 'manual',
        deliveryTime: advisor.preferences?.deliveryTime || '09:00',
        timezone: advisor.preferences?.timezone || 'Asia/Kolkata',
        languages: advisor.preferences?.languages || ['English']
      },
      subscription: {
        plan: advisor.advisorType || 'Silver',
        status: advisor.activeSubscription ? 'Active' : 'Inactive',
        validUntil: advisor.subscriptionValidUntil || '2025-12-31'
      }
    };

    processedAdvisors.push(profile);
  });

  // Calculate data quality
  const totalFields = processedAdvisors.length * 10; // 10 key fields per advisor
  let filledFields = 0;
  processedAdvisors.forEach(advisor => {
    if (advisor.personalInfo.name) filledFields++;
    if (advisor.personalInfo.phone) filledFields++;
    if (advisor.personalInfo.email) filledFields++;
    if (advisor.personalInfo.arn) filledFields++;
    if (advisor.customization.logoUrl) filledFields++;
    if (advisor.customization.brandColors.primary) filledFields++;
    if (advisor.customization.tagline) filledFields++;
    if (advisor.preferences.contentStyle) filledFields++;
    if (advisor.subscription.status === 'Active') filledFields++;
    if (advisor.businessInfo.advisorType) filledFields++;
  });

  const dataQuality = totalFields > 0 ? (filledFields / totalFields) : 0;

  // Prepare output
  const output = {
    success: true,
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
    advisorCount: processedAdvisors.length,
    advisors: processedAdvisors,
    metadata: {
      activeSubscriptions: processedAdvisors.filter(a => a.subscription.status === 'Active').length,
      premiumAdvisors: processedAdvisors.filter(a => a.subscription.plan === 'Premium').length,
      goldAdvisors: processedAdvisors.filter(a => a.subscription.plan === 'Gold').length,
      silverAdvisors: processedAdvisors.filter(a => a.subscription.plan === 'Silver').length,
      customBranding: brandingStats.withLogos,
      dataQuality: parseFloat(dataQuality.toFixed(2)),
      brandingStats: brandingStats
    },
    warnings: warnings
  };

  // Save to session-specific locations
  const outputPath = path.join(SESSION_OUTPUT, 'advisor_data_summary.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved advisor data to: ${outputPath}\n`);

  // Save to shared memory for other agents
  const sharedMemoryPath = path.join(SESSION_SHARED_MEMORY, 'advisor-data.json');
  fs.writeFileSync(sharedMemoryPath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved to shared memory: ${sharedMemoryPath}\n`);

  // Create markdown summary
  const markdownSummary = `# Advisor Data Summary - ${SESSION_ID}

## Overview
- **Total Advisors**: ${output.advisorCount}
- **Active Subscriptions**: ${output.metadata.activeSubscriptions}
- **Data Quality**: ${(output.metadata.dataQuality * 100).toFixed(1)}%

## Subscription Breakdown
- **Premium**: ${output.metadata.premiumAdvisors} advisors
- **Gold**: ${output.metadata.goldAdvisors} advisors
- **Silver**: ${output.metadata.silverAdvisors} advisors

## Branding Elements
- **Custom Logos**: ${brandingStats.withLogos} advisors
- **Custom Colors**: ${brandingStats.withColors} advisors
- **Custom Taglines**: ${brandingStats.withTaglines} advisors

## Advisors Loaded
${processedAdvisors.map(a => `- **${a.personalInfo.name}** (${a.advisorId})
  - Phone: ${a.personalInfo.phone}
  - ARN: ${a.personalInfo.arn}
  - Type: ${a.subscription.plan}
  - Approval Mode: ${a.preferences.approvalMode}
  - Branding: ${a.customization.logoUrl ? '✓ Logo' : '✗ No Logo'}, ${a.customization.tagline ? '✓ Tagline' : '✗ No Tagline'}
`).join('\n')}

## Warnings
${warnings.length > 0 ? warnings.map(w => `- ⚠️ ${w}`).join('\n') : '- No warnings'}

## Output Files
- **JSON**: ${outputPath}
- **Shared Memory**: ${sharedMemoryPath}
- **Session Isolation**: Enabled ✅
`;

  const markdownPath = path.join(SESSION_OUTPUT, 'advisor_data_summary.md');
  fs.writeFileSync(markdownPath, markdownSummary);

  // Update worklog
  const worklogFile = path.join(SESSION_LEARNINGS, 'worklog.md');
  const worklogEntry = `## Advisor Data Loading Summary - Session: ${SESSION_ID}
- **Total Advisors**: ${output.advisorCount}
- **Active Subscriptions**: ${output.metadata.activeSubscriptions}
- **Custom Branding**: ${brandingStats.withLogos} advisors have logos
- **Review Mode**: ${processedAdvisors.filter(a => a.preferences.approvalMode === 'manual').length} manual, ${processedAdvisors.filter(a => a.preferences.approvalMode === 'auto').length} auto-approve
- **Output File**: ${outputPath}
- **Session Isolation**: Enabled ✅

`;
  fs.appendFileSync(worklogFile, worklogEntry);

  // Log completion
  logTrace(`COMPLETED → ${sharedMemoryPath} (${output.advisorCount} advisors loaded)`);

  // Display summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ADVISOR DATA MANAGER - EXECUTION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📈 Summary:');
  console.log(`   • Advisors Loaded: ${output.advisorCount}`);
  console.log(`   • Active Subscriptions: ${output.metadata.activeSubscriptions}`);
  console.log(`   • Premium: ${output.metadata.premiumAdvisors}, Gold: ${output.metadata.goldAdvisors}, Silver: ${output.metadata.silverAdvisors}`);
  console.log(`   • Custom Branding: ${brandingStats.withLogos} with logos, ${brandingStats.withTaglines} with taglines`);
  console.log(`   • Data Quality: ${(output.metadata.dataQuality * 100).toFixed(1)}%`);
  console.log(`   • Warnings: ${warnings.length}\n`);

  console.log('📁 Output Files:');
  console.log(`   • JSON: ${outputPath}`);
  console.log(`   • Markdown: ${markdownPath}`);
  console.log(`   • Shared Memory: ${sharedMemoryPath}\n`);

  // Capture learnings if data quality is below threshold
  if (dataQuality < 0.9) {
    const learning = {
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      type: 'data-quality',
      message: `Data quality below threshold: ${(dataQuality * 100).toFixed(1)}%`,
      impact: 'medium',
      details: warnings
    };

    const learningsFile = path.join(SESSION_LEARNINGS, 'realtime_learnings.json');
    let existingLearnings = [];
    if (fs.existsSync(learningsFile)) {
      existingLearnings = JSON.parse(fs.readFileSync(learningsFile, 'utf8'));
    }
    existingLearnings.push(learning);
    fs.writeFileSync(learningsFile, JSON.stringify(existingLearnings, null, 2));

    console.log('🔍 Learning Captured:');
    console.log(`   • ${learning.message} - Impact: ${learning.impact}\n`);
  }

  // Final standardized output
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const totalAUM = processedAdvisors.reduce((sum, a) => {
    const aumMatch = (a.businessInfo.aum || '₹0').match(/(\d+)/);
    return sum + (aumMatch ? parseInt(aumMatch[1]) : 0);
  }, 0);

  console.log(`📈 Fetched ${output.advisorCount} advisors with ₹${totalAUM}Cr total AUM from local data`);
  console.log(`🎯 Session: ${SESSION_ID} | Saved to: ${sharedMemoryPath} | Active subs: Premium-${output.metadata.premiumAdvisors}, Gold-${output.metadata.goldAdvisors}, Silver-${output.metadata.silverAdvisors}`);

  if (warnings.length > 0) {
    console.log(`🔍 Learning: ${warnings[0]} - Impact: low - Captured to session learnings`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);

} catch (error) {
  console.error('❌ Error executing advisor-data-manager:', error.message);
  logTrace(`FAILED - ${error.message}`);

  // Save error to learnings
  const errorLearning = {
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
    type: 'execution-error',
    message: error.message,
    impact: 'high',
    stack: error.stack
  };

  const learningsFile = path.join(SESSION_LEARNINGS, 'realtime_learnings.json');
  fs.writeFileSync(learningsFile, JSON.stringify([errorLearning], null, 2));

  process.exit(1);
}
