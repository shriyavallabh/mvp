#!/usr/bin/env node

/**
 * Security Validation Script
 * Validates environment configuration before starting the application
 */

require('dotenv').config();
const envValidator = require('../agents/utils/env-validator');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Security Validation for FinAdvise MVP...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  console.error('💡 Copy .env.example to .env and configure with your actual values');
  process.exit(1);
}

// Check .env file permissions
try {
  const stats = fs.statSync(envPath);
  const permissions = (stats.mode & 0o777).toString(8);
  
  if (permissions !== '600') {
    console.warn(`⚠️  .env file has permissions ${permissions}, should be 600`);
    console.warn('   Run: chmod 600 .env');
  } else {
    console.log('✅ .env file permissions are secure (600)');
  }
} catch (error) {
  console.warn('⚠️  Could not check .env file permissions:', error.message);
}

// Validate environment variables
console.log('\n🔍 Validating environment variables...\n');
const results = envValidator.validate();

if (results.success) {
  console.log('✅ All security validations passed!');
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Security warnings:');
    results.warnings.forEach(warning => {
      console.log(`   • ${warning.name}: ${warning.warning}`);
    });
    console.log('\n💡 Consider addressing these warnings before deployment');
  }
  
} else {
  console.log('❌ Security validation failed!\n');
  console.log(results.summary);
  
  console.log('\n📋 Next steps:');
  console.log('1. Copy .env.example to .env if you haven\'t already');
  console.log('2. Replace all placeholder values with your actual credentials');
  console.log('3. Generate secure webhook secrets using: openssl rand -base64 32');
  console.log('4. Ensure all API keys are valid and active');
  console.log('5. Run this script again to verify');
  
  process.exit(1);
}

// Additional security checks
console.log('\n🔍 Running additional security checks...\n');

// Check for common insecure patterns in config files
const configFiles = [
  '../config/production_config.js',
  '../config/ecosystem.config.js',
  '../ecosystem.webhook.config.js'
];

let hasInsecureConfigs = false;

for (const configFile of configFiles) {
  const configPath = path.join(__dirname, configFile);
  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      
      const insecurePatterns = [
        { pattern: /secret.*[:=]\s*['"].*default.*['"]/, name: 'default secrets' },
        { pattern: /secret.*[:=]\s*['"].*change.*['"]/, name: 'placeholder secrets' },
        { pattern: /token.*[:=]\s*['"].*test.*['"]/, name: 'test tokens' },
        { pattern: /AIza[\w-]{35}/, name: 'hardcoded API keys' }
      ];
      
      for (const { pattern, name } of insecurePatterns) {
        if (pattern.test(content)) {
          console.log(`⚠️  Found ${name} in ${path.basename(configPath)}`);
          hasInsecureConfigs = true;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not check ${configPath}:`, error.message);
    }
  }
}

if (!hasInsecureConfigs) {
  console.log('✅ No hardcoded secrets found in configuration files');
}

// Check git status for sensitive files
try {
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --porcelain', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
  
  const sensitiveFiles = ['.env'];
  const trackedSensitiveFiles = [];
  
  for (const line of gitStatus.split('\n')) {
    const file = line.slice(3).trim();
    if (sensitiveFiles.includes(file) && !line.startsWith('??')) {
      trackedSensitiveFiles.push(file);
    }
  }
  
  if (trackedSensitiveFiles.length > 0) {
    console.log('❌ Sensitive files are tracked in git:');
    trackedSensitiveFiles.forEach(file => console.log(`   • ${file}`));
    console.log('\n💡 Remove sensitive files from git:');
    trackedSensitiveFiles.forEach(file => {
      console.log(`   git rm --cached ${file}`);
    });
    hasInsecureConfigs = true;
  } else {
    console.log('✅ No sensitive files tracked in git');
  }
} catch (error) {
  // Git not available or not in a git repo - skip this check
  console.log('ℹ️  Git security check skipped (not a git repository or git not available)');
}

console.log('\n' + '='.repeat(80));

if (results.success && !hasInsecureConfigs) {
  console.log('🎉 All security checks passed! Your configuration is secure.');
  console.log('✅ Ready to start the application safely.');
} else {
  console.log('⚠️  Some security issues were found. Please address them before deployment.');
  if (!results.success) {
    process.exit(1);
  }
}

console.log('='.repeat(80) + '\n');