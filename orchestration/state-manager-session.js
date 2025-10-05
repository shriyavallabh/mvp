/**
 * Session-Isolated State Manager for FinAdvise Content Orchestration
 * Manages session state, shared memory, and learning capture with complete isolation
 */

const fs = require('fs');
const path = require('path');

class SessionStateManager {
    constructor() {
        this.sessionId = null;
        this.sessionPaths = null;
        this.learningCapture = null;
        this.audioEnabled = true;
        this.init();
    }

    init() {
        const sessionContext = this.getSessionContext();
        this.sessionId = sessionContext.sessionId;
        this.sessionPaths = sessionContext.paths;
        this.learningCapture = new LearningCapture(this.sessionId, this.sessionPaths.learnings);

        // Announce session start
        if (this.audioEnabled) {
            this.announceSessionStart();
        }

        // Capture initialization learning
        this.learningCapture.captureLearning(
            'session-initialization',
            `Fresh session ${this.sessionId} initialized with complete isolation`,
            'low',
            {
                sessionId: this.sessionId,
                isolationEnabled: true,
                cleanMemory: true
            }
        );
    }

    getSessionContext() {
        const currentSessionPath = '/Users/shriyavallabh/Desktop/mvp/data/current-session.json';
        const currentSession = JSON.parse(fs.readFileSync(currentSessionPath, 'utf8'));

        const basePath = '/Users/shriyavallabh/Desktop/mvp';
        return {
            sessionId: currentSession.sessionId,
            paths: {
                sharedMemory: path.join(basePath, 'data/shared-memory', currentSession.sessionId),
                communication: path.join(basePath, 'data/agent-communication', currentSession.sessionId),
                output: path.join(basePath, 'output', currentSession.sessionId),
                learnings: path.join(basePath, 'learnings/sessions', currentSession.sessionId)
            }
        };
    }

    provideAgentContext(agentName) {
        const contextData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            agentName: agentName,
            paths: this.sessionPaths,
            sharedMemory: this.loadSharedMemory(),
            communicationLog: this.loadCommunicationLog(),
            sessionState: this.loadSessionState()
        };

        // Announce agent start
        if (this.audioEnabled) {
            this.announceAgentStart(agentName);
        }

        // Capture agent start learning
        this.learningCapture.captureLearning(
            'agent-activity',
            `${agentName} started with session context`,
            'low',
            {
                sessionId: this.sessionId,
                agentName: agentName,
                contextProvided: true
            }
        );

        return contextData;
    }

    updateSessionState(agentName, status, data = {}) {
        const sessionStatePath = path.join(this.sessionPaths.sharedMemory, 'session-state.json');
        const currentState = JSON.parse(fs.readFileSync(sessionStatePath, 'utf8'));

        if (status === 'started') {
            if (!currentState.currentAgents.includes(agentName)) {
                currentState.currentAgents.push(agentName);
            }
            currentState.pendingAgents = currentState.pendingAgents.filter(a => a !== agentName);
        } else if (status === 'completed') {
            currentState.agentsCompleted.push(agentName);
            currentState.currentAgents = currentState.currentAgents.filter(a => a !== agentName);

            // Announce completion
            if (this.audioEnabled) {
                const learningCount = data.learningCount || 0;
                this.announceAgentComplete(agentName, learningCount);
            }

            // Capture completion learning
            this.learningCapture.captureLearning(
                'agent-completion',
                `${agentName} completed successfully`,
                'low',
                {
                    duration: data.duration,
                    outputPath: data.outputPath,
                    learningsGenerated: data.learningCount || 0
                }
            );
        } else if (status === 'failed') {
            currentState.currentAgents = currentState.currentAgents.filter(a => a !== agentName);

            // Capture failure learning
            this.learningCapture.captureLearning(
                'agent-failure',
                `${agentName} failed: ${data.error || 'Unknown error'}`,
                'high',
                {
                    error: data.error,
                    stack: data.stack,
                    phase: currentState.phase
                }
            );
        }

        // Update timestamp
        currentState.lastUpdated = new Date().toISOString();

        // Save updated state
        fs.writeFileSync(sessionStatePath, JSON.stringify(currentState, null, 2));

        // Auto-save checkpoint
        this.saveCheckpoint(currentState);

        return currentState;
    }

    loadSharedMemory() {
        const memoryPath = path.join(this.sessionPaths.sharedMemory, 'clean-memory-structure.json');
        if (fs.existsSync(memoryPath)) {
            return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
        }
        return {};
    }

    loadCommunicationLog() {
        const logPath = path.join(this.sessionPaths.communication, 'communication-log.json');
        if (fs.existsSync(logPath)) {
            return JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        return { communicationLog: [], agentHandoffs: [] };
    }

    loadSessionState() {
        const statePath = path.join(this.sessionPaths.sharedMemory, 'session-state.json');
        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }
        return null;
    }

    saveCheckpoint(state) {
        const checkpointPath = path.join(
            this.sessionPaths.sharedMemory,
            'checkpoints',
            `${new Date().toISOString()}.json`
        );
        fs.writeFileSync(checkpointPath, JSON.stringify(state, null, 2));
    }

    completeSession() {
        const consolidated = this.learningCapture.consolidate();

        if (this.audioEnabled) {
            this.announceSessionComplete(consolidated.totalLearnings);
        }

        return consolidated;
    }

    // Audio feedback methods
    announceSessionStart() {
        const shortId = this.sessionId.slice(-6);
        const { exec } = require('child_process');
        exec(`say -v Samantha -r 175 "Starting fresh FinAdvise session ${shortId}" &`);
    }

    announceAgentStart(agentName) {
        const spoken = agentName.replace(/-/g, ' ').replace(/_/g, ' ');
        const { exec } = require('child_process');
        exec(`say -v Samantha -r 175 "Starting ${spoken}" &`);
    }

    announceAgentComplete(agentName, learningCount = 0) {
        const spoken = agentName.replace(/-/g, ' ').replace(/_/g, ' ');
        const { exec } = require('child_process');

        if (learningCount > 0) {
            exec(`say -v Samantha -r 175 "${spoken} completed with ${learningCount} learnings captured" &`);
        } else {
            exec(`say -v Samantha -r 175 "${spoken} completed successfully" &`);
        }
    }

    announceSessionComplete(totalLearnings) {
        const { exec } = require('child_process');
        exec(`say -v Samantha -r 175 "Session complete. ${totalLearnings} learnings captured and saved" &`);
    }
}

class LearningCapture {
    constructor(sessionId, learningsPath) {
        this.sessionId = sessionId;
        this.learningsPath = learningsPath;
        this.realtimeFile = path.join(learningsPath, 'realtime_learnings.json');
        this.learnings = [];
        this.loadExistingLearnings();
    }

    loadExistingLearnings() {
        if (fs.existsSync(this.realtimeFile)) {
            this.learnings = JSON.parse(fs.readFileSync(this.realtimeFile, 'utf8'));
        }
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

        this.learnings.push(learning);
        this.saveRealtime();
        return learning;
    }

    saveRealtime() {
        fs.writeFileSync(this.realtimeFile, JSON.stringify(this.learnings, null, 2));
    }

    consolidate() {
        const consolidated = {
            sessionId: this.sessionId,
            completedAt: new Date().toISOString(),
            totalLearnings: this.learnings.length,
            byType: this.groupByType(),
            byImpact: this.groupByImpact(),
            patterns: this.detectPatterns(),
            recommendations: this.generateRecommendations()
        };

        const consolidatedPath = path.join(this.learningsPath, 'consolidated_learnings.json');
        fs.writeFileSync(consolidatedPath, JSON.stringify(consolidated, null, 2));

        return consolidated;
    }

    groupByType() {
        const grouped = {};
        this.learnings.forEach(learning => {
            if (!grouped[learning.type]) grouped[learning.type] = [];
            grouped[learning.type].push(learning);
        });
        return grouped;
    }

    groupByImpact() {
        const grouped = {};
        this.learnings.forEach(learning => {
            if (!grouped[learning.impact]) grouped[learning.impact] = [];
            grouped[learning.impact].push(learning);
        });
        return grouped;
    }

    detectPatterns() {
        // Simple pattern detection - could be enhanced
        const patterns = [];
        const types = this.groupByType();

        Object.keys(types).forEach(type => {
            if (types[type].length > 3) {
                patterns.push(`High frequency of ${type} events (${types[type].length} occurrences)`);
            }
        });

        return patterns;
    }

    generateRecommendations() {
        const recommendations = [];
        const impacts = this.groupByImpact();

        if (impacts.critical && impacts.critical.length > 0) {
            recommendations.push('Address critical issues immediately');
        }
        if (impacts.high && impacts.high.length > 2) {
            recommendations.push('Review high-impact patterns for optimization opportunities');
        }

        return recommendations;
    }
}

module.exports = SessionStateManager;