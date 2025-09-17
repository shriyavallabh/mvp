/**
 * Hybrid Multi-Agent Communication Bus
 * Enables bidirectional messaging between agents during orchestration
 */

class AgentCommunicationBus {
    constructor() {
        this.messages = [];
        this.agents = new Map();
        this.executionLog = [];
        this.initialized = Date.now();
    }

    registerAgent(agentName, voice, color) {
        this.agents.set(agentName, {
            name: agentName,
            voice: voice,
            color: color,
            status: 'registered',
            startTime: null,
            endTime: null,
            output: null
        });

        this.log(`🔄 Agent ${agentName} registered with ${voice} voice`);
    }

    startAgent(agentName) {
        const agent = this.agents.get(agentName);
        if (agent) {
            agent.status = 'running';
            agent.startTime = Date.now();
            this.log(`🟢 ${agent.color} ${agentName} execution started`);
        }
    }

    completeAgent(agentName, output) {
        const agent = this.agents.get(agentName);
        if (agent) {
            agent.status = 'completed';
            agent.endTime = Date.now();
            agent.output = output;
            this.log(`✅ ${agent.color} ${agentName} execution completed`);
        }
    }

    sendMessage(fromAgent, toAgent, message) {
        const messageObj = {
            id: Date.now(),
            from: fromAgent,
            to: toAgent,
            message: message,
            timestamp: new Date().toISOString()
        };

        this.messages.push(messageObj);
        this.log(`💬 Message from ${fromAgent} to ${toAgent}: ${message}`);

        return messageObj;
    }

    getMessagesFor(agentName) {
        return this.messages.filter(msg => msg.to === agentName);
    }

    log(message) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message: message
        };

        this.executionLog.push(logEntry);
        console.log(`[${logEntry.timestamp}] ${message}`);
    }

    getStatus() {
        return {
            totalAgents: this.agents.size,
            running: Array.from(this.agents.values()).filter(a => a.status === 'running').length,
            completed: Array.from(this.agents.values()).filter(a => a.status === 'completed').length,
            messages: this.messages.length,
            uptime: Date.now() - this.initialized
        };
    }

    generateReport() {
        return {
            orchestrationId: this.initialized,
            startTime: new Date(this.initialized).toISOString(),
            agents: Object.fromEntries(this.agents),
            messages: this.messages,
            executionLog: this.executionLog,
            summary: this.getStatus()
        };
    }
}

// Initialize global communication bus
global.agentBus = new AgentCommunicationBus();

// Register all agents with their voices and colors
global.agentBus.registerAgent('advisor-data-manager', 'Alex', '🔵');
global.agentBus.registerAgent('market-intelligence', 'Victoria', '🟣');
global.agentBus.registerAgent('segment-analyzer', 'Daniel', '🟠');
global.agentBus.registerAgent('linkedin-post-generator', 'Samantha', '🟦');
global.agentBus.registerAgent('whatsapp-message-creator', 'Karen', '🟩');
global.agentBus.registerAgent('status-image-designer', 'Fred', '🟨');
global.agentBus.registerAgent('gemini-image-generator', 'Ralph', '🔴');
global.agentBus.registerAgent('brand-customizer', 'Kathy', '🟪');
global.agentBus.registerAgent('compliance-validator', 'Bruce', '🔥');
global.agentBus.registerAgent('quality-scorer', 'Princess', '🟢');
global.agentBus.registerAgent('fatigue-checker', 'Junior', '⚡');
global.agentBus.registerAgent('distribution-controller', 'Zarvox', '🟨');
global.agentBus.registerAgent('analytics-tracker', 'Whisper', '🔷');
global.agentBus.registerAgent('feedback-processor', 'Trinoids', '🟣');

console.log('🎭 Hybrid Communication Bus Initialized');
console.log(`📊 Status: ${JSON.stringify(global.agentBus.getStatus(), null, 2)}`);

module.exports = AgentCommunicationBus;