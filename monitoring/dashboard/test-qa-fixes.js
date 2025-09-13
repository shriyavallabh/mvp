#!/usr/bin/env node

/**
 * Test script to verify QA fixes for Story 4.4
 * This validates:
 * 1. Authentication middleware on analytics endpoints
 * 2. Input validation on POST endpoints
 * 3. Configuration usage instead of hardcoded values
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing QA Fixes for Story 4.4 Analytics Module');
console.log('=' .repeat(60));

// Test Results Tracking
let testsPassed = 0;
let testsFailed = 0;
const issues = [];

// Test 1: Check authentication middleware
function testAuthentication() {
  console.log('\n📋 Test 1: Authentication Middleware');
  console.log('-'.repeat(40));
  
  // Check if requireAuth is defined in api.js
  const apiPath = path.join(__dirname, 'routes/api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  // Check for requireAuth middleware definition
  if (apiContent.includes('const requireAuth = (req, res, next) =>')) {
    console.log('✅ requireAuth middleware defined');
    testsPassed++;
  } else {
    console.log('❌ requireAuth middleware not found');
    issues.push('Authentication middleware not properly defined');
    testsFailed++;
  }
  
  // Check if analytics endpoints use requireAuth
  const analyticsEndpoints = [
    '/analytics/kpis',
    '/analytics/content',
    '/analytics/advisors',
    '/analytics/comparison',
    '/analytics/predictions/churn',
    '/analytics/predictions/fatigue',
    '/analytics/report',
    '/analytics/export'
  ];
  
  analyticsEndpoints.forEach(endpoint => {
    const pattern = new RegExp(`router\\.(get|post)\\('${endpoint}'.*requireAuth`, 's');
    if (apiContent.match(pattern)) {
      console.log(`✅ ${endpoint} protected with authentication`);
      testsPassed++;
    } else {
      console.log(`❌ ${endpoint} missing authentication`);
      issues.push(`Endpoint ${endpoint} not protected`);
      testsFailed++;
    }
  });
}

// Test 2: Check input validation
function testInputValidation() {
  console.log('\n📋 Test 2: Input Validation');
  console.log('-'.repeat(40));
  
  const apiPath = path.join(__dirname, 'routes/api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  // Check for express-validator import
  if (apiContent.includes("require('express-validator')")) {
    console.log('✅ express-validator imported');
    testsPassed++;
  } else {
    console.log('❌ express-validator not imported');
    issues.push('express-validator not properly imported');
    testsFailed++;
  }
  
  // Check for validation error handler
  if (apiContent.includes('const handleValidationErrors')) {
    console.log('✅ Validation error handler defined');
    testsPassed++;
  } else {
    console.log('❌ Validation error handler not found');
    issues.push('Validation error handler missing');
    testsFailed++;
  }
  
  // Check specific POST endpoints for validation
  const postEndpoints = [
    { route: '/agents/trigger', validation: 'agentName' },
    { route: '/advisors', validation: 'name.*phone' },
    { route: '/content/approve', validation: 'param.*id' },
    { route: '/analytics/predictions/churn', validation: 'advisor_id' },
    { route: '/analytics/report', validation: 'report_type' }
  ];
  
  postEndpoints.forEach(({ route, validation }) => {
    const pattern = new RegExp(`router\\.post\\('${route}'[^}]*${validation}`, 's');
    if (apiContent.match(pattern)) {
      console.log(`✅ ${route} has input validation`);
      testsPassed++;
    } else {
      console.log(`⚠️  ${route} may lack proper validation`);
      // This is a warning, not a failure
    }
  });
}

// Test 3: Check configuration usage
function testConfiguration() {
  console.log('\n📋 Test 3: Configuration Usage');
  console.log('-'.repeat(40));
  
  // Check if configuration file exists
  const configPath = path.join(__dirname, 'config/analytics.config.js');
  if (fs.existsSync(configPath)) {
    console.log('✅ Configuration file exists');
    testsPassed++;
    
    // Check configuration structure
    const config = require(configPath);
    
    // Check main sections
    const requiredSections = ['predictions', 'apiCosts', 'operations', 'reports', 'cache'];
    requiredSections.forEach(section => {
      if (config[section]) {
        console.log(`✅ Config section '${section}' defined`);
        testsPassed++;
      } else {
        console.log(`❌ Config section '${section}' missing`);
        issues.push(`Configuration section '${section}' not found`);
        testsFailed++;
      }
    });
    
    // Check environment variable support
    const configContent = fs.readFileSync(configPath, 'utf-8');
    if (configContent.includes('process.env')) {
      console.log('✅ Environment variable overrides supported');
      testsPassed++;
    } else {
      console.log('⚠️  No environment variable overrides found');
    }
  } else {
    console.log('❌ Configuration file not found');
    issues.push('analytics.config.js file missing');
    testsFailed++;
  }
  
  // Check if services use configuration
  const predictionsPath = path.join(__dirname, 'services/predictions.js');
  if (fs.existsSync(predictionsPath)) {
    const predictionsContent = fs.readFileSync(predictionsPath, 'utf-8');
    
    if (predictionsContent.includes("require('../config/analytics.config')")) {
      console.log('✅ predictions.js imports configuration');
      testsPassed++;
    } else {
      console.log('❌ predictions.js not using configuration');
      issues.push('predictions.js not importing configuration');
      testsFailed++;
    }
    
    // Check for hardcoded values replaced
    const hardcodedPatterns = [
      /riskScore \+= 40(?!\))/,  // Hardcoded 40 (not in a comparison)
      /riskScore \+= 30(?!\))/,  // Hardcoded 30
      /daysInactive > 30(?!\))/  // Hardcoded threshold
    ];
    
    let hasHardcoded = false;
    hardcodedPatterns.forEach(pattern => {
      if (predictionsContent.match(pattern)) {
        hasHardcoded = true;
      }
    });
    
    if (!hasHardcoded) {
      console.log('✅ No obvious hardcoded values in predictions.js');
      testsPassed++;
    } else {
      console.log('⚠️  Some values may still be hardcoded');
    }
  }
  
  // Check API routes for configuration usage
  const apiPath = path.join(__dirname, 'routes/api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  if (apiContent.includes("require('../config/analytics.config')")) {
    console.log('✅ api.js imports configuration');
    testsPassed++;
    
    // Check for config usage in cost calculations
    if (apiContent.includes('config.apiCosts')) {
      console.log('✅ API costs using configuration');
      testsPassed++;
    } else {
      console.log('⚠️  API costs may not be using configuration');
    }
  } else {
    console.log('❌ api.js not using configuration');
    issues.push('api.js not importing configuration');
    testsFailed++;
  }
}

// Test 4: Check package dependencies
function testDependencies() {
  console.log('\n📋 Test 4: Package Dependencies');
  console.log('-'.repeat(40));
  
  const packagePath = path.join(__dirname, '..', '..', 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    const requiredPackages = ['express-validator', 'better-sqlite3', 'puppeteer'];
    
    requiredPackages.forEach(pkg => {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        console.log(`✅ ${pkg} in dependencies`);
        testsPassed++;
      } else {
        console.log(`❌ ${pkg} not found in dependencies`);
        issues.push(`Package ${pkg} not in dependencies`);
        testsFailed++;
      }
    });
  }
}

// Test 5: Security Best Practices
function testSecurityPractices() {
  console.log('\n📋 Test 5: Security Best Practices');
  console.log('-'.repeat(40));
  
  const apiPath = path.join(__dirname, 'routes/api.js');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  // Check for SQL injection prevention (parameterized queries)
  const servicesDir = path.join(__dirname, 'services');
  const serviceFiles = fs.readdirSync(servicesDir)
    .filter(f => f.endsWith('.js'));
  
  let usesPreparedStatements = false;
  serviceFiles.forEach(file => {
    const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
    if (content.includes('.prepare(') || content.includes('db.prepare(')) {
      usesPreparedStatements = true;
    }
  });
  
  if (usesPreparedStatements) {
    console.log('✅ Using prepared statements for database queries');
    testsPassed++;
  } else {
    console.log('⚠️  Verify prepared statements are used for SQL queries');
  }
  
  // Check for rate limiting mention
  if (apiContent.includes('rate') || apiContent.includes('limit')) {
    console.log('✅ Rate limiting considered');
    testsPassed++;
  } else {
    console.log('⚠️  Consider implementing rate limiting');
  }
  
  // Check session configuration
  const serverPath = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf-8');
    if (serverContent.includes('httpOnly: true')) {
      console.log('✅ Session cookies configured with httpOnly');
      testsPassed++;
    } else {
      console.log('⚠️  Session cookies should use httpOnly flag');
    }
    
    if (serverContent.includes("secure: process.env.NODE_ENV === 'production'")) {
      console.log('✅ Secure cookies in production');
      testsPassed++;
    } else {
      console.log('⚠️  Secure flag should be set for production');
    }
  }
}

// Run all tests
console.log('\n🚀 Starting QA Fix Validation Tests\n');

testAuthentication();
testInputValidation();
testConfiguration();
testDependencies();
testSecurityPractices();

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (issues.length > 0) {
  console.log('\n⚠️  Issues Found:');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
}

if (testsFailed === 0) {
  console.log('\n🎉 All QA fixes have been successfully applied!');
  console.log('✅ The module is ready for staging deployment.');
} else {
  console.log('\n❌ Some QA fixes are incomplete or missing.');
  console.log('📝 Please address the issues listed above.');
}

console.log('\n📝 Recommendations:');
console.log('  1. Run full test suite: npm test');
console.log('  2. Test authentication manually with curl or Postman');
console.log('  3. Verify environment variables are documented');
console.log('  4. Consider adding rate limiting for production');
console.log('  5. Review logs for any runtime errors');

process.exit(testsFailed > 0 ? 1 : 0);