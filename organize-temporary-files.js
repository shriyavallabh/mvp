#!/usr/bin/env node

/**
 * Organize all temporary, test, and non-essential files into a temporary-files folder
 * Creates a comprehensive manifest of moved files
 */

const fs = require('fs');
const path = require('path');

// Create temporary folder
const tempDir = path.join(__dirname, 'temporary-files');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Categories of files to move
const categories = {
    testing: {
        patterns: [
            /^test-.*\.js$/,
            /^TEST-.*\.js$/,
            /^testing-.*\.js$/,
            /^qa-test-.*\.js$/,
            /^beta-test.*\.js$/,
            /^e2e-.*\.js$/,
            /^final-test.*\.js$/,
            /^persistent-.*-tester\.js$/
        ],
        files: []
    },
    debugging: {
        patterns: [
            /^debug-.*\.js$/,
            /^diagnose-.*\.js$/,
            /^deep-debug.*\.js$/,
            /^deep-investigation.*\.js$/,
            /^troubleshoot.*\.js$/
        ],
        files: []
    },
    checking: {
        patterns: [
            /^check-.*\.js$/,
            /^verify-.*\.js$/,
            /^validate-.*\.js$/,
            /^identify-.*\.js$/,
            /^track-.*\.js$/,
            /^monitor-.*\.js$/
        ],
        files: []
    },
    fixing: {
        patterns: [
            /^fix-.*\.js$/,
            /^force-.*\.js$/,
            /^solve-.*\.js$/,
            /^implement-.*\.js$/,
            /^migrate-.*\.js$/
        ],
        files: []
    },
    sending: {
        patterns: [
            /^send-.*\.js$/,
            /^deliver-.*\.js$/,
            /^trigger-.*\.js$/,
            /^mark-.*\.js$/,
            /^continuous-.*\.js$/
        ],
        files: []
    },
    creation: {
        patterns: [
            /^create-.*\.js$/,
            /^generate-.*\.js$/,
            /^list-.*\.js$/,
            /^meta-compliant.*\.js$/
        ],
        files: []
    },
    setup: {
        patterns: [
            /^setup-.*\.js$/,
            /^auto-setup.*\.js$/,
            /^install-.*\.js$/,
            /^deploy-.*\.js$/,
            /^start-.*\.js$/
        ],
        files: []
    },
    webhooks: {
        patterns: [
            /^webhook-.*\.js$/,
            /^.*-webhook.*\.js$/,
            /^WORKING-WEBHOOK.*\.js$/
        ],
        files: []
    },
    whatsapp: {
        patterns: [
            /^whatsapp-.*\.js$/,
            /^.*-whatsapp-.*\.js$/,
            /^click-to-unlock.*\.js$/,
            /^daily-.*\.js$/
        ],
        files: []
    },
    scripts: {
        patterns: [
            /^RUN-.*\.sh$/,
            /^FIX-.*\.sh$/,
            /^START-.*\.sh$/,
            /^SEND.*\.sh$/,
            /^deploy-.*\.sh$/,
            /^auto-.*\.sh$/,
            /^debug-.*\.sh$/,
            /^get-.*\.sh$/,
            /^do-.*\.sh$/,
            /^quick-.*\.sh$/,
            /^ssh-.*\.sh$/
        ],
        files: []
    },
    templates: {
        patterns: [
            /^.*-template.*\.js$/,
            /^.*templates.*\.js$/,
            /^sample.*\.js$/
        ],
        files: []
    },
    demos: {
        patterns: [
            /^FINAL-.*\.js$/,
            /^SEND-.*\.js$/,
            /^.*-NOW\.js$/,
            /^.*-now\.js$/,
            /^.*-final\.js$/,
            /^.*-complete\.js$/
        ],
        files: []
    },
    reports: {
        patterns: [
            /^.*-results.*\.json$/,
            /^.*-report.*\.json$/,
            /^.*-info\.json$/,
            /^.*-diagnostic.*\.json$/,
            /^advisor-.*\.json$/,
            /^delivery-.*\.json$/,
            /^distribution-.*\.json$/,
            /^subscription.*\.json$/
        ],
        files: []
    },
    documentation: {
        patterns: [
            /^EMERGENCY-.*\.md$/,
            /^MANUAL_.*\.md$/,
            /^REAL_.*\.md$/,
            /^THE-.*\.md$/,
            /^STORY-.*\.md$/,
            /^COMPLETE-.*\.md$/,
            /^FINAL.*\.md$/,
            /^META-.*\.md$/,
            /^VIEW_.*\.md$/,
            /^PRODUCTION-.*\.md$/,
            /^VM-.*\.md$/,
            /^CLICK.*\.md$/,
            /^COPY-.*\.txt$/,
            /^one-line.*\.txt$/
        ],
        files: []
    },
    cloudInit: {
        patterns: [
            /^cloud-init.*$/,
            /^user-data.*$/,
            /^via-userdata.*$/
        ],
        files: []
    },
    misc: {
        patterns: [
            /^cloudflare-.*\.js$/,
            /^gemini-.*\.js$/,
            /^intelligent-.*\.js$/,
            /^production-.*\.js$/,
            /^crm-.*\.js$/,
            /^claude-.*\.js$/,
            /^app-v2\.js$/,
            /^.*\.tar\.gz$/
        ],
        files: []
    }
};

// Core files to ALWAYS keep (never move)
const keepFiles = [
    // Main application files
    'app.js',
    'index.js',
    'server.js',
    
    // Configuration
    'package.json',
    'package-lock.json',
    '.env',
    '.env.example',
    '.env.template',
    '.env.v2.template',
    '.gitignore',
    
    // Documentation
    'README.md',
    'ARCHITECTURE-EXPLANATION.md',
    'PROJECT_STRUCTURE.md',
    'DEPLOYMENT_GUIDE.md',
    'WHATSAPP_SETUP_GUIDE.md',
    'GOOGLE_SHEETS_SETUP.md',
    'SECURITY_FIXES_SUMMARY.md',
    'SECURITY_FIX_COMPLETE.md',
    
    // Core ecosystem configs
    'ecosystem.content.config.js',
    'ecosystem.content.production.js',
    'ecosystem.tunnel.config.js',
    'ecosystem.v2.config.js',
    'ecosystem.webhook.config.js',
    
    // Critical scripts that were already cleaned
    'test-security-fixes.js',
    'migrate-to-secure-config.js',
    'fix-remaining-fallbacks.js',
    'cleanup-test-files.js',
    'organize-temporary-files.js',
    
    // Important images
    'finadvise-sample.jpg',
    'test_message.png',
    'sample_template_image.jpg'
];

// Directories to keep
const keepDirs = [
    'node_modules',
    'config',
    'services',
    'utils',
    'agents',
    'scripts',
    'jobs',
    'data',
    'docs',
    'tests',
    'monitoring',
    'templates',
    'template-images',
    'subscriber-images',
    'generated-images',
    'daily-updates',
    '.bmad-core',
    '.claude',
    '.ai',
    'backup-test-files',
    'temporary-files'
];

let movedFiles = [];
let keptFiles = [];
let errors = [];

console.log('🗂️  ORGANIZING TEMPORARY FILES');
console.log('=' .repeat(60));

// Process all files in the root directory
const allItems = fs.readdirSync(__dirname);

allItems.forEach(item => {
    const itemPath = path.join(__dirname, item);
    const stats = fs.statSync(itemPath);
    
    // Skip directories
    if (stats.isDirectory()) {
        if (!keepDirs.includes(item)) {
            console.log(`📁 Directory: ${item} (keeping)`);
        }
        return;
    }
    
    // Skip files in keep list
    if (keepFiles.includes(item)) {
        keptFiles.push(item);
        console.log(`✓ Keeping: ${item} (core file)`);
        return;
    }
    
    // Skip backup files
    if (item.includes('.backup')) {
        console.log(`⏭️  Skipping: ${item} (backup file)`);
        return;
    }
    
    // Check each category
    let moved = false;
    for (const [categoryName, category] of Object.entries(categories)) {
        for (const pattern of category.patterns) {
            if (pattern.test(item)) {
                try {
                    const destPath = path.join(tempDir, item);
                    fs.renameSync(itemPath, destPath);
                    category.files.push(item);
                    movedFiles.push({ file: item, category: categoryName });
                    console.log(`→ Moved: ${item} to temporary-files/ (${categoryName})`);
                    moved = true;
                    break;
                } catch (err) {
                    errors.push(`Failed to move ${item}: ${err.message}`);
                    console.error(`✗ Error: ${item} - ${err.message}`);
                }
            }
        }
        if (moved) break;
    }
    
    if (!moved && !item.startsWith('.')) {
        console.log(`? Keeping: ${item} (no pattern match)`);
        keptFiles.push(item);
    }
});

// Generate manifest
let manifest = `# Temporary Files Manifest

Generated: ${new Date().toISOString()}

This document lists all files that have been moved to the \`temporary-files/\` directory.
These files are primarily test scripts, debugging tools, and temporary utilities that are not part of the core application.

## Summary
- **Total Files Moved**: ${movedFiles.length}
- **Files Kept**: ${keptFiles.length}
- **Errors**: ${errors.length}

## Files by Category

`;

// Add each category to manifest
for (const [categoryName, category] of Object.entries(categories)) {
    if (category.files.length > 0) {
        manifest += `### ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} (${category.files.length} files)\n\n`;
        category.files.sort().forEach(file => {
            manifest += `- ${file}\n`;
        });
        manifest += '\n';
    }
}

// Add kept files
manifest += `## Core Files Kept in Root (${keptFiles.length} files)\n\n`;
manifest += `These files remain in the root directory as they are part of the core application:\n\n`;
keptFiles.sort().forEach(file => {
    manifest += `- ${file}\n`;
});

// Add errors if any
if (errors.length > 0) {
    manifest += `\n## Errors Encountered\n\n`;
    errors.forEach(error => {
        manifest += `- ${error}\n`;
    });
}

// Add restoration instructions
manifest += `
## How to Restore Files

If you need to restore any of these files back to the root directory:

### Restore a single file:
\`\`\`bash
mv temporary-files/filename.js .
\`\`\`

### Restore all files from a category (example for testing):
\`\`\`bash
mv temporary-files/test-*.js .
\`\`\`

### Restore all files:
\`\`\`bash
mv temporary-files/* .
\`\`\`

### Delete temporary files permanently:
\`\`\`bash
rm -rf temporary-files/
\`\`\`

## File Location Reference

All moved files are now in: \`/Users/shriyavallabh/Desktop/mvp/temporary-files/\`

If an agent or script cannot find a file, check this directory first.
`;

// Write manifest
fs.writeFileSync(path.join(__dirname, 'TEMPORARY_FILES_MANIFEST.md'), manifest);

// Print summary
console.log('\n' + '=' .repeat(60));
console.log('📊 ORGANIZATION COMPLETE');
console.log('=' .repeat(60));
console.log(`Files moved: ${movedFiles.length}`);
console.log(`Files kept: ${keptFiles.length}`);
console.log(`Errors: ${errors.length}`);
console.log('\n📄 Manifest created: TEMPORARY_FILES_MANIFEST.md');
console.log('📁 Temporary files location: temporary-files/');
console.log('\nTo restore files, see instructions in TEMPORARY_FILES_MANIFEST.md');