/**
 * Image Creator Agent
 * Generates visual content using Gemini API with proper branding
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const errorHandler = require('../utils/error-handler');
const communication = require('../utils/communication');

class ImageCreator {
  constructor() {
    this.agentId = 'image-creator';
    this.apiKey = process.env.GEMINI_API_KEY;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1/';
    this.model = 'gemini-pro-vision';
    this.state = 'IDLE';
    
    // Validate API key on initialization
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required but not set');
    }
    if (!this.apiKey.startsWith('AIza')) {
      logger.warn(`[${this.agentId}] Gemini API key format may be invalid`);
    }
    
    // Rate limiting
    this.requestQueue = [];
    this.requestsPerMinute = 60;
    this.lastRequestTime = 0;
    this.requestCount = 0;
    
    // Cache configuration
    this.cacheDir = '/Users/shriyavallabh/Desktop/mvp/cache/images';
    this.cacheTTL = 86400000; // 24 hours in milliseconds
    
    // Ensure cache directory exists
    this.initializeCache();
  }

  async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      logger.error(`[${this.agentId}] Failed to create cache directory:`, error);
    }
  }

  /**
   * Process image generation request
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

      const { advisor_arn, brand_colors, logo_url, topic, platforms } = message.payload;

      logger.info(`[${this.agentId}] Starting image generation for advisor ${advisor_arn}`);

      // Generate images for each platform
      const imageUrls = {};
      
      if (platforms.whatsapp) {
        imageUrls.whatsapp = await this.generateImage(topic, 'whatsapp', brand_colors, logo_url);
      }
      
      if (platforms.linkedin) {
        imageUrls.linkedin = await this.generateImage(topic, 'linkedin', brand_colors, logo_url);
      }
      
      if (platforms.status) {
        imageUrls.status = await this.generateImage(topic, 'status', brand_colors, logo_url);
      }

      const generationTime = Date.now() - startTime;

      // Update platforms with image URLs
      const updatedPlatforms = { ...platforms };
      Object.keys(imageUrls).forEach(platform => {
        if (updatedPlatforms[platform]) {
          updatedPlatforms[platform].image_url = imageUrls[platform];
        }
      });

      // Prepare response
      const response = communication.createMessage({
        agentId: this.agentId,
        action: 'IMAGES_CREATED',
        payload: {
          advisor_arn,
          platforms: updatedPlatforms,
          image_urls: imageUrls,
          generation_time: generationTime
        },
        context: message.context
      });

      this.state = 'COMPLETED';
      logger.info(`[${this.agentId}] Image generation completed in ${generationTime}ms`);

      return response;

    } catch (error) {
      this.state = 'ERROR';
      logger.error(`[${this.agentId}] Image generation failed:`, error);
      
      return errorHandler.handleError(error, {
        agentId: this.agentId,
        action: 'IMAGE_GENERATION_FAILED',
        context: message.context
      });
    }
  }

  /**
   * Generate image with rate limiting and caching
   */
  async generateImage(topic, platform, brandColors, logoUrl) {
    // Check cache first
    const cacheKey = this.getCacheKey(topic, platform, brandColors);
    const cachedImage = await this.getCachedImage(cacheKey);
    
    if (cachedImage) {
      logger.info(`[${this.agentId}] Using cached image for ${platform}`);
      return cachedImage;
    }

    // Apply rate limiting
    await this.enforceRateLimit();

    try {
      const prompt = this.buildImagePrompt(topic, platform, brandColors);
      
      const response = await axios.post(
        `${this.endpoint}models/${this.model}:generateImage`,
        {
          prompt,
          image: {
            dimensions: '1080x1080',
            format: 'PNG'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const imageUrl = response.data.image_url || response.data.url;
      
      // Save to cache
      await this.cacheImage(cacheKey, imageUrl);
      
      // Apply branding overlay if logo URL provided
      if (logoUrl) {
        return await this.applyBranding(imageUrl, logoUrl, brandColors);
      }
      
      return imageUrl;

    } catch (error) {
      if (error.response && error.response.status === 429) {
        logger.warn(`[${this.agentId}] Rate limit hit, retrying after delay`);
        await this.delay(60000); // Wait 1 minute
        return this.generateImage(topic, platform, brandColors, logoUrl);
      }
      
      // Sanitize error to prevent API key exposure
      const sanitizedError = this.sanitizeError(error);
      logger.error(`[${this.agentId}] Image generation failed:`, sanitizedError);
      throw new Error(`Image generation failed: ${sanitizedError.message || 'Unknown error'}`);
    }
  }

  /**
   * Build platform-specific image prompt
   */
  buildImagePrompt(topic, platform, brandColors) {
    const colorString = brandColors && brandColors.length > 0 
      ? `Use these brand colors: ${brandColors.join(', ')}` 
      : 'Use professional blue and green colors';

    const platformSpecs = {
      whatsapp: 'square format (1080x1080), mobile-optimized, clear and simple design',
      linkedin: 'professional format (1080x1080), corporate style, detailed infographic',
      status: 'square format (1080x1080), eye-catching, minimal text overlay'
    };

    return `Create a financial infographic about "${topic}" for mutual fund advisors.

Specifications:
- ${platformSpecs[platform] || platformSpecs.whatsapp}
- ${colorString}
- Include relevant financial icons or charts
- Professional and trustworthy appearance
- Do NOT include any text (text will be overlaid separately)
- Modern, clean design suitable for ${platform}
- Focus on visual representation of financial concepts

Style: Professional financial marketing material`;
  }

  /**
   * Apply branding overlay to generated image
   */
  async applyBranding(imageUrl, logoUrl, brandColors) {
    // This is a placeholder for actual image manipulation
    // In production, you would use a library like Sharp or Canvas
    // to overlay the logo and apply brand colors
    
    logger.info(`[${this.agentId}] Applying branding overlay`);
    
    // For now, return the original image URL
    // TODO: Implement actual image manipulation
    return imageUrl;
  }

  /**
   * Enforce rate limiting
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 60000 / this.requestsPerMinute; // Minimum time between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      logger.info(`[${this.agentId}] Rate limiting - waiting ${waitTime}ms`);
      await this.delay(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    // Reset counter every minute
    if (this.requestCount >= this.requestsPerMinute) {
      await this.delay(60000);
      this.requestCount = 0;
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(topic, platform, brandColors) {
    const data = `${topic}-${platform}-${(brandColors || []).join('-')}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Get cached image if exists and not expired
   */
  async getCachedImage(cacheKey) {
    try {
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
      const stats = await fs.stat(cachePath);
      
      // Check if cache is expired
      if (Date.now() - stats.mtime.getTime() > this.cacheTTL) {
        return null;
      }
      
      const cacheData = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(cacheData).url;
      
    } catch (error) {
      return null; // Cache miss
    }
  }

  /**
   * Cache image URL
   */
  async cacheImage(cacheKey, imageUrl) {
    try {
      const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
      await fs.writeFile(cachePath, JSON.stringify({
        url: imageUrl,
        timestamp: Date.now()
      }));
    } catch (error) {
      logger.error(`[${this.agentId}] Failed to cache image:`, error);
    }
  }

  /**
   * Sanitize error messages to prevent API key exposure
   */
  sanitizeError(error) {
    if (!error) return { message: 'Unknown error' };
    
    // Create a safe copy of the error
    const sanitized = {
      message: error.message || 'Unknown error',
      status: error.response?.status,
      statusText: error.response?.statusText
    };
    
    // Remove any potential API key from error messages
    if (sanitized.message) {
      sanitized.message = sanitized.message.replace(/AIza[\w-]+/g, '[API_KEY_REDACTED]');
      sanitized.message = sanitized.message.replace(/(Bearer\s+)[\w-]+/gi, '$1[TOKEN_REDACTED]');
    }
    
    return sanitized;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    this.requestCount = 0;
  }
}

// Export singleton instance
module.exports = new ImageCreator();

// Also export class for testing
module.exports.ImageCreator = ImageCreator;