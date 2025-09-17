#!/usr/bin/env node

/**
 * Central Audio Feedback Controller
 *
 * This system provides comprehensive audio feedback for the hybrid orchestration system.
 * Features include agent-specific voices, emotional states, progress music, and contextual sounds.
 */

import fs from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';

class AudioController {
  constructor() {
    this.audioConfig = {
      enabled: true,
      volume: 0.7,
      speed: 1.0,
      useSystemVoices: true,
      enableProgressMusic: true,
      enableSoundEffects: true
    };

    // Agent voice personalities with emotional states
    this.agentVoices = {
      'advisor-data-manager': {
        voice: 'Alex',
        baseSpeed: 0.9,
        personality: 'analytical',
        emotions: {
          starting: { pitch: 'normal', energy: 'focused' },
          working: { pitch: 'steady', energy: 'concentrated' },
          success: { pitch: 'satisfied', energy: 'accomplished' },
          error: { pitch: 'concerned', energy: 'troubleshooting' }
        },
        soundEffects: {
          start: 'data-processing-beep',
          success: 'database-sync-chime',
          error: 'data-error-buzz'
        }
      },

      'market-intelligence': {
        voice: 'Victoria',
        baseSpeed: 1.0,
        personality: 'authoritative',
        emotions: {
          starting: { pitch: 'confident', energy: 'determined' },
          working: { pitch: 'analytical', energy: 'intense' },
          success: { pitch: 'triumphant', energy: 'commanding' },
          error: { pitch: 'serious', energy: 'investigative' }
        },
        soundEffects: {
          start: 'market-bell-ring',
          success: 'success-fanfare',
          error: 'alert-tone'
        }
      },

      'linkedin-post-generator': {
        voice: 'Samantha',
        baseSpeed: 1.1,
        personality: 'creative',
        emotions: {
          starting: { pitch: 'enthusiastic', energy: 'inspiring' },
          working: { pitch: 'creative', energy: 'flowing' },
          success: { pitch: 'delighted', energy: 'celebratory' },
          error: { pitch: 'thoughtful', energy: 'reimagining' }
        },
        soundEffects: {
          start: 'inspiration-chime',
          success: 'creative-flourish',
          error: 'contemplation-tone'
        }
      },

      'whatsapp-message-creator': {
        voice: 'Karen',
        baseSpeed: 1.2,
        personality: 'engaging',
        emotions: {
          starting: { pitch: 'cheerful', energy: 'vibrant' },
          working: { pitch: 'conversational', energy: 'lively' },
          success: { pitch: 'excited', energy: 'bubbly' },
          error: { pitch: 'puzzled', energy: 'problem-solving' }
        },
        soundEffects: {
          start: 'message-pop',
          success: 'notification-ding',
          error: 'message-fail-sound'
        }
      },

      'compliance-validator': {
        voice: 'Bruce',
        baseSpeed: 0.8,
        personality: 'authoritative',
        emotions: {
          starting: { pitch: 'serious', energy: 'vigilant' },
          working: { pitch: 'scrutinizing', energy: 'meticulous' },
          success: { pitch: 'approved', energy: 'official' },
          error: { pitch: 'stern', energy: 'corrective' }
        },
        soundEffects: {
          start: 'compliance-scan-beep',
          success: 'approval-stamp',
          error: 'violation-alert'
        }
      },

      'gemini-image-generator': {
        voice: 'Ralph',
        baseSpeed: 0.9,
        personality: 'technical',
        emotions: {
          starting: { pitch: 'methodical', energy: 'precise' },
          working: { pitch: 'computational', energy: 'processing' },
          success: { pitch: 'accomplished', energy: 'technical-pride' },
          error: { pitch: 'diagnostic', energy: 'troubleshooting' }
        },
        soundEffects: {
          start: 'ai-activation-sound',
          success: 'generation-complete-chime',
          error: 'processing-error-beep'
        }
      }
    };

    // System-wide audio themes
    this.systemAudio = {
      workflow: {
        start: {
          message: 'Initiating hybrid orchestration protocol. Multi-agent system online.',
          voice: 'Alex',
          speed: 1.0,
          soundEffect: 'system-startup-melody'
        },
        progress: {
          messages: [
            'Orchestration in progress. Agents collaborating seamlessly.',
            'Multi-agent workflow advancing. Systems synchronized.',
            'Intelligent coordination active. Agents executing in harmony.'
          ],
          voice: 'Whisper',
          speed: 0.9
        },
        completion: {
          message: 'Hybrid orchestration completed successfully. All systems nominal.',
          voice: 'Victoria',
          speed: 1.0,
          soundEffect: 'completion-fanfare'
        },
        error: {
          message: 'Orchestration error detected. Initiating recovery protocols.',
          voice: 'Bruce',
          speed: 0.9,
          soundEffect: 'error-alert-tone'
        }
      }
    };

    // Progress music themes
    this.progressMusic = {
      phases: {
        'data-collection': {
          tempo: 'moderate',
          mood: 'focused',
          instruments: ['piano', 'soft-strings'],
          description: 'Data gathering phase music'
        },
        'content-generation': {
          tempo: 'upbeat',
          mood: 'creative',
          instruments: ['acoustic-guitar', 'light-percussion'],
          description: 'Creative content generation music'
        },
        'validation': {
          tempo: 'steady',
          mood: 'serious',
          instruments: ['strings', 'brass'],
          description: 'Validation and compliance checking music'
        },
        'distribution': {
          tempo: 'energetic',
          mood: 'triumphant',
          instruments: ['full-orchestra'],
          description: 'Final distribution phase music'
        }
      }
    };
  }

  async playAgentAudio(agentName, eventType, customMessage = null, context = {}) {
    try {
      if (!this.audioConfig.enabled) {
        console.log(`🔊 SILENT: ${agentName} - ${eventType}`);
        return;
      }

      const agentVoice = this.agentVoices[agentName];
      if (!agentVoice) {
        await this.playGenericAgentAudio(agentName, eventType, customMessage);
        return;
      }

      // Generate context-aware message
      const message = customMessage || await this.generateContextualMessage(
        agentName,
        eventType,
        agentVoice,
        context
      );

      // Calculate emotional voice parameters
      const voiceParams = this.calculateVoiceParameters(agentVoice, eventType);

      // Play sound effect first (if enabled)
      if (this.audioConfig.enableSoundEffects && agentVoice.soundEffects[eventType]) {
        await this.playSoundEffect(agentVoice.soundEffects[eventType]);
      }

      // Play voice message
      await this.playVoiceMessage(message, voiceParams);

      // Log audio feedback
      await this.logAudioEvent(agentName, eventType, message, voiceParams);

      console.log(`🔊 AUDIO: ${agentName} (${agentVoice.voice}) - ${eventType.toUpperCase()}`);
      console.log(`    Message: ${message}`);

    } catch (error) {
      console.error(`Audio playback failed for ${agentName}:`, error);
      console.log(`🔊 FALLBACK: ${agentName} - ${eventType}`);
    }
  }

  async generateContextualMessage(agentName, eventType, agentVoice, context) {
    const messageTemplates = {
      starting: [
        `${agentName.replace(/-/g, ' ')} agent activating. ${agentVoice.personality} protocols engaged.`,
        `Initializing ${agentName.replace(/-/g, ' ')} with ${agentVoice.personality} parameters.`,
        `${agentName.replace(/-/g, ' ')} coming online. Beginning ${agentVoice.personality} execution.`
      ],

      working: [
        `${agentName.replace(/-/g, ' ')} processing. ${agentVoice.personality} algorithms active.`,
        `${agentName.replace(/-/g, ' ')} in progress. Executing with ${agentVoice.personality} precision.`,
        `${agentName.replace(/-/g, ' ')} working diligently. ${agentVoice.personality} mode engaged.`
      ],

      success: [
        `${agentName.replace(/-/g, ' ')} completed successfully. ${agentVoice.personality} objectives achieved.`,
        `${agentName.replace(/-/g, ' ')} execution complete. ${agentVoice.personality} standards met.`,
        `${agentName.replace(/-/g, ' ')} finished with excellence. ${agentVoice.personality} quality delivered.`
      ],

      error: [
        `${agentName.replace(/-/g, ' ')} encountered an issue. ${agentVoice.personality} troubleshooting initiated.`,
        `${agentName.replace(/-/g, ' ')} requires attention. ${agentVoice.personality} diagnosis in progress.`,
        `${agentName.replace(/-/g, ' ')} reporting error condition. ${agentVoice.personality} recovery protocols active.`
      ]
    };

    const templates = messageTemplates[eventType] || [`${agentName} - ${eventType}`];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Add context-specific information
    if (context.workflowPhase) {
      return `${selectedTemplate} Phase: ${context.workflowPhase}.`;
    }

    if (context.progress) {
      return `${selectedTemplate} Progress: ${context.progress}.`;
    }

    return selectedTemplate;
  }

  calculateVoiceParameters(agentVoice, eventType) {
    const emotion = agentVoice.emotions[eventType] || agentVoice.emotions.starting;

    let speedModifier = 1.0;
    let pitchModifier = 1.0;

    // Adjust speed based on emotion
    switch (emotion.energy) {
      case 'excited':
      case 'vibrant':
        speedModifier = 1.2;
        break;
      case 'focused':
      case 'serious':
        speedModifier = 0.9;
        break;
      case 'celebratory':
        speedModifier = 1.15;
        break;
      default:
        speedModifier = 1.0;
    }

    // Calculate final voice parameters
    const finalSpeed = agentVoice.baseSpeed * speedModifier * this.audioConfig.speed;
    const finalRate = Math.round(finalSpeed * 200); // Convert to macOS say rate

    return {
      voice: agentVoice.voice,
      rate: Math.max(80, Math.min(400, finalRate)), // Clamp to reasonable range
      emotion: emotion,
      personality: agentVoice.personality
    };
  }

  async playVoiceMessage(message, voiceParams) {
    try {
      const command = `say -v "${voiceParams.voice}" -r ${voiceParams.rate} "${message}"`;

      execSync(command, {
        timeout: 15000,
        stdio: 'pipe'
      });

    } catch (error) {
      // Fallback to default voice
      try {
        execSync(`say "${message}"`, { timeout: 8000, stdio: 'pipe' });
      } catch (fallbackError) {
        console.log(`🔊 VOICE FALLBACK: ${message}`);
      }
    }
  }

  async playSoundEffect(effectName) {
    if (!this.audioConfig.enableSoundEffects) return;

    try {
      // Map sound effects to actual audio commands/files
      const soundCommands = {
        'data-processing-beep': 'afplay /System/Library/Sounds/Tink.aiff',
        'database-sync-chime': 'afplay /System/Library/Sounds/Glass.aiff',
        'market-bell-ring': 'afplay /System/Library/Sounds/Ping.aiff',
        'inspiration-chime': 'afplay /System/Library/Sounds/Purr.aiff',
        'message-pop': 'afplay /System/Library/Sounds/Pop.aiff',
        'compliance-scan-beep': 'afplay /System/Library/Sounds/Morse.aiff',
        'ai-activation-sound': 'afplay /System/Library/Sounds/Bottle.aiff',
        'system-startup-melody': 'afplay /System/Library/Sounds/Sosumi.aiff',
        'completion-fanfare': 'afplay /System/Library/Sounds/Blow.aiff',
        'error-alert-tone': 'afplay /System/Library/Sounds/Basso.aiff'
      };

      const command = soundCommands[effectName];
      if (command) {
        execSync(command, { timeout: 3000, stdio: 'pipe' });
      }

    } catch (error) {
      // Sound effects are optional, don't throw errors
    }
  }

  async playSystemAudio(eventType, context = {}) {
    try {
      const systemEvent = this.systemAudio.workflow[eventType];
      if (!systemEvent) return;

      let message = systemEvent.message;

      if (eventType === 'progress' && systemEvent.messages) {
        const randomIndex = Math.floor(Math.random() * systemEvent.messages.length);
        message = systemEvent.messages[randomIndex];
      }

      // Add context information
      if (context.completedAgents && context.totalAgents) {
        message += ` Progress: ${context.completedAgents} of ${context.totalAgents} agents completed.`;
      }

      // Play sound effect first
      if (systemEvent.soundEffect && this.audioConfig.enableSoundEffects) {
        await this.playSoundEffect(systemEvent.soundEffect);
        // Small delay between sound effect and voice
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Play voice message
      const voiceParams = {
        voice: systemEvent.voice,
        rate: Math.round(systemEvent.speed * 200)
      };

      await this.playVoiceMessage(message, voiceParams);

      console.log(`🔊 SYSTEM AUDIO: ${eventType.toUpperCase()} - ${message}`);

    } catch (error) {
      console.error(`System audio failed for ${eventType}:`, error);
    }
  }

  async playProgressMusic(phase, intensity = 'medium') {
    if (!this.audioConfig.enableProgressMusic) return;

    try {
      const musicConfig = this.progressMusic.phases[phase];
      if (!musicConfig) return;

      // This is a placeholder for actual music generation/playback
      // In a real implementation, you might:
      // 1. Generate MIDI sequences
      // 2. Use audio synthesis libraries
      // 3. Play background ambient sounds
      // 4. Use web audio APIs

      console.log(`🎵 PROGRESS MUSIC: ${phase} - ${musicConfig.mood} (${musicConfig.tempo})`);
      console.log(`    Instruments: ${musicConfig.instruments.join(', ')}`);

      // For now, just log the music intention
      await this.logMusicEvent(phase, musicConfig, intensity);

    } catch (error) {
      console.error(`Progress music failed for ${phase}:`, error);
    }
  }

  async playGenericAgentAudio(agentName, eventType, customMessage) {
    const message = customMessage || `${agentName.replace(/-/g, ' ')} ${eventType}`;

    const voiceParams = {
      voice: 'Alex',
      rate: 200
    };

    await this.playVoiceMessage(message, voiceParams);
    console.log(`🔊 GENERIC AUDIO: ${agentName} - ${eventType}`);
  }

  async updateAudioConfig(newConfig) {
    this.audioConfig = { ...this.audioConfig, ...newConfig };

    // Save configuration to file
    await fs.writeFile(
      'data/audio-feedback/audio-config.json',
      JSON.stringify(this.audioConfig, null, 2)
    );

    console.log('🔧 Audio configuration updated');
  }

  async loadAudioConfig() {
    try {
      const content = await fs.readFile('data/audio-feedback/audio-config.json', 'utf-8');
      this.audioConfig = { ...this.audioConfig, ...JSON.parse(content) };
    } catch (error) {
      // Use default configuration
    }
  }

  async logAudioEvent(agentName, eventType, message, voiceParams) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'agent-audio',
        agent: agentName,
        event: eventType,
        message,
        voiceParams,
        audioConfig: this.audioConfig
      };

      await fs.appendFile(
        'logs/orchestration/audio-events.log',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      // Logging is optional
    }
  }

  async logMusicEvent(phase, musicConfig, intensity) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'progress-music',
        phase,
        musicConfig,
        intensity
      };

      await fs.appendFile(
        'logs/orchestration/music-events.log',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      // Logging is optional
    }
  }

  // Public API methods
  async agentStarted(agentName, context = {}) {
    await this.playAgentAudio(agentName, 'starting', null, context);
  }

  async agentWorking(agentName, context = {}) {
    await this.playAgentAudio(agentName, 'working', null, context);
  }

  async agentCompleted(agentName, context = {}) {
    await this.playAgentAudio(agentName, 'success', null, context);
  }

  async agentFailed(agentName, error, context = {}) {
    const message = `${agentName.replace(/-/g, ' ')} encountered error: ${error.message || error}`;
    await this.playAgentAudio(agentName, 'error', message, context);
  }

  async workflowStarted(context = {}) {
    await this.playSystemAudio('start', context);
  }

  async workflowProgress(context = {}) {
    await this.playSystemAudio('progress', context);
  }

  async workflowCompleted(context = {}) {
    await this.playSystemAudio('completion', context);
  }

  async workflowFailed(error, context = {}) {
    await this.playSystemAudio('error', { ...context, error });
  }
}

// Export for use as module
export default AudioController;

// CLI interface for testing
async function main() {
  const audioController = new AudioController();
  await audioController.loadAudioConfig();

  const args = process.argv.slice(2);
  const command = args[0];
  const agentName = args[1];
  const eventType = args[2];

  switch (command) {
    case 'agent':
      if (agentName && eventType) {
        await audioController.playAgentAudio(agentName, eventType);
      }
      break;

    case 'system':
      if (agentName) { // agentName is actually eventType here
        await audioController.playSystemAudio(agentName);
      }
      break;

    case 'test':
      // Test all agent voices
      console.log('🧪 Testing all agent voices...');
      for (const agent of Object.keys(audioController.agentVoices)) {
        await audioController.agentStarted(agent);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node audio-controller.js agent <agent-name> <event-type>');
      console.log('  node audio-controller.js system <event-type>');
      console.log('  node audio-controller.js test');
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}