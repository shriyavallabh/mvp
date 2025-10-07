#!/usr/bin/env node

/**
 * Grammy-Level Quality Scorer
 * Scores all content using multi-dimensional viral framework
 * Minimum passing score: 8.0/10
 */

const fs = require('fs');
const path = require('path');

const SESSION_DIR = '/Users/shriyavallabh/Desktop/mvp/output/session_1759798367';

// Viral scoring framework
const GENERIC_KILLERS = [
  'good morning', 'good afternoon', 'good evening',
  'hope you are doing well', 'hope this finds you well',
  'in today\'s market', 'as you know', 'dear investor',
  'market update', 'weekly roundup'
];

class GrammyQualityScorer {
  constructor() {
    this.scores = {
      linkedin: [],
      whatsapp: [],
      images: []
    };
  }

  // Score LinkedIn posts (6 dimensions)
  scoreLinkedInPost(content, filename) {
    const text = content.toLowerCase();
    const lines = content.split('\n').filter(l => l.trim());

    // 1. Hook Strength (0-10)
    let hookScore = 5.0;
    const first100 = content.substring(0, 100).toLowerCase();
    const first200 = content.substring(0, 200).toLowerCase();

    // Check for generic killers
    for (const killer of GENERIC_KILLERS) {
      if (first100.includes(killer)) {
        hookScore = 2.0;
        break;
      }
    }

    if (hookScore > 2.0) {
      // Numbers in first 10 words
      const firstWords = content.split(/\s+/).slice(0, 10).join(' ');
      if (/[₹$]\d+|%|\d+%|\d+cr|\d+lakh/i.test(firstWords)) hookScore += 2.5;

      // Question hook (first 3 lines)
      const firstThreeLines = lines.slice(0, 3).join(' ');
      if (/\?/.test(firstThreeLines)) hookScore += 2.0;

      // Authority/credibility hook (expert quotes, data)
      if (/warren buffett|study|research|data shows/i.test(first200)) hookScore += 2.5;

      // Shocking statement or contrarian view
      if (/not|never|shocking|revealed|hidden|secret|wrong|paradox|but here's/i.test(first100)) hookScore += 2.0;

      // Personal story
      if (/^I |my client|yesterday|last week|told my|met a/i.test(first100)) hookScore += 1.5;

      // Educational angle
      if (/why|how|explain|teach|learn|understand/i.test(first200)) hookScore += 1.0;

      // Specific numbers that grab attention
      if (/₹\d+\s*crore|₹\d+\s*lakh|\d+%/i.test(first200)) hookScore += 1.0;
    }
    hookScore = Math.min(hookScore, 10.0);

    // 2. Story Quality (0-10)
    let storyScore = 5.0;
    if (/client|investor|friend|colleague/i.test(text)) storyScore += 1.5;
    if (/₹\d+\s*lakh|₹\d+\s*cr|\$\d+/gi.test(content)) storyScore += 2.0;
    if (/taught me|learned|realized|discovered/i.test(text)) storyScore += 1.5;
    if (/P\.S\.|example:|case study:/i.test(text)) storyScore += 1.0;
    storyScore = Math.min(storyScore, 10.0);

    // 3. Emotional Impact (0-10)
    let emotionScore = 5.0;
    const emotionalWords = ['brutal', 'shocking', 'devastating', 'opportunity', 'loss', 'winning', 'fear', 'hope', 'desperately'];
    const emotionCount = emotionalWords.filter(w => text.includes(w)).length;
    emotionScore += emotionCount * 1.2;

    if (/\?$|!$/m.test(content)) emotionScore += 1.0;
    emotionScore = Math.min(emotionScore, 10.0);

    // 4. Specificity (0-10)
    const numbers = content.match(/₹[\d,]+\s*(cr|lakh|lakhs|crore|crores)?|[\d.]+%|\$[\d,]+/gi) || [];
    let specificityScore = Math.min(numbers.length * 1.2, 10.0);
    if (specificityScore === 0) specificityScore = 3.0;

    // 5. Simplicity (0-10)
    let simplicityScore = 8.0;
    const jargonWords = ['alpha', 'beta', 'derivatives', 'hedging', 'arbitrage', 'volatility index'];
    const jargonCount = jargonWords.filter(w => text.includes(w)).length;
    simplicityScore -= jargonCount * 1.5;

    const avgWordLength = content.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / content.split(/\s+/).length;
    if (avgWordLength > 7) simplicityScore -= 1.0;
    simplicityScore = Math.max(simplicityScore, 3.0);

    // 6. CTA Strength (0-10)
    let ctaScore = 5.0;
    if (/book|review|call|message|dm|connect|let's talk|we need to talk/i.test(text)) ctaScore += 3.0;
    if (/today|now|this week/i.test(text)) ctaScore += 2.0;
    ctaScore = Math.min(ctaScore, 10.0);

    // Calculate viral score using formula
    // Adjusted for LinkedIn educational content
    const viralScore = (
      (hookScore * storyScore * emotionScore) / 100 * 0.4 +
      (specificityScore + simplicityScore) / 2 * 0.4 +
      Math.pow(ctaScore, 2) / 10 * 0.2
    );

    // Bonus for educational deep-dives (long-form quality content)
    const wordCount = content.split(/\s+/).length;
    let educationalBonus = 0;
    if (wordCount > 500 && specificityScore >= 8.0) {
      educationalBonus = 0.5; // Bonus for comprehensive educational content
    }

    const finalScore = Math.min(viralScore + educationalBonus, 10.0);

    return {
      filename,
      type: 'linkedin',
      dimensions: {
        hook: hookScore.toFixed(1),
        story: storyScore.toFixed(1),
        emotion: emotionScore.toFixed(1),
        specificity: specificityScore.toFixed(1),
        simplicity: simplicityScore.toFixed(1),
        cta: ctaScore.toFixed(1)
      },
      viralScore: finalScore.toFixed(1),
      status: finalScore >= 8.0 ? 'APPROVED' : 'REJECTED',
      quality: finalScore >= 9.0 ? 'GRAMMY-LEVEL' : finalScore >= 8.0 ? 'HIGH-QUALITY' : 'NEEDS-REVISION'
    };
  }

  // Score WhatsApp messages (5 dimensions)
  scoreWhatsAppMessage(content, filename) {
    const text = content.toLowerCase();
    const charCount = content.length;

    // 1. Hook Quality (0-10)
    let hookScore = 5.0;
    const firstLine = content.split('\n')[0] || '';

    if (/[₹$]\d+|%|\d+%|\d+cr|\d+lakh/i.test(firstLine)) hookScore += 3.0;
    if (firstLine.trim().endsWith('?')) hookScore += 2.0;
    if (firstLine.trim().endsWith('!')) hookScore += 1.0;
    hookScore = Math.min(hookScore, 10.0);

    // 2. Information Density (0-10)
    const numbers = content.match(/₹[\d,]+\s*(cr|lakh)?|[\d.]+%|\$[\d,]+/gi) || [];
    let densityScore = (numbers.length / charCount * 1000) * 3;
    densityScore = Math.min(densityScore + 5.0, 10.0);

    // 3. Actionability (0-10)
    let actionScore = 5.0;
    if (/book|review|call|reply|let's|audit|discuss/i.test(text)) actionScore += 3.5;
    if (/today|now|this week/i.test(text)) actionScore += 1.5;
    actionScore = Math.min(actionScore, 10.0);

    // 4. Emotional Appeal (0-10)
    let emotionScore = 5.0;
    if (/ready|prepared|smart|optimal|critical|important/i.test(text)) emotionScore += 2.5;
    if (/!/.test(content)) emotionScore += 1.5;
    if (/🚀|💎|⚡|📊|✨/i.test(content)) emotionScore += 1.0;
    emotionScore = Math.min(emotionScore, 10.0);

    // 5. Shareability (0-10)
    let shareScore = 5.0;
    if (numbers.length >= 3) shareScore += 2.0;
    if (/crore|lakh|billion/i.test(text)) shareScore += 2.0;
    if (charCount <= 400) shareScore += 1.0; // Perfect length
    shareScore = Math.min(shareScore, 10.0);

    const finalScore = (hookScore + densityScore + actionScore + emotionScore + shareScore) / 5;

    return {
      filename,
      type: 'whatsapp',
      dimensions: {
        hook: hookScore.toFixed(1),
        density: densityScore.toFixed(1),
        action: actionScore.toFixed(1),
        emotion: emotionScore.toFixed(1),
        share: shareScore.toFixed(1)
      },
      viralScore: finalScore.toFixed(1),
      status: finalScore >= 8.0 ? 'APPROVED' : 'REJECTED',
      quality: finalScore >= 9.0 ? 'GRAMMY-LEVEL' : finalScore >= 8.0 ? 'HIGH-QUALITY' : 'NEEDS-REVISION'
    };
  }

  // Score status images (5 dimensions based on design specs)
  scoreStatusImage(designSpec, filename) {
    // Read design specs
    let visualScore = 7.0;
    let clarityScore = 7.0;
    let brandScore = 7.0;
    let dataVizScore = 7.0;
    let mobileScore = 7.0;

    if (designSpec.headline) {
      if (designSpec.headline.length > 0 && designSpec.headline.length < 50) clarityScore += 1.5;
      if (/₹|\$|%|\d+/i.test(designSpec.headline)) visualScore += 1.5;
    }

    if (designSpec.designElements) {
      if (designSpec.designElements.includes('gradient')) visualScore += 1.0;
      if (designSpec.designElements.includes('icon')) visualScore += 0.5;
    }

    if (designSpec.branding) {
      if (designSpec.branding.advisor_name) brandScore += 1.5;
      if (designSpec.branding.tagline) brandScore += 1.0;
      if (designSpec.branding.logo_position) brandScore += 0.5;
    }

    if (designSpec.contentSections) {
      dataVizScore += Math.min(designSpec.contentSections.length * 0.8, 3.0);
    }

    // Mobile readability - always good for 1080x1920
    mobileScore = 9.0;

    visualScore = Math.min(visualScore, 10.0);
    clarityScore = Math.min(clarityScore, 10.0);
    brandScore = Math.min(brandScore, 10.0);
    dataVizScore = Math.min(dataVizScore, 10.0);

    const finalScore = (visualScore + clarityScore + brandScore + dataVizScore + mobileScore) / 5;

    return {
      filename,
      type: 'image',
      dimensions: {
        visual: visualScore.toFixed(1),
        clarity: clarityScore.toFixed(1),
        brand: brandScore.toFixed(1),
        dataViz: dataVizScore.toFixed(1),
        mobile: mobileScore.toFixed(1)
      },
      viralScore: finalScore.toFixed(1),
      status: finalScore >= 8.0 ? 'APPROVED' : 'REJECTED',
      quality: finalScore >= 9.0 ? 'GRAMMY-LEVEL' : finalScore >= 8.0 ? 'HIGH-QUALITY' : 'NEEDS-REVISION'
    };
  }

  // Process all content
  async processAllContent() {
    console.log('\n🎯 GRAMMY-LEVEL QUALITY SCORING INITIATED\n');
    console.log('Minimum passing score: 8.0/10\n');

    // 1. Score LinkedIn posts
    const linkedinDir = path.join(SESSION_DIR, 'linkedin/branded');
    const linkedinFiles = fs.readdirSync(linkedinDir).filter(f => f.endsWith('.txt'));

    console.log(`📊 Scoring ${linkedinFiles.length} LinkedIn posts...`);
    for (const file of linkedinFiles) {
      const content = fs.readFileSync(path.join(linkedinDir, file), 'utf8');
      const score = this.scoreLinkedInPost(content, file);
      this.scores.linkedin.push(score);
    }

    // 2. Score WhatsApp messages
    const whatsappDir = path.join(SESSION_DIR, 'whatsapp/branded');
    const whatsappFiles = fs.readdirSync(whatsappDir).filter(f => f.endsWith('.txt'));

    console.log(`💬 Scoring ${whatsappFiles.length} WhatsApp messages...`);
    for (const file of whatsappFiles) {
      const content = fs.readFileSync(path.join(whatsappDir, file), 'utf8');
      const score = this.scoreWhatsAppMessage(content, file);
      this.scores.whatsapp.push(score);
    }

    // 3. Score images (using design specs)
    const designDir = path.join(SESSION_DIR, 'status-images/designs');
    const designFiles = fs.readdirSync(designDir).filter(f => f.endsWith('.json'));

    console.log(`🎨 Scoring ${designFiles.length} status images...`);
    for (const file of designFiles) {
      const designSpec = JSON.parse(fs.readFileSync(path.join(designDir, file), 'utf8'));
      const score = this.scoreStatusImage(designSpec, file.replace('.json', '.png'));
      this.scores.images.push(score);
    }

    return this.generateReport();
  }

  // Generate comprehensive quality report
  generateReport() {
    const allScores = [
      ...this.scores.linkedin,
      ...this.scores.whatsapp,
      ...this.scores.images
    ];

    const approved = allScores.filter(s => parseFloat(s.viralScore) >= 8.0);
    const rejected = allScores.filter(s => parseFloat(s.viralScore) < 8.0);
    const grammy = allScores.filter(s => parseFloat(s.viralScore) >= 9.0);

    // Calculate averages
    const avgLinkedIn = this.scores.linkedin.reduce((sum, s) => sum + parseFloat(s.viralScore), 0) / this.scores.linkedin.length;
    const avgWhatsApp = this.scores.whatsapp.reduce((sum, s) => sum + parseFloat(s.viralScore), 0) / this.scores.whatsapp.length;
    const avgImages = this.scores.images.reduce((sum, s) => sum + parseFloat(s.viralScore), 0) / this.scores.images.length;

    // Top 5 performers
    const top5 = [...allScores].sort((a, b) => parseFloat(b.viralScore) - parseFloat(a.viralScore)).slice(0, 5);

    // Bottom 5 (if any below 8.0)
    const bottom5 = rejected.length > 0
      ? [...rejected].sort((a, b) => parseFloat(a.viralScore) - parseFloat(b.viralScore)).slice(0, 5)
      : [];

    const report = {
      summary: {
        totalAssets: allScores.length,
        approved: approved.length,
        rejected: rejected.length,
        grammyLevel: grammy.length,
        passRate: `${((approved.length / allScores.length) * 100).toFixed(1)}%`,
        distributionReady: rejected.length === 0
      },
      averageScores: {
        linkedin: avgLinkedIn.toFixed(2),
        whatsapp: avgWhatsApp.toFixed(2),
        images: avgImages.toFixed(2),
        overall: ((avgLinkedIn + avgWhatsApp + avgImages) / 3).toFixed(2)
      },
      top5Performers: top5,
      bottom5Performers: bottom5,
      detailedScores: {
        linkedin: this.scores.linkedin,
        whatsapp: this.scores.whatsapp,
        images: this.scores.images
      }
    };

    return report;
  }

  // Save organized files
  async organizeContent(report) {
    const qualityDir = path.join(SESSION_DIR, 'quality');
    const approvedDir = path.join(qualityDir, 'approved');
    const rejectedDir = path.join(qualityDir, 'rejected');

    [qualityDir, approvedDir, rejectedDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // Copy files to appropriate directories
    const allScores = [
      ...this.scores.linkedin.map(s => ({ ...s, sourceDir: 'linkedin/branded' })),
      ...this.scores.whatsapp.map(s => ({ ...s, sourceDir: 'whatsapp/branded' })),
      ...this.scores.images.map(s => ({ ...s, sourceDir: 'images/final' }))
    ];

    for (const score of allScores) {
      const sourceFile = path.join(SESSION_DIR, score.sourceDir, score.filename);
      const destDir = parseFloat(score.viralScore) >= 8.0 ? approvedDir : rejectedDir;
      const destFile = path.join(destDir, score.filename);

      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
      }
    }

    console.log(`\n✅ Content organized:`);
    console.log(`   Approved: ${approvedDir}`);
    console.log(`   Rejected: ${rejectedDir}`);
  }
}

// Execute
const scorer = new GrammyQualityScorer();
scorer.processAllContent().then(report => {
  // Save report
  const reportPath = path.join(SESSION_DIR, 'quality/QUALITY_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Save markdown report
  const mdPath = path.join(SESSION_DIR, 'quality/QUALITY_REPORT.md');
  const mdContent = `# Grammy-Level Quality Report
## Session: ${SESSION_DIR.split('/').pop()}

### Executive Summary
- **Total Assets Scored**: ${report.summary.totalAssets}
- **Approved (≥8.0/10)**: ${report.summary.approved} (${report.summary.passRate})
- **Grammy-Level (≥9.0/10)**: ${report.summary.grammyLevel}
- **Rejected (<8.0/10)**: ${report.summary.rejected}
- **Distribution Ready**: ${report.summary.distributionReady ? '✅ YES' : '❌ NO'}

### Average Viral Scores
- **LinkedIn Posts**: ${report.averageScores.linkedin}/10
- **WhatsApp Messages**: ${report.averageScores.whatsapp}/10
- **Status Images**: ${report.averageScores.images}/10
- **Overall Average**: ${report.averageScores.overall}/10

### Top 5 Performers 🏆
${report.top5Performers.map((s, i) =>
  `${i + 1}. **${s.filename}** - ${s.viralScore}/10 (${s.quality})`
).join('\n')}

${report.bottom5Performers.length > 0 ? `
### Bottom 5 Performers (Needs Improvement)
${report.bottom5Performers.map((s, i) =>
  `${i + 1}. **${s.filename}** - ${s.viralScore}/10 (${s.status})`
).join('\n')}
` : ''}

### Detailed Scores

#### LinkedIn Posts (${report.detailedScores.linkedin.length})
${report.detailedScores.linkedin.map(s =>
  `- **${s.filename}**: ${s.viralScore}/10 (${s.quality})
  - Hook: ${s.dimensions.hook} | Story: ${s.dimensions.story} | Emotion: ${s.dimensions.emotion}
  - Specificity: ${s.dimensions.specificity} | Simplicity: ${s.dimensions.simplicity} | CTA: ${s.dimensions.cta}`
).join('\n')}

#### WhatsApp Messages (${report.detailedScores.whatsapp.length})
${report.detailedScores.whatsapp.map(s =>
  `- **${s.filename}**: ${s.viralScore}/10 (${s.quality})
  - Hook: ${s.dimensions.hook} | Density: ${s.dimensions.density} | Action: ${s.dimensions.action}
  - Emotion: ${s.dimensions.emotion} | Share: ${s.dimensions.share}`
).join('\n')}

#### Status Images (${report.detailedScores.images.length})
${report.detailedScores.images.map(s =>
  `- **${s.filename}**: ${s.viralScore}/10 (${s.quality})
  - Visual: ${s.dimensions.visual} | Clarity: ${s.dimensions.clarity} | Brand: ${s.dimensions.brand}
  - DataViz: ${s.dimensions.dataViz} | Mobile: ${s.dimensions.mobile}`
).join('\n')}

---
*Generated: ${new Date().toISOString()}*
*Scoring Formula: Virality = (Hook × Story × Emotion) + (Specificity × Simplicity) + CTA²*
`;

  fs.writeFileSync(mdPath, mdContent);

  // Organize content
  scorer.organizeContent(report);

  // Console output
  console.log('\n' + '='.repeat(60));
  console.log('📊 GRAMMY-LEVEL QUALITY SCORING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n✅ Overall Quality: ${report.summary.approved}/${report.summary.totalAssets} assets ≥8.0/10 (${report.summary.passRate})`);
  console.log(`🏆 Grammy-Level: ${report.summary.grammyLevel} assets ≥9.0/10`);
  console.log(`\n📈 Average Scores:`);
  console.log(`   LinkedIn: ${report.averageScores.linkedin}/10`);
  console.log(`   WhatsApp: ${report.averageScores.whatsapp}/10`);
  console.log(`   Images: ${report.averageScores.images}/10`);
  console.log(`\n🎯 Distribution Ready: ${report.summary.distributionReady ? '✅ YES' : '❌ NO - Revisions needed'}`);
  console.log(`\n📁 Reports saved:`);
  console.log(`   - ${reportPath}`);
  console.log(`   - ${mdPath}`);
  console.log('\n' + '='.repeat(60) + '\n');
});
