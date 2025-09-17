#!/usr/bin/env node

/**
 * Trigger Next Agent Hook
 *
 * This hook determines which agent should execute next based on the current workflow state,
 * agent dependencies, and execution results. It implements intelligent routing and
 * bidirectional communication patterns.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class NextAgentTrigger {
  constructor() {
    this.agentDependencies = {
      'advisor-data-manager': [],
      'market-intelligence': ['advisor-data-manager'],
      'segment-analyzer': ['advisor-data-manager', 'market-intelligence'],
      'linkedin-post-generator': ['market-intelligence', 'segment-analyzer'],
      'whatsapp-message-creator': ['market-intelligence', 'segment-analyzer'],
      'status-image-designer': ['market-intelligence'],
      'gemini-image-generator': ['status-image-designer'],
      'brand-customizer': ['gemini-image-generator'],
      'compliance-validator': ['linkedin-post-generator', 'whatsapp-message-creator'],
      'quality-scorer': ['linkedin-post-generator', 'whatsapp-message-creator'],
      'fatigue-checker': ['linkedin-post-generator', 'whatsapp-message-creator'],
      'distribution-controller': ['compliance-validator', 'quality-scorer'],
      'analytics-tracker': ['distribution-controller'],
      'feedback-processor': ['compliance-validator', 'quality-scorer', 'fatigue-checker']
    };

    this.agentColors = {
      'advisor-data-manager': 'blue',
      'market-intelligence': 'purple',
      'segment-analyzer': 'orange',
      'linkedin-post-generator': 'cyan',
      'whatsapp-message-creator': 'green',
      'status-image-designer': 'yellow',
      'gemini-image-generator': 'red',
      'brand-customizer': 'magenta',
      'compliance-validator': 'brightred',
      'quality-scorer': 'brightgreen',
      'fatigue-checker': 'brightyellow',
      'distribution-controller': 'teal',
      'analytics-tracker': 'brightcyan',
      'feedback-processor': 'brightmagenta'
    };

    this.agentVoices = {
      'advisor-data-manager': 'analytical',
      'market-intelligence': 'authoritative',
      'segment-analyzer': 'strategic',
      'linkedin-post-generator': 'creative',
      'whatsapp-message-creator': 'engaging',
      'status-image-designer': 'artistic',
      'gemini-image-generator': 'technical',
      'brand-customizer': 'professional',
      'compliance-validator': 'authoritative',
      'quality-scorer': 'analytical',
      'fatigue-checker': 'vigilant',
      'distribution-controller': 'efficient',
      'analytics-tracker': 'insightful',
      'feedback-processor': 'adaptive'
    };
  }

  async determineNextAgent() {
    try {
      // Load current workflow state
      const workflowState = await this.loadWorkflowState();
      if (!workflowState) {
        console.log('No active workflow found');
        return;
      }

      // Get current agent execution status
      const executionState = await this.loadExecutionState(workflowState.workflowId);

      // Analyze what agents are ready to execute
      const readyAgents = await this.findReadyAgents(executionState);

      if (readyAgents.length === 0) {
        await this.handleWorkflowCompletion(workflowState);
        return;
      }

      // Select the highest priority agent
      const nextAgent = this.selectNextAgent(readyAgents, workflowState);

      if (nextAgent) {
        await this.triggerAgent(nextAgent, workflowState);
      }

    } catch (error) {
      console.error('Error determining next agent:', error);
      await this.handleError(error);
    }
  }

  async loadWorkflowState() {
    try {
      const content = await fs.readFile('data/orchestration-state/active-workflow.json', 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async loadExecutionState(workflowId) {
    try {
      const content = await fs.readFile(`data/orchestration-state/${workflowId}.json`, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Initialize empty execution state
      const emptyState = {
        workflowId,
        timestamp: Date.now(),
        agentStates: {},
        completedAgents: [],
        failedAgents: [],
        currentAgent: null
      };

      await fs.writeFile(
        `data/orchestration-state/${workflowId}.json`,
        JSON.stringify(emptyState, null, 2)
      );

      return emptyState;
    }
  }

  async findReadyAgents(executionState) {
    const readyAgents = [];
    const completedAgents = new Set(executionState.completedAgents || []);
    const failedAgents = new Set(executionState.failedAgents || []);
    const currentAgent = executionState.currentAgent;

    for (const [agent, dependencies] of Object.entries(this.agentDependencies)) {
      // Skip if already completed or failed
      if (completedAgents.has(agent) || failedAgents.has(agent)) {
        continue;
      }

      // Skip if currently running
      if (currentAgent === agent) {
        continue;
      }

      // Check if all dependencies are completed
      const dependenciesReady = dependencies.every(dep => completedAgents.has(dep));

      if (dependenciesReady) {
        // Additional readiness checks
        const isReady = await this.checkAgentReadiness(agent, executionState);
        if (isReady) {
          readyAgents.push({
            name: agent,
            priority: this.getAgentPriority(agent),
            dependencies,
            color: this.agentColors[agent],
            voice: this.agentVoices[agent]
          });
        }
      }
    }

    return readyAgents.sort((a, b) => this.comparePriority(a.priority, b.priority));
  }

  async checkAgentReadiness(agent, executionState) {
    try {
      // Check if required data files exist
      const requiredFiles = this.getRequiredFiles(agent);
      for (const file of requiredFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          console.log(`Agent ${agent} not ready: missing ${file}`);
          return false;
        }
      }

      // Check for specific agent readiness conditions
      switch (agent) {
        case 'compliance-validator':
          // Needs content to validate
          return await this.checkContentExists();

        case 'quality-scorer':
          // Needs content to score
          return await this.checkContentExists();

        case 'distribution-controller':
          // Needs validated content
          return await this.checkValidatedContent();

        default:
          return true;
      }
    } catch (error) {
      console.error(`Error checking readiness for ${agent}:`, error);
      return false;
    }
  }

  getRequiredFiles(agent) {
    const fileMap = {
      'market-intelligence': ['data/advisor-data.json'],
      'segment-analyzer': ['data/advisor-data.json', 'data/market-intelligence.json'],
      'linkedin-post-generator': ['data/market-intelligence.json', 'data/segment-analysis.json'],
      'whatsapp-message-creator': ['data/market-intelligence.json', 'data/segment-analysis.json'],
      'compliance-validator': ['data/linkedin-posts.json', 'data/whatsapp-messages.json'],
      'quality-scorer': ['data/linkedin-posts.json', 'data/whatsapp-messages.json'],
      'distribution-controller': ['data/compliance-validation.json', 'data/quality-scores.json']
    };

    return fileMap[agent] || [];
  }

  async checkContentExists() {
    try {
      await fs.access('data/linkedin-posts.json');
      await fs.access('data/whatsapp-messages.json');
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkValidatedContent() {
    try {
      const complianceData = await fs.readFile('data/compliance-validation.json', 'utf-8');
      const qualityData = await fs.readFile('data/quality-scores.json', 'utf-8');

      const compliance = JSON.parse(complianceData);
      const quality = JSON.parse(qualityData);

      // Check if validation passed
      return compliance.overallCompliance >= 1.0 && quality.averageScore >= 0.8;
    } catch (error) {
      return false;
    }
  }

  selectNextAgent(readyAgents, workflowState) {
    if (readyAgents.length === 0) return null;

    // For intelligent mode, select based on priority and workflow type
    if (workflowState.mode === 'intelligent') {
      // Prioritize critical agents (compliance, quality)
      const criticalAgents = readyAgents.filter(a => a.priority === 'critical');
      if (criticalAgents.length > 0) {
        return criticalAgents[0];
      }

      // Then high priority agents
      const highPriorityAgents = readyAgents.filter(a => a.priority === 'high');
      if (highPriorityAgents.length > 0) {
        return highPriorityAgents[0];
      }
    }

    // Default: return first ready agent
    return readyAgents[0];
  }

  async triggerAgent(agent, workflowState) {
    try {
      // Update execution state to mark current agent
      await this.updateExecutionState(workflowState.workflowId, {
        currentAgent: agent.name,
        lastAgentStartTime: Date.now()
      });

      // Play audio feedback for agent start
      if (workflowState.audioFeedback) {
        await this.playAudioFeedback(
          agent.name,
          'started',
          `Starting ${agent.name} agent with ${agent.voice} voice`
        );
      }

      // Create agent execution trigger file
      const triggerData = {
        agent: agent.name,
        timestamp: Date.now(),
        workflowId: workflowState.workflowId,
        color: agent.color,
        voice: agent.voice,
        priority: agent.priority,
        dependencies: agent.dependencies
      };

      await fs.writeFile(
        `data/orchestration-state/execute-${agent.name}-${Date.now()}.json`,
        JSON.stringify(triggerData, null, 2)
      );

      // Log the agent trigger
      const logEntry = `${new Date().toISOString()} - Triggering agent: ${agent.name}\n` +
                       `  Color: ${agent.color}\n` +
                       `  Voice: ${agent.voice}\n` +
                       `  Priority: ${agent.priority}\n` +
                       `  Dependencies: ${agent.dependencies.join(', ')}\n`;

      await fs.appendFile('logs/orchestration/agent-triggers.log', logEntry);

      console.log(`🚀 Triggered agent: ${agent.name} (${agent.color})`);
      console.log(`   Priority: ${agent.priority}`);
      console.log(`   Voice: ${agent.voice}`);

      // The actual Claude Code agent execution will be handled by other hooks
      // This just sets up the trigger conditions

    } catch (error) {
      console.error(`Error triggering agent ${agent.name}:`, error);
      throw error;
    }
  }

  async updateExecutionState(workflowId, updates) {
    try {
      const stateFile = `data/orchestration-state/${workflowId}.json`;
      const currentState = await this.loadExecutionState(workflowId);

      const updatedState = { ...currentState, ...updates };

      await fs.writeFile(stateFile, JSON.stringify(updatedState, null, 2));
    } catch (error) {
      console.error('Error updating execution state:', error);
    }
  }

  async handleWorkflowCompletion(workflowState) {
    try {
      console.log('🎉 Workflow completion detected');

      // Update workflow status
      workflowState.status = 'completed';
      workflowState.endTime = Date.now();

      await fs.writeFile(
        'data/orchestration-state/active-workflow.json',
        JSON.stringify(workflowState, null, 2)
      );

      // Play completion audio feedback
      if (workflowState.audioFeedback) {
        await this.playAudioFeedback(
          'system',
          'workflow-completed',
          'All agents have completed successfully. Workflow finished.'
        );
      }

      // Archive the workflow
      await this.archiveWorkflow(workflowState);

      console.log(`✅ Workflow ${workflowState.workflowId} completed successfully`);

    } catch (error) {
      console.error('Error handling workflow completion:', error);
    }
  }

  async archiveWorkflow(workflowState) {
    try {
      const archiveDir = `data/archived-workflows/${workflowState.workflowId}`;
      await fs.mkdir(archiveDir, { recursive: true });

      // Move workflow files to archive
      const filesToArchive = [
        `data/orchestration-state/${workflowState.workflowId}.json`,
        `data/orchestration-state/${workflowState.workflowId}-plan.json`,
        `data/orchestration-state/trigger-${workflowState.workflowId}.json`
      ];

      for (const file of filesToArchive) {
        try {
          const filename = path.basename(file);
          await fs.rename(file, `${archiveDir}/${filename}`);
        } catch (error) {
          // File might not exist, continue
        }
      }

    } catch (error) {
      console.error('Error archiving workflow:', error);
    }
  }

  getAgentPriority(agent) {
    const priorityMap = {
      'compliance-validator': 'critical',
      'quality-scorer': 'critical',
      'advisor-data-manager': 'high',
      'market-intelligence': 'high',
      'distribution-controller': 'high',
      'feedback-processor': 'high',
      'linkedin-post-generator': 'medium',
      'whatsapp-message-creator': 'medium',
      'gemini-image-generator': 'medium',
      'fatigue-checker': 'medium',
      'segment-analyzer': 'medium',
      'analytics-tracker': 'low',
      'status-image-designer': 'low',
      'brand-customizer': 'low'
    };

    return priorityMap[agent] || 'medium';
  }

  comparePriority(a, b) {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return priorityOrder[a] - priorityOrder[b];
  }

  async playAudioFeedback(agent, event, message) {
    try {
      execSync(`say "${message}"`, { timeout: 5000 });
    } catch (error) {
      console.log(`🔊 AUDIO: ${message}`);
    }
  }

  async handleError(error) {
    const errorData = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context: 'next-agent-trigger'
    };

    await fs.appendFile(
      'logs/orchestration/errors.log',
      JSON.stringify(errorData, null, 2) + '\n'
    );
  }
}

// Main execution
async function main() {
  const trigger = new NextAgentTrigger();
  await trigger.determineNextAgent();
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default NextAgentTrigger;