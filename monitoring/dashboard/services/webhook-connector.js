/**
 * Story 3.2 Webhook Data Connector Service
 * Connects Dashboard to Story 3.2 Webhook System for real-time monitoring
 */

const axios = require('axios');
const EventEmitter = require('events');
const WebSocket = require('ws');

class WebhookConnector extends EventEmitter {
    constructor() {
        super();
        this.webhookBaseUrl = process.env.WEBHOOK_URL || 'http://localhost:3000';
        this.ngrokUrl = 'https://6ecac5910ac8.ngrok-free.app';
        this.isConnected = false;
        this.healthCheckInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Data storage for real-time metrics
        this.metrics = {
            status: 'unknown',
            uptime: 0,
            lastHeartbeat: null,
            messagesProcessed: 0,
            buttonClicks: {
                daily: {
                    'UNLOCK_IMAGES': 0,
                    'UNLOCK_CONTENT': 0,
                    'UNLOCK_UPDATES': 0,
                    'RETRIEVE_CONTENT': 0,
                    'SHARE_WITH_CLIENTS': 0
                },
                hourly: {}
            },
            chatMetrics: {
                activeConversations: 0,
                averageResponseTime: 0,
                dailyVolume: 0,
                completionRate: 0
            },
            errors: [],
            performance: {
                avgProcessingTime: 0,
                successRate: 100
            }
        };

        this.startMonitoring();
    }

    /**
     * Initialize webhook monitoring
     */
    startMonitoring() {
        console.log('🔗 Starting webhook connector monitoring...');
        
        // Initial health check
        this.checkWebhookHealth();
        
        // Set up periodic health checks
        this.healthCheckInterval = setInterval(() => {
            this.checkWebhookHealth();
        }, 30000); // Check every 30 seconds

        // Initialize hourly metrics tracking
        this.initializeHourlyTracking();
    }

    /**
     * Check webhook health status
     */
    async checkWebhookHealth() {
        try {
            const response = await axios.get(`${this.ngrokUrl}/health`, {
                timeout: 5000,
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.data.status === 'healthy') {
                this.metrics.status = 'healthy';
                this.metrics.lastHeartbeat = new Date().toISOString();
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                this.emit('health_update', {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: response.data.service || 'Story 3.2 Webhook'
                });
            }
        } catch (error) {
            this.handleConnectionError(error);
        }
    }

    /**
     * Handle connection errors and implement retry logic
     */
    handleConnectionError(error) {
        this.metrics.status = 'error';
        this.isConnected = false;
        this.reconnectAttempts++;

        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: error.message,
            attempt: this.reconnectAttempts
        };

        this.metrics.errors.push(errorInfo);
        
        // Keep only last 50 errors
        if (this.metrics.errors.length > 50) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }

        this.emit('health_update', {
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            reconnectAttempts: this.reconnectAttempts
        });

        // Exponential backoff for reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            setTimeout(() => this.checkWebhookHealth(), backoffTime);
        }

        console.error(`❌ Webhook connection error (attempt ${this.reconnectAttempts}):`, error.message);
    }

    /**
     * Initialize hourly tracking for button clicks
     */
    initializeHourlyTracking() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Initialize 24 hours of data
        for (let i = 0; i < 24; i++) {
            this.metrics.buttonClicks.hourly[i] = 0;
        }

        // Reset hourly counter every hour
        setInterval(() => {
            const hour = new Date().getHours();
            if (!this.metrics.buttonClicks.hourly[hour]) {
                this.metrics.buttonClicks.hourly[hour] = 0;
            }
        }, 3600000); // Every hour
    }

    /**
     * Simulate button click tracking (for demonstration)
     * In production, this would receive real webhook events
     */
    recordButtonClick(buttonType, timestamp = new Date()) {
        if (this.metrics.buttonClicks.daily[buttonType] !== undefined) {
            this.metrics.buttonClicks.daily[buttonType]++;
            
            const hour = timestamp.getHours();
            this.metrics.buttonClicks.hourly[hour]++;
            
            this.emit('button_click', {
                type: buttonType,
                timestamp: timestamp.toISOString(),
                dailyTotal: this.metrics.buttonClicks.daily[buttonType],
                hourlyTotal: this.metrics.buttonClicks.hourly[hour]
            });
        }
    }

    /**
     * Record chat interaction
     */
    recordChatInteraction(messageType, responseTime, contactName) {
        this.metrics.chatMetrics.dailyVolume++;
        
        // Update average response time
        if (this.metrics.chatMetrics.averageResponseTime === 0) {
            this.metrics.chatMetrics.averageResponseTime = responseTime;
        } else {
            this.metrics.chatMetrics.averageResponseTime = 
                (this.metrics.chatMetrics.averageResponseTime + responseTime) / 2;
        }

        this.emit('chat_interaction', {
            type: messageType,
            responseTime,
            contactName,
            timestamp: new Date().toISOString(),
            dailyVolume: this.metrics.chatMetrics.dailyVolume,
            avgResponseTime: this.metrics.chatMetrics.averageResponseTime
        });
    }

    /**
     * Get current webhook metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.calculateUptime(),
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Calculate uptime percentage
     */
    calculateUptime() {
        // Simple uptime calculation based on successful vs failed checks
        const totalErrors = this.metrics.errors.length;
        const totalChecks = Math.max(1, totalErrors + 100); // Assume 100 successful checks for demo
        return Math.round((100 - (totalErrors / totalChecks) * 100) * 10) / 10;
    }

    /**
     * Get button analytics for dashboard widgets
     */
    getButtonAnalytics() {
        const total = Object.values(this.metrics.buttonClicks.daily)
            .reduce((sum, count) => sum + count, 0);

        return {
            daily_totals: this.metrics.buttonClicks.daily,
            hourly_distribution: this.metrics.buttonClicks.hourly,
            total_clicks: total,
            most_popular: this.getMostPopularButton(),
            click_rate: this.calculateClickRate()
        };
    }

    /**
     * Get most popular button type
     */
    getMostPopularButton() {
        const clicks = this.metrics.buttonClicks.daily;
        return Object.keys(clicks).reduce((a, b) => 
            clicks[a] > clicks[b] ? a : b
        );
    }

    /**
     * Calculate click rate (clicks per hour)
     */
    calculateClickRate() {
        const totalClicks = Object.values(this.metrics.buttonClicks.daily)
            .reduce((sum, count) => sum + count, 0);
        const hoursActive = 24; // Assuming 24-hour tracking
        return Math.round((totalClicks / hoursActive) * 10) / 10;
    }

    /**
     * Get CRM analytics
     */
    getCRMAnalytics() {
        return {
            active_conversations: this.metrics.chatMetrics.activeConversations,
            avg_response_time: Math.round(this.metrics.chatMetrics.averageResponseTime * 100) / 100,
            daily_volume: this.metrics.chatMetrics.dailyVolume,
            completion_rate: this.metrics.chatMetrics.completionRate,
            quality_score: this.calculateQualityScore()
        };
    }

    /**
     * Calculate conversation quality score
     */
    calculateQualityScore() {
        // Simple quality score based on response time and completion rate
        const responseScore = Math.max(0, 5 - (this.metrics.chatMetrics.averageResponseTime / 1000));
        const completionScore = (this.metrics.chatMetrics.completionRate / 100) * 5;
        return Math.round(((responseScore + completionScore) / 2) * 10) / 10;
    }

    /**
     * Start real-time event simulation (for demo purposes)
     */
    startEventSimulation() {
        console.log('🎯 Starting webhook event simulation...');
        
        // Simulate button clicks
        setInterval(() => {
            const buttons = ['UNLOCK_CONTENT', 'UNLOCK_IMAGES', 'UNLOCK_UPDATES', 'RETRIEVE_CONTENT'];
            const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
            this.recordButtonClick(randomButton);
        }, 30000); // Every 30 seconds

        // Simulate chat interactions
        setInterval(() => {
            const responseTime = Math.random() * 3000 + 500; // 500ms to 3.5s
            this.recordChatInteraction('text', responseTime, `User${Math.floor(Math.random() * 100)}`);
        }, 45000); // Every 45 seconds
    }

    /**
     * Stop monitoring and cleanup
     */
    stop() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.isConnected = false;
        console.log('🔌 Webhook connector monitoring stopped');
    }
}

module.exports = WebhookConnector;