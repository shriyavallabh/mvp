#!/usr/bin/env node

/**
 * FATIGUE CHECKER AGENT - Phase 5, Agent #11
 *
 * Analyzes content freshness and prevents repetition for session_1759383378
 *
 * Mission: Track last 30 days of advisor posts, check topic overlap, verify hook diversity,
 * ensure fresh angles, prevent message repetition
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Session configuration
const SESSION_ID = 'session_1759383378';
const OUTPUT_DIR = `/Users/shriyavallabh/Desktop/mvp/output/${SESSION_ID}`;
const FATIGUE_DIR = `${OUTPUT_DIR}/fatigue`;
const CONFIG_PATH = '/Users/shriyavallabh/Desktop/mvp/.claude/agents/fatigue-checker-config.json';

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(80), 'cyan');
}

// Calculate semantic similarity (simplified cosine similarity)
function calculateSimilarity(text1, text2) {
  // Normalize text
  const normalize = (text) => text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter out short words

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  // Create word frequency maps
  const freq1 = {};
  const freq2 = {};

  words1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
  words2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);

  // Calculate intersection
  const intersection = Object.keys(freq1).filter(word => freq2[word]);
  const union = new Set([...Object.keys(freq1), ...Object.keys(freq2)]);

  // Jaccard similarity
  const similarity = intersection.length / union.size;

  return similarity;
}

// Extract topics from content
function extractTopics(content) {
  const topicKeywords = {
    'tax_planning': ['tax', 'saving', '80c', 'elss', 'deduction', 'nps'],
    'sip': ['sip', 'systematic', 'monthly', 'discipline', 'regular'],
    'market_update': ['market', 'sensex', 'nifty', 'rally', 'correction'],
    'rbi_policy': ['rbi', 'repo', 'rate', 'policy', 'inflation', 'gdp'],
    'gold': ['gold', 'dhanteras', 'festive', 'commodity'],
    'fd_comparison': ['fd', 'fixed', 'deposit', 'bank', 'rate'],
    'portfolio': ['portfolio', 'allocation', 'diversification', 'rebalance'],
    'insurance': ['insurance', 'health', 'term', 'protection']
  };

  const normalized = content.toLowerCase();
  const detectedTopics = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matchCount = keywords.filter(keyword => normalized.includes(keyword)).length;
    if (matchCount >= 2) { // Topic detected if 2+ keywords match
      detectedTopics.push({ topic, confidence: matchCount / keywords.length });
    }
  }

  return detectedTopics.sort((a, b) => b.confidence - a.confidence);
}

// Extract hook types
function extractHookType(content) {
  const hooks = {
    'question': /\?/,
    'emoji_hook': /^[🎯💪📚🌟⏰📊💰]/,
    'statistic': /₹[\d,]+|[\d.]+%|[\d,]+ crore/i,
    'story': /real story|remember when|imagine|once upon/i,
    'statement': /^[A-Z][^.!?]*[.!]/,
    'quote': /["'].*["']/
  };

  for (const [type, pattern] of Object.entries(hooks)) {
    if (pattern.test(content)) {
      return type;
    }
  }

  return 'statement'; // Default
}

// Extract CTA type
function extractCTA(content) {
  const ctas = {
    'schedule': /book|schedule|appointment|consultation|session/i,
    'contact': /call|contact|reach|whatsapp|message/i,
    'start': /start|begin|invest|open/i,
    'learn': /learn|know|understand|explore/i,
    'act': /act now|start now|do it|take action/i,
    'continue': /continue|keep|maintain|persist/i
  };

  for (const [type, pattern] of Object.entries(ctas)) {
    if (pattern.test(content)) {
      return type;
    }
  }

  return 'general';
}

// Load historical content (last 30 days simulation - we'll use recent sessions)
function loadHistoricalContent() {
  const outputPath = '/Users/shriyavallabh/Desktop/mvp/output';
  const sessions = fs.readdirSync(outputPath)
    .filter(dir => dir.startsWith('session_') && dir !== SESSION_ID)
    .sort()
    .slice(-5); // Last 5 sessions as proxy for 30 days

  const historical = {
    linkedin: [],
    whatsapp: [],
    status: []
  };

  sessions.forEach(sessionDir => {
    const sessionPath = path.join(outputPath, sessionDir);

    // Load LinkedIn posts
    const linkedinPath = path.join(sessionPath, 'linkedin/summary.json');
    if (fs.existsSync(linkedinPath)) {
      const data = JSON.parse(fs.readFileSync(linkedinPath, 'utf8'));

      // Try to load individual posts
      const jsonDir = path.join(sessionPath, 'linkedin/json');
      if (fs.existsSync(jsonDir)) {
        fs.readdirSync(jsonDir).forEach(file => {
          if (file.endsWith('_posts.json') || file.endsWith('_linkedin_posts.json')) {
            const posts = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'));
            if (Array.isArray(posts)) {
              posts.forEach(post => {
                historical.linkedin.push({
                  session: sessionDir,
                  content: post.content || post.post || post.text || '',
                  topics: extractTopics(post.content || post.post || post.text || ''),
                  hook: extractHookType(post.content || post.post || post.text || ''),
                  virality: post.virality_score || post.viralityScore || 0
                });
              });
            }
          }
        });
      }
    }

    // Load WhatsApp messages
    const whatsappDir = path.join(sessionPath, 'whatsapp');
    if (fs.existsSync(whatsappDir)) {
      const whatsappFiles = fs.readdirSync(whatsappDir)
        .filter(f => f.startsWith('whatsapp_summary_'));

      if (whatsappFiles.length > 0) {
        const data = JSON.parse(fs.readFileSync(
          path.join(whatsappDir, whatsappFiles[0]),
          'utf8'
        ));

        if (data.advisors) {
          data.advisors.forEach(advisor => {
            advisor.messages.forEach(msg => {
              historical.whatsapp.push({
                session: sessionDir,
                content: msg.message || '',
                topics: extractTopics(msg.message || ''),
                hook: extractHookType(msg.message || ''),
                cta: extractCTA(msg.message || ''),
                virality: msg.virality_score || 0
              });
            });
          });
        }
      }
    }
  });

  return historical;
}

// Load current session content
function loadCurrentContent() {
  const current = {
    linkedin: [],
    whatsapp: [],
    status: []
  };

  // Load LinkedIn
  const linkedinSummary = JSON.parse(
    fs.readFileSync(`${OUTPUT_DIR}/linkedin/summary.json`, 'utf8')
  );

  const linkedinJsonDir = `${OUTPUT_DIR}/linkedin/json`;
  fs.readdirSync(linkedinJsonDir).forEach(file => {
    if (file.endsWith('_linkedin_posts.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(linkedinJsonDir, file), 'utf8'));
      const posts = data.posts || data; // Handle both structures

      if (Array.isArray(posts)) {
        posts.forEach(post => {
          current.linkedin.push({
            content: post.content || post.post,
            topics: extractTopics(post.content || post.post),
            hook: extractHookType(post.content || post.post),
            virality: post.virality_score || post.viralityScore,
            advisor: post.advisor_id || post.advisorId || data.advisorId
          });
        });
      }
    }
  });

  // Load WhatsApp
  const whatsappSummary = JSON.parse(
    fs.readFileSync(`${OUTPUT_DIR}/whatsapp/whatsapp_summary_20251002_112107.json`, 'utf8')
  );

  whatsappSummary.advisors.forEach(advisor => {
    advisor.messages.forEach(msg => {
      current.whatsapp.push({
        content: msg.message,
        topics: extractTopics(msg.message),
        hook: extractHookType(msg.message),
        cta: extractCTA(msg.message),
        virality: msg.virality_score,
        advisor: msg.advisor_id
      });
    });
  });

  return current;
}

// Analyze content fatigue
function analyzeFatigue(current, historical, config) {
  const analysis = {
    freshness_score: 100,
    flags: [],
    topic_diversity: {},
    hook_diversity: {},
    cta_diversity: {},
    similarity_alerts: [],
    recommendations: []
  };

  // 1. SIMILARITY ANALYSIS
  logSection('SIMILARITY ANALYSIS');

  current.linkedin.forEach((currentPost, idx) => {
    historical.linkedin.forEach(histPost => {
      const similarity = calculateSimilarity(currentPost.content, histPost.content);

      if (similarity > config.configuration.similarity_threshold) {
        const penalty = config.scoring.penalties.high_similarity;
        analysis.freshness_score -= penalty;
        analysis.flags.push({
          type: 'high_similarity',
          platform: 'linkedin',
          current_index: idx,
          similarity: similarity.toFixed(3),
          threshold: config.configuration.similarity_threshold,
          previous_session: histPost.session,
          penalty: penalty
        });

        log(`⚠️  LinkedIn Post ${idx + 1}: ${(similarity * 100).toFixed(1)}% similar to ${histPost.session}`, 'yellow');
      }
    });
  });

  current.whatsapp.forEach((currentMsg, idx) => {
    historical.whatsapp.forEach(histMsg => {
      const similarity = calculateSimilarity(currentMsg.content, histMsg.content);

      if (similarity > config.configuration.similarity_threshold) {
        const penalty = config.scoring.penalties.high_similarity;
        analysis.freshness_score -= penalty;
        analysis.flags.push({
          type: 'high_similarity',
          platform: 'whatsapp',
          current_index: idx,
          similarity: similarity.toFixed(3),
          threshold: config.configuration.similarity_threshold,
          previous_session: histMsg.session,
          penalty: penalty
        });

        log(`⚠️  WhatsApp Message ${idx + 1}: ${(similarity * 100).toFixed(1)}% similar to ${histMsg.session}`, 'yellow');
      }
    });
  });

  // 2. TOPIC DIVERSITY ANALYSIS
  logSection('TOPIC DIVERSITY ANALYSIS');

  const allTopics = {};
  [...current.linkedin, ...current.whatsapp].forEach(item => {
    item.topics.forEach(t => {
      allTopics[t.topic] = (allTopics[t.topic] || 0) + 1;
    });
  });

  const totalItems = current.linkedin.length + current.whatsapp.length;
  const topicConcentration = Math.max(...Object.values(allTopics)) / totalItems;

  analysis.topic_diversity = allTopics;

  if (topicConcentration > 0.6) {
    const penalty = config.scoring.penalties.topic_repetition;
    analysis.freshness_score -= penalty;
    analysis.flags.push({
      type: 'topic_concentration',
      concentration: topicConcentration.toFixed(2),
      dominant_topic: Object.entries(allTopics).sort((a, b) => b[1] - a[1])[0][0],
      penalty: penalty
    });
    log(`⚠️  Topic concentration too high: ${(topicConcentration * 100).toFixed(1)}%`, 'yellow');
  }

  Object.entries(allTopics).forEach(([topic, count]) => {
    const percentage = (count / totalItems * 100).toFixed(1);
    log(`   ${topic}: ${count} items (${percentage}%)`, 'cyan');
  });

  // 3. HOOK DIVERSITY ANALYSIS
  logSection('HOOK DIVERSITY ANALYSIS');

  const hookTypes = {};
  [...current.linkedin, ...current.whatsapp].forEach(item => {
    hookTypes[item.hook] = (hookTypes[item.hook] || 0) + 1;
  });

  analysis.hook_diversity = hookTypes;

  const hookVariety = Object.keys(hookTypes).length;
  if (hookVariety < 3) {
    const penalty = config.scoring.penalties.hook_monotony;
    analysis.freshness_score -= penalty;
    analysis.flags.push({
      type: 'hook_monotony',
      variety: hookVariety,
      minimum_expected: 3,
      penalty: penalty
    });
    log(`⚠️  Low hook variety: Only ${hookVariety} different hook types`, 'yellow');
  }

  Object.entries(hookTypes).forEach(([hook, count]) => {
    const percentage = (count / totalItems * 100).toFixed(1);
    log(`   ${hook}: ${count} items (${percentage}%)`, 'cyan');
  });

  // 4. CTA DIVERSITY ANALYSIS
  logSection('CTA DIVERSITY ANALYSIS');

  const ctaTypes = {};
  current.whatsapp.forEach(item => {
    ctaTypes[item.cta] = (ctaTypes[item.cta] || 0) + 1;
  });

  analysis.cta_diversity = ctaTypes;

  const ctaVariety = Object.keys(ctaTypes).length;
  if (ctaVariety < 2) {
    const penalty = config.scoring.penalties.cta_repetition;
    analysis.freshness_score -= penalty;
    analysis.flags.push({
      type: 'cta_monotony',
      variety: ctaVariety,
      minimum_expected: 2,
      penalty: penalty
    });
    log(`⚠️  Low CTA variety: Only ${ctaVariety} different CTA types`, 'yellow');
  }

  Object.entries(ctaTypes).forEach(([cta, count]) => {
    const percentage = (count / current.whatsapp.length * 100).toFixed(1);
    log(`   ${cta}: ${count} items (${percentage}%)`, 'cyan');
  });

  // 5. GENERATE RECOMMENDATIONS
  if (analysis.freshness_score < config.scoring.thresholds.approved) {
    analysis.recommendations.push({
      priority: 'high',
      action: 'diversify_topics',
      description: 'Introduce new topics or rotate existing ones to reduce repetition'
    });
  }

  if (hookVariety < 4) {
    analysis.recommendations.push({
      priority: 'medium',
      action: 'vary_hooks',
      description: 'Use more diverse hook styles: questions, stories, statistics, quotes'
    });
  }

  if (analysis.flags.some(f => f.type === 'high_similarity')) {
    analysis.recommendations.push({
      priority: 'high',
      action: 'rewrite_similar_content',
      description: 'Rewrite flagged content with fresh angles and different phrasing'
    });
  }

  // Ensure score doesn't go below 0
  analysis.freshness_score = Math.max(0, analysis.freshness_score);

  return analysis;
}

// Main execution
async function main() {
  try {
    logSection('🔍 FATIGUE CHECKER AGENT - Phase 5, Agent #11');
    log(`Session: ${SESSION_ID}`, 'cyan');
    log(`Output: ${FATIGUE_DIR}`, 'cyan');

    // Create output directory
    if (!fs.existsSync(FATIGUE_DIR)) {
      fs.mkdirSync(FATIGUE_DIR, { recursive: true });
    }

    // Load configuration
    log('\n📋 Loading configuration...', 'blue');
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    log(`   Similarity threshold: ${config.configuration.similarity_threshold}`, 'cyan');
    log(`   Topic rotation: ${config.diversity_rules.topic_rotation.default_days} days`, 'cyan');
    log(`   CTA rotation: ${config.diversity_rules.cta_variation.default_interval} posts`, 'cyan');

    // Load historical content
    log('\n📚 Loading historical content (last 30 days proxy)...', 'blue');
    const historical = loadHistoricalContent();
    log(`   LinkedIn posts: ${historical.linkedin.length}`, 'cyan');
    log(`   WhatsApp messages: ${historical.whatsapp.length}`, 'cyan');

    // Load current content
    log('\n📝 Loading current session content...', 'blue');
    const current = loadCurrentContent();
    log(`   LinkedIn posts: ${current.linkedin.length}`, 'cyan');
    log(`   WhatsApp messages: ${current.whatsapp.length}`, 'cyan');

    // Analyze fatigue
    log('\n🔬 Analyzing content fatigue...', 'blue');
    const analysis = analyzeFatigue(current, historical, config);

    // Display results
    logSection('📊 FATIGUE ANALYSIS RESULTS');

    const scoreColor = analysis.freshness_score >= 70 ? 'green' :
                       analysis.freshness_score >= 50 ? 'yellow' : 'red';
    log(`\n🎯 FRESHNESS SCORE: ${analysis.freshness_score}/100`, scoreColor);

    const status = analysis.freshness_score >= config.scoring.thresholds.approved ?
      '✅ APPROVED' :
      analysis.freshness_score >= config.scoring.thresholds.review_recommended ?
      '⚠️  REVIEW RECOMMENDED' :
      '❌ REVISION REQUIRED';
    log(`   Status: ${status}`, scoreColor);

    log(`\n📌 Flags: ${analysis.flags.length}`, 'cyan');
    analysis.flags.forEach((flag, idx) => {
      log(`   ${idx + 1}. ${flag.type}: -${flag.penalty} points`, 'yellow');
    });

    log(`\n💡 Recommendations: ${analysis.recommendations.length}`, 'cyan');
    analysis.recommendations.forEach((rec, idx) => {
      log(`   ${idx + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`, 'magenta');
      log(`      ${rec.description}`, 'cyan');
    });

    // Create detailed report
    const report = {
      session_id: SESSION_ID,
      agent: 'fatigue-checker',
      phase: 5,
      agent_number: 11,
      timestamp: new Date().toISOString(),
      execution_time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),

      summary: {
        freshness_score: analysis.freshness_score,
        status: analysis.freshness_score >= 70 ? 'APPROVED' :
                analysis.freshness_score >= 50 ? 'REVIEW_RECOMMENDED' : 'REVISION_REQUIRED',
        total_flags: analysis.flags.length,
        total_recommendations: analysis.recommendations.length
      },

      content_analyzed: {
        current_session: {
          linkedin_posts: current.linkedin.length,
          whatsapp_messages: current.whatsapp.length,
          total_items: current.linkedin.length + current.whatsapp.length
        },
        historical_comparison: {
          linkedin_posts: historical.linkedin.length,
          whatsapp_messages: historical.whatsapp.length,
          sessions_analyzed: 5
        }
      },

      diversity_analysis: {
        topics: analysis.topic_diversity,
        hooks: analysis.hook_diversity,
        ctas: analysis.cta_diversity
      },

      flags: analysis.flags,
      recommendations: analysis.recommendations,

      thresholds: {
        similarity_threshold: config.configuration.similarity_threshold,
        topic_rotation_days: config.diversity_rules.topic_rotation.default_days,
        cta_rotation_posts: config.diversity_rules.cta_variation.default_interval,
        approved_score: config.scoring.thresholds.approved,
        review_score: config.scoring.thresholds.review_recommended
      },

      output_files: {
        full_report: `${FATIGUE_DIR}/fatigue-analysis-report.json`,
        summary: `${FATIGUE_DIR}/fatigue-summary.md`,
        recommendations: `${FATIGUE_DIR}/diversification-recommendations.json`
      }
    };

    // Save full report
    const reportPath = `${FATIGUE_DIR}/fatigue-analysis-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n✅ Full report saved: ${reportPath}`, 'green');

    // Save summary markdown
    const summaryMd = `# FATIGUE CHECKER ANALYSIS - Session ${SESSION_ID}

**Agent**: fatigue-checker (Phase 5, Agent #11)
**Execution Time**: ${report.execution_time}
**Status**: ${report.summary.status}

---

## 📊 FRESHNESS SCORE

**${report.summary.freshness_score}/100** ${report.summary.status === 'APPROVED' ? '✅' : report.summary.status === 'REVIEW_RECOMMENDED' ? '⚠️' : '❌'}

- **Threshold for Approval**: ${report.thresholds.approved_score}/100
- **Flags Raised**: ${report.summary.total_flags}
- **Recommendations**: ${report.summary.total_recommendations}

---

## 🔍 CONTENT ANALYZED

### Current Session:
- LinkedIn Posts: ${report.content_analyzed.current_session.linkedin_posts}
- WhatsApp Messages: ${report.content_analyzed.current_session.whatsapp_messages}
- **Total**: ${report.content_analyzed.current_session.total_items} items

### Historical Comparison:
- LinkedIn Posts: ${report.content_analyzed.historical_comparison.linkedin_posts}
- WhatsApp Messages: ${report.content_analyzed.historical_comparison.whatsapp_messages}
- Sessions Analyzed: ${report.content_analyzed.historical_comparison.sessions_analyzed}

---

## 📈 DIVERSITY ANALYSIS

### Topic Distribution:
${Object.entries(report.diversity_analysis.topics)
  .sort((a, b) => b[1] - a[1])
  .map(([topic, count]) => `- **${topic}**: ${count} items (${(count / report.content_analyzed.current_session.total_items * 100).toFixed(1)}%)`)
  .join('\n')}

### Hook Variety:
${Object.entries(report.diversity_analysis.hooks)
  .sort((a, b) => b[1] - a[1])
  .map(([hook, count]) => `- **${hook}**: ${count} items (${(count / report.content_analyzed.current_session.total_items * 100).toFixed(1)}%)`)
  .join('\n')}

### CTA Diversity:
${Object.entries(report.diversity_analysis.ctas)
  .sort((a, b) => b[1] - a[1])
  .map(([cta, count]) => `- **${cta}**: ${count} items (${(count / report.content_analyzed.current_session.whatsapp_messages * 100).toFixed(1)}%)`)
  .join('\n')}

---

## 🚨 FLAGS RAISED

${report.flags.length === 0 ? '✅ No flags raised - Content is fresh and diverse!' :
  report.flags.map((flag, idx) => `
### ${idx + 1}. ${flag.type.toUpperCase()}
- **Platform**: ${flag.platform || 'N/A'}
- **Penalty**: -${flag.penalty} points
- **Details**: ${JSON.stringify(flag, null, 2)}`).join('\n')}

---

## 💡 RECOMMENDATIONS

${report.recommendations.length === 0 ? '✅ No recommendations - Content meets all diversity standards!' :
  report.recommendations.map((rec, idx) => `
### ${idx + 1}. ${rec.action.replace(/_/g, ' ').toUpperCase()}
- **Priority**: ${rec.priority.toUpperCase()}
- **Description**: ${rec.description}`).join('\n')}

---

## 📋 CONFIGURATION USED

- **Similarity Threshold**: ${report.thresholds.similarity_threshold} (70% = flag)
- **Topic Rotation**: ${report.thresholds.topic_rotation_days} days
- **CTA Rotation**: ${report.thresholds.cta_rotation_posts} posts

---

## 📁 OUTPUT FILES

- **Full Report**: \`${report.output_files.full_report}\`
- **Summary**: \`${report.output_files.summary}\`
- **Recommendations**: \`${report.output_files.recommendations}\`

---

## ✅ NEXT STEPS

${report.summary.status === 'APPROVED' ?
  '**Content approved for distribution!** Proceed to Distribution Controller (Agent #12)' :
  '**Review and revise flagged content** before proceeding to distribution'}

---

*Generated by Fatigue Checker Agent (Phase 5, Agent #11)*
*Part of FinAdvise 14-Agent Grammy-Level Pipeline*
`;

    const summaryPath = `${FATIGUE_DIR}/fatigue-summary.md`;
    fs.writeFileSync(summaryPath, summaryMd);
    log(`✅ Summary saved: ${summaryPath}`, 'green');

    // Save recommendations
    const recommendationsPath = `${FATIGUE_DIR}/diversification-recommendations.json`;
    fs.writeFileSync(recommendationsPath, JSON.stringify({
      session_id: SESSION_ID,
      timestamp: report.timestamp,
      freshness_score: report.summary.freshness_score,
      recommendations: report.recommendations,
      next_steps: report.summary.status === 'APPROVED' ?
        'Proceed to Distribution Controller' :
        'Revise flagged content before distribution'
    }, null, 2));
    log(`✅ Recommendations saved: ${recommendationsPath}`, 'green');

    // Update execution summary
    const execSummaryPath = `${OUTPUT_DIR}/EXECUTION_SUMMARY.md`;
    let execSummary = fs.readFileSync(execSummaryPath, 'utf8');

    execSummary = execSummary.replace(
      '- Agent #11: Fatigue Checker (Pending)',
      `- Agent #11: Fatigue Checker ✅ (${report.summary.freshness_score}/100 freshness)`
    );

    execSummary = execSummary.replace(
      '**Status**: 🟢 PHASE 4 COMPLETED - BRAND CUSTOMIZER',
      '**Status**: 🟢 PHASE 5 IN PROGRESS - FATIGUE CHECKER COMPLETE'
    );

    fs.writeFileSync(execSummaryPath, execSummary);

    // Final summary
    logSection('🎯 EXECUTION COMPLETE');
    log(`\n✅ Freshness Score: ${report.summary.freshness_score}/100`, scoreColor);
    log(`✅ Flags Raised: ${report.summary.total_flags}`, 'cyan');
    log(`✅ Recommendations: ${report.summary.total_recommendations}`, 'cyan');
    log(`✅ Status: ${report.summary.status}`, scoreColor);
    log(`\n📁 Output Directory: ${FATIGUE_DIR}`, 'green');
    log(`📄 Full Report: fatigue-analysis-report.json`, 'green');
    log(`📄 Summary: fatigue-summary.md`, 'green');
    log(`📄 Recommendations: diversification-recommendations.json`, 'green');

    if (report.summary.status === 'APPROVED') {
      log(`\n🚀 READY FOR DISTRIBUTION CONTROLLER (Agent #12)`, 'green');
    } else {
      log(`\n⚠️  REVIEW REQUIRED before proceeding to distribution`, 'yellow');
    }

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run
main();
