/**
 * WebSocket Server for Real-time Dashboard Updates
 * Streams webhook events, metrics, and system status to dashboard clients
 */

const WebSocket = require('ws');
const http = require('http');
const EventEmitter = require('events');
const WebhookConnector = require('./webhook-connector');
const CRMMonitorService = require('./crm-monitor');
const ButtonAnalyticsService = require('./button-analytics');

class WebSocketServer extends EventEmitter {
    constructor(port = 3001) {
        super();
        this.port = port;
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        
        // Initialize monitoring services
        this.webhookConnector = new WebhookConnector();
        this.crmMonitor = new CRMMonitorService();
        this.analyticsService = new ButtonAnalyticsService();
        
        // Metrics cache for efficient broadcasting
        this.metricsCache = {
            webhook_status: null,
            button_analytics: null,
            crm_metrics: null,
            system_health: null
        };
        
        this.initialize();
    }

    /**
     * Initialize WebSocket server
     */
    async initialize() {
        try {
            // Create HTTP server for WebSocket upgrade
            this.server = http.createServer();
            
            // Create WebSocket server
            this.wss = new WebSocket.Server({ 
                server: this.server,
                path: '/ws'
            });
            
            // Set up WebSocket event handlers
            this.setupWebSocketHandlers();
            
            // Set up monitoring service event handlers
            this.setupMonitoringHandlers();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            // Start the server
            this.server.listen(this.port, () => {
                console.log(`🔌 WebSocket server listening on port ${this.port}`);
                console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}/ws`);
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize WebSocket server:', error);
        }
    }

    /**
     * Set up WebSocket connection handlers
     */
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            console.log(`🔗 New WebSocket client connected from ${req.socket.remoteAddress}`);
            
            // Add client to active connections
            this.clients.add(ws);
            
            // Send initial data to new client
            this.sendInitialData(ws);
            
            // Handle client messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleClientMessage(ws, message);
                } catch (error) {
                    console.error('❌ Invalid WebSocket message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            
            // Handle client disconnection
            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
                this.clients.delete(ws);
            });
            
            // Handle connection errors
            ws.on('error', (error) => {
                console.error('❌ WebSocket client error:', error);
                this.clients.delete(ws);
            });
            
            // Send heartbeat to keep connection alive
            const heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000); // 30 seconds
        });
    }

    /**
     * Set up monitoring service event handlers
     */
    setupMonitoringHandlers() {
        // Webhook connector events
        this.webhookConnector.on('health_update', (data) => {
            this.metricsCache.webhook_status = data;
            this.broadcast('webhook_status', data);
        });
        
        this.webhookConnector.on('button_click', (data) => {
            this.broadcast('button_click', data);
        });
        
        this.webhookConnector.on('chat_interaction', (data) => {
            this.broadcast('chat_interaction', data);
        });
        
        // CRM monitor events
        this.crmMonitor.on('conversation_started', (data) => {
            this.broadcast('conversation_started', data);
        });
        
        this.crmMonitor.on('message_received', (data) => {
            this.broadcast('message_received', data);
        });
        
        this.crmMonitor.on('response_sent', (data) => {
            this.broadcast('response_sent', data);
        });
        
        this.crmMonitor.on('conversation_completed', (data) => {
            this.broadcast('conversation_completed', data);
        });
        
        this.crmMonitor.on('metrics_updated', (data) => {
            this.metricsCache.crm_metrics = data;
            this.broadcast('crm_metrics', data);
        });
    }

    /**
     * Send initial data to newly connected client
     */
    async sendInitialData(ws) {
        try {
            // Send current metrics
            const initialData = {
                webhook_status: this.metricsCache.webhook_status || await this.getWebhookStatus(),
                button_analytics: this.metricsCache.button_analytics || await this.getButtonAnalytics(),
                crm_metrics: this.metricsCache.crm_metrics || await this.getCRMMetrics(),
                system_health: this.metricsCache.system_health || await this.getSystemHealth()
            };
            
            ws.send(JSON.stringify({
                type: 'initial_data',
                data: initialData,
                timestamp: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('❌ Error sending initial data:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to load initial data'
            }));
        }
    }

    /**
     * Handle incoming client messages
     */
    handleClientMessage(ws, message) {
        switch (message.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;
                
            case 'subscribe':
                // Handle subscription to specific data streams
                ws.subscriptions = message.channels || [];
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channels: ws.subscriptions,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case 'request_metrics':
                // Send current metrics on demand
                this.sendCurrentMetrics(ws);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${message.type}`
                }));
        }
    }

    /**
     * Broadcast message to all connected clients
     */
    broadcast(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });
        
        // Remove disconnected clients
        const deadClients = [];
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                // Check if client is subscribed to this type of update
                if (!client.subscriptions || client.subscriptions.includes(type) || client.subscriptions.includes('all')) {
                    client.send(message);
                }
            } else {
                deadClients.push(client);
            }
        });
        
        // Clean up dead connections
        deadClients.forEach(client => {
            this.clients.delete(client);
        });
        
        console.log(`📡 Broadcasted ${type} to ${this.clients.size} clients`);
    }

    /**
     * Start periodic metric updates
     */
    startPeriodicUpdates() {
        // Update webhook metrics every 30 seconds
        setInterval(async () => {
            try {
                const webhookStatus = await this.getWebhookStatus();
                if (JSON.stringify(webhookStatus) !== JSON.stringify(this.metricsCache.webhook_status)) {
                    this.metricsCache.webhook_status = webhookStatus;
                    this.broadcast('webhook_status', webhookStatus);
                }
            } catch (error) {
                console.error('❌ Error updating webhook status:', error);
            }
        }, 30000);
        
        // Update button analytics every 60 seconds
        setInterval(async () => {
            try {
                const buttonAnalytics = await this.getButtonAnalytics();
                if (JSON.stringify(buttonAnalytics) !== JSON.stringify(this.metricsCache.button_analytics)) {
                    this.metricsCache.button_analytics = buttonAnalytics;
                    this.broadcast('button_analytics', buttonAnalytics);
                }
            } catch (error) {
                console.error('❌ Error updating button analytics:', error);
            }
        }, 60000);
        
        // Update system health every 45 seconds
        setInterval(async () => {
            try {
                const systemHealth = await this.getSystemHealth();
                if (JSON.stringify(systemHealth) !== JSON.stringify(this.metricsCache.system_health)) {
                    this.metricsCache.system_health = systemHealth;
                    this.broadcast('system_health', systemHealth);
                }
            } catch (error) {
                console.error('❌ Error updating system health:', error);
            }
        }, 45000);
        
        console.log('📊 Started periodic metric updates');
    }

    /**
     * Get webhook status from connector
     */
    async getWebhookStatus() {
        const metrics = this.webhookConnector.getMetrics();
        return {
            status: metrics.status,
            uptime: metrics.uptime,
            isConnected: metrics.isConnected,
            lastHeartbeat: metrics.lastHeartbeat,
            messagesProcessed: metrics.messagesProcessed,
            reconnectAttempts: metrics.reconnectAttempts,
            errors: metrics.errors.slice(-5) // Last 5 errors
        };
    }

    /**
     * Get button analytics
     */
    async getButtonAnalytics() {
        const analytics = await this.analyticsService.getTodayButtonAnalytics();
        const hourlyDistribution = await this.analyticsService.getHourlyButtonDistribution();
        
        return {
            daily_totals: analytics.daily_totals,
            response_times: analytics.response_times,
            unique_users: analytics.unique_users,
            total_clicks: analytics.total_clicks,
            hourly_distribution: hourlyDistribution
        };
    }

    /**
     * Get CRM metrics
     */
    async getCRMMetrics() {
        const crmMetrics = this.crmMonitor.getCRMMetrics();
        const chatAnalytics = await this.analyticsService.getChatAnalytics();
        
        return {
            ...crmMetrics,
            database_metrics: chatAnalytics
        };
    }

    /**
     * Get system health metrics
     */
    async getSystemHealth() {
        const webhookHealth = await this.analyticsService.getWebhookHealthMetrics();
        
        return {
            webhook_health: webhookHealth,
            websocket_connections: this.clients.size,
            memory_usage: process.memoryUsage(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Send current metrics to specific client
     */
    async sendCurrentMetrics(ws) {
        try {
            const metrics = {
                webhook_status: await this.getWebhookStatus(),
                button_analytics: await this.getButtonAnalytics(),
                crm_metrics: await this.getCRMMetrics(),
                system_health: await this.getSystemHealth()
            };
            
            ws.send(JSON.stringify({
                type: 'current_metrics',
                data: metrics,
                timestamp: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('❌ Error sending current metrics:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to load current metrics'
            }));
        }
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            active_connections: this.clients.size,
            server_uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            port: this.port
        };
    }

    /**
     * Simulate real-time events for testing
     */
    startEventSimulation() {
        console.log('🎯 Starting WebSocket event simulation...');
        
        // Start event simulation in connector
        this.webhookConnector.startEventSimulation();
        
        // Simulate system events
        setInterval(() => {
            this.broadcast('system_event', {
                type: 'info',
                message: 'System performing routine maintenance check',
                timestamp: new Date().toISOString()
            });
        }, 120000); // Every 2 minutes
        
        // Simulate alerts occasionally
        setInterval(() => {
            const alertTypes = ['warning', 'info', 'success'];
            const alertMessages = [
                'High button click activity detected',
                'Response time improved',
                'New user conversation started',
                'Daily metrics updated'
            ];
            
            this.broadcast('alert', {
                level: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
                timestamp: new Date().toISOString()
            });
        }, 300000); // Every 5 minutes
    }

    /**
     * Stop WebSocket server
     */
    stop() {
        console.log('🔌 Stopping WebSocket server...');
        
        // Close all client connections
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close(1000, 'Server shutting down');
            }
        });
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        // Stop monitoring services
        if (this.webhookConnector) {
            this.webhookConnector.stop();
        }
        
        if (this.crmMonitor) {
            this.crmMonitor.stop();
        }
        
        if (this.analyticsService) {
            this.analyticsService.close();
        }
        
        console.log('✅ WebSocket server stopped');
    }
}

module.exports = WebSocketServer;