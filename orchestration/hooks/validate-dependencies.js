#!/usr/bin/env node

/**
 * Dependencies Validation Hook
 * Validates that all required dependencies are available
 */

const fs = require('fs').promises;
const path = require('path');

async function validateDependencies() {
  try {
    const checks = [];

    // Check node modules
    try {
      await fs.access('node_modules');
      checks.push({ dependency: 'node_modules', status: '✅' });
    } catch {
      checks.push({ dependency: 'node_modules', status: '❌' });
    }

    // Check .env file
    try {
      await fs.access('.env');
      checks.push({ dependency: '.env', status: '✅' });
    } catch {
      checks.push({ dependency: '.env', status: '⚠️  (optional)' });
    }

    // Check data directories
    const requiredDirs = [
      'data',
      'orchestration',
      '.claude/agents',
      '.claude/commands'
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        checks.push({ dependency: dir, status: '✅' });
      } catch {
        checks.push({ dependency: dir, status: '❌' });
      }
    }

    // Check MCP server
    try {
      await fs.access('orchestration/mcp-server/finadvise-orchestrator.js');
      checks.push({ dependency: 'MCP Server', status: '✅' });
    } catch {
      checks.push({ dependency: 'MCP Server', status: '❌' });
    }

    // Log results
    console.log('📋 Dependency Check Results:');
    checks.forEach(check => {
      console.log(`   ${check.dependency}: ${check.status}`);
    });

    // Save validation results
    await fs.mkdir('data/orchestration-state', { recursive: true });
    await fs.writeFile(
      'data/orchestration-state/dependency-check.json',
      JSON.stringify({
        timestamp: Date.now(),
        checks,
        passed: checks.filter(c => c.status === '✅').length,
        total: checks.length
      }, null, 2)
    );

    const failedChecks = checks.filter(c => c.status === '❌');
    if (failedChecks.length > 0) {
      console.log('⚠️  Some dependencies are missing');
      return false;
    }

    console.log('✅ All dependencies validated');
    return true;

  } catch (error) {
    console.error('Dependency validation failed:', error.message);
    return false;
  }
}

validateDependencies();