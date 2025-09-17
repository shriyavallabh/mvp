#!/usr/bin/env node

/**
 * Agent Completion Audio Hook
 *
 * This hook provides audio feedback when an agent completes execution.
 * It integrates with the central audio controller and provides contextual completion messages.
 */

import AudioController from '../audio/audio-controller.js';
import fs from 'fs/promises';

class AgentCompletionAudio {
  constructor() {
    this.audioController = new AudioController();
  }

  async playCompletionAudio() {
    try {
      await this.audioController.loadAudioConfig();

      // Get the completed agent information
      const completionInfo = await this.getCompletionInfo();

      if (!completionInfo) {
        console.log('No agent completion information found');
        return;
      }

      // Determine completion context
      const context = await this.getCompletionContext(completionInfo);

      // Play completion audio
      await this.audioController.agentCompleted(
        completionInfo.agentName,
        context
      );

      // Check if this triggers workflow progress update
      await this.checkWorkflowProgress(completionInfo, context);

    } catch (error) {
      console.error('Error in agent completion audio:', error);
    }
  }

  async getCompletionInfo() {
    try {
      // Method 1: Check environment variable
      if (process.env.COMPLETED_AGENT) {
        return {
          agentName: process.env.COMPLETED_AGENT,
          timestamp: Date.now(),
          source: 'environment'
        };
      }

      // Method 2: Check active workflow
      const workflowState = await this.loadActiveWorkflow();
      if (workflowState && workflowState.currentAgent) {
        return {
          agentName: workflowState.currentAgent,
          timestamp: Date.now(),
          source: 'workflow-state'
        };
      }

      // Method 3: Check recent completion files
      const recentCompletion = await this.findRecentCompletion();
      if (recentCompletion) {
        return recentCompletion;
      }

      return null;

    } catch (error) {
      console.error('Error getting completion info:', error);
      return null;
    }
  }

  async loadActiveWorkflow() {
    try {
      const content = await fs.readFile('data/orchestration-state/active-workflow.json', 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async findRecentCompletion() {
    try {
      // Look for agent output files that indicate completion
      const outputDirs = ['output/linkedin', 'output/whatsapp', 'output/images', 'data'];

      for (const dir of outputDirs) {
        try {
          const files = await fs.readdir(dir);

          // Find most recent file
          let newestFile = null;
          let newestTime = 0;

          for (const file of files) {
            const stats = await fs.stat(`${dir}/${file}`);
            if (stats.mtime.getTime() > newestTime) {
              newestTime = stats.mtime.getTime();
              newestFile = file;
            }
          }

          if (newestFile) {
            const agentName = this.extractAgentFromFilename(newestFile);
            if (agentName) {
              return {
                agentName,
                timestamp: newestTime,
                source: 'file-output',
                outputFile: `${dir}/${newestFile}`
              };
            }
          }
        } catch (dirError) {
          // Directory doesn't exist, continue
        }
      }

      return null;

    } catch (error) {
      return null;
    }
  }

  extractAgentFromFilename(filename) {
    // Map output files to agents
    const agentMappings = {
      'advisor': 'advisor-data-manager',
      'market': 'market-intelligence',
      'segment': 'segment-analyzer',
      'linkedin': 'linkedin-post-generator',
      'whatsapp': 'whatsapp-message-creator',
      'status': 'status-image-designer',
      'image': 'gemini-image-generator',
      'brand': 'brand-customizer',
      'compliance': 'compliance-validator',
      'quality': 'quality-scorer',
      'fatigue': 'fatigue-checker',
      'distribution': 'distribution-controller',
      'analytics': 'analytics-tracker',
      'feedback': 'feedback-processor'
    };

    const lowerFilename = filename.toLowerCase();

    for (const [key, agent] of Object.entries(agentMappings)) {
      if (lowerFilename.includes(key)) {
        return agent;
      }
    }

    return null;
  }

  async getCompletionContext(completionInfo) {
    try {
      const context = {
        timestamp: completionInfo.timestamp,
        source: completionInfo.source
      };

      // Add workflow progress information
      const workflowProgress = await this.calculateWorkflowProgress();
      if (workflowProgress) {
        context.workflowProgress = workflowProgress;
        context.completedAgents = workflowProgress.completed;
        context.totalAgents = workflowProgress.total;
        context.remainingAgents = workflowProgress.remaining;
      }

      // Add output information if available
      if (completionInfo.outputFile) {
        context.outputFile = completionInfo.outputFile;
        context.hasOutput = true;
      }

      // Add performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(completionInfo.agentName);
      if (performanceMetrics) {
        context.performance = performanceMetrics;
      }

      return context;

    } catch (error) {
      console.error('Error getting completion context:', error);
      return {};
    }
  }

  async calculateWorkflowProgress() {
    try {
      const workflowState = await this.loadActiveWorkflow();
      if (!workflowState) return null;

      const allAgents = [
        'advisor-data-manager',
        'market-intelligence',
        'segment-analyzer',
        'linkedin-post-generator',
        'whatsapp-message-creator',
        'status-image-designer',
        'gemini-image-generator',
        'brand-customizer',
        'compliance-validator',
        'quality-scorer',
        'fatigue-checker',
        'distribution-controller',
        'analytics-tracker',
        'feedback-processor'
      ];

      // Count completed agents by checking for their output files
      let completedCount = 0;
      const completedAgents = [];

      for (const agent of allAgents) {
        const isCompleted = await this.checkAgentCompleted(agent);
        if (isCompleted) {
          completedCount++;
          completedAgents.push(agent);
        }
      }

      return {
        total: allAgents.length,
        completed: completedCount,
        remaining: allAgents.length - completedCount,
        percentage: Math.round((completedCount / allAgents.length) * 100),
        completedAgents
      };

    } catch (error) {
      return null;
    }
  }

  async checkAgentCompleted(agentName) {
    try {
      // Check for agent-specific output files
      const outputChecks = {
        'advisor-data-manager': ['data/advisor-data.json', 'data/advisors.json'],
        'market-intelligence': ['data/market-intelligence.json'],
        'segment-analyzer': ['data/segment-analysis.json'],
        'linkedin-post-generator': ['data/linkedin-posts.json', 'output/linkedin'],
        'whatsapp-message-creator': ['data/whatsapp-messages.json', 'output/whatsapp'],
        'status-image-designer': ['data/status-image-designs.json'],
        'gemini-image-generator': ['data/generated-images.json', 'output/images'],
        'brand-customizer': ['data/branded-content.json'],
        'compliance-validator': ['data/compliance-validation.json'],
        'quality-scorer': ['data/quality-scores.json'],
        'fatigue-checker': ['data/fatigue-analysis.json'],
        'distribution-controller': ['data/distribution-package.json'],
        'analytics-tracker': ['data/analytics-config.json'],
        'feedback-processor': ['data/regenerated-content.json']
      };

      const filesToCheck = outputChecks[agentName] || [];

      for (const file of filesToCheck) {
        try {
          await fs.access(file);
          return true; // If any expected file exists, agent is completed
        } catch (error) {
          // File doesn't exist, continue checking
        }
      }

      return false;

    } catch (error) {
      return false;
    }
  }

  async getPerformanceMetrics(agentName) {
    try {
      // Read performance logs if they exist
      const logFile = `logs/orchestration/agent-performance-${agentName}.log`;
      const content = await fs.readFile(logFile, 'utf-8');

      const lines = content.trim().split('\n');
      if (lines.length === 0) return null;

      const latestEntry = JSON.parse(lines[lines.length - 1]);

      return {
        executionTime: latestEntry.executionTime,
        memoryUsage: latestEntry.memoryUsage,
        cpuUsage: latestEntry.cpuUsage,
        timestamp: latestEntry.timestamp
      };

    } catch (error) {
      return null;
    }
  }

  async checkWorkflowProgress(completionInfo, context) {
    try {
      if (!context.workflowProgress) return;

      const progress = context.workflowProgress;

      // Play progress audio at certain milestones
      const milestones = [25, 50, 75, 90, 100];

      for (const milestone of milestones) {
        if (progress.percentage >= milestone && !this.hasPlayedMilestone(milestone)) {
          await this.audioController.workflowProgress({
            ...context,
            milestone,
            message: `Workflow ${milestone}% complete. ${progress.completed} of ${progress.total} agents finished.`
          });

          await this.markMilestoneAsPlayed(milestone);
          break;
        }
      }

      // Check if workflow is complete
      if (progress.percentage >= 100) {
        await this.audioController.workflowCompleted(context);
      }

    } catch (error) {
      console.error('Error checking workflow progress:', error);
    }
  }

  async hasPlayedMilestone(milestone) {
    try {
      const content = await fs.readFile('data/orchestration-state/milestones-played.json', 'utf-8');
      const milestones = JSON.parse(content);
      return milestones.includes(milestone);
    } catch (error) {
      return false;
    }
  }

  async markMilestoneAsPlayed(milestone) {
    try {
      let milestones = [];

      try {
        const content = await fs.readFile('data/orchestration-state/milestones-played.json', 'utf-8');
        milestones = JSON.parse(content);
      } catch (error) {
        // File doesn't exist, start with empty array
      }

      if (!milestones.includes(milestone)) {
        milestones.push(milestone);
        await fs.writeFile(
          'data/orchestration-state/milestones-played.json',
          JSON.stringify(milestones, null, 2)
        );
      }

    } catch (error) {
      console.error('Error marking milestone as played:', error);
    }
  }
}

// Main execution
async function main() {
  const completionAudio = new AgentCompletionAudio();
  await completionAudio.playCompletionAudio();
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AgentCompletionAudio;