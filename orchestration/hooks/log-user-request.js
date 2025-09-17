#!/usr/bin/env node

/**
 * Log User Request Hook
 * Logs and analyzes user requests for orchestration planning
 */

const fs = require('fs').promises;

async function logUserRequest() {
  try {
    const request = {
      timestamp: Date.now(),
      requestTime: new Date().toISOString(),
      userInput: process.argv[2] || 'No input provided',
      sessionId: process.env.SESSION_ID || `session_${Date.now()}`
    };

    // Create logs directory
    await fs.mkdir('logs/orchestration', { recursive: true });

    // Log the request
    const logEntry = `${request.requestTime}: User request logged - ${request.userInput}\n`;
    await fs.appendFile('logs/orchestration/user-requests.log', logEntry);

    // Save structured request data
    await fs.mkdir('data/orchestration-state', { recursive: true });
    await fs.writeFile(
      `data/orchestration-state/user-request-${Date.now()}.json`,
      JSON.stringify(request, null, 2)
    );

    console.log(`📝 User request logged: ${request.userInput.substring(0, 50)}...`);

  } catch (error) {
    console.error('Failed to log user request:', error.message);
  }
}

logUserRequest();