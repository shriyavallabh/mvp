// STORY 3.2 DASHBOARD INTEGRATION - WEBSOCKET SERVER
// Port 3001 - Real-time event streaming for Story 4.2 dashboard
// ZERO impact on production webhook (webhook-meta-grade.js)

const WebSocket = require('ws');
const eventsLogger = require('./events-logger');
const fs = require('fs');
const path = require('path');

class DashboardWebSocketServer {
    constructor(port = 3001) {
        this.port = port;
        this.wss = null;
        this.clients = new Set();
        this.eventQueue = [];
        this.isPolling = false;
        
        // Configuration
        this.config = {
            heartbeatInterval: 30000,  // 30 seconds
            eventPollingInterval: 2000, // 2 seconds
            maxQueueSize: 100,
            clientTimeout: 60000 // 1 minute
        };
    }

    async start() {
        try {
            // Create WebSocket server
            this.wss = new WebSocket.Server({ 
                port: this.port,
                perMessageDeflate: false,
                clientTracking: true
            });

            console.log('🌐 WEBSOCKET SERVER STARTING');
            console.log('=' .repeat(50));
            console.log(`📡 Port: ${this.port}`);
            console.log(`❤️  Heartbeat: ${this.config.heartbeatInterval}ms`);
            console.log(`🔄 Polling: ${this.config.eventPollingInterval}ms`);
            console.log('=' .repeat(50));

            this.setupEventHandlers();
            this.startEventPolling();
            this.startHeartbeat();
            
            console.log('✅ WebSocket server started successfully');
            
        } catch (error) {
            console.error('❌ Failed to start WebSocket server:', error.message);
            throw error;
        }
    }

    setupEventHandlers() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            ws.clientId = clientId;
            ws.isAlive = true;
            ws.connectedAt = new Date();
            
            this.clients.add(ws);
            
            console.log(`🔗 [WS] Client connected: ${clientId} (${this.clients.size} total)`);
            
            // Send welcome message with current stats
            this.sendToClient(ws, {
                type: 'connection_established',
                clientId: clientId,
                timestamp: new Date().toISOString(),
                server_info: {
                    version: '1.0',
                    service: 'Dashboard WebSocket',
                    features: ['real_time_events', 'heartbeat', 'metrics_stream']
                }
            });

            // Send initial dashboard data
            this.sendInitialData(ws);

            // Handle client messages
            ws.on('message', (message) => {
                this.handleClientMessage(ws, message);
            });

            // Handle client disconnect
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🔌 [WS] Client disconnected: ${clientId} (${this.clients.size} remaining)`);
            });

            // Handle client errors
            ws.on('error', (error) => {
                console.error(`❌ [WS] Client error for ${clientId}:`, error.message);
                this.clients.delete(ws);
            });

            // Pong handler for heartbeat
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        this.wss.on('error', (error) => {
            console.error('❌ [WS] Server error:', error.message);
        });
    }

    async sendInitialData(ws) {
        try {
            const [dashboardMetrics, recentEvents] = await Promise.all([
                eventsLogger.getDashboardMetrics(),
                eventsLogger.getRecentEvents(20)
            ]);

            this.sendToClient(ws, {
                type: 'initial_data',
                data: {
                    dashboard_metrics: dashboardMetrics,
                    recent_events: recentEvents.slice(0, 10),
                    connection_stats: {
                        active_clients: this.clients.size,
                        server_uptime: process.uptime(),
                        last_event_time: recentEvents[0]?.timestamp || null
                    }
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ [WS] Error sending initial data:', error.message);
        }
    }

    handleClientMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            console.log(`📨 [WS] Message from ${ws.clientId}: ${data.type}`);
            
            switch (data.type) {
                case 'ping':
                    this.sendToClient(ws, {
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                case 'request_metrics':
                    this.sendMetricsUpdate(ws);
                    break;
                    
                case 'subscribe':
                    ws.subscriptions = data.channels || ['all'];
                    this.sendToClient(ws, {
                        type: 'subscription_confirmed',
                        channels: ws.subscriptions,
                        timestamp: new Date().toISOString()
                    });
                    break;
                    
                default:
                    console.log(`⚠️ [WS] Unknown message type: ${data.type}`);
            }
            
        } catch (error) {
            console.error(`❌ [WS] Error handling message from ${ws.clientId}:`, error.message);
        }
    }

    async sendMetricsUpdate(ws = null) {
        try {
            const metrics = await eventsLogger.getDashboardMetrics();
            const recentEvents = await eventsLogger.getRecentEvents(5);
            
            const updateMessage = {
                type: 'metrics_update',
                data: {
                    metrics: metrics,
                    recent_events: recentEvents,
                    active_clients: this.clients.size,
                    server_uptime: process.uptime()
                },
                timestamp: new Date().toISOString()
            };
            
            if (ws) {
                this.sendToClient(ws, updateMessage);
            } else {
                this.broadcast(updateMessage);
            }
            
        } catch (error) {
            console.error('❌ [WS] Error sending metrics update:', error.message);
        }
    }

    startEventPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.lastEventId = 0;
        
        setInterval(async () => {
            try {
                if (this.clients.size === 0) return; // No clients to update
                
                const recentEvents = await eventsLogger.getRecentEvents(10);
                
                // Filter for new events since last poll
                const newEvents = recentEvents.filter(event => event.id > this.lastEventId);
                
                if (newEvents.length > 0) {
                    this.lastEventId = Math.max(...newEvents.map(e => e.id));
                    
                    // Broadcast new events to all clients
                    this.broadcast({
                        type: 'new_events',
                        events: newEvents,
                        count: newEvents.length,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log(`📡 [WS] Broadcasted ${newEvents.length} new events to ${this.clients.size} clients`);
                }
                
            } catch (error) {
                console.error('❌ [WS] Error in event polling:', error.message);
            }
        }, this.config.eventPollingInterval);
        
        console.log(`🔄 [WS] Event polling started (${this.config.eventPollingInterval}ms interval)`);
    }

    startHeartbeat() {
        setInterval(() => {
            const deadClients = [];
            
            this.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    deadClients.push(ws);
                    return;
                }
                
                ws.isAlive = false;
                ws.ping();
            });
            
            // Remove dead clients
            deadClients.forEach(ws => {
                console.log(`💀 [WS] Removing dead client: ${ws.clientId}`);
                this.clients.delete(ws);
                ws.terminate();
            });
            
            if (deadClients.length > 0) {
                console.log(`❤️  [WS] Heartbeat: ${this.clients.size} active clients`);
            }
            
        }, this.config.heartbeatInterval);
        
        console.log(`❤️ [WS] Heartbeat started (${this.config.heartbeatInterval}ms interval)`);
    }

    broadcast(message, filter = null) {
        let sentCount = 0;
        
        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                if (!filter || filter(ws)) {
                    this.sendToClient(ws, message);
                    sentCount++;
                }
            }
        });
        
        return sentCount;
    }

    sendToClient(ws, message) {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                return true;
            }
        } catch (error) {
            console.error(`❌ [WS] Error sending to client ${ws.clientId}:`, error.message);
        }
        return false;
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public methods for external event triggering
    async notifyButtonClick(advisorPhone, buttonId, eventData = {}) {
        const message = {
            type: 'button_click',
            data: {
                advisor_phone: advisorPhone,
                button_id: buttonId,
                event_data: eventData,
                timestamp: new Date().toISOString()
            }
        };
        
        const sentCount = this.broadcast(message);
        console.log(`🔘 [WS] Button click notification sent to ${sentCount} clients`);
    }

    async notifyContentDelivery(advisorPhone, contentId, success, responseTime = 0) {
        const message = {
            type: 'content_delivery',
            data: {
                advisor_phone: advisorPhone,
                content_id: contentId,
                success: success,
                response_time: responseTime,
                timestamp: new Date().toISOString()
            }
        };
        
        const sentCount = this.broadcast(message);
        console.log(`📦 [WS] Content delivery notification sent to ${sentCount} clients`);
    }

    async notifyTextMessage(advisorPhone, messageText, direction = 'incoming') {
        const message = {
            type: 'text_message',
            data: {
                advisor_phone: advisorPhone,
                message: messageText,
                direction: direction,
                timestamp: new Date().toISOString()
            }
        };
        
        const sentCount = this.broadcast(message);
        console.log(`💬 [WS] Text message notification sent to ${sentCount} clients`);
    }

    getStats() {
        return {
            active_clients: this.clients.size,
            server_uptime: process.uptime(),
            event_queue_size: this.eventQueue.length,
            last_event_id: this.lastEventId || 0,
            heartbeat_interval: this.config.heartbeatInterval,
            polling_interval: this.config.eventPollingInterval
        };
    }

    async stop() {
        console.log('🔄 [WS] Shutting down WebSocket server...');
        
        this.isPolling = false;
        
        // Close all client connections
        this.clients.forEach(ws => {
            this.sendToClient(ws, {
                type: 'server_shutdown',
                message: 'Server is shutting down',
                timestamp: new Date().toISOString()
            });
            ws.close();
        });
        
        // Close server
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('✅ [WS] WebSocket server stopped');
    }
}

// Create singleton instance
const wsServer = new DashboardWebSocketServer(3001);

// Start server if running directly
if (require.main === module) {
    wsServer.start().catch(error => {
        console.error('❌ Failed to start WebSocket server:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🔄 [WS] Graceful shutdown initiated...');
        await wsServer.stop();
        process.exit(0);
    });
}

module.exports = wsServer;