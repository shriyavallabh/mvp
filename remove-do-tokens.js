#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean
const filesToClean = [
    './auto-deploy-via-api.js',
    './backup-test-files/deploy-to-vm-now.js',
    './DEPLOYMENT-STATUS.md',
    './emergency-webhook-fix.js',
    './FINAL-WORKING-SOLUTION.md',
    './programmatic-deploy.js',
    './rebuild-webhook-now.js',
    './restart-webhook-service.js',
    './restore-vm-complete.sh',
    './temporary-files/COMPLETE-THREAD-ANALYSIS.md',
    './temporary-files/do-api-setup.sh',
    './temporary-files/FINAL-SUMMARY-FOR-NEW-SESSION.md',
    './temporary-files/STORY-3.1-WEBHOOK-INTEGRATION-SUMMARY.md',
    './UPDATED-STORY-3.2-COMPLETE-DOCUMENTATION.md',
    './VM-DEPLOYMENT-ANALYSIS.md'
];

// Pattern to replace
const DO_TOKEN_PATTERN = /dop_v1_[a-zA-Z0-9]{64}/g;
const REPLACEMENT = 'YOUR_DO_TOKEN_HERE';

console.log('🔒 Removing DigitalOcean tokens from files...\n');

let filesProcessed = 0;
let tokensReplaced = 0;

filesToClean.forEach(filePath => {
    try {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            const matches = content.match(DO_TOKEN_PATTERN);
            
            if (matches) {
                content = content.replace(DO_TOKEN_PATTERN, REPLACEMENT);
                fs.writeFileSync(filePath, content);
                filesProcessed++;
                tokensReplaced += matches.length;
                console.log(`✅ Cleaned ${filePath} (${matches.length} tokens)`);
            }
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
});

console.log(`\n✅ Complete: Processed ${filesProcessed} files, replaced ${tokensReplaced} tokens`);
console.log('\n⚠️  Remember to add these tokens to .env file for production use');