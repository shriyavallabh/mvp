/**
 * Image Generator Service
 * Generates daily financial update images for advisors
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/whatsapp.config');
const logger = require('../services/logger');

class ImageGenerator {
    /**
     * Generate daily images for all contacts/segments
     */
    async generateDailyImages(contacts, date) {
        logger.info(`Generating images for ${contacts.length} contacts on ${date}`);

        const imageUrls = [];
        const baseUrl = config.cdn.baseUrl;
        const localPath = path.join('./generated-images', date);

        // Ensure directory exists
        await fs.mkdir(localPath, { recursive: true });

        // Group contacts by segment or generate individually
        const segments = this.groupContactsBySegment(contacts);

        for (const [segment, segmentContacts] of Object.entries(segments)) {
            try {
                // Generate image for segment
                const imagePath = await this.generateSegmentImage(segment, segmentContacts, date);
                
                // Upload to CDN (placeholder - implement actual CDN upload)
                const imageUrl = `${baseUrl}/${date}/${segment}.jpg`;
                
                imageUrls.push({
                    segment,
                    url: imageUrl,
                    localPath: imagePath,
                    contacts: segmentContacts.length
                });

                logger.info(`Generated image for segment ${segment}: ${imageUrl}`);
            } catch (error) {
                logger.error(`Failed to generate image for segment ${segment}:`, error);
            }
        }

        return imageUrls;
    }

    /**
     * Group contacts by segment for batch image generation
     */
    groupContactsBySegment(contacts) {
        const segments = {};

        for (const contact of contacts) {
            const segment = contact.segment || 'default';
            
            if (!segments[segment]) {
                segments[segment] = [];
            }
            
            segments[segment].push(contact);
        }

        return segments;
    }

    /**
     * Generate image for a segment
     */
    async generateSegmentImage(segment, contacts, date) {
        // Placeholder: Integrate with actual image generation service (Gemini, etc.)
        // For now, copy a sample image
        
        const sampleImagePath = path.join('./template-images', 'daily-update-template.jpg');
        const outputPath = path.join('./generated-images', date, `${segment}.jpg`);

        try {
            // Check if sample exists, if not create a placeholder
            try {
                await fs.access(sampleImagePath);
                await fs.copyFile(sampleImagePath, outputPath);
            } catch {
                // Create a simple placeholder text file
                await fs.writeFile(outputPath, `Image placeholder for ${segment} on ${date}`);
            }

            logger.info(`Generated image for ${segment}: ${outputPath}`);
            return outputPath;
        } catch (error) {
            logger.error(`Failed to generate image for ${segment}:`, error);
            throw error;
        }
    }

    /**
     * Upload image to CDN
     */
    async uploadToCDN(localPath, remotePath) {
        // Implement actual CDN upload (S3, Cloudinary, etc.)
        // For now, just log
        logger.info(`Would upload ${localPath} to ${remotePath}`);
        return `${config.cdn.baseUrl}/${remotePath}`;
    }

    /**
     * Generate test image
     */
    async generateTestImage() {
        const testPath = './generated-images/test/sample.jpg';
        await fs.mkdir(path.dirname(testPath), { recursive: true });
        
        // Copy or create test image
        const samplePath = './template-images/test-template.jpg';
        
        try {
            await fs.copyFile(samplePath, testPath);
        } catch {
            await fs.writeFile(testPath, 'Test image placeholder');
        }

        logger.info('Generated test image');
        return testPath;
    }
}

module.exports = new ImageGenerator();