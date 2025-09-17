#!/usr/bin/env node

/**
 * Agent Start Audio Feedback Hook
 *
 * This hook provides audio feedback when an agent starts execution.
 * It includes agent-specific voices, personality traits, and contextual messages.
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';

class AgentStartAudio {
  constructor() {
    this.agentPersonalities = {
      'advisor-data-manager': {
        voice: 'Alex',
        speed: 0.9,
        personality: 'analytical',
        startMessages: [
          'Initiating data collection protocols. Accessing advisor database.',
          'Beginning systematic data extraction from Google Sheets.',
          'Loading advisor profiles and customization preferences.'
        ]
      },
      'market-intelligence': {
        voice: 'Victoria',
        speed: 1.0,
        personality: 'authoritative',
        startMessages: [
          'Conducting real-time market analysis. Scanning financial indicators.',
          'Gathering intelligence from multiple market data sources.',
          'Analyzing current market conditions and trends.'
        ]
      },
      'segment-analyzer': {
        voice: 'Daniel',
        speed: 0.95,
        personality: 'strategic',
        startMessages: [
          'Performing strategic segment analysis. Evaluating client demographics.',
          'Analyzing advisor client segments for optimal targeting.',
          'Computing segment-specific content strategies.'
        ]
      },
      'linkedin-post-generator': {
        voice: 'Samantha',
        speed: 1.1,
        personality: 'creative',
        startMessages: [
          'Unleashing creative content generation. Crafting professional LinkedIn posts.',
          'Generating engaging professional content with market insights.',
          'Creating compelling LinkedIn narratives for advisors.'
        ]
      },
      'whatsapp-message-creator': {
        voice: 'Karen',
        speed: 1.2,
        personality: 'engaging',
        startMessages: [
          'Crafting personalized WhatsApp messages. Adding emoji magic.',
          'Creating engaging bite-sized content for instant messaging.',
          'Generating compelling WhatsApp communications.'
        ]
      },
      'status-image-designer': {
        voice: 'Fred',
        speed: 0.85,
        personality: 'artistic',
        startMessages: [
          'Initiating visual design protocols. Creating aesthetic status images.',
          'Designing compelling visual content for WhatsApp Status.',
          'Composing artistic layouts with market data integration.'
        ]
      },
      'gemini-image-generator': {
        voice: 'Ralph',
        speed: 0.9,
        personality: 'technical',
        startMessages: [
          'Initializing Gemini image generation protocols. Processing visual requests.',
          'Connecting to advanced AI image generation systems.',
          'Executing sophisticated image creation algorithms.'
        ]
      },
      'brand-customizer': {
        voice: 'Kathy',
        speed: 1.0,
        personality: 'professional',
        startMessages: [
          'Applying brand customization protocols. Integrating advisor identities.',
          'Customizing content with advisor-specific branding elements.',
          'Ensuring brand consistency across all generated materials.'
        ]
      },
      'compliance-validator': {
        voice: 'Bruce',
        speed: 0.8,
        personality: 'authoritative',
        startMessages: [
          'Initiating SEBI compliance validation. Ensuring regulatory adherence.',
          'Conducting thorough compliance checks. Zero tolerance for violations.',
          'Validating content against securities regulations.'
        ]
      },
      'quality-scorer': {
        voice: 'Princess',
        speed: 0.95,
        personality: 'analytical',
        startMessages: [
          'Beginning quality assessment protocols. Analyzing content metrics.',
          'Evaluating content quality across multiple dimensions.',
          'Computing engagement potential and value scores.'
        ]
      },
      'fatigue-checker': {
        voice: 'Junior',
        speed: 1.1,
        personality: 'vigilant',
        startMessages: [
          'Scanning for content repetition patterns. Detecting template fatigue.',
          'Ensuring content freshness and uniqueness.',
          'Analyzing recent content history for overlap detection.'
        ]
      },
      'distribution-controller': {
        voice: 'Zarvox',
        speed: 0.9,
        personality: 'efficient',
        startMessages: [
          'Activating distribution protocols. Preparing content delivery systems.',
          'Coordinating multi-channel content distribution.',
          'Initializing delivery tracking and confirmation systems.'
        ]
      },
      'analytics-tracker': {
        voice: 'Whisper',
        speed: 1.0,
        personality: 'insightful',
        startMessages: [
          'Initializing analytics collection. Gathering performance insights.',
          'Beginning comprehensive metric tracking and analysis.',
          'Monitoring engagement patterns and success indicators.'
        ]
      },
      'feedback-processor': {
        voice: 'Trinoids',
        speed: 1.05,
        personality: 'adaptive',
        startMessages: [
          'Processing feedback loops. Adapting to quality requirements.',
          'Analyzing validation results for content improvement.',
          'Implementing intelligent feedback-driven optimizations.'
        ]
      }
    };

    this.systemPersonality = {
      voice: 'Alex',
      speed: 1.0,
      startMessages: [
        'System orchestration activated. Multi-agent workflow initiated.',
        'Hybrid orchestration system online. Beginning intelligent coordination.',
        'Advanced agent coordination protocols engaged.'
      ]
    };
  }

  async playAgentStartAudio() {
    try {
      // Get the current agent from environment or execution state
      const currentAgent = await this.getCurrentAgent();

      if (!currentAgent) {
        console.log('No current agent detected for audio feedback');
        return;
      }

      // Check if audio is enabled
      const audioEnabled = await this.isAudioEnabled();
      if (!audioEnabled) {
        console.log(`🔊 SILENT: ${currentAgent} agent started`);
        return;
      }

      // Get agent personality and generate audio
      await this.generateAgentStartAudio(currentAgent);

    } catch (error) {
      console.error('Error in agent start audio:', error);
      // Fallback to text output
      console.log('🔊 AUDIO ERROR: Agent start audio failed');
    }
  }

  async getCurrentAgent() {
    try {
      // Try multiple methods to detect current agent

      // Method 1: Check environment variable
      if (process.env.CURRENT_AGENT) {
        return process.env.CURRENT_AGENT;
      }

      // Method 2: Check active workflow state
      const workflowState = await this.loadActiveWorkflow();
      if (workflowState && workflowState.currentAgent) {
        return workflowState.currentAgent;
      }

      // Method 3: Check recent execution files
      const recentAgent = await this.findRecentAgentExecution();
      if (recentAgent) {
        return recentAgent;
      }

      return null;

    } catch (error) {
      console.error('Error detecting current agent:', error);
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

  async findRecentAgentExecution() {
    try {
      const files = await fs.readdir('data/orchestration-state');
      const executeFiles = files.filter(f => f.startsWith('execute-') && f.endsWith('.json'));

      if (executeFiles.length === 0) return null;

      // Sort by timestamp (newest first)
      executeFiles.sort((a, b) => {
        const timeA = parseInt(a.match(/execute-.+-(\d+)\.json/)?.[1] || '0');
        const timeB = parseInt(b.match(/execute-.+-(\d+)\.json/)?.[1] || '0');
        return timeB - timeA;
      });

      // Get the most recent execution
      const recentFile = executeFiles[0];
      const content = await fs.readFile(`data/orchestration-state/${recentFile}`, 'utf-8');
      const executeData = JSON.parse(content);

      return executeData.agent;

    } catch (error) {
      return null;
    }
  }

  async isAudioEnabled() {
    try {
      // Check configuration for audio settings
      const workflowState = await this.loadActiveWorkflow();
      return workflowState?.audioFeedback !== false;
    } catch (error) {
      return true; // Default to enabled
    }
  }

  async generateAgentStartAudio(agentName) {
    try {
      const personality = this.agentPersonalities[agentName];

      if (!personality) {
        // Use generic system audio for unknown agents
        await this.playGenericStartAudio(agentName);
        return;
      }

      // Select a random start message
      const messages = personality.startMessages;
      const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

      // Create the full audio message
      const audioMessage = `${agentName.replace(/-/g, ' ')} agent starting. ${selectedMessage}`;

      // Play audio with agent-specific voice settings
      await this.playAudioWithVoice(audioMessage, personality);

      // Log the audio feedback
      await this.logAudioFeedback(agentName, 'start', audioMessage, personality);

      console.log(`🔊 AUDIO: ${agentName} (${personality.voice}) - ${selectedMessage}`);

    } catch (error) {
      console.error(`Error generating audio for ${agentName}:`, error);
      console.log(`🔊 FALLBACK: ${agentName} agent started`);
    }
  }

  async playGenericStartAudio(agentName) {
    const message = `${agentName.replace(/-/g, ' ')} agent is starting execution`;
    await this.playAudioWithVoice(message, this.systemPersonality);
    console.log(`🔊 AUDIO: ${message}`);
  }

  async playAudioWithVoice(message, personality) {
    try {
      // macOS system voices with personality-specific settings
      const voiceCommand = `say -v "${personality.voice}" -r ${Math.round(personality.speed * 200)} "${message}"`;

      execSync(voiceCommand, {
        timeout: 10000,
        stdio: 'pipe' // Suppress output
      });

    } catch (error) {
      // Fallback to default system voice
      try {
        execSync(`say "${message}"`, { timeout: 5000, stdio: 'pipe' });
      } catch (fallbackError) {
        // Audio completely failed, use console output
        console.log(`🔊 AUDIO FALLBACK: ${message}`);
      }
    }
  }

  async logAudioFeedback(agentName, event, message, personality) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        agent: agentName,
        event,
        message,
        voice: personality.voice,
        speed: personality.speed,
        personality: personality.personality
      };

      await fs.appendFile(
        'logs/orchestration/audio-feedback.log',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      // Logging failed, but don't throw error
      console.error('Failed to log audio feedback:', error);
    }
  }

  async saveAudioConfig(agentName, personality) {
    try {
      const audioConfig = {
        agent: agentName,
        timestamp: Date.now(),
        ...personality
      };

      await fs.writeFile(
        `data/audio-feedback/agent-${agentName}-${Date.now()}.json`,
        JSON.stringify(audioConfig, null, 2)
      );

    } catch (error) {
      // Config save failed, continue anyway
    }
  }
}

// Main execution
async function main() {
  const audioSystem = new AgentStartAudio();
  await audioSystem.playAgentStartAudio();
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AgentStartAudio;