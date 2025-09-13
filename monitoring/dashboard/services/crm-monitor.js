/**
 * CRM Monitoring Service for Story 3.2 Integration
 * Tracks chat interactions, response quality, and conversation analytics
 */

const EventEmitter = require('events');
const ButtonAnalyticsService = require('./button-analytics');

class CRMMonitorService extends EventEmitter {
    constructor() {
        super();
        this.analyticsService = new ButtonAnalyticsService();
        this.activeConversations = new Map();
        this.conversationMetrics = {
            totalConversations: 0,
            completedConversations: 0,
            averageResponseTime: 0,
            averageQualityScore: 0,
            responseTimeHistory: [],
            qualityScoreHistory: []
        };
        
        // Conversation patterns for quality scoring
        this.qualityPatterns = {
            excellent: [
                /market.*analysis/i,
                /specific.*recommendation/i,
                /detailed.*explanation/i,
                /step.*by.*step/i
            ],
            good: [
                /thank/i,
                /help/i,
                /information/i,
                /update/i
            ],
            basic: [
                /hello/i,
                /hi/i,
                /yes/i,
                /no/i
            ]
        };
        
        this.startMonitoring();
    }

    /**
     * Initialize CRM monitoring
     */
    startMonitoring() {
        console.log('📊 Starting CRM monitoring service...');
        
        // Clean up old conversations every hour
        setInterval(() => {
            this.cleanupOldConversations();
        }, 3600000);
        
        // Update metrics every 5 minutes
        setInterval(() => {
            this.updateMetrics();
        }, 300000);
    }

    /**
     * Start a new conversation
     */
    startConversation(contactId, contactName, initialMessage) {
        const conversation = {
            id: contactId,
            name: contactName,
            startTime: new Date(),
            lastActivity: new Date(),
            messages: [{
                type: 'incoming',
                content: initialMessage,
                timestamp: new Date()
            }],
            responseCount: 0,
            averageResponseTime: 0,
            qualityScore: 0,
            status: 'active',
            topics: new Set()
        };
        
        this.activeConversations.set(contactId, conversation);
        this.conversationMetrics.totalConversations++;
        
        this.emit('conversation_started', {
            contactId,
            contactName,
            timestamp: new Date().toISOString()
        });
        
        console.log(`💬 New conversation started: ${contactName} (${contactId})`);
        return conversation;
    }

    /**
     * Process incoming message
     */
    async processIncomingMessage(contactId, contactName, messageContent, messageType = 'text') {
        let conversation = this.activeConversations.get(contactId);
        
        if (!conversation) {
            conversation = this.startConversation(contactId, contactName, messageContent);
        }
        
        // Update conversation
        conversation.lastActivity = new Date();
        conversation.messages.push({
            type: 'incoming',
            content: messageContent,
            timestamp: new Date(),
            messageType
        });
        
        // Detect topics and intent
        const detectedTopics = this.detectTopics(messageContent);
        detectedTopics.forEach(topic => conversation.topics.add(topic));
        
        // Record in analytics database
        await this.analyticsService.recordChatInteraction(
            contactId,
            contactName,
            messageType,
            messageContent,
            null, // No response yet
            0, // No response time yet
            0 // No quality score yet
        );
        
        this.emit('message_received', {
            contactId,
            contactName,
            messageContent,
            messageType,
            detectedTopics,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📨 Message received from ${contactName}: ${messageContent.substring(0, 50)}...`);
        return conversation;
    }

    /**
     * Process outgoing response
     */
    async processOutgoingResponse(contactId, responseContent, responseTime) {
        const conversation = this.activeConversations.get(contactId);
        
        if (!conversation) {
            console.warn(`⚠️ No active conversation found for ${contactId}`);
            return null;
        }
        
        // Calculate quality score
        const qualityScore = this.calculateResponseQuality(responseContent, conversation);
        
        // Update conversation
        conversation.lastActivity = new Date();
        conversation.responseCount++;
        conversation.messages.push({
            type: 'outgoing',
            content: responseContent,
            timestamp: new Date(),
            responseTime,
            qualityScore
        });
        
        // Update average response time
        if (conversation.averageResponseTime === 0) {
            conversation.averageResponseTime = responseTime;
        } else {
            conversation.averageResponseTime = 
                (conversation.averageResponseTime + responseTime) / 2;
        }
        
        // Update quality score
        conversation.qualityScore = 
            (conversation.qualityScore * (conversation.responseCount - 1) + qualityScore) / 
            conversation.responseCount;
        
        // Update analytics database
        const lastMessage = conversation.messages.find(m => m.type === 'incoming');
        if (lastMessage) {
            await this.analyticsService.recordChatInteraction(
                contactId,
                conversation.name,
                'text',
                lastMessage.content,
                responseContent,
                responseTime,
                qualityScore
            );
        }
        
        // Update global metrics
        this.updateResponseTimeMetrics(responseTime);
        this.updateQualityMetrics(qualityScore);
        
        this.emit('response_sent', {
            contactId,
            contactName: conversation.name,
            responseContent,
            responseTime,
            qualityScore,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📤 Response sent to ${conversation.name}: ${responseTime}ms, Quality: ${qualityScore.toFixed(1)}`);
        return conversation;
    }

    /**
     * Detect topics in message content
     */
    detectTopics(messageContent) {
        const topics = [];
        const content = messageContent.toLowerCase();
        
        const topicKeywords = {
            'market_analysis': ['market', 'nifty', 'sensex', 'index', 'analysis'],
            'stock_advice': ['stock', 'buy', 'sell', 'recommendation', 'target'],
            'mutual_funds': ['mutual fund', 'sip', 'investment', 'portfolio'],
            'trading': ['trading', 'intraday', 'swing', 'technical'],
            'general_inquiry': ['hello', 'hi', 'help', 'thank', 'info']
        };
        
        Object.keys(topicKeywords).forEach(topic => {
            if (topicKeywords[topic].some(keyword => content.includes(keyword))) {
                topics.push(topic);
            }
        });
        
        return topics.length > 0 ? topics : ['general_inquiry'];
    }

    /**
     * Calculate response quality score (0-5)
     */
    calculateResponseQuality(responseContent, conversation) {
        let score = 2.0; // Base score
        
        // Length factor (longer responses generally better for financial advice)
        if (responseContent.length > 200) score += 0.5;
        if (responseContent.length > 500) score += 0.5;
        
        // Quality patterns
        if (this.qualityPatterns.excellent.some(pattern => pattern.test(responseContent))) {
            score += 1.5;
        } else if (this.qualityPatterns.good.some(pattern => pattern.test(responseContent))) {
            score += 1.0;
        } else if (this.qualityPatterns.basic.some(pattern => pattern.test(responseContent))) {
            score += 0.5;
        }
        
        // Context relevance (if response matches conversation topics)
        const responseTopics = this.detectTopics(responseContent);
        const commonTopics = responseTopics.filter(topic => conversation.topics.has(topic));
        if (commonTopics.length > 0) {
            score += 0.5;
        }
        
        // Financial advice indicators
        if (/₹|rs|rupee|percent|target|support|resistance/i.test(responseContent)) {
            score += 0.5;
        }
        
        // Structured response (bullets, numbers)
        if (/[•*]\s|^\d+\.|:\s*$|Target:|Support:|Resistance:/gm.test(responseContent)) {
            score += 0.3;
        }
        
        return Math.min(5.0, Math.max(1.0, score)); // Clamp between 1-5
    }

    /**
     * Mark conversation as completed
     */
    completeConversation(contactId, completionType = 'natural') {
        const conversation = this.activeConversations.get(contactId);
        
        if (conversation) {
            conversation.status = 'completed';
            conversation.endTime = new Date();
            conversation.completionType = completionType;
            conversation.duration = conversation.endTime - conversation.startTime;
            
            this.conversationMetrics.completedConversations++;
            
            this.emit('conversation_completed', {
                contactId,
                contactName: conversation.name,
                duration: conversation.duration,
                messageCount: conversation.messages.length,
                qualityScore: conversation.qualityScore,
                completionType,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Conversation completed: ${conversation.name} (${conversation.duration}ms)`);
        }
    }

    /**
     * Get real-time CRM metrics
     */
    getCRMMetrics() {
        const activeCount = Array.from(this.activeConversations.values())
            .filter(conv => conv.status === 'active').length;
        
        const completionRate = this.conversationMetrics.totalConversations > 0 ?
            (this.conversationMetrics.completedConversations / this.conversationMetrics.totalConversations) * 100 : 0;
        
        return {
            active_conversations: activeCount,
            total_conversations: this.conversationMetrics.totalConversations,
            completed_conversations: this.conversationMetrics.completedConversations,
            completion_rate: Math.round(completionRate * 10) / 10,
            avg_response_time: Math.round(this.conversationMetrics.averageResponseTime),
            avg_quality_score: Math.round(this.conversationMetrics.averageQualityScore * 10) / 10,
            response_time_trend: this.getResponseTimeTrend(),
            quality_trend: this.getQualityTrend(),
            topic_distribution: this.getTopicDistribution(),
            peak_hours: this.getPeakHours()
        };
    }

    /**
     * Get detailed conversation analytics
     */
    getConversationAnalytics() {
        const conversations = Array.from(this.activeConversations.values());
        
        return {
            total_active: conversations.filter(c => c.status === 'active').length,
            longest_conversation: this.getLongestConversation(conversations),
            most_active_user: this.getMostActiveUser(conversations),
            average_messages_per_conversation: this.getAverageMessagesPerConversation(conversations),
            response_time_distribution: this.getResponseTimeDistribution(conversations),
            quality_distribution: this.getQualityDistribution(conversations)
        };
    }

    /**
     * Update response time metrics
     */
    updateResponseTimeMetrics(responseTime) {
        this.conversationMetrics.responseTimeHistory.push({
            time: responseTime,
            timestamp: new Date()
        });
        
        // Keep only last 100 response times
        if (this.conversationMetrics.responseTimeHistory.length > 100) {
            this.conversationMetrics.responseTimeHistory = 
                this.conversationMetrics.responseTimeHistory.slice(-100);
        }
        
        // Recalculate average
        const totalTime = this.conversationMetrics.responseTimeHistory
            .reduce((sum, entry) => sum + entry.time, 0);
        this.conversationMetrics.averageResponseTime = 
            totalTime / this.conversationMetrics.responseTimeHistory.length;
    }

    /**
     * Update quality metrics
     */
    updateQualityMetrics(qualityScore) {
        this.conversationMetrics.qualityScoreHistory.push({
            score: qualityScore,
            timestamp: new Date()
        });
        
        // Keep only last 100 quality scores
        if (this.conversationMetrics.qualityScoreHistory.length > 100) {
            this.conversationMetrics.qualityScoreHistory = 
                this.conversationMetrics.qualityScoreHistory.slice(-100);
        }
        
        // Recalculate average
        const totalScore = this.conversationMetrics.qualityScoreHistory
            .reduce((sum, entry) => sum + entry.score, 0);
        this.conversationMetrics.averageQualityScore = 
            totalScore / this.conversationMetrics.qualityScoreHistory.length;
    }

    /**
     * Get response time trend (improving/declining)
     */
    getResponseTimeTrend() {
        if (this.conversationMetrics.responseTimeHistory.length < 10) {
            return 'stable';
        }
        
        const recent = this.conversationMetrics.responseTimeHistory.slice(-10);
        const earlier = this.conversationMetrics.responseTimeHistory.slice(-20, -10);
        
        const recentAvg = recent.reduce((sum, entry) => sum + entry.time, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, entry) => sum + entry.time, 0) / earlier.length;
        
        if (recentAvg < earlierAvg * 0.9) return 'improving';
        if (recentAvg > earlierAvg * 1.1) return 'declining';
        return 'stable';
    }

    /**
     * Get quality trend
     */
    getQualityTrend() {
        if (this.conversationMetrics.qualityScoreHistory.length < 10) {
            return 'stable';
        }
        
        const recent = this.conversationMetrics.qualityScoreHistory.slice(-10);
        const earlier = this.conversationMetrics.qualityScoreHistory.slice(-20, -10);
        
        const recentAvg = recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, entry) => sum + entry.score, 0) / earlier.length;
        
        if (recentAvg > earlierAvg * 1.05) return 'improving';
        if (recentAvg < earlierAvg * 0.95) return 'declining';
        return 'stable';
    }

    /**
     * Get topic distribution
     */
    getTopicDistribution() {
        const topicCounts = {};
        
        this.activeConversations.forEach(conversation => {
            conversation.topics.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        });
        
        return topicCounts;
    }

    /**
     * Get peak conversation hours
     */
    getPeakHours() {
        const hourCounts = {};
        
        this.activeConversations.forEach(conversation => {
            const hour = conversation.startTime.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const sortedHours = Object.keys(hourCounts)
            .sort((a, b) => hourCounts[b] - hourCounts[a]);
        
        return sortedHours.slice(0, 3).map(hour => `${hour}:00`);
    }

    /**
     * Helper methods for analytics
     */
    getLongestConversation(conversations) {
        return conversations.reduce((longest, current) => {
            const currentDuration = current.lastActivity - current.startTime;
            const longestDuration = longest ? longest.lastActivity - longest.startTime : 0;
            return currentDuration > longestDuration ? current : longest;
        }, null);
    }

    getMostActiveUser(conversations) {
        const userMessageCounts = {};
        conversations.forEach(conv => {
            userMessageCounts[conv.name] = conv.messages.length;
        });
        
        return Object.keys(userMessageCounts).reduce((a, b) => 
            userMessageCounts[a] > userMessageCounts[b] ? a : b, 'N/A'
        );
    }

    getAverageMessagesPerConversation(conversations) {
        if (conversations.length === 0) return 0;
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        return Math.round((totalMessages / conversations.length) * 10) / 10;
    }

    getResponseTimeDistribution(conversations) {
        const distribution = { fast: 0, medium: 0, slow: 0 };
        
        conversations.forEach(conv => {
            if (conv.averageResponseTime < 2000) distribution.fast++;
            else if (conv.averageResponseTime < 5000) distribution.medium++;
            else distribution.slow++;
        });
        
        return distribution;
    }

    getQualityDistribution(conversations) {
        const distribution = { excellent: 0, good: 0, average: 0 };
        
        conversations.forEach(conv => {
            if (conv.qualityScore >= 4) distribution.excellent++;
            else if (conv.qualityScore >= 3) distribution.good++;
            else distribution.average++;
        });
        
        return distribution;
    }

    /**
     * Clean up old inactive conversations
     */
    cleanupOldConversations() {
        const oneHourAgo = new Date(Date.now() - 3600000);
        const toDelete = [];
        
        this.activeConversations.forEach((conversation, contactId) => {
            if (conversation.lastActivity < oneHourAgo && conversation.status === 'active') {
                this.completeConversation(contactId, 'timeout');
                toDelete.push(contactId);
            }
        });
        
        toDelete.forEach(contactId => {
            this.activeConversations.delete(contactId);
        });
        
        if (toDelete.length > 0) {
            console.log(`🧹 Cleaned up ${toDelete.length} inactive conversations`);
        }
    }

    /**
     * Update overall metrics
     */
    updateMetrics() {
        this.emit('metrics_updated', this.getCRMMetrics());
    }

    /**
     * Stop monitoring and cleanup
     */
    stop() {
        console.log('🔌 CRM monitoring service stopped');
        if (this.analyticsService) {
            this.analyticsService.close();
        }
    }
}

module.exports = CRMMonitorService;