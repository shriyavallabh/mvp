#!/usr/bin/env node

/**
 * Migration Script - Update all files to use secure configuration
 * This script replaces hardcoded credentials with environment variable references
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to find and replace
const REPLACEMENTS = [
    {
        pattern: /phoneNumberId:\s*['"`]574744175733556['"`]/g,
        replacement: "phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID",
        envVar: 'WHATSAPP_PHONE_NUMBER_ID',
        value: '574744175733556'
    },
    {
        pattern: /businessAccountId:\s*['"`]1861646317956355['"`]/g,
        replacement: "businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID",
        envVar: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        value: '1861646317956355'
    },
    {
        pattern: /accessToken:\s*['"`]EAATOFQtMe9gBP[^'"`]*['"`]/g,
        replacement: "accessToken: process.env.WHATSAPP_ACCESS_TOKEN",
        envVar: 'WHATSAPP_ACCESS_TOKEN',
        value: 'EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD'
    },
    {
        pattern: /Bearer\s+EAATOFQtMe9gBP[^'"`\s]*/g,
        replacement: "Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}",
        envVar: 'WHATSAPP_ACCESS_TOKEN',
        isBearer: true
    },
    {
        pattern: /'574744175733556'/g,
        replacement: "process.env.WHATSAPP_PHONE_NUMBER_ID",
        envVar: 'WHATSAPP_PHONE_NUMBER_ID',
        checkContext: true
    },
    {
        pattern: /"574744175733556"/g,
        replacement: "process.env.WHATSAPP_PHONE_NUMBER_ID",
        envVar: 'WHATSAPP_PHONE_NUMBER_ID',
        checkContext: true
    }
];

// Files to skip
const SKIP_FILES = [
    'node_modules/**',
    '.git/**',
    '*.md',
    '*.json',
    '*.lock',
    '.env*',
    'migrate-to-secure-config.js',
    'config/env.config.js',
    'utils/resilience.js',
    'utils/validation.js',
    'utils/logger.js',
    'services/whatsapp/whatsapp.service.js',
    'send-to-advisors-secure.js'
];

// Files that need environment variable imports
const ADD_ENV_IMPORT = `const dotenv = require('dotenv');
dotenv.config();

`;

console.log('🔒 SECURITY MIGRATION - Replacing Hardcoded Credentials');
console.log('=' .repeat(70));

/**
 * Check if file should be skipped
 */
function shouldSkipFile(filePath) {
    const fileName = path.basename(filePath);
    
    // Skip non-JS files unless they're shell scripts
    if (!filePath.endsWith('.js') && !filePath.endsWith('.sh')) {
        return true;
    }
    
    // Check skip patterns
    for (const pattern of SKIP_FILES) {
        if (filePath.includes(pattern.replace('**', '').replace('*', ''))) {
            return true;
        }
    }
    
    return false;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
    if (shouldSkipFile(filePath)) {
        return null;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        let modified = false;
        const changes = [];
        
        // Apply replacements
        for (const replacement of REPLACEMENTS) {
            const matches = content.match(replacement.pattern);
            if (matches && matches.length > 0) {
                content = content.replace(replacement.pattern, replacement.replacement);
                changes.push({
                    envVar: replacement.envVar,
                    occurrences: matches.length
                });
                modified = true;
            }
        }
        
        // Add dotenv import if needed and not already present
        if (modified && filePath.endsWith('.js')) {
            if (!content.includes('dotenv') && !content.includes('env.config')) {
                // Check if this is a script that needs dotenv
                if (content.includes('process.env.')) {
                    content = ADD_ENV_IMPORT + content;
                    changes.push({ action: 'Added dotenv import' });
                }
            }
        }
        
        // Write back if modified
        if (modified) {
            // Create backup
            const backupPath = filePath + '.backup';
            fs.writeFileSync(backupPath, originalContent);
            
            // Write updated content
            fs.writeFileSync(filePath, content);
            
            return {
                file: filePath,
                changes,
                backup: backupPath
            };
        }
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
    
    return null;
}

/**
 * Create .env file if it doesn't exist
 */
function createEnvFile() {
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
        console.log('✓ .env file already exists');
        return false;
    }
    
    const envContent = `# WhatsApp Business API Configuration
# CRITICAL: These are sensitive credentials - keep them secure!
WHATSAPP_PHONE_NUMBER_ID=574744175733556
WHATSAPP_BUSINESS_ACCOUNT_ID=1861646317956355
WHATSAPP_ACCESS_TOKEN=EAATOFQtMe9gBPXrmwK1MDrvlBAWfbeevjzXs8PgT15GPsKADHmzJPWZBvnyhAYTjSfoAzOZC97CHQ27X6jE1iOjNZCehO2WrxPiEfRnhLO3sZA0iJ93Sh7ZB49ZBnF12CWCVTpB1WMfpRgpCdv5hXWIbWgzaHFovUPaZBQBDSa7p74ZCIKvZCtyLo3rj8dzDZAs74GaQZDZD

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=secure_webhook_token_2024

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Created .env file with migrated credentials');
    
    // Set file permissions to 600 (owner read/write only)
    try {
        fs.chmodSync(envPath, 0o600);
        console.log('✓ Set .env file permissions to 600 (secure)');
    } catch (error) {
        console.warn('⚠ Could not set file permissions:', error.message);
    }
    
    return true;
}

/**
 * Main migration function
 */
async function main() {
    console.log('\n1️⃣  Creating .env file...');
    const envCreated = createEnvFile();
    
    console.log('\n2️⃣  Finding JavaScript files...');
    
    // Find all JS files
    const files = glob.sync('**/*.js', {
        ignore: ['node_modules/**', '.git/**'],
        absolute: false
    });
    
    console.log(`   Found ${files.length} JavaScript files`);
    
    console.log('\n3️⃣  Migrating files...');
    
    const results = [];
    for (const file of files) {
        const result = migrateFile(file);
        if (result) {
            results.push(result);
            console.log(`   ✓ Migrated: ${file}`);
            result.changes.forEach(change => {
                if (change.envVar) {
                    console.log(`     - Replaced ${change.occurrences} occurrence(s) of ${change.envVar}`);
                } else if (change.action) {
                    console.log(`     - ${change.action}`);
                }
            });
        }
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 MIGRATION SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Files scanned: ${files.length}`);
    console.log(`Files migrated: ${results.length}`);
    console.log(`Backups created: ${results.length}`);
    
    if (envCreated) {
        console.log('\n✅ New .env file created with credentials');
    }
    
    if (results.length > 0) {
        console.log('\n📁 Migrated files:');
        results.forEach(r => {
            console.log(`   • ${r.file}`);
        });
        
        console.log('\n⚠️  IMPORTANT NEXT STEPS:');
        console.log('1. Review the changes in migrated files');
        console.log('2. Test the application to ensure it works correctly');
        console.log('3. ROTATE the WhatsApp access token in Meta Business Manager');
        console.log('4. Update the new token in your .env file');
        console.log('5. Delete backup files once verified: rm *.backup');
        console.log('6. Never commit .env to version control');
    } else {
        console.log('\n✅ No files needed migration (already secure or skipped)');
    }
    
    // Save migration report
    const reportPath = `migration-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        filesScanned: files.length,
        filesMigrated: results.length,
        results
    }, null, 2));
    
    console.log(`\n📄 Migration report saved to: ${reportPath}`);
}

// Run migration
main().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
});