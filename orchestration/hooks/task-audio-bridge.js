#!/usr/bin/env node

/**
 * Task Audio Bridge - Critical Pipeline Integration
 * Ensures lady voice announcements for EVERY agent in the /o pipeline
 * This is the bulletproof solution for agent audio feedback
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔊 Task Audio Bridge: Initializing agent audio system...');

// Monitor for Task tool executions and announce them
class TaskAudioBridge {
    constructor() {
        this.activeAgents = new Set();
        this.sessionId = this.getOrCreateSessionId();
        this.logFile = path.join(__dirname, '../../data/audio-logs', `task-audio-${Date.now()}.log`);

        console.log(`🔊 Audio Bridge Ready - Session: ${this.sessionId}`);
    }

    getOrCreateSessionId() {
        try {
            const sessionPath = path.join(__dirname, '../../data/current-session.json');
            if (fs.existsSync(sessionPath)) {
                const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
                return session.sessionId;
            }
        } catch (error) {
            // Create new session if none exists
        }
        return `session_${Date.now()}`;
    }

    // Enhanced agent detection that works with Task tool calls
    detectAgentFromArgs() {
        const sources = [
            process.env.CLAUDE_TOOL_ARGS,
            process.env.CLAUDE_CURRENT_TOOL,
            process.argv.join(' '),
            JSON.stringify(process.env).toLowerCase()
        ];

        // Known agent patterns
        const agentPatterns = [
            { pattern: /market[_-]?intelligence/i, name: 'market-intelligence', spoken: 'market intelligence' },
            { pattern: /advisor[_-]?data[_-]?manager/i, name: 'advisor-data-manager', spoken: 'advisor data manager' },
            { pattern: /segment[_-]?analyzer/i, name: 'segment-analyzer', spoken: 'segment analyzer' },
            { pattern: /linkedin[_-]?post[_-]?generator/i, name: 'linkedin-post-generator-enhanced', spoken: 'LinkedIn post generator' },
            { pattern: /whatsapp[_-]?message[_-]?creator/i, name: 'whatsapp-message-creator', spoken: 'WhatsApp message creator' },
            { pattern: /status[_-]?image[_-]?designer/i, name: 'status-image-designer', spoken: 'status image designer' },
            { pattern: /gemini[_-]?image[_-]?generator/i, name: 'gemini-image-generator', spoken: 'Gemini image generator' },
            { pattern: /brand[_-]?customizer/i, name: 'brand-customizer', spoken: 'brand customizer' },
            { pattern: /compliance[_-]?validator/i, name: 'compliance-validator', spoken: 'compliance validator' },
            { pattern: /quality[_-]?scorer/i, name: 'quality-scorer', spoken: 'quality scorer' },
            { pattern: /fatigue[_-]?checker/i, name: 'fatigue-checker', spoken: 'fatigue checker' },
            { pattern: /distribution[_-]?controller/i, name: 'distribution-controller', spoken: 'distribution controller' },
            { pattern: /analytics[_-]?tracker/i, name: 'analytics-tracker', spoken: 'analytics tracker' },
            { pattern: /feedback[_-]?processor/i, name: 'feedback-processor', spoken: 'feedback processor' },
            { pattern: /mcp[_-]?coordinator/i, name: 'mcp-coordinator', spoken: 'MCP coordinator' },
            { pattern: /state[_-]?manager/i, name: 'state-manager', spoken: 'state manager' },
            { pattern: /communication[_-]?bus/i, name: 'communication-bus', spoken: 'communication bus' }
        ];

        for (const source of sources) {
            if (!source) continue;

            for (const agent of agentPatterns) {
                if (agent.pattern.test(source)) {
                    return agent;
                }
            }
        }

        return null;
    }

    announceAgentStart(agentInfo) {
        try {
            if (this.activeAgents.has(agentInfo.name)) {
                console.log(`🔊 Agent ${agentInfo.name} already announced, skipping...`);
                return;
            }

            this.activeAgents.add(agentInfo.name);

            const announcement = `${agentInfo.spoken} is triggered`;
            const command = `say -v Samantha -r 175 "${announcement}" &`;

            execSync(command, { stdio: 'ignore' });
            console.log(`🔊 Audio: ${announcement}`);

            this.logEvent('agent-start', agentInfo, announcement);

        } catch (error) {
            console.log(`🔇 Audio failed for ${agentInfo.spoken}: ${error.message}`);
        }
    }

    announceAgentCompletion(agentInfo) {
        try {
            this.activeAgents.delete(agentInfo.name);

            const announcement = `${agentInfo.spoken} completed successfully`;
            const command = `say -v Samantha -r 175 "${announcement}" &`;

            execSync(command, { stdio: 'ignore' });
            console.log(`🔊 Audio: ${announcement}`);

            this.logEvent('agent-completion', agentInfo, announcement);

        } catch (error) {
            console.log(`🔇 Completion audio failed for ${agentInfo.spoken}: ${error.message}`);
        }
    }

    logEvent(eventType, agentInfo, announcement) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                eventType,
                agentName: agentInfo.name,
                spokenName: agentInfo.spoken,
                announcement,
                environment: {
                    args: process.argv.slice(2),
                    toolArgs: process.env.CLAUDE_TOOL_ARGS?.substring(0, 100)
                }
            };

            fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            // Silent fail for logging
        }
    }

    // Monitor and announce based on environment
    processCurrentExecution() {
        const agentInfo = this.detectAgentFromArgs();

        if (agentInfo) {
            console.log(`🎯 Detected agent: ${agentInfo.name} (${agentInfo.spoken})`);

            // Determine if this is start or completion based on context
            const isCompletion = process.argv.includes('--completion') ||
                               process.env.TASK_PHASE === 'completion' ||
                               process.argv.includes('completion');

            if (isCompletion) {
                this.announceAgentCompletion(agentInfo);
            } else {
                this.announceAgentStart(agentInfo);
            }
        } else {
            console.log('🔍 No agent detected in current execution context');

            // Debug output
            console.log('Available sources:');
            console.log('- CLAUDE_TOOL_ARGS:', process.env.CLAUDE_TOOL_ARGS?.substring(0, 100));
            console.log('- argv:', process.argv.slice(2).join(' '));
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const bridge = new TaskAudioBridge();
    bridge.processCurrentExecution();
}

// Export for use in other scripts
module.exports = TaskAudioBridge;