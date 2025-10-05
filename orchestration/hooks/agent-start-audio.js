#!/usr/bin/env node

/**
 * Agent Start Audio Hook - Session Aware
 * Detects Task tool calls and announces agent start with session context
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function updateLearnings(sessionId, agentName) {
    try {
        const learningsPath = path.join(__dirname, `../../learnings/sessions/${sessionId}/realtime_learnings.json`);
        let learnings = [];

        if (fs.existsSync(learningsPath)) {
            learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
        }

        learnings.push({
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            type: "agent-start",
            message: `${agentName} started with session context`,
            impact: "low",
            data: { agentName, audioAnnounced: true },
            capturedBy: "audio-hook"
        });

        fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
    } catch (error) {
        // Silent fail for learning capture
    }
}

function announceAgentStart() {
    try {
        // Get session context
        const session = getSessionContext();

        // Get the tool arguments from environment or process
        const args = process.argv.slice(2);

        // Check if this is a Task tool call with subagent_type
        let agentName = null;

        // Try to extract agent name from command line arguments
        const fullArgs = process.env.CLAUDE_TOOL_ARGS || args.join(' ');

        // Look for subagent_type parameter
        const subagentMatch = fullArgs.match(/subagent_type["\s:]*["']?([^"'\s,}]+)/);
        if (subagentMatch) {
            agentName = subagentMatch[1];
        }

        // Also check for Task tool pattern
        const taskMatch = fullArgs.match(/Task.*subagent[_-]?type.*?["']([^"']+)["']/);
        if (taskMatch) {
            agentName = taskMatch[1];
        }

        if (agentName) {
            // Convert agent name to natural speech
            const spokenName = agentName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .replace(/([a-z])([A-Z])/g, '$1 $2')
                .toLowerCase();

            // Include session info for first agent or phase transitions
            let announcement = `Starting ${spokenName}`;
            if (session && session.sessionId) {
                const sessionShort = session.sessionId.slice(-6);

                // Check if this is the first agent of the session
                const isFirstAgent = !fs.existsSync(path.join(__dirname, `../../data/shared-memory/${session.sessionId}/first-agent-started.flag`));

                if (isFirstAgent) {
                    announcement = `Starting session ${sessionShort}. Beginning ${spokenName}`;
                    // Create flag file
                    fs.writeFileSync(path.join(__dirname, `../../data/shared-memory/${session.sessionId}/first-agent-started.flag`), 'true');
                }
            }

            // Announce with Samantha voice (non-blocking)
            const command = `say -v Samantha -r 175 "${announcement}" &`;

            try {
                execSync(command, { stdio: 'ignore' });
                console.log(`🔊 Audio: ${announcement}`);

                // Update learnings if session context available
                if (session && session.sessionId) {
                    updateLearnings(session.sessionId, agentName);
                }
            } catch (audioError) {
                // Audio failed, continue silently
                console.log(`🔇 Audio unavailable for: ${spokenName}`);
            }
        }

    } catch (error) {
        // Hook failed, continue silently
        console.log('🔇 Audio hook failed, continuing...');
    }
}

// Run if called directly
if (require.main === module) {
    announceAgentStart();
}

module.exports = { announceAgentStart };