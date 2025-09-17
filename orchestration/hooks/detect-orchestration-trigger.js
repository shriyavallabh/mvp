#!/usr/bin/env node

/**
 * Detect Orchestration Trigger Hook
 *
 * This hook analyzes user prompts to detect when hybrid orchestration should be triggered.
 * It looks for keywords, patterns, and contexts that indicate multi-agent execution is needed.
 */

import fs from 'fs/promises';
import path from 'path';

class OrchestrationTriggerDetector {
  constructor() {
    this.triggerPatterns = [
      // Direct orchestration commands
      /\/orchestrate/i,
      /\/master/i,
      /orchestrate.*agents?/i,
      /run.*all.*agents?/i,
      /execute.*pipeline/i,
      /hybrid.*orchestration/i,

      // Content generation triggers
      /generate.*content.*for.*advisors?/i,
      /create.*linkedin.*posts?/i,
      /create.*whatsapp.*messages?/i,
      /generate.*images?.*for.*advisors?/i,
      /content.*generation.*workflow/i,

      // Multi-agent workflow indicators
      /run.*full.*workflow/i,
      /complete.*finadvise.*pipeline/i,
      /execute.*all.*finadvise.*agents?/i,
      /market.*intelligence.*and.*content/i,

      // MCP tool triggers
      /mcp.*finadvise.*orchestrator/i,
      /orchestrate.*agents?/i,
      /agent.*communication/i,
      /monitor.*agents?/i
    ];

    this.contextPatterns = [
      // Business context
      /advisor.*content/i,
      /mutual.*fund.*advisor/i,
      /finadvise/i,
      /sebi.*compliance/i,
      /market.*analysis.*content/i,

      // Multi-step processes
      /data.*collection.*and.*analysis/i,
      /content.*validation.*and.*distribution/i,
      /end.*to.*end.*workflow/i,
      /complete.*automation/i
    ];
  }

  async detectTrigger() {
    try {
      // Get the latest user prompt from environment or stdin
      const userPrompt = process.env.CLAUDE_USER_PROMPT ||
                         process.env.USER_INPUT ||
                         await this.getLastUserPrompt();

      if (!userPrompt) {
        console.log('No user prompt detected');
        return;
      }

      const triggerDetected = this.analyzePrompt(userPrompt);

      if (triggerDetected) {
        await this.initializeOrchestration(userPrompt, triggerDetected);
      }

    } catch (error) {
      console.error('Error in orchestration trigger detection:', error);
    }
  }

  analyzePrompt(prompt) {
    const analysis = {
      isOrchestrationTrigger: false,
      confidence: 0,
      triggerType: null,
      matchedPatterns: [],
      suggestedWorkflow: null
    };

    // Check direct orchestration patterns
    for (const pattern of this.triggerPatterns) {
      if (pattern.test(prompt)) {
        analysis.isOrchestrationTrigger = true;
        analysis.confidence += 0.3;
        analysis.matchedPatterns.push(pattern.source);

        if (pattern.source.includes('orchestrate')) {
          analysis.triggerType = 'direct-orchestration';
        } else if (pattern.source.includes('content')) {
          analysis.triggerType = 'content-generation';
        }
      }
    }

    // Check context patterns
    for (const pattern of this.contextPatterns) {
      if (pattern.test(prompt)) {
        analysis.confidence += 0.1;
        analysis.matchedPatterns.push(pattern.source);
      }
    }

    // Determine suggested workflow
    if (analysis.isOrchestrationTrigger) {
      if (/linkedin.*post/i.test(prompt) || /whatsapp.*message/i.test(prompt)) {
        analysis.suggestedWorkflow = 'content-generation';
      } else if (/market.*analysis/i.test(prompt) || /intelligence/i.test(prompt)) {
        analysis.suggestedWorkflow = 'market-analysis';
      } else if (/validation/i.test(prompt) || /compliance/i.test(prompt)) {
        analysis.suggestedWorkflow = 'validation-only';
      } else {
        analysis.suggestedWorkflow = 'full-pipeline';
      }
    }

    // Normalize confidence
    analysis.confidence = Math.min(analysis.confidence, 1.0);

    return analysis.isOrchestrationTrigger ? analysis : null;
  }

  async initializeOrchestration(userPrompt, triggerAnalysis) {
    const timestamp = new Date().toISOString();
    const workflowId = `workflow_${Date.now()}`;

    const orchestrationConfig = {
      workflowId,
      timestamp,
      userPrompt,
      triggerAnalysis,
      status: 'initialized',
      mode: 'intelligent',
      audioFeedback: true,
      workflow: triggerAnalysis.suggestedWorkflow || 'content-generation'
    };

    // Save orchestration trigger state
    await fs.writeFile(
      `data/orchestration-state/trigger-${workflowId}.json`,
      JSON.stringify(orchestrationConfig, null, 2)
    );

    // Create workflow control file that other hooks can monitor
    await fs.writeFile(
      'data/orchestration-state/active-workflow.json',
      JSON.stringify(orchestrationConfig, null, 2)
    );

    // Log the trigger detection
    const logEntry = `${timestamp} - Orchestration trigger detected\n` +
                     `  Confidence: ${triggerAnalysis.confidence}\n` +
                     `  Type: ${triggerAnalysis.triggerType}\n` +
                     `  Workflow: ${triggerAnalysis.suggestedWorkflow}\n` +
                     `  Patterns: ${triggerAnalysis.matchedPatterns.join(', ')}\n`;

    await fs.appendFile('logs/orchestration/trigger-detection.log', logEntry);

    // Trigger audio feedback if enabled
    if (orchestrationConfig.audioFeedback) {
      try {
        const audioMessage = `Orchestration trigger detected. Initializing ${triggerAnalysis.suggestedWorkflow} workflow.`;
        await this.playAudioFeedback('system', 'trigger-detected', audioMessage);
      } catch (audioError) {
        console.log(`🔊 AUDIO: Orchestration trigger detected. Initializing ${triggerAnalysis.suggestedWorkflow} workflow.`);
      }
    }

    console.log(`✅ Orchestration trigger detected and initialized: ${workflowId}`);
    console.log(`   Workflow: ${triggerAnalysis.suggestedWorkflow}`);
    console.log(`   Confidence: ${(triggerAnalysis.confidence * 100).toFixed(1)}%`);
  }

  async getLastUserPrompt() {
    try {
      // Try to read from Claude Code's prompt history or logs
      const possibleSources = [
        'logs/user-prompts.log',
        '.claude/last-prompt.txt',
        'data/user-input.txt'
      ];

      for (const source of possibleSources) {
        try {
          const content = await fs.readFile(source, 'utf-8');
          if (content.trim()) {
            return content.trim().split('\n').pop(); // Get last line
          }
        } catch (err) {
          // File doesn't exist, try next source
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading user prompt:', error);
      return null;
    }
  }

  async playAudioFeedback(agent, event, message) {
    try {
      const { execSync } = await import('child_process');
      execSync(`say "${message}"`, { timeout: 5000 });
    } catch (error) {
      console.log(`🔊 AUDIO: ${message}`);
    }
  }
}

// Main execution
async function main() {
  const detector = new OrchestrationTriggerDetector();
  await detector.detectTrigger();
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default OrchestrationTriggerDetector;