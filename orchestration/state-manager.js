#!/usr/bin/env node

/**
 * Session State Manager - FinAdvise Orchestration
 * Provides session context and manages state synchronization for all agents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StateManager {
    constructor() {
        this.sessionContext = this.getSessionContext();
        this.learnings = this.sessionContext ? new LearningCapture(this.sessionContext.sessionId) : null;
    }

    getSessionContext() {
        try {
            const sessionPath = path.join(__dirname, '../data/current-session.json');
            if (fs.existsSync(sessionPath)) {
                return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to get session context:', error.message);
        }
        return null;
    }

    provideAgentContext(agentName) {
        if (!this.sessionContext) {
            throw new Error('No active session context available');
        }

        const session = this.sessionContext;

        // Announce agent start
        this.announceAgentStart(agentName);

        // Read from SESSION-SPECIFIC memory only
        const context = {
            sessionId: session.sessionId,
            advisorData: this.readSessionFile('advisor-context.json'),
            marketData: this.readSessionFile('market-insights.json'),
            segmentData: this.readSessionFile('segment-analysis.json'),
            imageSpecs: this.readSessionFile('image-specifications.json'),
            complianceRules: this.readSessionFile('compliance-validation.json'),
            previousAgentOutputs: this.getPreviousOutputs(session.sessionId),
            learningsPath: session.paths.learnings,
            outputPath: session.paths.output,
            viralContentContext: this.readSessionFile('viral-content-context.json'),
            sessionPaths: session.paths
        };

        // Capture learning about agent start
        if (this.learnings) {
            this.learnings.captureLearning(
                'agent-activity',
                `${agentName} started with session context`,
                'low',
                { sessionId: session.sessionId, contextProvided: true }
            );
        }

        return context;
    }

    readSessionFile(filename) {
        try {
            if (!this.sessionContext) return null;

            const filePath = path.join(__dirname, `../data/shared-memory/${this.sessionContext.sessionId}/${filename}`);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (error) {
            console.warn(`Failed to read session file ${filename}:`, error.message);
        }
        return null;
    }

    writeSessionFile(filename, data) {
        try {
            if (!this.sessionContext) return false;

            const filePath = path.join(__dirname, `../data/shared-memory/${this.sessionContext.sessionId}/${filename}`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Failed to write session file ${filename}:`, error.message);
            return false;
        }
    }

    updateSessionState(agentName, status, data = {}) {
        if (!this.sessionContext) {
            console.warn('No session context available for state update');
            return;
        }

        const session = this.sessionContext;

        // Read current state from session-specific location
        const statePath = path.join(__dirname, `../data/shared-memory/${session.sessionId}/session-state.json`);
        let currentState;

        try {
            currentState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        } catch (error) {
            console.error('Failed to read session state:', error.message);
            return;
        }

        const now = new Date().toISOString();
        currentState.lastUpdated = now;

        // Update agent state based on status
        if (status === 'started') {
            if (!currentState.currentAgents.includes(agentName)) {
                currentState.currentAgents.push(agentName);
            }
            currentState.pendingAgents = currentState.pendingAgents.filter(a => a !== agentName);

            // Capture start learning
            if (this.learnings) {
                this.learnings.captureLearning(
                    'agent-start',
                    `${agentName} started execution`,
                    'low',
                    { startTime: now, estimatedDuration: data.estimatedDuration }
                );
            }
        } else if (status === 'completed') {
            currentState.agentsCompleted.push(agentName);
            currentState.currentAgents = currentState.currentAgents.filter(a => a !== agentName);

            // Update metrics
            currentState.metrics.completedAgents++;
            currentState.metrics.successRate = (currentState.metrics.completedAgents / currentState.metrics.totalAgents) * 100;

            // Capture completion learning
            if (this.learnings) {
                this.learnings.captureLearning(
                    'agent-completion',
                    `${agentName} completed successfully`,
                    'low',
                    {
                        duration: data.duration,
                        outputPath: data.outputPath,
                        endTime: now
                    }
                );
            }

            // Announce completion
            this.announceAgentComplete(agentName);

        } else if (status === 'failed') {
            currentState.failedAgents.push(agentName);
            currentState.currentAgents = currentState.currentAgents.filter(a => a !== agentName);

            // Capture failure learning
            if (this.learnings) {
                this.learnings.captureLearning(
                    'agent-failure',
                    `${agentName} failed: ${data.error || 'Unknown error'}`,
                    'high',
                    {
                        error: data.error,
                        stack: data.stack,
                        failureTime: now
                    }
                );
            }
        }

        // Save updated state
        try {
            fs.writeFileSync(statePath, JSON.stringify(currentState, null, 2));

            // Auto-save checkpoint
            const checkpoint = path.join(__dirname, `../data/shared-memory/${session.sessionId}/checkpoints/${now}.json`);
            fs.mkdirSync(path.dirname(checkpoint), { recursive: true });
            fs.writeFileSync(checkpoint, JSON.stringify(currentState, null, 2));

        } catch (error) {
            console.error('Failed to save session state:', error.message);
        }
    }

    announceAgentStart(agentName) {
        try {
            const spokenName = agentName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .toLowerCase();

            const sessionShort = this.sessionContext.sessionId.slice(-6);
            const flagPath = path.join(__dirname, `../data/shared-memory/${this.sessionContext.sessionId}/first-agent-started.flag`);
            const isFirstAgent = !fs.existsSync(flagPath);

            let announcement = `Starting ${spokenName}`;
            if (isFirstAgent) {
                announcement = `Starting session ${sessionShort}. Beginning ${spokenName}`;
                fs.writeFileSync(flagPath, 'true');
            }

            const command = `say -v Samantha -r 175 "${announcement}" &`;
            execSync(command, { stdio: 'ignore' });
            console.log(`🔊 Audio: ${announcement}`);
        } catch (error) {
            console.log(`🔇 Audio unavailable for: ${agentName}`);
        }
    }

    announceAgentComplete(agentName) {
        try {
            const spokenName = agentName
                .replace(/-/g, ' ')
                .replace(/_/g, ' ')
                .toLowerCase();

            const announcement = `${spokenName} completed successfully`;
            const command = `say -v Samantha -r 175 "${announcement}" &`;

            execSync(command, { stdio: 'ignore' });
            console.log(`🔊 Audio: ${announcement}`);
        } catch (error) {
            console.log(`🔇 Audio unavailable for: ${agentName} completion`);
        }
    }

    getPreviousOutputs(sessionId) {
        try {
            const outputDir = path.join(__dirname, `../output/${sessionId}`);
            if (!fs.existsSync(outputDir)) return {};

            const outputs = {};
            const files = fs.readdirSync(outputDir);

            files.forEach(file => {
                if (file.endsWith('.json')) {
                    try {
                        const content = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
                        outputs[file.replace('.json', '')] = content;
                    } catch (error) {
                        console.warn(`Failed to read output file ${file}:`, error.message);
                    }
                }
            });

            return outputs;
        } catch (error) {
            console.warn('Failed to get previous outputs:', error.message);
            return {};
        }
    }

    getReturnFormat(status, agentName, learningsCount = 0) {
        const sessionId = this.sessionContext ? this.sessionContext.sessionId : 'unknown';

        if (status === 'context-provided') {
            const memoryItems = this.countMemoryItems();
            return `✅ Provided session context for ${agentName}\n🎯 Session: ${sessionId} | Memory: ${memoryItems} items | Learnings: ${learningsCount} captured`;
        } else if (status === 'state-updated') {
            return `✅ State updated for ${agentName} - status: completed\n🎯 Session: ${sessionId} | Phase: ${this.getCurrentPhase()} | Learnings captured: ${learningsCount}`;
        }

        return `✅ Session state management active\n🎯 Session: ${sessionId}`;
    }

    countMemoryItems() {
        try {
            if (!this.sessionContext) return 0;

            const memoryDir = path.join(__dirname, `../data/shared-memory/${this.sessionContext.sessionId}`);
            if (!fs.existsSync(memoryDir)) return 0;

            const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.json'));
            return files.length;
        } catch (error) {
            return 0;
        }
    }

    getCurrentPhase() {
        try {
            const workflowState = this.readSessionFile('workflow-state-tracker.json');
            return workflowState ? workflowState.currentState.phase : 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }
}

class LearningCapture {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.learningsDir = path.join(__dirname, `../learnings/sessions/${sessionId}`);
        this.realtimeFile = path.join(this.learningsDir, 'realtime_learnings.json');
    }

    captureLearning(type, message, impact = 'medium', data = {}) {
        const learning = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: type,
            message: message,
            impact: impact,
            data: data,
            capturedBy: 'state-manager'
        };

        this.saveRealtime(learning);
        return learning;
    }

    saveRealtime(learning) {
        try {
            let existingLearnings = [];
            if (fs.existsSync(this.realtimeFile)) {
                existingLearnings = JSON.parse(fs.readFileSync(this.realtimeFile, 'utf8'));
            }
            existingLearnings.push(learning);
            fs.writeFileSync(this.realtimeFile, JSON.stringify(existingLearnings, null, 2));
        } catch (error) {
            console.warn('Failed to save learning:', error.message);
        }
    }
}

// Export for use by other modules
module.exports = { StateManager, LearningCapture };

// CLI interface when run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const stateManager = new StateManager();

    switch (command) {
        case 'context':
            const agentName = args[1];
            if (!agentName) {
                console.log('Usage: node state-manager.js context <agent-name>');
                process.exit(1);
            }
            try {
                const context = stateManager.provideAgentContext(agentName);
                console.log(stateManager.getReturnFormat('context-provided', agentName));
            } catch (error) {
                console.error('Error providing context:', error.message);
                process.exit(1);
            }
            break;

        case 'update':
            const updateAgentName = args[1];
            const status = args[2];
            if (!updateAgentName || !status) {
                console.log('Usage: node state-manager.js update <agent-name> <status> [data]');
                process.exit(1);
            }
            const data = args[3] ? JSON.parse(args[3]) : {};
            stateManager.updateSessionState(updateAgentName, status, data);
            console.log(stateManager.getReturnFormat('state-updated', updateAgentName));
            break;

        case 'status':
            console.log(stateManager.getReturnFormat('session-active'));
            break;

        default:
            console.log('Available commands:');
            console.log('  context <agent-name>           - Provide session context to agent');
            console.log('  update <agent-name> <status>   - Update agent state');
            console.log('  status                         - Show session status');
    }
}