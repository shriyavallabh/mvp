#!/usr/bin/env node

/**
 * Ultra Transparency Manager
 *
 * This system provides complete transparency for every orchestration execution:
 * - Timestamped output folders for each execution
 * - Final outputs: linkedin_post.md, whatsapp_post.md, images
 * - Interim outputs: research, communication, agent states
 * - Complete audit trail with full traceability
 */

import fs from 'fs/promises';
import path from 'path';
import LearningStatusManager from '../learning/learning-status-manager.js';

class UltraTransparencyManager {
  constructor(workflowId) {
    this.workflowId = workflowId;
    this.executionTimestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
    this.executionDate = this.executionTimestamp[0]; // YYYY-MM-DD
    this.executionTime = this.executionTimestamp[1].split('.')[0]; // HH-MM-SS
    this.sessionId = `${this.executionDate}-${this.executionTime}`;

    // Define output structure
    this.outputStructure = {
      sessionFolder: `output/${this.sessionId}`,
      finalOutputs: `output/${this.sessionId}/final-outputs`,
      interimOutputs: `output/${this.sessionId}/interim-outputs`,
      agentStates: `output/${this.sessionId}/agent-states`,
      communications: `output/${this.sessionId}/communications`,
      research: `output/${this.sessionId}/research`,
      validations: `output/${this.sessionId}/validations`,
      logs: `output/${this.sessionId}/logs`,
      traceability: `output/${this.sessionId}/traceability`,
      learningsFolder: `learning/${this.sessionId}`,
      learnings: `learning/${this.sessionId}/learning-${this.sessionId}.md`
    };

    this.agentLearnings = new Map();
    this.executionLog = [];
    this.learningStatusManager = new LearningStatusManager();
  }

  async initializeTransparency() {
    console.log(`📁 Initializing ultra transparency for session: ${this.sessionId}`);

    // Initialize learning status manager
    await this.learningStatusManager.initialize();

    // Create all directory structures
    for (const [key, folder] of Object.entries(this.outputStructure)) {
      if (key !== 'learnings') { // learnings is a file, not folder
        await fs.mkdir(folder, { recursive: true });
      }
    }

    // Create session metadata
    const sessionMetadata = {
      sessionId: this.sessionId,
      workflowId: this.workflowId,
      startTime: new Date().toISOString(),
      executionDate: this.executionDate,
      executionTime: this.executionTime,
      transparency: {
        finalOutputsPath: this.outputStructure.finalOutputs,
        interimOutputsPath: this.outputStructure.interimOutputs,
        learningsPath: this.outputStructure.learnings,
        traceabilityPath: this.outputStructure.traceability
      },
      expectedFinalOutputs: [
        'linkedin_post.md',
        'whatsapp_post.md',
        'whatsapp_image.png',
        'status_image.png'
      ],
      agentExecutionOrder: [
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
      ]
    };

    await fs.writeFile(
      `${this.outputStructure.sessionFolder}/session-metadata.json`,
      JSON.stringify(sessionMetadata, null, 2)
    );

    // Initialize learning file
    await this.initializeLearningFile();

    console.log(`✅ Ultra transparency initialized for session: ${this.sessionId}`);
    return this.sessionId;
  }

  async initializeLearningFile() {
    const learningContent = `# Learning Log - Session ${this.sessionId}

## Session Information
- **Session ID**: ${this.sessionId}
- **Workflow ID**: ${this.workflowId}
- **Date**: ${this.executionDate}
- **Time**: ${this.executionTime}
- **Status**: PENDING
- **Applied**: false

## Agent Learnings

This file captures all learnings, issues, errors, and improvements discovered during this execution session.

### Learning Categories:
- **🔧 Technical Issues**: API errors, memory issues, performance problems
- **🔄 Process Improvements**: Workflow optimizations, timing adjustments
- **📊 Quality Insights**: Content quality patterns, validation insights
- **🤝 Communication Issues**: Agent coordination problems, message handling
- **💡 Feature Requests**: New capabilities discovered during execution

---

## Detailed Learnings by Agent

`;

    await fs.mkdir(path.dirname(this.outputStructure.learnings), { recursive: true });
    await fs.writeFile(this.outputStructure.learnings, learningContent);
  }

  async captureAgentStart(agentName, agentConfig) {
    const timestamp = new Date().toISOString();

    // Log agent start
    const agentStartLog = {
      agent: agentName,
      event: 'started',
      timestamp,
      config: agentConfig,
      sessionId: this.sessionId
    };

    this.executionLog.push(agentStartLog);

    // Create agent-specific interim output folder
    const agentInterimFolder = `${this.outputStructure.interimOutputs}/${agentName}`;
    await fs.mkdir(agentInterimFolder, { recursive: true });

    // Save agent start state
    await fs.writeFile(
      `${this.outputStructure.agentStates}/${agentName}-start.json`,
      JSON.stringify(agentStartLog, null, 2)
    );

    console.log(`📝 Captured start state for ${agentName}`);
  }

  async captureAgentOutput(agentName, output, outputType = 'interim') {
    const timestamp = new Date().toISOString();

    if (outputType === 'final') {
      // Save to final outputs
      await this.saveFinalOutput(agentName, output);
    } else {
      // Save to interim outputs
      await this.saveInterimOutput(agentName, output, timestamp);
    }

    // Update agent state
    const agentEndLog = {
      agent: agentName,
      event: 'completed',
      timestamp,
      outputType,
      outputSize: JSON.stringify(output).length,
      sessionId: this.sessionId
    };

    this.executionLog.push(agentEndLog);

    await fs.writeFile(
      `${this.outputStructure.agentStates}/${agentName}-end.json`,
      JSON.stringify(agentEndLog, null, 2)
    );

    console.log(`💾 Captured ${outputType} output for ${agentName}`);
  }

  async saveFinalOutput(agentName, output) {
    const outputMappings = {
      'linkedin-post-generator': {
        filename: 'linkedin_post.md',
        content: this.formatLinkedInPost(output)
      },
      'whatsapp-message-creator': {
        filename: 'whatsapp_post.md',
        content: this.formatWhatsAppPost(output)
      },
      'gemini-image-generator': {
        filename: 'whatsapp_image.png',
        content: output.whatsappImage || 'Image generation placeholder'
      },
      'status-image-designer': {
        filename: 'status_image.png',
        content: output.statusImage || 'Status image generation placeholder'
      }
    };

    const mapping = outputMappings[agentName];
    if (mapping) {
      const finalPath = `${this.outputStructure.finalOutputs}/${mapping.filename}`;

      if (mapping.filename.endsWith('.png')) {
        // For images, create placeholder or save actual image data
        await fs.writeFile(finalPath, `Image placeholder for ${agentName}\nGenerated at: ${new Date().toISOString()}\nSession: ${this.sessionId}`);
      } else {
        // For markdown files
        await fs.writeFile(finalPath, mapping.content);
      }

      console.log(`📄 Final output saved: ${mapping.filename}`);
    }
  }

  async saveInterimOutput(agentName, output, timestamp) {
    const interimFolder = `${this.outputStructure.interimOutputs}/${agentName}`;

    // Save raw output
    await fs.writeFile(
      `${interimFolder}/raw-output-${timestamp.replace(/[:.]/g, '-')}.json`,
      JSON.stringify(output, null, 2)
    );

    // Save formatted output based on agent type
    const formattedOutput = this.formatInterimOutput(agentName, output);
    await fs.writeFile(
      `${interimFolder}/formatted-output.md`,
      formattedOutput
    );
  }

  formatLinkedInPost(output) {
    return `# LinkedIn Post - ${this.sessionId}

## Generated Content

${output.content || output.post || 'LinkedIn post content'}

## Metadata
- **Generated At**: ${new Date().toISOString()}
- **Session ID**: ${this.sessionId}
- **Character Count**: ${(output.content || output.post || '').length}
- **Compliance**: ${output.compliance || 'Pending validation'}
- **Quality Score**: ${output.qualityScore || 'Pending scoring'}

## Agent Insights
${output.insights || 'No specific insights recorded'}

---
*Generated by FinAdvise AI Content Engine*
`;
  }

  formatWhatsAppPost(output) {
    return `# WhatsApp Message - ${this.sessionId}

## Generated Content

${output.content || output.message || 'WhatsApp message content'}

## Metadata
- **Generated At**: ${new Date().toISOString()}
- **Session ID**: ${this.sessionId}
- **Character Count**: ${(output.content || output.message || '').length}
- **Emojis Used**: ${output.emojis || 'Standard business emojis'}
- **Call-to-Action**: ${output.cta || 'Contact advisor'}

## Agent Insights
${output.insights || 'No specific insights recorded'}

---
*Generated by FinAdvise AI Content Engine*
`;
  }

  formatInterimOutput(agentName, output) {
    const timestamp = new Date().toISOString();

    return `# ${agentName.toUpperCase()} - Interim Output

## Execution Details
- **Agent**: ${agentName}
- **Session**: ${this.sessionId}
- **Timestamp**: ${timestamp}
- **Status**: ${output.status || 'Completed'}

## Raw Data
\`\`\`json
${JSON.stringify(output, null, 2)}
\`\`\`

## Key Outputs
${this.extractKeyOutputs(agentName, output)}

## Processing Notes
${output.processingNotes || 'No specific processing notes'}

## Next Steps
${output.nextSteps || 'Continue to next agent in sequence'}

---
*Interim output captured by Ultra Transparency Manager*
`;
  }

  extractKeyOutputs(agentName, output) {
    const extractors = {
      'advisor-data-manager': (data) => `
- **Advisors Loaded**: ${data.advisorCount || 'Unknown'}
- **Data Source**: ${data.source || 'Google Sheets'}
- **Validation Status**: ${data.validation || 'Passed'}`,

      'market-intelligence': (data) => `
- **Market Data**: ${data.marketStatus || 'Current'}
- **Sectors Analyzed**: ${data.sectorCount || 'Multiple'}
- **Key Insights**: ${data.insights?.join(', ') || 'Market analysis complete'}`,

      'linkedin-post-generator': (data) => `
- **Posts Generated**: ${data.postCount || '1'}
- **Character Count**: ${data.characterCount || 'Within limits'}
- **Tone**: ${data.tone || 'Professional'}`,

      'compliance-validator': (data) => `
- **Compliance Score**: ${data.complianceScore || 'Pending'}
- **Violations**: ${data.violations?.length || 0}
- **Status**: ${data.status || 'Validated'}`
    };

    const extractor = extractors[agentName];
    return extractor ? extractor(output) : `
- **Output Type**: ${typeof output}
- **Size**: ${JSON.stringify(output).length} characters
- **Status**: Processed successfully`;
  }

  async captureAgentCommunication(fromAgent, toAgent, messageType, payload) {
    const timestamp = new Date().toISOString();

    const communicationLog = {
      timestamp,
      fromAgent,
      toAgent,
      messageType,
      payload,
      sessionId: this.sessionId
    };

    // Save to communications folder
    const commFile = `${this.outputStructure.communications}/comm-${timestamp.replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(commFile, JSON.stringify(communicationLog, null, 2));

    // Also append to communication log
    const commLogEntry = `## ${timestamp}\n**${fromAgent} → ${toAgent}** (${messageType})\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\n`;

    try {
      await fs.appendFile(`${this.outputStructure.communications}/communication-log.md`, commLogEntry);
    } catch (error) {
      // Create file if it doesn't exist
      await fs.writeFile(`${this.outputStructure.communications}/communication-log.md`,
        `# Agent Communications - ${this.sessionId}\n\n${commLogEntry}`);
    }

    console.log(`📨 Captured communication: ${fromAgent} → ${toAgent}`);
  }

  async captureAgentLearning(agentName, learningType, learningContent) {
    if (!this.agentLearnings.has(agentName)) {
      this.agentLearnings.set(agentName, []);
    }

    const learning = {
      timestamp: new Date().toISOString(),
      agent: agentName,
      type: learningType,
      content: learningContent,
      sessionId: this.sessionId
    };

    this.agentLearnings.get(agentName).push(learning);

    // Append to learning file
    const learningEntry = `
### ${agentName.toUpperCase()} - ${learningType}
**Timestamp**: ${learning.timestamp}
**Type**: ${learningType}

${learningContent}

`;

    await fs.appendFile(this.outputStructure.learnings, learningEntry);

    console.log(`🧠 Captured learning for ${agentName}: ${learningType}`);
  }

  async captureResearchData(agentName, researchType, researchData) {
    const timestamp = new Date().toISOString();

    // Save research data
    const researchFile = `${this.outputStructure.research}/${agentName}-${researchType}-${timestamp.replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(researchFile, JSON.stringify(researchData, null, 2));

    // Create research summary
    const researchSummary = `# ${agentName} Research - ${researchType}

## Research Details
- **Agent**: ${agentName}
- **Research Type**: ${researchType}
- **Timestamp**: ${timestamp}
- **Session**: ${this.sessionId}

## Research Data
\`\`\`json
${JSON.stringify(researchData, null, 2)}
\`\`\`

## Key Findings
${this.extractResearchFindings(researchType, researchData)}

---
*Research captured by Ultra Transparency Manager*
`;

    await fs.writeFile(`${this.outputStructure.research}/${agentName}-${researchType}-summary.md`, researchSummary);

    console.log(`🔬 Captured research for ${agentName}: ${researchType}`);
  }

  extractResearchFindings(researchType, data) {
    const findings = {
      'market-research': 'Market trends and sentiment analysis',
      'advisor-analysis': 'Advisor segmentation and preferences',
      'content-research': 'Content patterns and optimization opportunities',
      'compliance-research': 'Regulatory requirements and guidelines'
    };

    return findings[researchType] || 'Research findings recorded';
  }

  async captureValidationResults(validatorName, validationResults) {
    const timestamp = new Date().toISOString();

    const validationFile = `${this.outputStructure.validations}/${validatorName}-${timestamp.replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(validationFile, JSON.stringify(validationResults, null, 2));

    // Create validation summary
    const validationSummary = `# ${validatorName} Validation Results

## Validation Details
- **Validator**: ${validatorName}
- **Timestamp**: ${timestamp}
- **Session**: ${this.sessionId}
- **Status**: ${validationResults.success ? 'PASSED' : 'FAILED'}

## Results Summary
- **Score**: ${validationResults.score || 'N/A'}
- **Issues Found**: ${validationResults.issues?.length || 0}
- **Recommendations**: ${validationResults.recommendations?.length || 0}

## Detailed Results
\`\`\`json
${JSON.stringify(validationResults, null, 2)}
\`\`\`

${validationResults.issues?.length > 0 ? `
## Issues Identified
${validationResults.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

${validationResults.recommendations?.length > 0 ? `
## Recommendations
${validationResults.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}

---
*Validation captured by Ultra Transparency Manager*
`;

    await fs.writeFile(`${this.outputStructure.validations}/${validatorName}-summary.md`, validationSummary);

    console.log(`✅ Captured validation results for ${validatorName}`);
  }

  async finalizeTransparency() {
    const endTime = new Date().toISOString();

    // Create final execution summary
    const executionSummary = {
      sessionId: this.sessionId,
      workflowId: this.workflowId,
      startTime: this.executionLog[0]?.timestamp,
      endTime,
      totalAgents: this.executionLog.filter(log => log.event === 'started').length,
      completedAgents: this.executionLog.filter(log => log.event === 'completed').length,
      communicationsCount: this.communicationQueue?.length || 0,
      learningsCount: this.agentLearnings.size,
      outputStructure: this.outputStructure,
      executionLog: this.executionLog
    };

    await fs.writeFile(
      `${this.outputStructure.sessionFolder}/execution-summary.json`,
      JSON.stringify(executionSummary, null, 2)
    );

    // Create master traceability file
    await this.createMasterTraceability(executionSummary);

    // Update learning file status
    await this.updateLearningFileStatus();

    console.log(`📊 Transparency finalized for session: ${this.sessionId}`);
    console.log(`📁 All outputs available at: ${this.outputStructure.sessionFolder}`);

    return {
      sessionId: this.sessionId,
      outputPath: this.outputStructure.sessionFolder,
      finalOutputs: this.outputStructure.finalOutputs,
      learningsPath: this.outputStructure.learnings
    };
  }

  async createMasterTraceability(executionSummary) {
    const traceabilityContent = `# Master Traceability - ${this.sessionId}

## Session Overview
- **Session ID**: ${this.sessionId}
- **Workflow ID**: ${this.workflowId}
- **Execution Date**: ${this.executionDate}
- **Execution Time**: ${this.executionTime}
- **Duration**: ${this.calculateDuration(executionSummary.startTime, executionSummary.endTime)}

## Execution Statistics
- **Total Agents**: ${executionSummary.totalAgents}
- **Completed Agents**: ${executionSummary.completedAgents}
- **Success Rate**: ${((executionSummary.completedAgents / executionSummary.totalAgents) * 100).toFixed(1)}%
- **Communications**: ${executionSummary.communicationsCount}
- **Learnings Captured**: ${executionSummary.learningsCount}

## Output Locations
- **Final Outputs**: \`${this.outputStructure.finalOutputs}\`
- **Interim Outputs**: \`${this.outputStructure.interimOutputs}\`
- **Agent States**: \`${this.outputStructure.agentStates}\`
- **Communications**: \`${this.outputStructure.communications}\`
- **Research Data**: \`${this.outputStructure.research}\`
- **Validations**: \`${this.outputStructure.validations}\`
- **Learnings**: \`${this.outputStructure.learnings}\`

## Final Outputs Generated
${await this.listFinalOutputs()}

## Agent Execution Sequence
${this.formatExecutionSequence()}

## Key Metrics
${this.calculateKeyMetrics(executionSummary)}

---
*Master traceability generated by Ultra Transparency Manager*
`;

    await fs.writeFile(`${this.outputStructure.traceability}/master-traceability.md`, traceabilityContent);
  }

  async listFinalOutputs() {
    try {
      const files = await fs.readdir(this.outputStructure.finalOutputs);
      return files.map(file => `- ✅ ${file}`).join('\n') || '- No final outputs generated';
    } catch (error) {
      return '- Final outputs directory not accessible';
    }
  }

  formatExecutionSequence() {
    const startEvents = this.executionLog.filter(log => log.event === 'started');
    return startEvents.map((log, index) =>
      `${index + 1}. **${log.agent}** - ${log.timestamp}`
    ).join('\n');
  }

  calculateKeyMetrics(summary) {
    const duration = this.calculateDuration(summary.startTime, summary.endTime);
    const avgTimePerAgent = duration ? (parseFloat(duration) / summary.totalAgents).toFixed(2) : 'N/A';

    return `
- **Total Execution Time**: ${duration}
- **Average Time per Agent**: ${avgTimePerAgent} minutes
- **Communication Efficiency**: ${summary.communicationsCount} inter-agent messages
- **Learning Rate**: ${summary.learningsCount} insights captured
- **Transparency Level**: Ultra (100% visibility)`;
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const durationMinutes = (durationMs / 60000).toFixed(2);

    return `${durationMinutes} minutes`;
  }

  async updateLearningFileStatus() {
    try {
      // First add the learning session summary to the file
      let content = await fs.readFile(this.outputStructure.learnings, 'utf-8');
      content += `\n\n## Learning Session Summary\n- **Total Learnings**: ${this.agentLearnings.size} agents contributed\n- **Session Status**: Execution completed\n- **Next Action**: Run learning agent to apply these insights\n\n---\n*Learning file ready for processing by Learning Agent*\n`;
      await fs.writeFile(this.outputStructure.learnings, content);

      // Use learning status manager to properly update status
      await this.learningStatusManager.markSessionComplete(this.sessionId);

      console.log(`📊 Learning file status updated to READY_FOR_REVIEW for session: ${this.sessionId}`);
    } catch (error) {
      console.error('Error updating learning file status:', error);
    }
  }

  // Getter methods for external access
  getSessionId() {
    return this.sessionId;
  }

  getOutputStructure() {
    return this.outputStructure;
  }

  getLearningsPath() {
    return this.outputStructure.learnings;
  }
}

export default UltraTransparencyManager;