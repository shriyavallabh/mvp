/**
 * Story 3.2 Webhook Integration - Real-time Dashboard Widgets
 * Handles WebSocket connections and updates webhook monitoring widgets
 */

class WebhookDashboard {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.charts = {};
        this.eventBuffer = [];
        this.maxEvents = 50;
        
        this.initialize();
    }

    /**
     * Initialize WebSocket connection and UI components
     */
    initialize() {
        this.connectWebSocket();
        this.initializeCharts();
        this.startHeartbeat();
        
        console.log('🔗 Webhook dashboard initialized');
    }

    /**
     * Connect to WebSocket server
     */
    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:3001/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                
                // Subscribe to all event types
                this.ws.send(JSON.stringify({
                    type: 'subscribe',
                    channels: ['all']
                }));
                
                // Request initial metrics
                this.ws.send(JSON.stringify({
                    type: 'request_metrics'
                }));
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
            
        } catch (error) {
            console.error('❌ Failed to connect WebSocket:', error);
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'initial_data':
            case 'current_metrics':
                this.updateDashboardMetrics(message.data);
                break;
                
            case 'webhook_status':
                this.updateWebhookStatus(message.data);
                break;
                
            case 'button_click':
                this.handleButtonClick(message.data);
                break;
                
            case 'chat_interaction':
                this.handleChatInteraction(message.data);
                break;
                
            case 'button_analytics':
                this.updateButtonAnalytics(message.data);
                break;
                
            case 'crm_metrics':
                this.updateCRMMetrics(message.data);
                break;
                
            case 'system_health':
                this.updateSystemHealth(message.data);
                break;
                
            case 'system_event':
            case 'alert':
                this.addLiveEvent(message);
                break;
                
            case 'pong':
                // Heartbeat response
                break;
                
            default:
                console.log('📨 Unknown WebSocket message type:', message.type);
        }
    }

    /**
     * Update dashboard with comprehensive metrics
     */
    updateDashboardMetrics(data) {
        if (data.webhook_status) {
            this.updateWebhookStatus(data.webhook_status);
        }
        
        if (data.button_analytics) {
            this.updateButtonAnalytics(data.button_analytics);
        }
        
        if (data.crm_metrics) {
            this.updateCRMMetrics(data.crm_metrics);
        }
        
        if (data.system_health) {
            this.updateSystemHealth(data.system_health);
        }
    }

    /**
     * Update webhook status widgets
     */
    updateWebhookStatus(data) {
        // Update main webhook status
        const statusElement = document.getElementById('webhook-status');
        const statusIndicator = document.getElementById('webhook-status-indicator');
        const uptimeElement = document.getElementById('webhook-uptime');
        const messagesElement = document.getElementById('webhook-messages');
        
        if (statusElement) {
            statusElement.className = data.status === 'healthy' ? 'badge bg-success' : 'badge bg-danger';
            statusElement.textContent = data.status === 'healthy' ? 'Healthy' : 'Error';
        }
        
        if (statusIndicator) {
            statusIndicator.className = data.isConnected ? 'badge bg-success ms-auto' : 'badge bg-danger ms-auto';
            statusIndicator.textContent = data.isConnected ? 'Connected' : 'Disconnected';
        }
        
        if (uptimeElement) {
            uptimeElement.textContent = `${data.uptime || 0}%`;
        }
        
        if (messagesElement) {
            messagesElement.textContent = data.messagesProcessed || 0;
        }
    }

    /**
     * Update button analytics widgets
     */
    updateButtonAnalytics(data) {
        // Update total button clicks
        const totalClicksElement = document.getElementById('total-button-clicks');
        const popularButtonElement = document.getElementById('popular-button');
        
        if (totalClicksElement && data.total_clicks !== undefined) {
            totalClicksElement.textContent = data.total_clicks;
        }
        
        // Find most popular button
        if (popularButtonElement && data.daily_totals) {
            const mostPopular = Object.keys(data.daily_totals).reduce((a, b) => 
                data.daily_totals[a] > data.daily_totals[b] ? a : b
            );
            popularButtonElement.textContent = mostPopular.replace('_', ' ');
        }
        
        // Update button clicks chart
        if (data.hourly_distribution) {
            this.updateButtonClicksChart(data.hourly_distribution);
        }
    }

    /**
     * Update CRM metrics widgets
     */
    updateCRMMetrics(data) {
        const activeChatsElement = document.getElementById('active-chats');
        const avgResponseTimeElement = document.getElementById('avg-response-time');
        const qualityScoreElement = document.getElementById('ai-quality-score');
        const qualityTrendElement = document.getElementById('quality-trend');
        
        if (activeChatsElement) {
            activeChatsElement.textContent = data.active_conversations || 0;
        }
        
        if (avgResponseTimeElement) {
            const responseTime = data.avg_response_time ? (data.avg_response_time / 1000).toFixed(1) : '0';
            avgResponseTimeElement.textContent = responseTime;
        }
        
        if (qualityScoreElement) {
            qualityScoreElement.textContent = data.avg_quality_score || '4.2';
        }
        
        if (qualityTrendElement && data.quality_trend) {
            const trendIcons = {
                'improving': '↗️ Improving',
                'declining': '↘️ Declining',
                'stable': '➡️ Stable'
            };
            qualityTrendElement.textContent = trendIcons[data.quality_trend] || '➡️ Stable';
        }
    }

    /**
     * Handle real-time button click events
     */
    handleButtonClick(data) {
        // Update click counters immediately
        this.incrementClickCounter();
        
        // Add to live events
        this.addLiveEvent({
            type: 'button_click',
            data: {
                message: `Button clicked: ${data.type.replace('_', ' ')}`,
                timestamp: data.timestamp,
                user: 'User'
            }
        });
        
        // Update last event indicator
        this.updateLastEvent(`Button: ${data.type}`);
    }

    /**
     * Handle real-time chat interaction events
     */
    handleChatInteraction(data) {
        // Add to live events
        this.addLiveEvent({
            type: 'chat_interaction',
            data: {
                message: `Chat message received`,
                timestamp: data.timestamp,
                user: data.contactName || 'User'
            }
        });
        
        // Update last event indicator
        this.updateLastEvent('Chat received');
        
        // Update active chats counter
        const activeChatsElement = document.getElementById('active-chats');
        if (activeChatsElement) {
            const currentCount = parseInt(activeChatsElement.textContent) || 0;
            activeChatsElement.textContent = Math.max(1, currentCount);
        }
    }

    /**
     * Initialize Chart.js charts
     */
    initializeCharts() {
        // Button clicks chart
        const buttonClicksCtx = document.getElementById('buttonClicksChart');
        if (buttonClicksCtx) {
            this.charts.buttonClicks = new Chart(buttonClicksCtx, {
                type: 'bar',
                data: {
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                        label: 'Button Clicks',
                        data: new Array(24).fill(0),
                        backgroundColor: 'rgba(255, 193, 7, 0.6)',
                        borderColor: 'rgba(255, 193, 7, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        },
                        x: {
                            ticks: {
                                maxTicksLimit: 12
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Update button clicks chart
     */
    updateButtonClicksChart(hourlyData) {
        if (this.charts.buttonClicks && hourlyData) {
            const chartData = Array.from({length: 24}, (_, hour) => {
                return hourlyData[hour] ? hourlyData[hour].total : 0;
            });
            
            this.charts.buttonClicks.data.datasets[0].data = chartData;
            this.charts.buttonClicks.update();
        }
    }

    /**
     * Add live event to the events panel
     */
    addLiveEvent(message) {
        const eventsContainer = document.getElementById('live-events');
        if (!eventsContainer) return;
        
        const eventData = message.data || message;
        const timestamp = new Date(eventData.timestamp || Date.now());
        const timeString = timestamp.toLocaleTimeString();
        
        const eventElement = document.createElement('div');
        eventElement.className = 'mb-2 p-2 border-start border-3 border-primary bg-light rounded';
        eventElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong class="text-primary">${eventData.message || eventData.type}</strong>
                    ${eventData.user ? `<br><small class="text-muted">by ${eventData.user}</small>` : ''}
                </div>
                <small class="text-muted">${timeString}</small>
            </div>
        `;
        
        // Add to buffer and DOM
        this.eventBuffer.unshift(eventElement);
        eventsContainer.insertBefore(eventElement, eventsContainer.firstChild);
        
        // Remove old events to prevent memory issues
        if (this.eventBuffer.length > this.maxEvents) {
            const oldEvent = this.eventBuffer.pop();
            if (oldEvent.parentNode) {
                oldEvent.parentNode.removeChild(oldEvent);
            }
        }
        
        // Auto-scroll to top for new events
        eventsContainer.scrollTop = 0;
    }

    /**
     * Update last event indicator
     */
    updateLastEvent(eventText) {
        const lastEventElement = document.getElementById('last-event');
        if (lastEventElement) {
            lastEventElement.textContent = `Last: ${eventText}`;
        }
    }

    /**
     * Increment click counter with animation
     */
    incrementClickCounter() {
        const clicksElement = document.getElementById('total-button-clicks');
        if (clicksElement) {
            const currentCount = parseInt(clicksElement.textContent) || 0;
            clicksElement.textContent = currentCount + 1;
            
            // Add pulse animation
            clicksElement.classList.add('pulse-animation');
            setTimeout(() => {
                clicksElement.classList.remove('pulse-animation');
            }, 1000);
        }
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected) {
        const connectionElement = document.getElementById('webhook-connection');
        const statusIndicator = document.getElementById('webhook-status-indicator');
        const liveEventIndicator = document.getElementById('live-event-indicator');
        
        if (connectionElement) {
            connectionElement.className = isConnected ? 'badge bg-success' : 'badge bg-danger';
            connectionElement.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
        
        if (statusIndicator) {
            statusIndicator.className = isConnected ? 'badge bg-success ms-auto' : 'badge bg-danger ms-auto';
            statusIndicator.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
        
        if (liveEventIndicator) {
            liveEventIndicator.className = isConnected ? 'text-success' : 'text-danger';
            liveEventIndicator.innerHTML = isConnected ? 
                '<i class="bi bi-circle-fill"></i> Live' : 
                '<i class="bi bi-circle"></i> Offline';
        }
    }

    /**
     * Attempt to reconnect WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            
            console.log(`🔄 Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            console.error('❌ Max WebSocket reconnection attempts reached');
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // 30 seconds
    }

    /**
     * Manual refresh function
     */
    refresh() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_metrics'
            }));
        } else {
            // Fallback to REST API
            this.fetchMetricsViaREST();
        }
    }

    /**
     * Fallback REST API metrics fetch
     */
    async fetchMetricsViaREST() {
        try {
            const response = await fetch('/api/webhook/metrics');
            const data = await response.json();
            
            // Update widgets with REST data
            this.updateWebhookStatus({
                status: 'healthy',
                uptime: data.uptime_percentage || 99.5,
                messagesProcessed: data.total_messages || 0,
                isConnected: true
            });
            
            this.updateButtonAnalytics({
                total_clicks: data.total_button_clicks || 0,
                daily_totals: data.button_totals || {},
                hourly_distribution: data.hourly_stats || {}
            });
            
        } catch (error) {
            console.error('❌ Failed to fetch metrics via REST:', error);
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        console.log('🧹 Webhook dashboard cleaned up');
    }
}

// Initialize webhook dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.webhookDashboard = new WebhookDashboard();
});

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    .pulse-animation {
        animation: pulse 1s ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); color: #ffc107; }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);