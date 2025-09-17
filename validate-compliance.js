#!/usr/bin/env node

const fs = require('fs');

// Simple compliance validator to check the regenerated content
const regeneratedData = JSON.parse(fs.readFileSync('data/regenerated-content.json', 'utf8'));

console.log('🔍 FINAL COMPLIANCE VALIDATION');
console.log('━'.repeat(50));

let totalCompliant = 0;
const results = [];

regeneratedData.regeneratedPosts.forEach(post => {
  const content = post.post.content;
  let compliant = true;
  const issues = [];

  // Check ARN format
  const arnMatch = content.match(/ARN-\d{5,6}/);
  if (!arnMatch) {
    issues.push('ARN format incorrect');
    compliant = false;
  }

  // Check market risk disclaimer
  if (!content.includes('Mutual fund investments are subject to market risks')) {
    issues.push('Missing market risk disclaimer');
    compliant = false;
  }

  // Check past performance disclaimer if performance mentioned
  const hasPerformance = /\d+(?:\.\d+)?%/.test(content) || /₹[\d,]+/.test(content) || /profits?/.test(content);
  if (hasPerformance && !content.includes('Past performance')) {
    issues.push('Missing past performance disclaimer');
    compliant = false;
  }

  // Check SEBI registration mention
  if (!content.includes('SEBI Registered')) {
    issues.push('Missing SEBI registration mention');
    compliant = false;
  }

  if (compliant) totalCompliant++;

  results.push({
    advisor: post.advisorName,
    compliant,
    issues,
    arn: arnMatch ? arnMatch[0] : 'NOT_FOUND',
    hasMarketDisclaimer: content.includes('Mutual fund investments are subject to market risks'),
    hasPastPerformanceDisclaimer: content.includes('Past performance'),
    hasSebiMention: content.includes('SEBI Registered')
  });

  console.log(`${post.advisorName}: ${compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
  console.log(`  ARN: ${arnMatch ? arnMatch[0] : 'NOT_FOUND'}`);
  console.log(`  Market Disclaimer: ${content.includes('Mutual fund investments are subject to market risks') ? '✅' : '❌'}`);
  console.log(`  Past Performance: ${content.includes('Past performance') ? '✅' : '❌'}`);
  console.log(`  SEBI Mention: ${content.includes('SEBI Registered') ? '✅' : '❌'}`);

  if (!compliant) {
    issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  }
  console.log('');
});

console.log('━'.repeat(50));
console.log(`Overall Compliance: ${totalCompliant}/${regeneratedData.regeneratedPosts.length} (${((totalCompliant/regeneratedData.regeneratedPosts.length)*100).toFixed(1)}%)`);

if (totalCompliant === regeneratedData.regeneratedPosts.length) {
  console.log('🎉 ALL POSTS ARE NOW SEBI COMPLIANT!');
  console.log('📋 COMPLIANCE SUMMARY:');
  console.log('• ✅ Correct ARN format (ARN-XXXXX)');
  console.log('• ✅ SEBI registration mentioned');
  console.log('• ✅ Market risk disclaimer included');
  console.log('• ✅ Past performance disclaimer added');

  // Update final compliance status
  const finalCompliance = {
    timestamp: new Date().toISOString(),
    status: 'COMPLIANT',
    compliance_rate: 1.0,
    total_posts: regeneratedData.regeneratedPosts.length,
    compliant_posts: totalCompliant,
    validationResults: results,
    certificate: `SEBI-COMP-${Date.now()}`
  };

  fs.writeFileSync('data/final-compliance-validation.json', JSON.stringify(finalCompliance, null, 2));
  console.log('\n📄 Final compliance certificate saved to: data/final-compliance-validation.json');

} else {
  console.log('❌ Some posts still need fixes');

  // Save failed validation
  const failedCompliance = {
    timestamp: new Date().toISOString(),
    status: 'NON_COMPLIANT',
    compliance_rate: totalCompliant / regeneratedData.regeneratedPosts.length,
    total_posts: regeneratedData.regeneratedPosts.length,
    compliant_posts: totalCompliant,
    validationResults: results,
    issues: results.filter(r => !r.compliant).map(r => ({ advisor: r.advisor, issues: r.issues }))
  };

  fs.writeFileSync('data/failed-compliance-validation.json', JSON.stringify(failedCompliance, null, 2));
}