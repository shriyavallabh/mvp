const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AgentMonitor extends EventEmitter {
  constructor() {
    super();
    this.agentStatus = {};
    this.agentHierarchy = this.initializeHierarchy();
    this.executionHistory = [];
    this.maxHistorySize = 100;
    this.logsDir = path.join(__dirname, '../../../logs');
  }

  initializeHierarchy() {
    return {
      name: 'content-engine',
      status: 'idle',
      children: [
        {
          name: 'content-orchestrator',
          status: 'idle',
          children: [
            { name: 'content-strategist', status: 'idle', children: [] },
            { name: 'fatigue-checker', status: 'idle', children: [] },
            { name: 'content-generator', status: 'idle', children: [] },
            { name: 'image-creator', status: 'idle', children: [] },
            { name: 'compliance-validator', status: 'idle', children: [] },
            { name: 'distribution-manager', status: 'idle', children: [] }
          ]
        },
        { name: 'approval-guardian', status: 'idle', children: [] },
        { name: 'revision-handler', status: 'idle', children: [] },
        { name: 'analytics-tracker', status: 'idle', children: [] }
      ]
    };
  }

  updateAgentStatus(agentName, status, metadata = {}) {
    this.agentStatus[agentName] = {
      status,
      lastUpdate: new Date().toISOString(),
      ...metadata
    };

    this.updateHierarchyStatus(this.agentHierarchy, agentName, status);

    if (global.io) {
      global.io.to('agent-updates').emit('agent-status-update', {
        agent: agentName,
        status,
        metadata,
        timestamp: new Date().toISOString()
      });
    }

    this.addToHistory({
      agent: agentName,
      status,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  updateHierarchyStatus(node, agentName, status) {
    if (node.name === agentName) {
      node.status = status;
      return true;
    }
    
    if (node.children) {
      for (const child of node.children) {
        if (this.updateHierarchyStatus(child, agentName, status)) {
          return true;
        }
      }
    }
    
    return false;
  }

  addToHistory(entry) {
    this.executionHistory.unshift(entry);
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.pop();
    }
  }

  async getAgentStatus() {
    const runningAgents = Object.entries(this.agentStatus)
      .filter(([_, status]) => status.status === 'processing')
      .length;
    
    return {
      totalAgents: Object.keys(this.agentStatus).length,
      runningAgents,
      idleAgents: Object.keys(this.agentStatus).length - runningAgents,
      agents: this.agentStatus,
      lastExecution: this.executionHistory[0] || null
    };
  }

  getAgentHierarchy() {
    return this.agentHierarchy;
  }

  async getAgentLogs(agentName, lines = 100) {
    try {
      const logFile = path.join(this.logsDir, `${agentName}.log`);
      const exists = await fs.access(logFile).then(() => true).catch(() => false);
      
      if (!exists) {
        return { logs: [], error: 'Log file not found' };
      }
      
      const { stdout } = await execAsync(`tail -n ${lines} ${logFile}`);
      const logs = stdout.split('\n').filter(line => line.trim());
      
      return {
        agent: agentName,
        logs: logs.map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        })
      };
    } catch (error) {
      return { logs: [], error: error.message };
    }
  }

  async triggerAgent(agentName, params = {}) {
    try {
      this.updateAgentStatus(agentName, 'processing', { 
        triggeredBy: 'manual',
        params 
      });

      const agentPath = path.join(__dirname, '../../../agents');
      let command = '';

      switch (agentName) {
        case 'content-orchestrator':
          command = `node ${agentPath}/controllers/content-orchestrator.js`;
          break;
        case 'content-strategist':
          command = `node ${agentPath}/generators/content-strategist.js`;
          break;
        case 'content-generator':
          command = `node ${agentPath}/generators/content-generator.js`;
          break;
        case 'image-creator':
          command = `node ${agentPath}/generators/image-creator.js`;
          break;
        case 'compliance-validator':
          command = `node ${agentPath}/validators/compliance-validator.js`;
          break;
        case 'fatigue-checker':
          command = `node ${agentPath}/validators/fatigue-checker.js`;
          break;
        case 'distribution-manager':
          command = `node ${agentPath}/controllers/distribution-manager.js`;
          break;
        case 'approval-guardian':
          command = `node ${agentPath}/controllers/approval-guardian.js`;
          break;
        case 'revision-handler':
          command = `node ${agentPath}/controllers/revision-handler.js`;
          break;
        default:
          throw new Error(`Unknown agent: ${agentName}`);
      }

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.updateAgentStatus(agentName, 'error', { 
            error: error.message,
            stderr 
          });
        } else {
          this.updateAgentStatus(agentName, 'completed', { 
            output: stdout.slice(0, 1000)
          });
        }
      });

      return {
        success: true,
        message: `Agent ${agentName} triggered`,
        status: 'processing'
      };
    } catch (error) {
      this.updateAgentStatus(agentName, 'error', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  getExecutionTimeline(limit = 50) {
    return this.executionHistory.slice(0, limit);
  }

  simulateAgentExecution() {
    const agents = [
      'content-orchestrator',
      'content-strategist',
      'fatigue-checker',
      'content-generator',
      'image-creator',
      'compliance-validator',
      'distribution-manager'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < agents.length) {
        this.updateAgentStatus(agents[index], 'processing', {
          progress: Math.floor(Math.random() * 100)
        });
        
        setTimeout(() => {
          this.updateAgentStatus(agents[index], 'completed', {
            duration: Math.floor(Math.random() * 5000) + 1000
          });
        }, 2000);
        
        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  }
}

module.exports = new AgentMonitor();