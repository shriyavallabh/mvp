#!/usr/bin/env node

const { google } = require('googleapis');
const stringSimilarity = require('string-similarity');

class FatigueChecker {
    constructor() {
        this.agentId = 'fatigue-checker';
        this.state = 'IDLE';
        this.lookbackDays = 30;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
        this.contentRange = 'Content!A:K';
        this.similarityThreshold = 0.65;
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
            
            await this.initializeGoogleSheets();
            
            this.logger.info('Fatigue Checker initialized');
            this.state = 'IDLE';
            return true;
        } catch (error) {
            this.state = 'ERROR';
            console.error('Failed to initialize fatigue checker:', error);
            return false;
        }
    }

    async initializeGoogleSheets() {
        try {
            const path = require('path');
            const fs = require('fs');
            
            const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
                                   path.join(process.cwd(), 'config', 'google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                this.logger.warn('Google credentials not found, using mock mode');
                this.mockMode = true;
                return;
            }
            
            const auth = new google.auth.GoogleAuth({
                keyFile: credentialsPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });
            
            this.sheets = google.sheets({ version: 'v4', auth });
            this.logger.info('Google Sheets API initialized for fatigue checking');
        } catch (error) {
            this.logger.error('Failed to initialize Google Sheets', error);
            this.mockMode = true;
        }
    }

    async getContentHistory(advisorArn) {
        try {
            this.logger.info(`Fetching content history for advisor: ${advisorArn}`);
            
            if (this.mockMode) {
                return this.getMockContentHistory(advisorArn);
            }
            
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: this.contentRange
            });
            
            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                this.logger.warn('No content history found');
                return [];
            }
            
            const headers = rows[0];
            const contentHistory = rows.slice(1)
                .map(row => {
                    const content = {};
                    headers.forEach((header, index) => {
                        content[header] = row[index] || '';
                    });
                    return content;
                })
                .filter(content => content.advisor_arn === advisorArn);
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.lookbackDays);
            
            const recentContent = contentHistory.filter(content => {
                const contentDate = new Date(content.created_at || content.date);
                return contentDate >= cutoffDate;
            });
            
            this.logger.info(`Found ${recentContent.length} content items in last ${this.lookbackDays} days`);
            return recentContent;
            
        } catch (error) {
            this.logger.error('Failed to fetch content history', error);
            return this.getMockContentHistory(advisorArn);
        }
    }

    getMockContentHistory(advisorArn) {
        const mockHistory = [
            {
                advisor_arn: advisorArn,
                content_id: 'content_001',
                topic: 'Understanding Equity Mutual Funds for Long-term Wealth Creation',
                created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                content_type: 'educational'
            },
            {
                advisor_arn: advisorArn,
                content_id: 'content_002',
                topic: 'Tax Saving through ELSS Funds: A Comprehensive Guide',
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                content_type: 'tax_planning'
            },
            {
                advisor_arn: advisorArn,
                content_id: 'content_003',
                topic: 'Debt Funds vs Fixed Deposits: Making the Right Choice',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                content_type: 'comparison'
            },
            {
                advisor_arn: advisorArn,
                content_id: 'content_004',
                topic: 'SIP Investment: Building Wealth Systematically',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                content_type: 'educational'
            },
            {
                advisor_arn: advisorArn,
                content_id: 'content_005',
                topic: 'Market Volatility: How to Stay Invested During Corrections',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                content_type: 'market_update'
            }
        ];
        
        return mockHistory.filter(content => content.advisor_arn === advisorArn);
    }

    calculateSimilarity(topic, contentHistory) {
        if (!contentHistory || contentHistory.length === 0) {
            return { score: 0, similarContent: [] };
        }
        
        const historicalTopics = contentHistory.map(content => content.topic || '');
        const similarities = stringSimilarity.findBestMatch(topic, historicalTopics);
        
        const similarContent = [];
        similarities.ratings.forEach((rating, index) => {
            if (rating.rating >= this.similarityThreshold) {
                similarContent.push({
                    topic: contentHistory[index].topic,
                    similarity: rating.rating,
                    created_at: contentHistory[index].created_at,
                    content_id: contentHistory[index].content_id
                });
            }
        });
        
        similarContent.sort((a, b) => b.similarity - a.similarity);
        
        const maxSimilarity = similarities.bestMatch.rating;
        
        return {
            score: maxSimilarity,
            similarContent: similarContent.slice(0, 3),
            bestMatch: similarities.bestMatch
        };
    }

    calculateFatigueScore(topic, contentHistory) {
        const similarity = this.calculateSimilarity(topic, contentHistory);
        
        let fatigueScore = similarity.score;
        
        const recentSimilarContent = similarity.similarContent.filter(content => {
            const daysSince = this.getDaysSince(content.created_at);
            return daysSince <= 7;
        });
        
        if (recentSimilarContent.length > 0) {
            fatigueScore = Math.min(fatigueScore + 0.3, 1);
        }
        
        const topicFrequency = this.calculateTopicFrequency(topic, contentHistory);
        if (topicFrequency > 2) {
            fatigueScore = Math.min(fatigueScore + 0.2, 1);
        }
        
        const categoryFatigue = this.calculateCategoryFatigue(topic, contentHistory);
        fatigueScore = Math.min(fatigueScore + categoryFatigue * 0.1, 1);
        
        return {
            fatigueScore: Math.round(fatigueScore * 100) / 100,
            similarity: similarity,
            topicFrequency: topicFrequency,
            categoryFatigue: categoryFatigue,
            recommendation: this.getRecommendation(fatigueScore)
        };
    }

    calculateTopicFrequency(topic, contentHistory) {
        const keywords = this.extractKeywords(topic);
        let frequency = 0;
        
        contentHistory.forEach(content => {
            const contentKeywords = this.extractKeywords(content.topic || '');
            const commonKeywords = keywords.filter(kw => contentKeywords.includes(kw));
            if (commonKeywords.length >= 2) {
                frequency++;
            }
        });
        
        return frequency;
    }

    extractKeywords(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                          'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                          'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would'];
        
        return text.toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[^a-z0-9]/g, ''))
            .filter(word => word.length > 3 && !stopWords.includes(word));
    }

    calculateCategoryFatigue(topic, contentHistory) {
        const categories = {
            equity: ['equity', 'stock', 'share', 'growth', 'capital'],
            debt: ['debt', 'bond', 'fixed', 'income', 'stable'],
            tax: ['tax', 'saving', 'elss', '80c', 'deduction'],
            sip: ['sip', 'systematic', 'monthly', 'regular'],
            market: ['market', 'nifty', 'sensex', 'volatility', 'correction']
        };
        
        const topicCategory = this.identifyCategory(topic, categories);
        if (!topicCategory) return 0;
        
        let categoryCount = 0;
        contentHistory.forEach(content => {
            const contentCategory = this.identifyCategory(content.topic || '', categories);
            if (contentCategory === topicCategory) {
                categoryCount++;
            }
        });
        
        return Math.min(categoryCount / 5, 1);
    }

    identifyCategory(text, categories) {
        const lowerText = text.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return category;
            }
        }
        return null;
    }

    getDaysSince(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    getRecommendation(fatigueScore) {
        if (fatigueScore >= 0.8) {
            return 'HIGH_FATIGUE: Strongly recommend choosing a different topic to maintain audience engagement';
        } else if (fatigueScore >= 0.6) {
            return 'MODERATE_FATIGUE: Consider modifying the topic angle or waiting a few more days';
        } else if (fatigueScore >= 0.4) {
            return 'LOW_FATIGUE: Topic is acceptable but try to add fresh perspective';
        } else {
            return 'NO_FATIGUE: Topic is fresh and suitable for content creation';
        }
    }

    async generateFatigueReport(advisorArn, period = 30) {
        try {
            this.state = 'PROCESSING';
            this.logger.info(`Generating fatigue report for advisor: ${advisorArn}`);
            
            const contentHistory = await this.getContentHistory(advisorArn);
            
            const topicCategories = {};
            const topicTimeline = [];
            
            contentHistory.forEach(content => {
                const category = this.identifyCategory(content.topic || '', {
                    equity: ['equity', 'stock', 'share'],
                    debt: ['debt', 'bond', 'fixed'],
                    tax: ['tax', 'elss', '80c'],
                    sip: ['sip', 'systematic'],
                    market: ['market', 'nifty', 'sensex']
                }) || 'other';
                
                topicCategories[category] = (topicCategories[category] || 0) + 1;
                
                topicTimeline.push({
                    date: content.created_at,
                    topic: content.topic,
                    category: category
                });
            });
            
            const repetitionPatterns = this.identifyRepetitionPatterns(contentHistory);
            
            const report = {
                advisorArn: advisorArn,
                period: period,
                totalContent: contentHistory.length,
                categoryDistribution: topicCategories,
                repetitionPatterns: repetitionPatterns,
                topicTimeline: topicTimeline.slice(0, 10),
                recommendations: this.generateRecommendations(topicCategories, repetitionPatterns),
                generatedAt: new Date().toISOString()
            };
            
            this.state = 'IDLE';
            this.logger.info('Fatigue report generated successfully');
            
            return report;
            
        } catch (error) {
            this.state = 'ERROR';
            this.logger.error('Failed to generate fatigue report', error);
            throw error;
        }
    }

    identifyRepetitionPatterns(contentHistory) {
        const patterns = [];
        
        for (let i = 0; i < contentHistory.length - 1; i++) {
            for (let j = i + 1; j < contentHistory.length; j++) {
                const similarity = stringSimilarity.compareTwoStrings(
                    contentHistory[i].topic || '',
                    contentHistory[j].topic || ''
                );
                
                if (similarity >= this.similarityThreshold) {
                    patterns.push({
                        topic1: contentHistory[i].topic,
                        topic2: contentHistory[j].topic,
                        similarity: similarity,
                        daysBetween: this.getDaysBetween(
                            contentHistory[i].created_at,
                            contentHistory[j].created_at
                        )
                    });
                }
            }
        }
        
        return patterns.slice(0, 5);
    }

    getDaysBetween(date1String, date2String) {
        const date1 = new Date(date1String);
        const date2 = new Date(date2String);
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    generateRecommendations(categoryDistribution, repetitionPatterns) {
        const recommendations = [];
        
        const totalContent = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);
        for (const [category, count] of Object.entries(categoryDistribution)) {
            const percentage = (count / totalContent) * 100;
            if (percentage > 40) {
                recommendations.push(`Diversify content: ${category} topics comprise ${percentage.toFixed(1)}% of recent content`);
            }
        }
        
        if (repetitionPatterns.length > 3) {
            recommendations.push(`High repetition detected: ${repetitionPatterns.length} similar topics found`);
        }
        
        const underrepresented = ['equity', 'debt', 'tax', 'sip', 'market']
            .filter(cat => !categoryDistribution[cat] || categoryDistribution[cat] < 2);
        
        if (underrepresented.length > 0) {
            recommendations.push(`Consider topics in: ${underrepresented.join(', ')}`);
        }
        
        return recommendations;
    }

    async processMessage(message) {
        try {
            if (!this.communication || !this.communication.validateMessage(message)) {
                throw new Error('Invalid message format');
            }
            
            const { action, payload } = message;
            
            switch (action) {
                case 'CHECK_FATIGUE':
                    const contentHistory = await this.getContentHistory(payload.advisorArn);
                    const fatigueResult = this.calculateFatigueScore(payload.topic, contentHistory);
                    
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'FATIGUE_RESPONSE',
                        payload: fatigueResult,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GENERATE_REPORT':
                    const report = await this.generateFatigueReport(
                        payload.advisorArn,
                        payload.period || 30
                    );
                    
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'REPORT_RESPONSE',
                        payload: report,
                        context: message.context,
                        responseRequired: false
                    });
                
                case 'GET_HISTORY':
                    const history = await this.getContentHistory(payload.advisorArn);
                    
                    return this.communication.createMessage({
                        agentId: this.agentId,
                        action: 'HISTORY_RESPONSE',
                        payload: { history },
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
        console.log('=== Fatigue Checker Test Mode ===');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.error('Failed to initialize fatigue checker');
            return;
        }
        
        const testAdvisorArn = 'ARN_12345';
        const testTopic = 'Understanding Equity Mutual Funds for Wealth Creation';
        
        console.log('\n1. Testing content history retrieval...');
        const history = await this.getContentHistory(testAdvisorArn);
        console.log(`Found ${history.length} content items in history`);
        
        console.log('\n2. Testing similarity detection...');
        const similarity = this.calculateSimilarity(testTopic, history);
        console.log(`Best match similarity: ${similarity.score}`);
        if (similarity.similarContent.length > 0) {
            console.log('Similar content found:');
            similarity.similarContent.forEach(content => {
                console.log(`  - "${content.topic}" (similarity: ${content.similarity})`);
            });
        }
        
        console.log('\n3. Testing fatigue score calculation...');
        const fatigueResult = this.calculateFatigueScore(testTopic, history);
        console.log(`Fatigue Score: ${fatigueResult.fatigueScore}`);
        console.log(`Topic Frequency: ${fatigueResult.topicFrequency}`);
        console.log(`Recommendation: ${fatigueResult.recommendation}`);
        
        console.log('\n4. Testing fatigue report generation...');
        const report = await this.generateFatigueReport(testAdvisorArn, 30);
        console.log(`Report generated for ${report.totalContent} content items`);
        console.log('Category distribution:', report.categoryDistribution);
        console.log('Recommendations:');
        report.recommendations.forEach(rec => {
            console.log(`  - ${rec}`);
        });
        
        console.log('\n=== Test Complete ===');
    }
}

if (require.main === module) {
    const checker = new FatigueChecker();
    
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        checker.test();
    } else {
        checker.initialize().then(() => {
            console.log('Fatigue Checker running...');
        });
    }
}

module.exports = FatigueChecker;