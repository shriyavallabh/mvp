/**
 * Template Manager
 * Manages 50+ financial content templates with metadata and selection logic
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../agents/utils/logger');

class TemplateManager {
    constructor() {
        this.templatesPath = path.join(process.cwd(), 'templates');
        this.templates = new Map();
        this.metadata = {
            categories: {
                'investment-education': {
                    name: 'Investment Education',
                    description: 'Educational content about investment basics and strategies',
                    count: 15
                },
                'market-updates': {
                    name: 'Market Updates',
                    description: 'Market analysis and commentary',
                    count: 10
                },
                'tax-planning': {
                    name: 'Tax Planning',
                    description: 'Tax saving strategies and tips',
                    count: 10
                },
                'financial-planning': {
                    name: 'Financial Planning',
                    description: 'Personal finance and planning guidance',
                    count: 10
                },
                'seasonal': {
                    name: 'Seasonal Content',
                    description: 'Festival and season-specific financial content',
                    count: 5
                }
            },
            tags: ['beginner', 'intermediate', 'advanced', 'urgent', 'evergreen'],
            segments: ['young_professionals', 'retirees', 'families', 'entrepreneurs', 'salaried']
        };
        this.loadTemplates();
    }

    async loadTemplates() {
        try {
            // Load all template categories
            for (const category of Object.keys(this.metadata.categories)) {
                const categoryPath = path.join(this.templatesPath, category);
                const templates = await this.loadCategoryTemplates(category, categoryPath);
                templates.forEach(template => {
                    this.templates.set(template.id, template);
                });
            }
            logger.info(`Loaded ${this.templates.size} templates`);
        } catch (error) {
            logger.error('Error loading templates:', error);
        }
    }

    async loadCategoryTemplates(category, categoryPath) {
        const templates = [];
        
        // Generate templates programmatically for each category
        const categoryMeta = this.metadata.categories[category];
        
        for (let i = 1; i <= categoryMeta.count; i++) {
            const template = await this.createTemplate(category, i);
            templates.push(template);
        }
        
        return templates;
    }

    async createTemplate(category, index) {
        const templateId = `${category}-${String(index).padStart(3, '0')}`;
        
        // Template structure based on category
        const templateStructures = {
            'investment-education': this.getInvestmentEducationTemplate(index),
            'market-updates': this.getMarketUpdateTemplate(index),
            'tax-planning': this.getTaxPlanningTemplate(index),
            'financial-planning': this.getFinancialPlanningTemplate(index),
            'seasonal': this.getSeasonalTemplate(index)
        };

        const template = {
            id: templateId,
            category,
            ...templateStructures[category],
            metadata: {
                created: new Date().toISOString(),
                version: '1.0',
                author: 'TemplateManager',
                approved: true
            }
        };

        // Save template to file
        const templatePath = path.join(this.templatesPath, category, `${templateId}.json`);
        try {
            await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
        } catch (error) {
            // File might already exist or directory not created
            logger.debug(`Template ${templateId} creation skipped:`, error.message);
        }

        return template;
    }

    getInvestmentEducationTemplate(index) {
        const topics = [
            'Understanding Mutual Funds', 'SIP Benefits', 'Risk and Return',
            'Asset Allocation', 'Diversification Strategy', 'Market Volatility',
            'Long-term Investing', 'Goal-based Planning', 'Emergency Fund',
            'Retirement Planning', 'Child Education Planning', 'Tax-saving Funds',
            'Equity vs Debt', 'Index Funds', 'Portfolio Rebalancing'
        ];

        return {
            title: topics[index - 1] || `Investment Basics ${index}`,
            structure: {
                opening: 'Engaging question or statement about {topic}',
                body: [
                    'Key concept explanation',
                    'Real-world example or analogy',
                    'Benefits or importance',
                    'Action step or tip'
                ],
                closing: 'Call-to-action for consultation'
            },
            tags: ['education', index <= 5 ? 'beginner' : 'intermediate'],
            targetSegments: ['young_professionals', 'families'],
            tone: 'educational',
            contentFocus: 'growth',
            platforms: {
                whatsapp: { maxLength: 300, includeEmoji: true },
                linkedin: { maxLength: 500, professional: true },
                status: { visual: true, textOverlay: true }
            }
        };
    }

    getMarketUpdateTemplate(index) {
        const topics = [
            'Weekly Market Wrap', 'Sector Performance', 'Global Market Impact',
            'Interest Rate Update', 'Inflation Analysis', 'Corporate Earnings',
            'Market Outlook', 'Investment Opportunities', 'Risk Factors',
            'Economic Indicators'
        ];

        return {
            title: topics[index - 1] || `Market Update ${index}`,
            structure: {
                opening: 'Current market situation summary',
                body: [
                    'Key market movements',
                    'Driving factors',
                    'Impact on investments',
                    'Recommended action'
                ],
                closing: 'Disclaimer and consultation offer'
            },
            tags: ['market', 'timely', 'intermediate'],
            targetSegments: ['entrepreneurs', 'salaried'],
            tone: 'professional',
            contentFocus: 'balanced',
            platforms: {
                whatsapp: { maxLength: 350, includeData: true },
                linkedin: { maxLength: 600, includeCharts: false },
                status: { visual: true, dataVisualization: true }
            }
        };
    }

    getTaxPlanningTemplate(index) {
        const topics = [
            'Section 80C Benefits', 'ELSS Advantages', 'Tax Harvesting',
            'Capital Gains Tax', 'Tax-efficient Investing', 'HRA Benefits',
            'NPS Tax Benefits', 'Tax Planning Calendar', 'Form 16 Guide',
            'Advance Tax Planning'
        ];

        return {
            title: topics[index - 1] || `Tax Planning Tip ${index}`,
            structure: {
                opening: 'Tax-saving opportunity highlight',
                body: [
                    'Tax provision explanation',
                    'Eligibility and limits',
                    'Investment options',
                    'Calculation example'
                ],
                closing: 'Deadline reminder and CTA'
            },
            tags: ['tax', 'urgent', 'evergreen'],
            targetSegments: ['salaried', 'entrepreneurs'],
            tone: 'informative',
            contentFocus: 'tax_saving',
            platforms: {
                whatsapp: { maxLength: 400, includeCalculation: true },
                linkedin: { maxLength: 550, professionalTone: true },
                status: { visual: true, infographic: true }
            }
        };
    }

    getFinancialPlanningTemplate(index) {
        const topics = [
            'Budget Planning', 'Debt Management', 'Insurance Planning',
            'Goal Setting', 'Financial Health Check', 'Wealth Creation',
            'Passive Income', 'Financial Mistakes', 'Money Mindset',
            'Financial Freedom'
        ];

        return {
            title: topics[index - 1] || `Financial Planning ${index}`,
            structure: {
                opening: 'Relatable financial scenario',
                body: [
                    'Problem identification',
                    'Solution approach',
                    'Step-by-step guide',
                    'Expected outcomes'
                ],
                closing: 'Personalized planning offer'
            },
            tags: ['planning', 'evergreen', 'beginner'],
            targetSegments: ['families', 'young_professionals'],
            tone: 'friendly',
            contentFocus: 'balanced',
            platforms: {
                whatsapp: { maxLength: 350, conversational: true },
                linkedin: { maxLength: 500, storytelling: true },
                status: { visual: true, motivational: true }
            }
        };
    }

    getSeasonalTemplate(index) {
        const seasons = [
            'Diwali Investment Ideas', 'New Year Financial Resolutions',
            'Tax Season Preparation', 'Monsoon Portfolio Review',
            'Year-end Planning'
        ];

        return {
            title: seasons[index - 1] || `Seasonal Finance ${index}`,
            structure: {
                opening: 'Seasonal greeting and relevance',
                body: [
                    'Seasonal financial opportunity',
                    'Traditional wisdom meets modern finance',
                    'Special offers or benefits',
                    'Timely action items'
                ],
                closing: 'Festive wishes and consultation'
            },
            tags: ['seasonal', 'timely', 'special'],
            targetSegments: ['families', 'retirees'],
            tone: 'celebratory',
            contentFocus: 'growth',
            platforms: {
                whatsapp: { maxLength: 300, festive: true },
                linkedin: { maxLength: 450, cultural: true },
                status: { visual: true, festiveDesign: true }
            }
        };
    }

    /**
     * Select template based on advisor preferences
     */
    selectTemplate(advisorProfile, context = {}) {
        const { client_segment, content_focus, tone } = advisorProfile;
        const { date, recentTopics = [], specificRequest } = context;

        // Filter templates by segment
        let candidates = Array.from(this.templates.values()).filter(template => 
            template.targetSegments.includes(client_segment)
        );

        // Filter by content focus
        if (content_focus) {
            candidates = candidates.filter(template => 
                template.contentFocus === content_focus
            );
        }

        // Filter by tone preference
        if (tone) {
            candidates = candidates.filter(template => 
                template.tone === tone || template.tone === 'neutral'
            );
        }

        // Avoid recent topics
        if (recentTopics.length > 0) {
            candidates = candidates.filter(template => 
                !recentTopics.includes(template.id)
            );
        }

        // Check for seasonal relevance
        if (date) {
            const month = new Date(date).getMonth();
            // Prioritize seasonal content during festivals
            if ([0, 2, 9, 10, 11].includes(month)) { // Jan, Mar, Oct, Nov, Dec
                const seasonalTemplates = candidates.filter(t => 
                    t.category === 'seasonal'
                );
                if (seasonalTemplates.length > 0) {
                    candidates = [...seasonalTemplates, ...candidates];
                }
            }
        }

        // Return random selection from candidates
        if (candidates.length === 0) {
            // Fallback to any template
            candidates = Array.from(this.templates.values());
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        logger.info(`Selected template: ${selected.id} for advisor segment: ${client_segment}`);
        
        return selected;
    }

    /**
     * Personalize template with advisor branding
     */
    personalizeTemplate(template, advisorProfile) {
        const { name, brand_colors, logo_url, contact_info } = advisorProfile;
        
        return {
            ...template,
            personalization: {
                advisorName: name,
                brandColors: brand_colors,
                logoUrl: logo_url,
                contactInfo: contact_info,
                disclaimer: `Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.`
            },
            personalized: true,
            personalizedAt: new Date().toISOString()
        };
    }

    /**
     * Get template statistics
     */
    getStatistics() {
        const stats = {
            totalTemplates: this.templates.size,
            byCategory: {},
            byTags: {},
            bySegment: {}
        };

        // Count by category
        for (const template of this.templates.values()) {
            stats.byCategory[template.category] = 
                (stats.byCategory[template.category] || 0) + 1;
            
            // Count by tags
            template.tags.forEach(tag => {
                stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
            });

            // Count by segment
            template.targetSegments.forEach(segment => {
                stats.bySegment[segment] = (stats.bySegment[segment] || 0) + 1;
            });
        }

        return stats;
    }

    /**
     * Search templates
     */
    searchTemplates(query) {
        const results = [];
        const searchTerm = query.toLowerCase();

        for (const template of this.templates.values()) {
            if (
                template.title.toLowerCase().includes(searchTerm) ||
                template.category.includes(searchTerm) ||
                template.tags.some(tag => tag.includes(searchTerm))
            ) {
                results.push(template);
            }
        }

        return results;
    }

    /**
     * Get template by ID
     */
    getTemplate(templateId) {
        return this.templates.get(templateId);
    }

    /**
     * Get all templates
     */
    getAllTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * Get templates by category
     */
    getTemplatesByCategory(category) {
        return Array.from(this.templates.values()).filter(
            template => template.category === category
        );
    }
}

// Singleton instance
let templateManagerInstance = null;

function getTemplateManager() {
    if (!templateManagerInstance) {
        templateManagerInstance = new TemplateManager();
    }
    return templateManagerInstance;
}

module.exports = {
    getTemplateManager,
    TemplateManager
};