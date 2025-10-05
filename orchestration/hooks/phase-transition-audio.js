#!/usr/bin/env node

/**
 * Phase Transition Audio Hook - Session Aware
 * Announces workflow phase transitions with session context
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getSessionContext() {
    try {
        const sessionPath = path.join(__dirname, '../../data/current-session.json');
        if (fs.existsSync(sessionPath)) {
            return JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        }
    } catch (error) {
        return null;
    }
    return null;
}

function updateLearnings(sessionId, fromPhase, toPhase) {
    try {
        const learningsPath = path.join(__dirname, `../../learnings/sessions/${sessionId}/realtime_learnings.json`);
        let learnings = [];

        if (fs.existsSync(learningsPath)) {
            learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
        }

        learnings.push({
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            type: "phase-transition",
            message: `Workflow transitioned from ${fromPhase} to ${toPhase}`,
            impact: "medium",
            data: { fromPhase, toPhase, audioAnnounced: true },
            capturedBy: "phase-transition-hook"
        });

        fs.writeFileSync(learningsPath, JSON.stringify(learnings, null, 2));
    } catch (error) {
        // Silent fail for learning capture
    }
}

function announcePhaseTransition(fromPhase, toPhase) {
    try {
        // Get session context
        const session = getSessionContext();

        if (!fromPhase || !toPhase) {
            console.log('Phase transition announcement requires both fromPhase and toPhase');
            return;
        }

        // Convert phase names to natural speech
        const spokenFromPhase = fromPhase
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .toLowerCase();

        const spokenToPhase = toPhase
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .toLowerCase();

        // Create announcement
        let announcement = `Moving to ${spokenToPhase} phase`;

        // Announce with Samantha voice (non-blocking)
        const command = `say -v Samantha -r 175 "${announcement}" &`;

        try {
            execSync(command, { stdio: 'ignore' });
            console.log(`🔊 Audio: ${announcement}`);

            // Update learnings if session context available
            if (session && session.sessionId) {
                updateLearnings(session.sessionId, fromPhase, toPhase);
            }
        } catch (audioError) {
            // Audio failed, continue silently
            console.log(`🔇 Audio unavailable for phase transition: ${fromPhase} -> ${toPhase}`);
        }

    } catch (error) {
        // Hook failed, continue silently
        console.log('🔇 Phase transition audio hook failed, continuing...');
    }
}

// Run if called directly with command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length >= 2) {
        announcePhaseTransition(args[0], args[1]);
    } else {
        console.log('Usage: node phase-transition-audio.js <fromPhase> <toPhase>');
    }
}

module.exports = { announcePhaseTransition };