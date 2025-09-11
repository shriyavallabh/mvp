#!/usr/bin/env node

/**
 * Clean up redundant test and debug files
 * Moves them to a backup directory instead of deleting
 */

const fs = require('fs');
const path = require('path');

// Create backup directory
const backupDir = path.join(__dirname, 'backup-test-files');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Patterns for files to clean up
const patterns = [
    /^test-.*\.js$/,
    /^TEST-.*\.js$/,
    /^check-.*\.js$/,
    /^diagnose-.*\.js$/,
    /^debug-.*\.js$/,
    /^fix-.*\.js$/,
    /^force-.*\.js$/,
    /^deep-.*\.js$/,
    /^final-.*-test\.js$/
];

// Files to keep (important ones)
const keepFiles = [
    'test-security-fixes.js',  // Important security test
    'check-webhook-hierarchy.js',  // May be needed
    'migrate-to-secure-config.js',  // Migration script
    'fix-remaining-fallbacks.js'  // Our new fix script
];

let movedCount = 0;
let skippedCount = 0;

// Get all .js files in current directory
const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));

files.forEach(file => {
    // Check if file should be kept
    if (keepFiles.includes(file)) {
        console.log(`✓ Keeping: ${file} (important file)`);
        skippedCount++;
        return;
    }
    
    // Check if file matches cleanup patterns
    const shouldCleanup = patterns.some(pattern => pattern.test(file));
    
    if (shouldCleanup) {
        const sourcePath = path.join(__dirname, file);
        const destPath = path.join(backupDir, file);
        
        try {
            fs.renameSync(sourcePath, destPath);
            console.log(`→ Moved: ${file} to backup/`);
            movedCount++;
        } catch (err) {
            console.error(`✗ Error moving ${file}: ${err.message}`);
        }
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 CLEANUP SUMMARY');
console.log('='.repeat(60));
console.log(`Files moved to backup: ${movedCount}`);
console.log(`Files kept: ${skippedCount}`);
console.log(`\nBackup location: ${backupDir}`);
console.log('\nTo restore files: mv backup-test-files/*.js .');
console.log('To permanently delete: rm -rf backup-test-files');