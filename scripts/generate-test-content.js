#!/usr/bin/env node

/**
 * Generate test content for all advisors
 * Creates a test session with sample WhatsApp, LinkedIn, and image content
 */

const fs = require('fs').promises;
const path = require('path');

async function generateTestContent() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const sessionDir = path.join(process.cwd(), 'output', `session_${timestamp}`);

  // Load advisors
  const advisorsPath = path.join(process.cwd(), 'data', 'advisors.json');
  const advisorsData = await fs.readFile(advisorsPath, 'utf-8');
  const advisors = JSON.parse(advisorsData);

  console.log(`\n📁 Creating test session: session_${timestamp}\n`);

  for (const advisor of advisors) {
    const advisorDir = path.join(sessionDir, 'advisors', advisor.id);
    await fs.mkdir(advisorDir, { recursive: true });

    // WhatsApp message
    const whatsappContent = `🚀 Breaking: Nifty hits new high at 25,234!

What this means for YOUR portfolio:
✅ Large-cap funds up 18% YTD
✅ Perfect time to review allocation
✅ SIP returns looking strong

Quick action: Review your equity exposure today.

Need help? Reply "REVIEW" 💼`;

    await fs.writeFile(
      path.join(advisorDir, 'whatsapp-message.txt'),
      whatsappContent
    );

    // LinkedIn post
    const linkedinContent = `🎯 The Nifty 50 just crossed 25,000 - but here's what most investors miss...

Everyone's celebrating the new high. But smart investors are asking different questions:

📊 Key Insights:
• Large-cap indices up 18% YTD
• Mid-caps outperforming at 24%
• Small-caps showing volatility at 28%

🔍 What This Means for You:

If you started SIPs in 2020:
→ Your Rs 10,000/month is now worth Rs 6.2L (vs Rs 4.8L invested)
→ That's 29% CAGR - beating FD returns by 3x

If you're sitting in cash:
→ Inflation ate 6.2% of your purchasing power
→ Opportunity cost: Rs 1.2L on every Rs 10L parked

💡 The Real Question:
It's not about timing the market high.
It's about time IN the market.

Your move:
1️⃣ Review your asset allocation
2️⃣ Ensure you're not over-exposed to one sector
3️⃣ Continue your SIPs (yes, even at the high)

Remember: Nifty crossed 10,000 in 2017. Everyone said "too high."
If you waited, you missed 150% returns.

What's your investment strategy for the next 5 years?

#InvestmentStrategy #MutualFunds #WealthCreation #FinancialPlanning #NiftyAllTimeHigh`;

    await fs.writeFile(
      path.join(advisorDir, 'linkedin-post.txt'),
      linkedinContent
    );

    // Create a simple test image (1080x1920 placeholder)
    // For now, just create a text file indicating image should be here
    await fs.writeFile(
      path.join(advisorDir, 'status-image-placeholder.txt'),
      'Image would be generated here: 1080x1920 WhatsApp Status'
    );

    console.log(`✅ Generated content for ${advisor.name}`);
  }

  console.log(`\n✨ Test content created successfully!`);
  console.log(`📂 Location: ${sessionDir}`);
  console.log(`\n🌐 Test the dashboard:`);
  console.log(`   Local: http://localhost:3000/dashboard?phone=919765071249`);
  console.log(`   Prod:  https://jarvisdaily.in/dashboard?phone=919765071249\n`);
}

// Run
generateTestContent().catch(console.error);
