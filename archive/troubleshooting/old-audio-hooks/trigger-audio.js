#!/usr/bin/env node

/**
 * Audio Feedback Hook
 * Triggers audio feedback for tool completion events
 */

const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');

async function triggerAudio() {
  try {
    // Check if audio is enabled in hooks config
    const audioEnabled = process.env.AUDIO_ENABLED !== 'false';
    if (!audioEnabled) {
      console.log('Audio feedback disabled');
      return;
    }

    // Get the last executed tool/command info
    const message = process.argv[2] || 'Tool execution completed';
    const agent = process.argv[3] || 'system';

    // Create audio feedback message
    const audioText = `${agent}: ${message}`;

    try {
      // Use macOS TTS with female voice (Samantha)
      execSync(`say -v Samantha "${audioText}"`, { timeout: 5000 });
      console.log(`🔊 Audio (Female): ${audioText}`);
    } catch (error) {
      // Fallback to console log
      console.log(`🔊 AUDIO FALLBACK: ${audioText}`);
    }

    // Log audio event
    const logEntry = {
      timestamp: Date.now(),
      agent,
      message,
      audioPlayed: true
    };

    await fs.mkdir('data/audio-feedback', { recursive: true });
    await fs.writeFile(
      `data/audio-feedback/audio-${Date.now()}.json`,
      JSON.stringify(logEntry, null, 2)
    );

  } catch (error) {
    console.error('Audio hook failed:', error.message);
  }
}

triggerAudio();