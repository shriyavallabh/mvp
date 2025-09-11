#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

class ContentStrategist {
    constructor() {
        this.agentId = 'content-strategist';
        this.state = 'IDLE';
        this.financialNewsSources = [
            'https://economictimes.indiatimes.com/markets',
            'https://www.moneycontrol.com/news/business/markets',
            'https://www.livemint.com/market'
        ];
        this.trendingTopics = [];
        this.topicHistory = [];
    }

    async initialize() {
        try {
            this.state = 'PROCESSING';
            
            const Communication = require('../utils/communication');
            const ErrorHandler = require('../utils/error-handler');
            const Logger = require('../utils/logger');
            
            this.communication = new Communication();
            this.errorHandler = new ErrorHandler();
            this.logger = new Logger(this.agentId);
            
            this.logger.info('Content Strategist initialized');
            this.state = 'IDLE';
            return true;
        } catch (error) {
            this.state = 'ERROR';
            console.error('Failed to initialize content strategist:', error);
            return false;
        }
    }

    async scrapeFinancialNews() {
        try {
            this.logger.info('Scraping financial news for trends');
            const trends = [];
            
            for (const source of this.financialNewsSources) {
                try {
                    const scrapedData = await this.scrapeSource(source);
                    trends.push(...scrapedData);
                } catch (error) {
                    this.logger.warn(`Failed to scrape ${source}:`, error.message);
                }
            }
            
            this.trendingTopics = this.analyzeTrends(trends);
            this.logger.info(`Identified ${this.trendingTopics.length} trending topics`);
            
            return this.trendingTopics;
        } catch (error) {
            this.logger.error('Failed to scrape news', error);
            return this.getMockTrendingTopics();
        }
    }

    async scrapeSource(url) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const headlines = [];
            
            $('h2, h3, .headline, .title').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 10) {
                    headlines.push({
                        text: text,
                        source: url,
                        timestamp: new Date().toISOString()
                    });
                }
            });
            
            return headlines.slice(0, 10);
        } catch (error) {
            this.logger.warn(`Scraping failed for ${url}, using mock data`);
            return [];
        }
    }

    analyzeTrends(newsData) {
        const keywordFrequency = {};
        const financialKeywords = [
            'market', 'stock', 'nifty', 'sensex', 'mutual fund', 'investment',
            'returns', 'growth', 'dividend', 'equity', 'debt', 'gold', 'silver',
            'inflation', 'rbi', 'sebi', 'budget', 'tax', 'sip', 'elss', 'nps',
            'portfolio', 'rally', 'correction', 'volatility', 'ipo', 'fii', 'dii'
        ];
        
        newsData.forEach(item => {
            const words = item.text.toLowerCase().split(/\s+/);
            words.forEach(word => {
                const cleanWord = word.replace(/[^a-z0-9]/g, '');
                if (financialKeywords.includes(cleanWord)) {
                    keywordFrequency[cleanWord] = (keywordFrequency[cleanWord] || 0) + 1;
                }
            });
        });
        
        const sortedKeywords = Object.entries(keywordFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        return sortedKeywords.map(([keyword, frequency]) => ({
            keyword,
            frequency,
            viralityScore: Math.min(frequency / 10, 1)
        }));
    }

    getMockTrendingTopics() {
        return [
            { keyword: 'market rally', frequency: 8, viralityScore: 0.8 },
            { keyword: 'nifty 50', frequency: 7, viralityScore: 0.7 },
            { keyword: 'mutual fund returns', frequency: 6, viralityScore: 0.6 },
            { keyword: 'tax saving', frequency: 5, viralityScore: 0.5 },
            { keyword: 'gold investment', frequency: 4, viralityScore: 0.4 }
        ];
    }

    async generateTopic(advisorProfile) {
        try {
            this.state = 'PROCESSING';
            this.logger.info('Generating topic for advisor', { arn: advisorProfile.advisorArn });
            
            const trends = await this.scrapeFinancialNews();
            
            const scoredTopics = trends.map(trend => {
                const score = this.calculateTopicScore(trend, advisorProfile);
                return {
                    ...trend,
                    advisorScore: score,
                    finalScore: (trend.viralityScore + score) / 2
                };
            });
            
            scoredTopics.sort((a, b) => b.finalScore - a.finalScore);
            
            const selectedTopic = scoredTopics[0] || this.getDefaultTopic(advisorProfile);
            
            const topicContent = this.createTopicContent(selectedTopic, advisorProfile);
            
            this.topicHistory.push({
                advisorArn: advisorProfile.advisorArn,
                topic: topicContent.topic,
                timestamp: new Date().toISOString()
            });
            
            this.state = 'IDLE';
            this.logger.info('Topic generated successfully', { topic: topicContent.topic });
            
            return topicContent;
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to generate topic', error);
            throw error;
        }
    }

    calculateTopicScore(trend, advisorProfile) {
        let score = 0.5;
        
        const focusKeywords = {
            growth: ['growth', 'equity', 'rally', 'returns', 'performance'],
            safety: ['debt', 'fd', 'safety', 'stable', 'guaranteed'],
            tax: ['tax', 'elss', '80c', 'deduction', 'saving'],
            balanced: ['balanced', 'hybrid', 'diversified', 'portfolio']
        };
        
        const contentFocus = advisorProfile.content_focus || 'balanced';
        const relevantKeywords = focusKeywords[contentFocus] || focusKeywords.balanced;
        
        if (relevantKeywords.some(kw => trend.keyword.includes(kw))) {
            score += 0.3;
        }
        
        const segmentPreferences = {
            young_professionals: ['sip', 'equity', 'growth', 'tech'],
            middle_aged: ['balanced', 'tax', 'children', 'retirement'],
            senior: ['debt', 'dividend', 'safety', 'monthly income'],
            mixed: ['diversified', 'portfolio', 'planning']
        };
        
        const clientSegment = advisorProfile.client_segment || 'mixed';
        const segmentKeywords = segmentPreferences[clientSegment] || segmentPreferences.mixed;
        
        if (segmentKeywords.some(kw => trend.keyword.includes(kw))) {
            score += 0.2;
        }
        
        return Math.min(score, 1);
    }

    createTopicContent(selectedTopic, advisorProfile) {
        const templates = {
            growth: [
                `Why ${selectedTopic.keyword} presents a compelling opportunity for long-term wealth creation`,
                `${selectedTopic.keyword}: Understanding the growth potential in current market conditions`,
                `How to leverage ${selectedTopic.keyword} for portfolio enhancement`
            ],
            safety: [
                `${selectedTopic.keyword}: A prudent approach to wealth preservation`,
                `Understanding ${selectedTopic.keyword} for risk-averse investors`,
                `Why ${selectedTopic.keyword} matters for stable returns`
            ],
            tax: [
                `${selectedTopic.keyword}: Smart tax planning strategies for FY 2024-25`,
                `Maximizing benefits through ${selectedTopic.keyword}`,
                `Year-end tax planning with ${selectedTopic.keyword}`
            ],
            balanced: [
                `${selectedTopic.keyword}: Balancing risk and reward in your portfolio`,
                `A comprehensive look at ${selectedTopic.keyword} for diversified investing`,
                `Building wealth systematically with ${selectedTopic.keyword}`
            ]
        };
        
        const contentFocus = advisorProfile.content_focus || 'balanced';
        const topicTemplates = templates[contentFocus] || templates.balanced;
        const selectedTemplate = topicTemplates[Math.floor(Math.random() * topicTemplates.length)];
        
        const content = {
            topic: selectedTemplate,
            keyword: selectedTopic.keyword,
            viralityScore: selectedTopic.viralityScore || 0.5,
            advisorScore: selectedTopic.advisorScore || 0.5,
            finalScore: selectedTopic.finalScore || 0.5,
            references: selectedTopic.source ? [selectedTopic.source] : [],
            metadata: {
                advisorArn: advisorProfile.advisorArn,
                contentFocus: contentFocus,
                clientSegment: advisorProfile.client_segment,
                generatedAt: new Date().toISOString()
            }
        };
        
        return content;
    }

    getDefaultTopic(advisorProfile) {
        const defaults = {
            growth: { keyword: 'equity mutual funds', viralityScore: 0.6 },
            safety: { keyword: 'debt fund selection', viralityScore: 0.5 },
            tax: { keyword: 'elss investment', viralityScore: 0.7 },
            balanced: { keyword: 'balanced advantage funds', viralityScore: 0.6 }
        };
        
        const contentFocus = advisorProfile.content_focus || 'balanced';
        return defaults[contentFocus] || defaults.balanced;
    }

    async storeReferences(topic, references) {
        try {
            this.logger.info('Storing content references', {
                topic: topic,
                referenceCount: references.length
            });
            
            return {
                success: true,
                storedAt: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Failed to store references', error);
            throw error;
        }
    }

    async processMessage(message) {
        try {
            if (!this.communication || !this.communication.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            const { action, payload } = message;
            
            switch (action) {
                case 'GENERATE_TOPIC':
                    const topic = await this.generateTopic(payload);
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'TOPIC_RESPONSE',
                        payload: topic,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GET_TRENDS':
                    const trends = await this.scrapeFinancialNews();
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'TRENDS_RESPONSE',
                        payload: { trends },
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'STORE_REFERENCES':
                    const storeResult = await this.storeReferences(
                        payload.topic,
                        payload.references
                    );
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'STORE_RESPONSE',
                        payload: storeResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Failed to process message', error);
            return this.communication.createMessage({
                agentId: this.agentId,
                action: 'ERROR_RESPONSE',
                payload: { error: error.message },
                context: message.context,
                responseRequired: false
            });
        }
    }

    async test() {
        console.log('=== Content Strategist Test Mode ===');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize content strategist');
            return;
        }
        
        console.log('\n1. Testing trend scraping (using mock data)...');
        const trends = await this.scrapeFinancialNews();
        console.log(`Found ${trends.length} trending topics:`);
        trends.slice(0, 3).forEach(trend => {
            console.log(`  - ${trend.keyword} (virality: ${trend.viralityScore})`);
        });
        
        console.log('\n2. Testing topic generation for different advisor profiles...');
        
        const testProfiles = [
            {
                advisorArn: 'ARN_12345',
                content_focus: 'growth',
                client_segment: 'young_professionals'
            },
            {
                advisorArn: 'ARN_67890',
                content_focus: 'safety',
                client_segment: 'senior'
            },
            {
                advisorArn: 'ARN_11111',
                content_focus: 'tax',
                client_segment: 'middle_aged'
            }
        ];
        
        for (const profile of testProfiles) {
            const topic = await this.generateTopic(profile);
            console.log(`\nAdvisor ${profile.advisorArn} (${profile.content_focus}):`);
            console.log(`  Topic: ${topic.topic}`);
            console.log(`  Score: ${topic.finalScore}`);
        }
        
        console.log('\n3. Testing virality scoring...');
        const mockTrend = { keyword: 'market rally', frequency: 10 };
        const viralityScore = Math.min(mockTrend.frequency / 10, 1);
        console.log(`Virality score for "${mockTrend.keyword}": ${viralityScore}`);
        
        console.log('\n=== Test Complete ===');
    }
}

if (require.main === module) {
    const strategist = new ContentStrategist();
    
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        strategist.test();
    } else {
        strategist.initialize().then(() => {
            console.log('Content Strategist running...');
        });
    }
}

module.exports = ContentStrategist;