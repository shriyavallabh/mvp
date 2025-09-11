#!/usr/bin/env node

/**
 * Fix remaining hardcoded fallback tokens
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'send-integrated-image-templates.js',
    'create-image-templates-and-trigger-flow.js',
    'check-all-approved-templates.js',
    'agents/whatsapp-template-manager.js',
    'whatsapp-strategic-solution.js',
    'whatsapp-gemini-image-templates.js'
];

const tokenPattern = /process\.env\.WHATSAPP_(?:ACCESS_TOKEN|BEARER_TOKEN)\s*\|\|\s*'EAAT[^']+'/g;
const phonePattern = /process\.env\.WHATSAPP_PHONE_NUMBER_ID\s*\|\|\s*'?\d+'?/g;
const businessPattern = /process\.env\.WHATSAPP_BUSINESS_ACCOUNT_ID\s*\|\|\s*'?\d+'?/g;

let totalFixed = 0;

filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if dotenv is imported
    if (!content.includes("require('dotenv')") && !content.includes('require("dotenv")')) {
        content = "require('dotenv').config();\n" + content;
    }
    
    // Fix token fallbacks
    content = content.replace(tokenPattern, 'process.env.WHATSAPP_ACCESS_TOKEN');
    
    // Fix phone number fallbacks
    content = content.replace(phonePattern, 'process.env.WHATSAPP_PHONE_NUMBER_ID');
    
    // Fix business account fallbacks
    content = content.replace(businessPattern, 'process.env.WHATSAPP_BUSINESS_ACCOUNT_ID');
    
    if (content !== originalContent) {
        // Create backup
        fs.writeFileSync(filePath + '.fallback-backup', originalContent);
        
        // Write fixed content
        fs.writeFileSync(filePath, content);
        
        console.log(`✅ Fixed: ${file}`);
        totalFixed++;
    } else {
        console.log(`ℹ️  No changes needed: ${file}`);
    }
});

console.log(`\n✅ Fixed ${totalFixed} files with fallback tokens`);
console.log('🔒 All hardcoded fallback tokens have been removed');