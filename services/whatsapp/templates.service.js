/**
 * WhatsApp Template Management Service
 * Handles template operations and registry
 */

const axios = require('axios');
const config = require('../../config/whatsapp.config');
const logger = require('../logger');

class TemplateService {
    constructor() {
        this.baseUrl = config.api.baseUrl;
        this.wabaId = config.waba.id;
        this.accessToken = config.waba.accessToken;
        this.templateCache = new Map();
    }

    /**
     * Fetch all templates for the WABA
     */
    async fetchTemplates() {
        try {
            const url = `${this.baseUrl}/${this.wabaId}/message_templates`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${this.accessToken}` },
                params: { limit: 100 }
            });

            const templates = response.data.data || [];
            
            // Cache templates by name
            templates.forEach(template => {
                this.templateCache.set(template.name, template);
            });

            logger.info(`Fetched ${templates.length} templates`);
            return templates;
        } catch (error) {
            logger.error('Failed to fetch templates:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get template by name
     */
    async getTemplate(name) {
        if (!this.templateCache.has(name)) {
            await this.fetchTemplates();
        }
        return this.templateCache.get(name);
    }

    /**
     * Check if a template is approved
     */
    async isTemplateApproved(name) {
        const template = await this.getTemplate(name);
        return template?.status === 'APPROVED';
    }

    /**
     * Get all approved media templates
     */
    async getApprovedMediaTemplates() {
        await this.fetchTemplates();
        
        const mediaTemplates = [];
        for (const [name, template] of this.templateCache) {
            if (template.status === 'APPROVED' && 
                template.components?.some(c => c.type === 'HEADER' && c.format === 'IMAGE')) {
                mediaTemplates.push(template);
            }
        }
        
        return mediaTemplates;
    }

    /**
     * Create a new media template with IMAGE header
     */
    async createMediaTemplate({ name, category, headerHandle, bodyText, footerText, language = 'en' }) {
        try {
            const components = [
                {
                    type: 'HEADER',
                    format: 'IMAGE',
                    example: {
                        header_handle: [headerHandle] // From resumable upload
                    }
                }
            ];

            if (bodyText) {
                components.push({
                    type: 'BODY',
                    text: bodyText,
                    example: {
                        body_text: [[bodyText.match(/\{\{[\d]+\}\}/g)?.[0]?.replace(/[{}]/g, '') || 'Example']]
                    }
                });
            }

            if (footerText) {
                components.push({
                    type: 'FOOTER',
                    text: footerText
                });
            }

            const payload = {
                name,
                category: category || 'MARKETING',
                language,
                components
            };

            const url = `${this.baseUrl}/${this.wabaId}/message_templates`;
            const response = await axios.post(url, payload, {
                headers: { 
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            logger.info(`Created template: ${name}`, response.data);
            return response.data;
        } catch (error) {
            logger.error('Failed to create template:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Upload image for template header using APP_ID resumable upload
     */
    async uploadTemplateHeaderImage(imagePath) {
        try {
            const fs = require('fs');
            const FormData = require('form-data');
            
            // Step 1: Create upload session with APP_ID (not WABA_ID)
            const sessionUrl = `${this.baseUrl}/${config.app.id}/uploads`;
            const fileSize = fs.statSync(imagePath).size;
            
            const sessionResponse = await axios.post(sessionUrl, null, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    file_length: fileSize,
                    file_type: 'image/jpeg',
                    file_name: 'template_image.jpg'
                }
            });

            const uploadSessionId = sessionResponse.data.id;
            logger.info(`Created upload session: ${uploadSessionId}`);

            // Step 2: Upload file data
            const uploadUrl = `${this.baseUrl}/${uploadSessionId}`;
            const fileStream = fs.createReadStream(imagePath);
            
            const uploadResponse = await axios.post(uploadUrl, fileStream, {
                headers: {
                    'Authorization': `OAuth ${this.accessToken}`,
                    'Content-Type': 'image/jpeg',
                    'file_offset': '0'
                }
            });

            const handle = uploadResponse.data.h;
            logger.info(`Uploaded image with handle: ${handle}`);
            
            return handle; // Format: "4::..."
        } catch (error) {
            logger.error('Failed to upload template image:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Monitor template approval status
     */
    async waitForApproval(templateName, maxWaitMs = 300000) {
        const startTime = Date.now();
        const checkInterval = 10000; // Check every 10 seconds

        while (Date.now() - startTime < maxWaitMs) {
            const template = await this.getTemplate(templateName);
            
            if (template?.status === 'APPROVED') {
                logger.info(`Template ${templateName} is approved!`);
                return true;
            } else if (template?.status === 'REJECTED') {
                logger.error(`Template ${templateName} was rejected:`, template.rejected_reason);
                return false;
            }

            logger.info(`Template ${templateName} status: ${template?.status || 'NOT_FOUND'}`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            
            // Refresh cache
            await this.fetchTemplates();
        }

        logger.warn(`Timeout waiting for template ${templateName} approval`);
        return false;
    }
}

module.exports = new TemplateService();