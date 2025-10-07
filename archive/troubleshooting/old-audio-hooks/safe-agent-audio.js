#!/usr/bin/env node

/**
 * Safe Agent Audio - No Recursion
 * Only announces when Task tool is used with agent types
 * Prevents infinite loops by checking execution context
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Prevent recursion by tracking current executions
const LOCK_FILE = path.join(__dirname, '../../data/audio-lock.json');

function isAudioLocked() {
    try {
        if (!fs.existsSync(LOCK_FILE)) return false;

        const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        const now = Date.now();

        // Lock expires after 5 seconds
        if (now - lock.timestamp > 5000) {
            fs.unlinkSync(LOCK_FILE);
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

function createAudioLock() {
    try {
        fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
        fs.writeFileSync(LOCK_FILE, JSON.stringify({ timestamp: Date.now() }));
    } catch (error) {
        // Silent fail
    }
}

function removeAudioLock() {
    try {
        if (fs.existsSync(LOCK_FILE)) {
            fs.unlinkSync(LOCK_FILE);
        }
    } catch (error) {
        // Silent fail
    }
}

function isTaskToolCall() {
    const sources = [
        process.env.CLAUDE_TOOL_ARGS,
        process.env.CLAUDE_CURRENT_TOOL,
        process.argv.join(' ')
    ];

    for (const source of sources) {
        if (source && (source.includes('subagent_type') || source.includes('Task'))) {
            return true;
        }
    }

    return false;
}

function detectAgent() {
    const agentMap = {
        'market-intelligence': 'market intelligence',
        'advisor-data-manager': 'advisor data manager',
        'segment-analyzer': 'segment analyzer',
        'linkedin-post-generator-enhanced': 'LinkedIn post generator',
        'whatsapp-message-creator': 'WhatsApp message creator',
        'status-image-designer': 'status image designer',
        'gemini-image-generator': 'Gemini image generator',
        'brand-customizer': 'brand customizer',
        'compliance-validator': 'compliance validator',
        'quality-scorer': 'quality scorer',
        'fatigue-checker': 'fatigue checker',
        'distribution-controller': 'distribution controller'
    };

    const source = process.env.CLAUDE_TOOL_ARGS || process.argv.join(' ');

    for (const [key, value] of Object.entries(agentMap)) {
        if (source.toLowerCase().includes(key)) {
            return value;
        }
    }

    return null;
}

function safeAnnounce() {
    try {
        // Check if this is a recursion attempt
        if (isAudioLocked()) {
            console.log('🔇 Audio locked, preventing recursion');
            return;
        }

        // Only announce for Task tool calls
        if (!isTaskToolCall()) {
            console.log('🔇 Not a Task tool call, skipping audio');
            return;
        }

        const agentName = detectAgent();
        if (!agentName) {
            console.log('🔇 No agent detected, skipping audio');
            return;
        }

        // Create lock to prevent recursion
        createAudioLock();

        const isCompletion = process.argv.includes('--completion');
        const announcement = isCompletion
            ? `${agentName} completed successfully`
            : `${agentName} is triggered`;

        // Announce with audio
        const command = `say -v Samantha -r 175 "${announcement}" &`;
        execSync(command, { stdio: 'ignore' });

        console.log(`🔊 Audio: ${announcement}`);

        // Remove lock after 1 second
        setTimeout(() => {
            removeAudioLock();
        }, 1000);

    } catch (error) {
        removeAudioLock();
        console.log(`🔇 Audio failed: ${error.message}`);
    }
}

// Only run if this is a direct call (not from hooks)
if (require.main === module && !process.env.INSIDE_HOOK) {
    safeAnnounce();
}

module.exports = { safeAnnounce };