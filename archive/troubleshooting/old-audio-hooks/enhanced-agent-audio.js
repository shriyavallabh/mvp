#!/usr/bin/env node

/**
 * Enhanced Agent Audio System - Critical Pipeline Integration
 * Ensures lady voice announces every agent trigger in the automated pipeline
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Agent name mapping for clear pronunciation
const AGENT_PRONUNCIATION = {
    'market-intelligence': 'market intelligence',
    'advisor-data-manager': 'advisor data manager',
    'segment-analyzer': 'segment analyzer',
    'linkedin-post-generator-enhanced': 'LinkedIn post generator',
    'whatsapp-message-creator': 'WhatsApp message creator',
    'status-image-designer': 'status image designer',
    'gemini-image-generator': 'Gemini image generator',
    'brand-customizer': 'brand customizer',
    'compliance-validator': 'compliance validator',
    'quality-scorer': 'quality scorer',
    'fatigue-checker': 'fatigue checker',
    'distribution-controller': 'distribution controller',
    'analytics-tracker': 'analytics tracker',
    'feedback-processor': 'feedback processor',
    'mcp-coordinator': 'MCP coordinator',
    'state-manager': 'state manager',
    'communication-bus': 'communication bus'
};

function getSessionContext() {
    try {
        const sessionPath = path.join(__dirname, '../../data/current-session.json');
        if (fs.existsSync(sessionPath)) {
            return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        }
    } catch (error) {
        return null;
    }
    return null;
}

function detectAgentFromEnvironment() {
    // Multiple detection methods for robust agent identification
    const sources = [
        process.env.CLAUDE_TOOL_ARGS,
        process.env.CLAUDE_AGENT_NAME,
        process.argv.slice(2).join(' '),
        process.env.npm_config_agent,
        process.env.AGENT_NAME
    ];

    for (const source of sources) {
        if (!source) continue;

        // Look for subagent_type parameter
        const subagentMatch = source.match(/subagent[_-]?type["\s:]*["']?([^"'\s,}]+)/i);
        if (subagentMatch) {
            return subagentMatch[1];
        }

        // Look for Task tool pattern
        const taskMatch = source.match(/Task.*subagent[_-]?type.*?["']([^"']+)["']/i);
        if (taskMatch) {
            return taskMatch[1];
        }

        // Look for direct agent names in known agents
        for (const agentName of Object.keys(AGENT_PRONUNCIATION)) {
            if (source.toLowerCase().includes(agentName.toLowerCase())) {
                return agentName;
            }
        }
    }

    return null;
}

function announceAgentEvent(eventType = 'start') {
    try {
        const agentName = detectAgentFromEnvironment();

        if (!agentName) {
            // Fallback announcement
            const fallbackMessage = eventType === 'start' ? 'Agent starting' : 'Agent completed';
            execSync(`say -v Samantha -r 175 "${fallbackMessage}" &`, { stdio: 'ignore' });
            console.log(`🔊 Audio (fallback): ${fallbackMessage}`);
            return;
        }

        // Get proper pronunciation
        const spokenName = AGENT_PRONUNCIATION[agentName] || agentName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .toLowerCase();

        // Create announcement based on event type
        let announcement;
        if (eventType === 'start') {
            announcement = `${spokenName} is triggered`;
        } else {
            announcement = `${spokenName} completed successfully`;
        }

        // Add session context for first agent
        const session = getSessionContext();
        if (session && eventType === 'start') {
            const sessionShort = session.sessionId.slice(-6);
            const flagPath = path.join(__dirname, `../../data/shared-memory/${session.sessionId}/first-agent-started.flag`);

            if (!fs.existsSync(flagPath)) {
                announcement = `Session ${sessionShort} started. ${announcement}`;
                fs.mkdirSync(path.dirname(flagPath), { recursive: true });
                fs.writeFileSync(flagPath, 'true');
            }
        }

        // Announce with Samantha voice (non-blocking)
        const command = `say -v Samantha -r 175 "${announcement}" &`;

        execSync(command, { stdio: 'ignore' });
        console.log(`🔊 Audio: ${announcement}`);

        // Log for debugging
        logAudioEvent(agentName, eventType, announcement, session);

    } catch (error) {
        console.log(`🔇 Audio announcement failed: ${error.message}`);
    }
}

function logAudioEvent(agentName, eventType, announcement, session) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            agentName,
            eventType,
            announcement,
            sessionId: session?.sessionId,
            env: {
                CLAUDE_TOOL_ARGS: process.env.CLAUDE_TOOL_ARGS?.substring(0, 100),
                argv: process.argv.slice(2).join(' ')
            }
        };

        const logDir = path.join(__dirname, '../../data/audio-logs');
        fs.mkdirSync(logDir, { recursive: true });

        const logFile = path.join(logDir, `audio-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        // Silent fail for logging
    }
}

// Export functions
module.exports = { announceAgentEvent, detectAgentFromEnvironment, AGENT_PRONUNCIATION };

// Handle direct execution
if (require.main === module) {
    const eventType = process.argv[2] || 'start';
    announceAgentEvent(eventType);
}