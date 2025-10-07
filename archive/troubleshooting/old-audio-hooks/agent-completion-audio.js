#!/usr/bin/env node

/**
 * Agent Completion Audio Hook - Session Aware
 * Detects Task tool completion and announces agent finish with learnings
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

function updateLearnings(sessionId, agentName, learningCount = 0) {
    try {
        const learningsPath = path.join(__dirname, `../../learnings/sessions/${sessionId}/realtime_learnings.json`);
        let learnings = [];

        if (fs.existsSync(learningsPath)) {
            learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
        }

        learnings.push({
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            type: "agent-completion",
            message: `${agentName} completed successfully`,
            impact: "low",
            data: { agentName, learningCount, audioAnnounced: true },
            capturedBy: "audio-hook"
        });

        fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
        return learnings.length;
    } catch (error) {
        return 0;
    }
}

function countRecentLearnings(sessionId, agentName) {
    try {
        const learningsPath = path.join(__dirname, `../../learnings/sessions/${sessionId}/realtime_learnings.json`);
        if (!fs.existsSync(learningsPath)) return 0;

        const learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
        const recentLearnings = learnings.filter(l =>
            l.data && l.data.agentName === agentName &&
            l.type !== 'agent-start' && l.type !== 'agent-completion'
        );
        return recentLearnings.length;
    } catch (error) {
        return 0;
    }
}

function announceAgentCompletion() {
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

            // Count recent learnings for this agent
            let learningCount = 0;
            if (session && session.sessionId) {
                learningCount = countRecentLearnings(session.sessionId, agentName);
            }

            // Create announcement with learning count if significant
            let announcement = `${spokenName} completed successfully`;
            if (learningCount > 0) {
                announcement = `${spokenName} completed with ${learningCount} learnings captured`;
            }

            // Announce completion with Samantha voice (non-blocking)
            const command = `say -v Samantha -r 175 "${announcement}" &`;

            try {
                execSync(command, { stdio: 'ignore' });
                console.log(`🔊 Audio: ${announcement}`);

                // Update learnings if session context available
                if (session && session.sessionId) {
                    const totalLearnings = updateLearnings(session.sessionId, agentName, learningCount);

                    // Check if this is the last agent and announce session completion
                    const sessionStatePath = path.join(__dirname, `../../data/shared-memory/${session.sessionId}/session-state.json`);
                    if (fs.existsSync(sessionStatePath)) {
                        const sessionState = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));
                        const allCompleted = sessionState.pendingAgents.length === 0 && sessionState.currentAgents.length === 0;

                        if (allCompleted) {
                            setTimeout(() => {
                                const finalCommand = `say -v Samantha -r 175 "Session complete. ${totalLearnings} learnings captured and saved" &`;
                                try {
                                    execSync(finalCommand, { stdio: 'ignore' });
                                    console.log(`🔊 Audio: Session complete. ${totalLearnings} learnings captured and saved`);
                                } catch (error) {
                                    console.log('🔇 Session completion audio failed');
                                }
                            }, 2000); // 2 second delay
                        }
                    }
                }
            } catch (audioError) {
                // Audio failed, continue silently
                console.log(`🔇 Audio unavailable for: ${spokenName} completion`);
            }
        }

    } catch (error) {
        // Hook failed, continue silently
        console.log('🔇 Completion audio hook failed, continuing...');
    }
}

// Run if called directly
if (require.main === module) {
    announceAgentCompletion();
}

module.exports = { announceAgentCompletion };