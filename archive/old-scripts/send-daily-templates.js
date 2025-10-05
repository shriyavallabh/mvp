#!/usr/bin/env node
/**
 * JarvisDaily - Daily Template Sender
 * Sends 3 templates (Content Package, Status Image, LinkedIn Post) to all active advisors
 *
 * CORRECTED: 1 campaign sends to multiple advisors (not 1 campaign per advisor!)
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { uploadStatusImage, cleanupOldImages } = require('./utils/cloudinary-upload');

// Configuration
const AISENSY_API_KEY = process.env.AISENSY_API_KEY;
const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Load advisors
const advisorsPath = path.join(__dirname, 'data/advisors.json');
if (!fs.existsSync(advisorsPath)) {
  console.error('❌ Advisors file not found:', advisorsPath);
  process.exit(1);
}
const advisors = JSON.parse(fs.readFileSync(advisorsPath, 'utf8'));

/**
 * Get latest session content
 */
function getLatestSession() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    throw new Error('No output directory found. Run: /o command first');
  }

  const sessions = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('session_'))
    .sort()
    .reverse();

  if (sessions.length === 0) {
    throw new Error('No sessions found. Generate content first with: /o');
  }

  const latestSession = sessions[0];
  const sessionPath = path.join(outputDir, latestSession);

  return {
    sessionId: latestSession,
    sessionPath,
    whatsappDir: path.join(sessionPath, 'whatsapp/text'),
    linkedinDir: path.join(sessionPath, 'linkedin/text'),
    imagesDir: path.join(sessionPath, 'images/status/compliant')
  };
}

/**
 * Load content for specific advisor
 */
function loadAdvisorContent(session, advisor) {
  // Build advisor name slug (e.g., "avalok_langer")
  const nameParts = advisor.name.toLowerCase().split(' ');
  const advisorSlug = nameParts.join('_');

  // Find WhatsApp message file (pick msg_1.txt)
  const whatsappFiles = fs.readdirSync(session.whatsappDir)
    .filter(f => f.includes(advisorSlug) && f.includes('msg_1') && f.endsWith('.txt'));
  const whatsappFile = whatsappFiles.length > 0 ? whatsappFiles[0] : null;
  const whatsappContent = whatsappFile
    ? fs.readFileSync(path.join(session.whatsappDir, whatsappFile), 'utf8')
    : '';

  // Find LinkedIn post file (pick post_1.txt)
  const linkedinFiles = fs.readdirSync(session.linkedinDir)
    .filter(f => f.includes(advisorSlug) && f.includes('post_1') && f.endsWith('.txt'));
  const linkedinFile = linkedinFiles.length > 0 ? linkedinFiles[0] : null;
  const linkedinContent = linkedinFile
    ? fs.readFileSync(path.join(session.linkedinDir, linkedinFile), 'utf8')
    : '';

  // Find status image (pick status_1)
  const imageFiles = fs.readdirSync(session.imagesDir)
    .filter(f => f.includes(advisorSlug) && f.includes('status_1') && f.endsWith('.png'));
  const imageFile = imageFiles.length > 0 ? imageFiles[0] : null;
  const imagePath = imageFile ? path.join(session.imagesDir, imageFile) : null;

  return {
    whatsappContent,
    linkedinContent,
    imagePath,
    whatsappFile,
    linkedinFile,
    imageFile
  };
}

/**
 * Extract market headline from WhatsApp message
 */
function extractHeadline(whatsappContent) {
  const lines = whatsappContent.split('\n').filter(l => l.trim());

  // Look for NIFTY/SENSEX/Sensex mentions
  const marketLine = lines.find(l =>
    l.includes('NIFTY') ||
    l.includes('SENSEX') ||
    l.includes('Sensex') ||
    l.match(/\d+\.\d+%/) ||
    l.match(/\+\d+\s*points/)
  );

  if (marketLine) {
    // Clean and limit to 100 chars
    return marketLine.trim().replace(/[📈📊🚀💪]/g, '').trim().slice(0, 100);
  }

  // Fallback: first non-empty line
  return lines[0]?.trim().replace(/[📈📊🚀💪]/g, '').slice(0, 100) || 'Market update available';
}

/**
 * Parse LinkedIn post into topic and parts
 */
function parseLinkedInPost(linkedinContent) {
  const lines = linkedinContent.split('\n').filter(l => l.trim());

  // Topic is first meaningful line (not just date)
  let topic = lines.find(l => l.length > 20 && !l.match(/^\w+ \d+, \d+$/))?.slice(0, 60);
  if (!topic) topic = 'Market insights and investment strategy';

  // Find where CTA starts (usually "Comment", "DM", hashtags, or "ARN:")
  let ctaIndex = linkedinContent.search(/Comment|DM|Drop|Share|#|ARN:/i);

  if (ctaIndex > 0) {
    const postPart1 = linkedinContent.slice(0, ctaIndex).trim();
    const postPart2 = linkedinContent.slice(ctaIndex).trim();
    return { topic, postPart1, postPart2 };
  }

  // Fallback: split at 250 characters
  const postPart1 = linkedinContent.slice(0, 250).trim();
  const postPart2 = linkedinContent.slice(250).trim() || '#FinancialPlanning #WealthManagement #InvestSmart';

  return { topic, postPart1, postPart2 };
}

/**
 * CAMPAIGN 1: Daily Content Package
 * Sends to ALL advisors with personalized variables
 */
async function sendCampaign1_ContentPackage(session, activeAdvisors) {
  console.log('\n📦 CAMPAIGN 1: Daily Content Package');
  console.log('   Template: daily_content_package');
  console.log(`   Recipients: ${activeAdvisors.length} advisors`);

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Upload images for all advisors to Cloudinary first
  console.log('   Uploading images to Cloudinary...');
  const uploadedImages = {};
  for (const advisor of activeAdvisors) {
    try {
      const content = loadAdvisorContent(session, advisor);
      if (content.imagePath) {
        uploadedImages[advisor.id] = await uploadStatusImage(content.imagePath, advisor.id);
      } else {
        console.error(`  ⚠️  No image found for ${advisor.name} (looked for: ${content.imageFile || 'status_1'})`);
      }
    } catch (error) {
      console.error(`  ⚠️  Image upload failed for ${advisor.name}: ${error.message}`);
    }
  }

  // Send campaign to each advisor individually (AiSensy requires one API call per recipient for personalization)
  const results = [];

  for (const advisor of activeAdvisors) {
    try {
      const content = loadAdvisorContent(session, advisor);
      const headline = extractHeadline(content.whatsappContent);
      const urlSlug = `${advisor.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`;
      const imageUrl = uploadedImages[advisor.id];

      if (!imageUrl) {
        throw new Error('Image not available');
      }

      const payload = {
        apiKey: AISENSY_API_KEY,
        campaignName: 'Daily_Package',
        destination: advisor.phone,
        userName: 'JarvisDaily',
        templateParams: [
          advisor.name,     // {{1}}
          today,            // {{2}}
          headline          // {{3}} - removed {{4}} for v2 template
        ],
        media: {
          url: imageUrl,
          filename: `status_${advisor.id}.png`
        }
      };

      if (DRY_RUN) {
        console.log(`  🧪 DRY RUN: ${advisor.name}`);
        console.log(`     Headline: "${headline}"`);
        console.log(`     Image: ${imageUrl.slice(0, 60)}...`);
        results.push({ advisor: advisor.name, status: 'DRY_RUN', payload });
      } else {
        const response = await axios.post(AISENSY_API_URL, payload);
        console.log(`  ✅ Sent to ${advisor.name}`);
        results.push({ advisor: advisor.name, status: 'SUCCESS', response: response.data });
        await delay(2000); // 2-second delay
      }
    } catch (error) {
      console.error(`  ❌ Failed for ${advisor.name}:`, error.response?.data || error.message);
      results.push({ advisor: advisor.name, status: 'FAILED', error: error.message });
    }
  }

  return results;
}

/**
 * CAMPAIGN 2: Status Image
 */
async function sendCampaign2_StatusImage(session, activeAdvisors) {
  console.log('\n📸 CAMPAIGN 2: WhatsApp Status Image');
  console.log('   Template: daily_status_image');
  console.log(`   Recipients: ${activeAdvisors.length} advisors`);

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const results = [];

  for (const advisor of activeAdvisors) {
    try {
      const content = loadAdvisorContent(session, advisor);

      if (!content.imagePath) {
        throw new Error('Image not found');
      }

      const imageUrl = await uploadStatusImage(content.imagePath, advisor.id);
      // WhatsApp templates don't allow newlines in variables - use single line with separators
      const description = 'Market trends, investment insights, and portfolio tips';

      const payload = {
        apiKey: AISENSY_API_KEY,
        campaignName: 'Status_Image',
        destination: advisor.phone,
        userName: 'JarvisDaily',
        templateParams: [
          advisor.name.split(' ')[0],  // {{1}} First name only
          today,                        // {{2}}
          description                   // {{3}}
        ],
        media: {
          url: imageUrl,
          filename: `status_${advisor.id}.png`
        }
      };

      if (DRY_RUN) {
        console.log(`  🧪 DRY RUN: ${advisor.name}`);
        results.push({ advisor: advisor.name, status: 'DRY_RUN' });
      } else {
        const response = await axios.post(AISENSY_API_URL, payload);
        console.log(`  ✅ Sent to ${advisor.name}`);
        results.push({ advisor: advisor.name, status: 'SUCCESS', response: response.data });
        await delay(2000);
      }
    } catch (error) {
      console.error(`  ❌ Failed for ${advisor.name}:`, error.response?.data || error.message);
      results.push({ advisor: advisor.name, status: 'FAILED', error: error.message });
    }
  }

  return results;
}

/**
 * CAMPAIGN 3: LinkedIn Post
 */
async function sendCampaign3_LinkedInPost(session, activeAdvisors) {
  console.log('\n📝 CAMPAIGN 3: LinkedIn Post');
  console.log('   Template: daily_linkedin_post');
  console.log(`   Recipients: ${activeAdvisors.length} advisors`);

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const results = [];

  for (const advisor of activeAdvisors) {
    try {
      const content = loadAdvisorContent(session, advisor);

      if (!content.linkedinContent) {
        throw new Error('LinkedIn post not found');
      }

      const { topic, postPart1, postPart2 } = parseLinkedInPost(content.linkedinContent);

      const payload = {
        apiKey: AISENSY_API_KEY,
        campaignName: 'LinkedIn_Post',
        destination: advisor.phone,
        userName: 'JarvisDaily',
        templateParams: [
          advisor.name,   // {{1}}
          today,          // {{2}}
          topic,          // {{3}}
          postPart1,      // {{4}}
          postPart2       // {{5}}
        ]
      };

      if (DRY_RUN) {
        console.log(`  🧪 DRY RUN: ${advisor.name}`);
        console.log(`     Topic: "${topic}"`);
        results.push({ advisor: advisor.name, status: 'DRY_RUN' });
      } else {
        const response = await axios.post(AISENSY_API_URL, payload);
        console.log(`  ✅ Sent to ${advisor.name}`);
        results.push({ advisor: advisor.name, status: 'SUCCESS', response: response.data });
        await delay(2000);
      }
    } catch (error) {
      console.error(`  ❌ Failed for ${advisor.name}:`, error.response?.data || error.message);
      results.push({ advisor: advisor.name, status: 'FAILED', error: error.message });
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🚀 JarvisDaily Template Delivery');
  console.log('═══════════════════════════════════════');
  console.log(`📅 Date: ${new Date().toLocaleString('en-IN')}`);
  console.log(`🔧 Mode: ${DRY_RUN ? '🧪 DRY RUN (Test Mode)' : '🚀 PRODUCTION'}`);
  console.log('═══════════════════════════════════════\n');

  try {
    // Cleanup old images
    await cleanupOldImages();

    // Get latest session
    const session = getLatestSession();
    console.log(`📁 Session: ${session.sessionId}\n`);

    // Filter active advisors
    const activeAdvisors = advisors.filter(a => a.activeSubscription);
    console.log(`👥 Active Advisors: ${activeAdvisors.length}/${advisors.length}`);
    activeAdvisors.forEach(a => console.log(`   • ${a.name} (${a.phone})`));

    if (activeAdvisors.length === 0) {
      throw new Error('No active advisors found. Check data/advisors.json');
    }

    // Send campaigns
    const campaign1Results = await sendCampaign1_ContentPackage(session, activeAdvisors);
    await delay(5000); // 5 seconds between campaigns

    const campaign2Results = await sendCampaign2_StatusImage(session, activeAdvisors);
    await delay(5000);

    const campaign3Results = await sendCampaign3_LinkedInPost(session, activeAdvisors);

    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId,
      dryRun: DRY_RUN,
      campaigns: {
        contentPackage: campaign1Results,
        statusImage: campaign2Results,
        linkedinPost: campaign3Results
      },
      summary: {
        totalAdvisors: activeAdvisors.length,
        campaign1Success: campaign1Results.filter(r => r.status === 'SUCCESS').length,
        campaign2Success: campaign2Results.filter(r => r.status === 'SUCCESS').length,
        campaign3Success: campaign3Results.filter(r => r.status === 'SUCCESS').length
      }
    };

    const reportPath = path.join(__dirname, `data/delivery-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Summary
    console.log('\n═══════════════════════════════════════');
    console.log('📊 DELIVERY SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Campaign 1 (Content Package): ${report.summary.campaign1Success}/${activeAdvisors.length} ✅`);
    console.log(`Campaign 2 (Status Image):    ${report.summary.campaign2Success}/${activeAdvisors.length} ✅`);
    console.log(`Campaign 3 (LinkedIn Post):   ${report.summary.campaign3Success}/${activeAdvisors.length} ✅`);
    console.log(`\n📁 Report saved: ${reportPath}`);
    console.log('═══════════════════════════════════════\n');

    if (DRY_RUN) {
      console.log('💡 This was a DRY RUN. No messages were sent.');
      console.log('   To send for real, run: node send-daily-templates.js');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run
if (require.main === module) {
  main();
}

module.exports = { main };
