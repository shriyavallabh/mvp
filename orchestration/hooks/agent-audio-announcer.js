#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AgentAudioAnnouncer {
  constructor() {
    this.configPath = path.join(__dirname, 'audio-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Failed to load audio config:', error.message);
      return { enabled: false };
    }
  }

  async speak(text) {
    if (!this.config.enabled) {
      return;
    }

    const { voice_name, rate } = this.config.voice;

    // macOS say command with professional female voice
    const command = `say -v "${voice_name}" -r ${rate} "${text}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Audio error: ${error.message}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async announceAgentStart(agentName) {
    if (!this.config.enabled) {
      return;
    }

    const agentConfig = this.config.agents[agentName];
    if (!agentConfig) {
      console.log(`⚠️  No audio config for agent: ${agentName}`);
      return;
    }

    const message = agentConfig.start;
    console.log(`🔊 AUDIO: ${message}`);
    await this.speak(message);
  }

  async announceAgentComplete(agentName) {
    if (!this.config.enabled) {
      return;
    }

    const agentConfig = this.config.agents[agentName];
    if (!agentConfig) {
      return;
    }

    const message = agentConfig.complete;
    console.log(`🔊 AUDIO: ${message}`);
    await this.speak(message);
  }

  async announcePhaseTransition(phase, description) {
    if (!this.config.enabled) {
      return;
    }

    const message = `Starting ${phase}: ${description}`;
    console.log(`🔊 AUDIO: ${message}`);
    await this.speak(message);
  }

  async announceOrchestrationStart() {
    if (!this.config.enabled) {
      return;
    }

    const message = "FinAdvise orchestration is starting. Initiating all agents.";
    console.log(`🔊 AUDIO: ${message}`);
    await this.speak(message);
  }

  async announceOrchestrationComplete() {
    if (!this.config.enabled) {
      return;
    }

    const message = "FinAdvise orchestration is complete. All agents have finished execution.";
    console.log(`🔊 AUDIO: ${message}`);
    await this.speak(message);
  }
}

// CLI usage
if (require.main === module) {
  const announcer = new AgentAudioAnnouncer();
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node agent-audio-announcer.js <event> <agentName>');
    console.log('Events: start, complete, phase, orchestration-start, orchestration-complete');
    process.exit(1);
  }

  const [event, ...rest] = args;
  const agentName = rest.join(' ');

  (async () => {
    switch(event) {
      case 'start':
        await announcer.announceAgentStart(agentName);
        break;
      case 'complete':
        await announcer.announceAgentComplete(agentName);
        break;
      case 'phase':
        await announcer.announcePhaseTransition(agentName, rest[1] || '');
        break;
      case 'orchestration-start':
        await announcer.announceOrchestrationStart();
        break;
      case 'orchestration-complete':
        await announcer.announceOrchestrationComplete();
        break;
      default:
        console.log(`Unknown event: ${event}`);
    }
  })();
}

module.exports = AgentAudioAnnouncer;
