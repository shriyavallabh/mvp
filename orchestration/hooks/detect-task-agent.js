#!/usr/bin/env node

/**
 * Task Agent Detector - Audio Bridge for Slash Commands
 *
 * This hook intercepts Task tool calls and extracts the agent name
 * to enable audio announcements when /o command triggers agents.
 *
 * Problem solved: Task tools don't expose subagent_type to ${AGENT_NAME},
 * so we parse it from Claude's tool execution context.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TaskAgentDetector {
  constructor() {
    this.audioConfigPath = path.join(__dirname, 'audio-config.json');
    this.audioConfig = this.loadAudioConfig();
    this.logPath = path.join(__dirname, '../../data/audio-logs', 'task-detection.log');
  }

  loadAudioConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.audioConfigPath, 'utf8'));
    } catch (error) {
      return { enabled: false };
    }
  }

  // Extract agent name from various sources
  detectAgentName() {
    // Source 1: Environment variables that Claude Code might set
    const envSources = [
      process.env.CLAUDE_TOOL_NAME,
      process.env.CLAUDE_TOOL_ARGS,
      process.env.CLAUDE_SUBAGENT_TYPE,
      process.env.AGENT_NAME
    ];

    // Source 2: Process arguments
    const allArgs = process.argv.slice(2).join(' ');

    // Source 3: stdin (Claude might pass tool metadata here)
    let stdinData = '';
    try {
      // Non-blocking stdin read (if available)
      if (!process.stdin.isTTY) {
        stdinData = fs.readFileSync(0, 'utf-8');
      }
    } catch (e) {
      // Stdin not available, that's okay
    }

    // Combine all sources
    const searchSpace = [
      ...envSources.filter(Boolean),
      allArgs,
      stdinData
    ].join(' ').toLowerCase();

    // Known agent patterns (same as task-audio-bridge.js)
    const agentPatterns = [
      { pattern: /market[_-]?intelligence/i, name: 'market-intelligence' },
      { pattern: /advisor[_-]?data[_-]?manager/i, name: 'advisor-data-manager' },
      { pattern: /segment[_-]?analyzer/i, name: 'segment-analyzer' },
      { pattern: /linkedin[_-]?post[_-]?generator/i, name: 'linkedin-post-generator-enhanced' },
      { pattern: /whatsapp[_-]?message[_-]?creator/i, name: 'whatsapp-message-creator' },
      { pattern: /status[_-]?image[_-]?designer/i, name: 'status-image-designer' },
      { pattern: /gemini[_-]?image[_-]?generator/i, name: 'gemini-image-generator' },
      { pattern: /brand[_-]?customizer/i, name: 'brand-customizer' },
      { pattern: /compliance[_-]?validator/i, name: 'compliance-validator' },
      { pattern: /quality[_-]?scorer/i, name: 'quality-scorer' },
      { pattern: /fatigue[_-]?checker/i, name: 'fatigue-checker' },
      { pattern: /distribution[_-]?controller/i, name: 'distribution-controller' },
      { pattern: /analytics[_-]?tracker/i, name: 'analytics-tracker' },
      { pattern: /feedback[_-]?processor/i, name: 'feedback-processor' },
      { pattern: /mcp[_-]?coordinator/i, name: 'mcp-coordinator' },
      { pattern: /state[_-]?manager/i, name: 'state-manager' },
      { pattern: /communication[_-]?bus/i, name: 'communication-bus' }
    ];

    // Search for matches
    for (const agent of agentPatterns) {
      if (agent.pattern.test(searchSpace)) {
        return agent.name;
      }
    }

    return null;
  }

  // Check if current tool execution is a Task tool
  isTaskToolExecution() {
    const toolIndicators = [
      process.env.CLAUDE_TOOL_NAME === 'Task',
      process.argv.join(' ').includes('Task'),
      process.argv.join(' ').includes('subagent')
    ];

    return toolIndicators.some(indicator => indicator);
  }

  async announceAgent(agentName, eventType = 'start') {
    if (!this.audioConfig.enabled) {
      return;
    }

    const agentConfig = this.audioConfig.agents[agentName];
    if (!agentConfig) {
      this.log(`No audio config for agent: ${agentName}`);
      return;
    }

    const message = eventType === 'start' ? agentConfig.start : agentConfig.complete;

    // Use macOS say command
    const { voice_name, rate } = this.audioConfig.voice;
    const sayCommand = `say -v "${voice_name}" -r ${rate} "${message}" &`;

    try {
      execSync(sayCommand, { stdio: 'ignore' });
      console.log(`🔊 Audio: ${message}`);
      this.log(`Announced: ${message}`);
    } catch (error) {
      this.log(`Audio error: ${error.message}`);
    }
  }

  log(message) {
    try {
      const logDir = path.dirname(this.logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        env: {
          CLAUDE_TOOL_NAME: process.env.CLAUDE_TOOL_NAME,
          CLAUDE_TOOL_ARGS: process.env.CLAUDE_TOOL_ARGS?.substring(0, 100),
          args: process.argv.slice(2)
        }
      };

      fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      // Silent fail for logging
    }
  }

  async process() {
    // Check if this is a Task tool execution
    if (!this.isTaskToolExecution()) {
      this.log('Not a Task tool execution, skipping');
      return;
    }

    // Detect agent name
    const agentName = this.detectAgentName();

    if (!agentName) {
      this.log('No agent detected in Task tool execution');
      return;
    }

    this.log(`Detected agent: ${agentName}`);

    // Determine event type (start vs complete)
    const isCompletion = process.argv.includes('--post') ||
                        process.argv.includes('complete') ||
                        process.env.HOOK_TYPE === 'post-tool-use';

    const eventType = isCompletion ? 'complete' : 'start';

    // Announce the agent
    await this.announceAgent(agentName, eventType);

    // Export agent name for other hooks to use
    console.log(`export AGENT_NAME="${agentName}"`);
  }
}

// Execute if called directly
if (require.main === module) {
  const detector = new TaskAgentDetector();
  detector.process().catch(error => {
    console.error('Task detection error:', error.message);
  });
}

module.exports = TaskAgentDetector;
