#!/usr/bin/env node

/**
 * Bidirectional Feedback Loop Engine
 *
 * This system creates intelligent feedback loops between agents, enabling:
 * - Real-time quality validation and improvement
 * - Dynamic workflow adaptation based on results
 * - Self-healing content generation
 * - Intelligent agent coordination and learning
 * - Validation chain orchestration
 */

import fs from 'fs/promises';
import AgentCommunicationBus from '../communication/agent-communication-bus.js';
import AudioController from '../audio/audio-controller.js';

class FeedbackLoopEngine {
  constructor() {
    this.communicationBus = new AgentCommunicationBus();
    this.audioController = new AudioController();

    // Validation chain definitions
    this.validationChains = {
      'content-generation': {
        agents: ['linkedin-post-generator', 'whatsapp-message-creator'],
        validators: ['compliance-validator', 'quality-scorer', 'fatigue-checker'],
        feedbackFlow: 'immediate',
        maxIterations: 3,
        qualityThreshold: 0.8,
        complianceThreshold: 1.0
      },

      'market-analysis': {
        agents: ['market-intelligence', 'segment-analyzer'],
        validators: ['data-quality-validator'],
        feedbackFlow: 'batch',
        maxIterations: 2,
        qualityThreshold: 0.9
      },

      'image-generation': {
        agents: ['status-image-designer', 'gemini-image-generator'],
        validators: ['brand-compliance-validator', 'visual-quality-scorer'],
        feedbackFlow: 'immediate',
        maxIterations: 2,
        qualityThreshold: 0.75
      },

      'distribution-preparation': {
        agents: ['brand-customizer', 'distribution-controller'],
        validators: ['final-quality-check', 'distribution-readiness-validator'],
        feedbackFlow: 'gate',
        maxIterations: 1,
        qualityThreshold: 0.95
      }
    };

    // Feedback loop patterns
    this.feedbackPatterns = {
      'quality-improvement': {
        trigger: 'quality-score-below-threshold',
        actions: ['send-improvement-suggestions', 'request-regeneration'],
        priority: 'high',
        maxAttempts: 3
      },

      'compliance-correction': {
        trigger: 'compliance-violation',
        actions: ['send-compliance-feedback', 'block-distribution', 'request-regeneration'],
        priority: 'critical',
        maxAttempts: 2
      },

      'content-fatigue': {
        trigger: 'repetitive-content-detected',
        actions: ['diversify-content-parameters', 'request-alternative-approach'],
        priority: 'medium',
        maxAttempts: 2
      },

      'dependency-coordination': {
        trigger: 'dependency-not-ready',
        actions: ['coordinate-with-dependency', 'adjust-execution-order'],
        priority: 'high',
        maxAttempts: 5
      },

      'performance-optimization': {
        trigger: 'execution-time-exceeded',
        actions: ['optimize-agent-parameters', 'parallel-execution-suggestion'],
        priority: 'low',
        maxAttempts: 1
      }
    };

    // Active feedback loops
    this.activeFeedbackLoops = new Map();
    this.feedbackHistory = [];
    this.validationResults = new Map();

    this.initialize();
  }

  async initialize() {
    await this.communicationBus.initializeCommunicationBus();
    await this.audioController.loadAudioConfig();

    // Create necessary directories
    await fs.mkdir('data/feedback-loops', { recursive: true });
    await fs.mkdir('data/validation-chains', { recursive: true });
    await fs.mkdir('logs/feedback', { recursive: true });

    console.log('🔄 Feedback Loop Engine initialized');
  }

  async processValidationChain(chainName, triggeringAgent, context = {}) {
    try {
      console.log(`🔗 Starting validation chain: ${chainName} (triggered by ${triggeringAgent})`);

      const chain = this.validationChains[chainName];
      if (!chain) {
        throw new Error(`Unknown validation chain: ${chainName}`);
      }

      // Create validation session
      const sessionId = this.generateSessionId();
      const validationSession = {
        sessionId,
        chainName,
        triggeringAgent,
        agents: chain.agents,
        validators: chain.validators,
        startTime: Date.now(),
        status: 'running',
        currentIteration: 1,
        maxIterations: chain.maxIterations,
        results: [],
        feedbackLoops: [],
        context
      };

      this.activeFeedbackLoops.set(sessionId, validationSession);

      // Execute validation chain
      const chainResult = await this.executeValidationChain(validationSession);

      // Audio feedback for chain completion
      await this.audioController.playSystemAudio('validation-chain-completed', {
        chainName,
        success: chainResult.success,
        iterations: chainResult.iterations
      });

      return chainResult;

    } catch (error) {
      console.error(`Error processing validation chain ${chainName}:`, error);
      await this.audioController.playSystemAudio('validation-chain-failed', {
        chainName,
        error: error.message
      });

      throw error;
    }
  }

  async executeValidationChain(session) {
    try {
      let chainSuccess = false;
      let iterations = 0;

      while (!chainSuccess && iterations < session.maxIterations) {
        iterations++;
        session.currentIteration = iterations;

        console.log(`📋 Validation chain iteration ${iterations}/${session.maxIterations}`);

        // Validate content with all validators
        const validationResults = await this.runValidators(session);

        // Process validation results
        const iterationResult = await this.processValidationResults(
          session,
          validationResults
        );

        if (iterationResult.success) {
          chainSuccess = true;
          session.status = 'completed';
        } else {
          // Trigger feedback loops for failed validation
          await this.triggerFeedbackLoops(session, iterationResult.issues);

          if (iterations < session.maxIterations) {
            console.log(`🔄 Triggering feedback loops for iteration ${iterations + 1}`);
            await this.audioController.playSystemAudio('feedback-loop-triggered', {
              iteration: iterations + 1,
              issues: iterationResult.issues.length
            });
          }
        }

        // Save iteration results
        session.results.push({
          iteration: iterations,
          validationResults,
          success: iterationResult.success,
          issues: iterationResult.issues,
          timestamp: Date.now()
        });

        await this.saveValidationSession(session);
      }

      // Final result
      const finalResult = {
        success: chainSuccess,
        iterations,
        sessionId: session.sessionId,
        totalIssues: this.countTotalIssues(session.results),
        finalQualityScore: this.calculateFinalQualityScore(session.results),
        executionTime: Date.now() - session.startTime
      };

      if (!chainSuccess) {
        session.status = 'failed';
        console.log(`❌ Validation chain failed after ${iterations} iterations`);
      } else {
        console.log(`✅ Validation chain completed successfully in ${iterations} iterations`);
      }

      await this.archiveValidationSession(session);

      return finalResult;

    } catch (error) {
      session.status = 'error';
      session.error = error.message;
      await this.saveValidationSession(session);
      throw error;
    }
  }

  async runValidators(session) {
    const validationResults = {};

    for (const validator of session.validators) {
      try {
        console.log(`🔍 Running validator: ${validator}`);

        const validatorResult = await this.executeValidator(validator, session);
        validationResults[validator] = validatorResult;

        // Audio feedback for individual validator
        await this.audioController.playAgentAudio(validator, 'validation-completed', null, {
          success: validatorResult.success,
          score: validatorResult.score
        });

      } catch (error) {
        console.error(`❌ Validator ${validator} failed:`, error);
        validationResults[validator] = {
          success: false,
          error: error.message,
          timestamp: Date.now()
        };

        await this.audioController.playAgentAudio(validator, 'validation-failed', error.message);
      }
    }

    return validationResults;
  }

  async executeValidator(validatorName, session) {
    // This simulates validator execution
    // In real implementation, this would trigger actual validator agents

    const validatorConfigs = {
      'compliance-validator': {
        checkFiles: ['data/linkedin-posts.json', 'data/whatsapp-messages.json'],
        thresholds: { compliance: 1.0 },
        executionTime: 2000
      },

      'quality-scorer': {
        checkFiles: ['data/linkedin-posts.json', 'data/whatsapp-messages.json'],
        thresholds: { quality: 0.8 },
        executionTime: 3000
      },

      'fatigue-checker': {
        checkFiles: ['data/linkedin-posts.json', 'data/whatsapp-messages.json'],
        thresholds: { uniqueness: 0.9 },
        executionTime: 1500
      },

      'brand-compliance-validator': {
        checkFiles: ['data/branded-content.json'],
        thresholds: { brandCompliance: 0.95 },
        executionTime: 1000
      },

      'visual-quality-scorer': {
        checkFiles: ['output/images'],
        thresholds: { visualQuality: 0.75 },
        executionTime: 2500
      }
    };

    const config = validatorConfigs[validatorName];
    if (!config) {
      throw new Error(`Unknown validator: ${validatorName}`);
    }

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, config.executionTime));

    // Check if required files exist
    for (const file of config.checkFiles) {
      try {
        await fs.access(file);
      } catch (error) {
        return {
          success: false,
          error: `Required file not found: ${file}`,
          score: 0,
          timestamp: Date.now()
        };
      }
    }

    // Simulate validation logic
    const baseScore = 0.7 + (Math.random() * 0.3); // Random score between 0.7-1.0
    const issues = [];

    // Determine success based on thresholds
    const success = Object.values(config.thresholds).every(threshold => baseScore >= threshold);

    if (!success) {
      issues.push(`Score ${baseScore.toFixed(2)} below threshold`);
    }

    return {
      success,
      score: baseScore,
      issues,
      thresholds: config.thresholds,
      timestamp: Date.now(),
      validatorName
    };
  }

  async processValidationResults(session, validationResults) {
    const chain = this.validationChains[session.chainName];
    const allIssues = [];
    let overallSuccess = true;

    // Analyze each validator result
    for (const [validator, result] of Object.entries(validationResults)) {
      if (!result.success) {
        overallSuccess = false;
        allIssues.push({
          validator,
          issues: result.issues || [result.error],
          score: result.score,
          severity: this.determineIssueSeverity(validator, result)
        });
      }
    }

    // Check chain-specific thresholds
    if (chain.qualityThreshold) {
      const avgQualityScore = this.calculateAverageQualityScore(validationResults);
      if (avgQualityScore < chain.qualityThreshold) {
        overallSuccess = false;
        allIssues.push({
          validator: 'chain-quality-check',
          issues: [`Average quality score ${avgQualityScore.toFixed(2)} below threshold ${chain.qualityThreshold}`],
          score: avgQualityScore,
          severity: 'high'
        });
      }
    }

    if (chain.complianceThreshold) {
      const complianceScore = this.getComplianceScore(validationResults);
      if (complianceScore < chain.complianceThreshold) {
        overallSuccess = false;
        allIssues.push({
          validator: 'chain-compliance-check',
          issues: [`Compliance score ${complianceScore.toFixed(2)} below threshold ${chain.complianceThreshold}`],
          score: complianceScore,
          severity: 'critical'
        });
      }
    }

    return {
      success: overallSuccess,
      issues: allIssues,
      averageScore: this.calculateAverageQualityScore(validationResults),
      timestamp: Date.now()
    };
  }

  async triggerFeedbackLoops(session, issues) {
    for (const issue of issues) {
      const feedbackPattern = this.determineFeedbackPattern(issue);

      if (feedbackPattern) {
        await this.executeFeedbackLoop(session, issue, feedbackPattern);
      }
    }
  }

  determineFeedbackPattern(issue) {
    // Map issues to feedback patterns
    if (issue.validator === 'compliance-validator' || issue.severity === 'critical') {
      return this.feedbackPatterns['compliance-correction'];
    }

    if (issue.validator === 'quality-scorer' || issue.severity === 'high') {
      return this.feedbackPatterns['quality-improvement'];
    }

    if (issue.validator === 'fatigue-checker') {
      return this.feedbackPatterns['content-fatigue'];
    }

    return this.feedbackPatterns['quality-improvement']; // Default
  }

  async executeFeedbackLoop(session, issue, pattern) {
    try {
      console.log(`🔄 Executing feedback loop: ${pattern.trigger}`);

      const feedbackLoopId = this.generateFeedbackLoopId();
      const feedbackLoop = {
        id: feedbackLoopId,
        sessionId: session.sessionId,
        issue,
        pattern,
        startTime: Date.now(),
        status: 'running',
        attempts: 0,
        actions: []
      };

      session.feedbackLoops.push(feedbackLoop);

      // Execute feedback actions
      for (const action of pattern.actions) {
        if (feedbackLoop.attempts >= pattern.maxAttempts) {
          console.log(`⚠️ Max attempts reached for feedback loop ${feedbackLoopId}`);
          break;
        }

        await this.executeFeedbackAction(action, feedbackLoop, session);
        feedbackLoop.attempts++;
      }

      feedbackLoop.status = 'completed';
      feedbackLoop.endTime = Date.now();

      // Log feedback loop
      await this.logFeedbackLoop(feedbackLoop);

      return feedbackLoop;

    } catch (error) {
      console.error('Error executing feedback loop:', error);
      throw error;
    }
  }

  async executeFeedbackAction(actionName, feedbackLoop, session) {
    console.log(`🎯 Executing feedback action: ${actionName}`);

    switch (actionName) {
      case 'send-improvement-suggestions':
        await this.sendImprovementSuggestions(feedbackLoop, session);
        break;

      case 'request-regeneration':
        await this.requestContentRegeneration(feedbackLoop, session);
        break;

      case 'send-compliance-feedback':
        await this.sendComplianceFeedback(feedbackLoop, session);
        break;

      case 'block-distribution':
        await this.blockDistribution(feedbackLoop, session);
        break;

      case 'diversify-content-parameters':
        await this.diversifyContentParameters(feedbackLoop, session);
        break;

      case 'coordinate-with-dependency':
        await this.coordinateWithDependency(feedbackLoop, session);
        break;

      default:
        console.log(`⚠️ Unknown feedback action: ${actionName}`);
    }

    feedbackLoop.actions.push({
      action: actionName,
      timestamp: Date.now(),
      success: true
    });
  }

  async sendImprovementSuggestions(feedbackLoop, session) {
    const issue = feedbackLoop.issue;

    for (const agent of session.agents) {
      await this.communicationBus.sendMessage(
        issue.validator,
        agent,
        'improvement-suggestion',
        {
          qualityScore: issue.score,
          suggestions: [
            'Enhance content clarity and engagement',
            'Add more specific market insights',
            'Improve call-to-action effectiveness'
          ],
          improvementAreas: issue.issues,
          feedbackLoopId: feedbackLoop.id
        },
        { priority: 'high' }
      );
    }
  }

  async requestContentRegeneration(feedbackLoop, session) {
    const issue = feedbackLoop.issue;

    for (const agent of session.agents) {
      await this.communicationBus.sendMessage(
        issue.validator,
        agent,
        'regeneration-request',
        {
          reason: issue.issues.join(', '),
          suggestions: [
            'Revise content approach',
            'Ensure compliance requirements',
            'Improve quality metrics'
          ],
          severity: issue.severity,
          feedbackLoopId: feedbackLoop.id
        },
        { priority: 'critical' }
      );
    }
  }

  async sendComplianceFeedback(feedbackLoop, session) {
    const issue = feedbackLoop.issue;

    for (const agent of session.agents) {
      await this.communicationBus.sendMessage(
        'compliance-validator',
        agent,
        'validation-feedback',
        {
          validationResult: 'failed',
          violations: issue.issues,
          severity: 'critical',
          requiresImmediate: true,
          feedbackLoopId: feedbackLoop.id
        },
        { priority: 'critical' }
      );
    }
  }

  async blockDistribution(feedbackLoop, session) {
    await this.communicationBus.sendMessage(
      'compliance-validator',
      'distribution-controller',
      'workflow-signal',
      {
        signal: 'block',
        reason: 'compliance-violation',
        sessionId: session.sessionId,
        feedbackLoopId: feedbackLoop.id
      },
      { priority: 'critical' }
    );
  }

  // Utility methods

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFeedbackLoopId() {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  determineIssueSeverity(validator, result) {
    if (validator === 'compliance-validator') return 'critical';
    if (result.score < 0.5) return 'high';
    if (result.score < 0.7) return 'medium';
    return 'low';
  }

  calculateAverageQualityScore(validationResults) {
    const scores = Object.values(validationResults)
      .map(r => r.score || 0)
      .filter(s => s > 0);

    return scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
  }

  getComplianceScore(validationResults) {
    const complianceResult = validationResults['compliance-validator'];
    return complianceResult ? (complianceResult.score || 0) : 0;
  }

  countTotalIssues(results) {
    return results.reduce((total, result) => total + result.issues.length, 0);
  }

  calculateFinalQualityScore(results) {
    if (results.length === 0) return 0;

    const latestResult = results[results.length - 1];
    return latestResult.averageScore || 0;
  }

  async saveValidationSession(session) {
    try {
      await fs.writeFile(
        `data/validation-chains/${session.sessionId}.json`,
        JSON.stringify(session, null, 2)
      );
    } catch (error) {
      console.error('Error saving validation session:', error);
    }
  }

  async archiveValidationSession(session) {
    try {
      await fs.mkdir('data/archived-validation-sessions', { recursive: true });

      await fs.rename(
        `data/validation-chains/${session.sessionId}.json`,
        `data/archived-validation-sessions/${session.sessionId}.json`
      );

      this.activeFeedbackLoops.delete(session.sessionId);

    } catch (error) {
      console.error('Error archiving validation session:', error);
    }
  }

  async logFeedbackLoop(feedbackLoop) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        feedbackLoopId: feedbackLoop.id,
        sessionId: feedbackLoop.sessionId,
        pattern: feedbackLoop.pattern.trigger,
        attempts: feedbackLoop.attempts,
        duration: feedbackLoop.endTime - feedbackLoop.startTime,
        actions: feedbackLoop.actions
      };

      await fs.appendFile(
        'logs/feedback/feedback-loops.log',
        JSON.stringify(logEntry) + '\n'
      );

    } catch (error) {
      console.error('Error logging feedback loop:', error);
    }
  }

  // Public API methods

  async startContentValidationChain(triggeringAgent, context = {}) {
    return await this.processValidationChain('content-generation', triggeringAgent, context);
  }

  async startMarketAnalysisValidationChain(triggeringAgent, context = {}) {
    return await this.processValidationChain('market-analysis', triggeringAgent, context);
  }

  async startImageValidationChain(triggeringAgent, context = {}) {
    return await this.processValidationChain('image-generation', triggeringAgent, context);
  }

  async getActiveFeedbackLoops() {
    return Array.from(this.activeFeedbackLoops.values());
  }

  async getFeedbackLoopStats() {
    return {
      activeLoops: this.activeFeedbackLoops.size,
      totalLoopsExecuted: this.feedbackHistory.length,
      averageExecutionTime: this.calculateAverageExecutionTime(),
      successRate: this.calculateSuccessRate()
    };
  }
}

// Export for use as module
export default FeedbackLoopEngine;

// CLI interface
async function main() {
  const engine = new FeedbackLoopEngine();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'validate':
      const [chainName, agent] = args.slice(1);
      const result = await engine.processValidationChain(chainName, agent);
      console.log(JSON.stringify(result, null, 2));
      break;

    case 'status':
      const loops = await engine.getActiveFeedbackLoops();
      console.log(`Active feedback loops: ${loops.length}`);
      loops.forEach(loop => {
        console.log(`  ${loop.id}: ${loop.status} (${loop.attempts} attempts)`);
      });
      break;

    case 'stats':
      const stats = await engine.getFeedbackLoopStats();
      console.log(JSON.stringify(stats, null, 2));
      break;

    default:
      console.log('Usage:');
      console.log('  node feedback-loop-engine.js validate <chain-name> <triggering-agent>');
      console.log('  node feedback-loop-engine.js status');
      console.log('  node feedback-loop-engine.js stats');
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}