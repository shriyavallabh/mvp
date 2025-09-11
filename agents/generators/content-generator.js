/**
 * Content Generator Agent
 * Generates high-quality financial content using Claude CLI
 */

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const path = require('path');
const logger = require('../utils/logger');
const errorHandler = require('../utils/error-handler');
const communication = require('../utils/communication');

class ContentGenerator {
  constructor() {
    this.agentId = 'content-generator';
    this.sessionToken = process.env.CLAUDE_SESSION_TOKEN;
    this.timeout = 30000; // 30 seconds per generation
    this.state = 'IDLE';
  }

  /**
   * Process content generation request
   */
  async processRequest(message) {
    this.state = 'PROCESSING';
    const startTime = Date.now();

    try {
      // Validate message format
      const validationResult = communication.validateMessage(message);
      if (!validationResult.valid) {
        throw new Error(`Invalid message format: ${validationResult.error}`);
      }

      const { advisor_arn, client_segment, content_focus, tone, brand_colors, logo_url, topic } = message.payload;

      logger.info(`[${this.agentId}] Starting content generation for advisor ${advisor_arn}`);

      // Generate content for each platform
      const platforms = {
        whatsapp: await this.generateWhatsAppContent(advisor_arn, topic, client_segment, content_focus, tone),
        linkedin: await this.generateLinkedInContent(advisor_arn, topic, client_segment, content_focus, tone),
        status: await this.generateStatusContent(advisor_arn, topic, client_segment, content_focus, tone)
      };

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(platforms);

      const generationTime = Date.now() - startTime;

      // Prepare response
      const response = communication.createMessage({
        agentId: this.agentId,
        action: 'CONTENT_GENERATED',
        payload: {
          advisor_arn,
          topic,
          platforms,
          metadata: {
            quality_score: qualityScore,
            generation_time: generationTime
          }
        },
        context: message.context
      });

      this.state = 'COMPLETED';
      logger.info(`[${this.agentId}] Content generation completed in ${generationTime}ms`);

      return response;

    } catch (error) {
      this.state = 'ERROR';
      logger.error(`[${this.agentId}] Content generation failed:`, error);
      
      return errorHandler.handleError(error, {
        agentId: this.agentId,
        action: 'CONTENT_GENERATION_FAILED',
        context: message.context
      });
    }
  }

  /**
   * Generate WhatsApp content using Claude CLI
   */
  async generateWhatsAppContent(advisorArn, topic, clientSegment, contentFocus, tone) {
    const prompt = this.buildWhatsAppPrompt(topic, clientSegment, contentFocus, tone);
    
    try {
      // Use execFile with argument array to prevent command injection
      const { stdout } = await execFileAsync('claude', ['--prompt', prompt], { 
        timeout: this.timeout,
        env: { ...process.env, CLAUDE_SESSION_TOKEN: this.sessionToken }
      });

      return {
        text: stdout.trim(),
        image_url: '' // Will be filled by image-creator agent
      };
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Claude CLI timeout - generation took too long');
      }
      throw error;
    }
  }

  /**
   * Generate LinkedIn content using Claude CLI
   */
  async generateLinkedInContent(advisorArn, topic, clientSegment, contentFocus, tone) {
    const prompt = this.buildLinkedInPrompt(topic, clientSegment, contentFocus, tone);
    
    try {
      // Use execFile with argument array to prevent command injection
      const { stdout } = await execFileAsync('claude', ['--prompt', prompt], { 
        timeout: this.timeout,
        env: { ...process.env, CLAUDE_SESSION_TOKEN: this.sessionToken }
      });

      return {
        post: stdout.trim(),
        image_url: '' // Will be filled by image-creator agent
      };
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Claude CLI timeout - generation took too long');
      }
      throw error;
    }
  }

  /**
   * Generate Status content (brief version for WhatsApp status)
   */
  async generateStatusContent(advisorArn, topic, clientSegment, contentFocus, tone) {
    const prompt = this.buildStatusPrompt(topic, clientSegment, contentFocus, tone);
    
    try {
      // Use execFile with argument array to prevent command injection
      const { stdout } = await execFileAsync('claude', ['--prompt', prompt], { 
        timeout: this.timeout,
        env: { ...process.env, CLAUDE_SESSION_TOKEN: this.sessionToken }
      });

      return {
        text: stdout.trim(),
        image_url: '' // Will be filled by image-creator agent
      };
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Claude CLI timeout - generation took too long');
      }
      throw error;
    }
  }

  /**
   * Build WhatsApp-specific prompt
   */
  buildWhatsAppPrompt(topic, clientSegment, contentFocus, tone) {
    const segmentDescriptions = {
      young: 'young professionals (25-35 years)',
      middle: 'middle-aged investors (35-50 years)',
      senior: 'senior citizens (50+ years)',
      mixed: 'diverse age groups'
    };

    const focusDescriptions = {
      growth: 'growth and wealth creation',
      safety: 'capital preservation and safety',
      tax: 'tax saving and planning',
      balanced: 'balanced portfolio approach'
    };

    const toneDescriptions = {
      professional: 'professional and formal',
      friendly: 'friendly and conversational',
      educational: 'educational and informative'
    };

    return `Generate a WhatsApp message about "${topic}" for mutual fund advisors to share with their clients.

Target Audience: ${segmentDescriptions[clientSegment] || 'general investors'}
Investment Focus: ${focusDescriptions[contentFocus] || 'general investing'}
Tone: ${toneDescriptions[tone] || 'professional'}

Requirements:
- Keep it concise (150-200 words)
- Include relevant financial advice
- Add a clear call-to-action
- Use simple language avoiding jargon
- Include appropriate emojis for WhatsApp
- Must include disclaimer: "Mutual Fund investments are subject to market risks. Read all scheme related documents carefully."
- Do NOT include any guaranteed returns or misleading claims

Generate only the message content, no additional commentary.`;
  }

  /**
   * Build LinkedIn-specific prompt
   */
  buildLinkedInPrompt(topic, clientSegment, contentFocus, tone) {
    const segmentDescriptions = {
      young: 'young professionals (25-35 years)',
      middle: 'middle-aged investors (35-50 years)',
      senior: 'senior citizens (50+ years)',
      mixed: 'diverse age groups'
    };

    const focusDescriptions = {
      growth: 'growth and wealth creation',
      safety: 'capital preservation and safety',
      tax: 'tax saving and planning',
      balanced: 'balanced portfolio approach'
    };

    const toneDescriptions = {
      professional: 'professional and formal',
      friendly: 'friendly and conversational',
      educational: 'educational and informative'
    };

    return `Generate a LinkedIn post about "${topic}" for a mutual fund advisor.

Target Audience: ${segmentDescriptions[clientSegment] || 'general investors'}
Investment Focus: ${focusDescriptions[contentFocus] || 'general investing'}
Tone: ${toneDescriptions[tone] || 'professional'}

Requirements:
- Professional tone suitable for LinkedIn
- 200-300 words
- Include relevant hashtags (5-7)
- Add industry insights or statistics
- Include a thought-provoking question to encourage engagement
- Must include disclaimer: "Mutual Fund investments are subject to market risks. Read all scheme related documents carefully."
- Do NOT include any guaranteed returns or misleading claims

Generate only the post content, no additional commentary.`;
  }

  /**
   * Build Status-specific prompt (WhatsApp Status)
   */
  buildStatusPrompt(topic, clientSegment, contentFocus, tone) {
    return `Generate a very brief WhatsApp Status message about "${topic}" for mutual fund advisors.

Requirements:
- Maximum 50 words
- Catchy and memorable
- Include 1-2 relevant emojis
- Focus on key message only
- Must be compliant with SEBI guidelines

Generate only the status text, no additional commentary.`;
  }

  /**
   * Calculate quality score based on content characteristics
   */
  calculateQualityScore(platforms) {
    let score = 0;
    let factors = 0;

    // Check WhatsApp content
    if (platforms.whatsapp && platforms.whatsapp.text) {
      const text = platforms.whatsapp.text;
      if (text.length >= 100 && text.length <= 300) score += 0.2;
      if (text.includes('disclaimer') || text.includes('market risk')) score += 0.2;
      if (text.includes('📈') || text.includes('💰') || text.includes('📊')) score += 0.1;
      factors += 0.5;
    }

    // Check LinkedIn content
    if (platforms.linkedin && platforms.linkedin.post) {
      const post = platforms.linkedin.post;
      if (post.length >= 150 && post.length <= 400) score += 0.2;
      if (post.includes('#')) score += 0.1;
      if (post.includes('?')) score += 0.1; // Has question for engagement
      factors += 0.4;
    }

    // Check Status content
    if (platforms.status && platforms.status.text) {
      const text = platforms.status.text;
      if (text.length <= 100) score += 0.1;
      factors += 0.1;
    }

    // Normalize score
    return Math.min(1, score / factors);
  }

  /**
   * Get agent state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = 'IDLE';
  }
}

// Export singleton instance
module.exports = new ContentGenerator();

// Also export class for testing
module.exports.ContentGenerator = ContentGenerator;