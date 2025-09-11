/**
 * OG Page Generator Service
 * Creates HTML pages with Open Graph tags for rich link previews
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/whatsapp.config');
const logger = require('../services/logger');

class OGPageGenerator {
    /**
     * Generate OG preview pages for the day
     */
    async generateDailyPages(imageUrls, date) {
        logger.info(`Generating OG pages for ${date}`);

        const outputDir = path.join('./public/daily', date);
        await fs.mkdir(outputDir, { recursive: true });

        // Generate main page for the day
        await this.generateMainPage(imageUrls[0]?.url, date);

        // Generate segment-specific pages
        for (const imageData of imageUrls) {
            await this.generateSegmentPage(imageData, date);
        }

        logger.info(`Generated ${imageUrls.length + 1} OG pages for ${date}`);
    }

    /**
     * Generate main daily page
     */
    async generateMainPage(defaultImageUrl, date) {
        const html = this.createOGHTML({
            title: `FinAdvise Daily Update - ${date}`,
            description: 'Your personalized financial insights and market updates',
            imageUrl: defaultImageUrl || `${config.cdn.baseUrl}/default.jpg`,
            url: `${config.cdn.ogPageUrl}/${date}`
        });

        const outputPath = path.join('./public/daily', date, 'index.html');
        await fs.writeFile(outputPath, html, 'utf8');
        
        logger.info(`Generated main OG page: ${outputPath}`);
    }

    /**
     * Generate segment-specific page
     */
    async generateSegmentPage(imageData, date) {
        const { segment, url: imageUrl } = imageData;

        const html = this.createOGHTML({
            title: `FinAdvise ${segment} Update - ${date}`,
            description: `Financial insights for ${segment} segment`,
            imageUrl,
            url: `${config.cdn.ogPageUrl}/${date}/${segment}`
        });

        const outputPath = path.join('./public/daily', date, `${segment}.html`);
        await fs.writeFile(outputPath, html, 'utf8');
        
        logger.info(`Generated segment OG page: ${outputPath}`);
    }

    /**
     * Create HTML with Open Graph tags
     */
    createOGHTML({ title, description, imageUrl, url }) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Open Graph Tags for WhatsApp Preview -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="FinAdvise" />
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Additional Meta Tags -->
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 28px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        img {
            max-width: 100%;
            border-radius: 10px;
            margin: 20px 0;
        }
        .cta {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.3s;
        }
        .cta:hover {
            transform: translateY(-2px);
        }
        .date {
            color: #999;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <p>${description}</p>
        <img src="${imageUrl}" alt="Financial Update" />
        <p>Get personalized financial insights delivered daily to your WhatsApp.</p>
        <a href="https://finadvise.app" class="cta">Learn More</a>
        <p class="date">Generated on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Generate test OG page
     */
    async generateTestPage() {
        const html = this.createOGHTML({
            title: 'FinAdvise Test Update',
            description: 'Test financial update with image preview',
            imageUrl: `${config.cdn.baseUrl}/test/sample.jpg`,
            url: `${config.cdn.ogPageUrl}/test`
        });

        const outputPath = './public/daily/test/index.html';
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, html, 'utf8');
        
        logger.info('Generated test OG page');
        return outputPath;
    }
}

module.exports = new OGPageGenerator();