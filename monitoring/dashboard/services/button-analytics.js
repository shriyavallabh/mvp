/**
 * Button Analytics Service for Story 3.2 Click-to-Unlock Integration
 * Aggregates and analyzes button click data from webhook events
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class ButtonAnalyticsService {
    constructor() {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '../../../../data');
        if (!require('fs').existsSync(dataDir)) {
            require('fs').mkdirSync(dataDir, { recursive: true });
        }
        
        this.dbPath = path.join(dataDir, 'webhook_events.db');
        this.db = null;
        this.initializeDatabase();
    }

    /**
     * Initialize SQLite database for button analytics
     */
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error opening button analytics database:', err);
                    reject(err);
                    return;
                }
                
                console.log('✅ Button analytics database connected');
                
                // Create tables if they don't exist
                this.createTables().then(resolve).catch(reject);
            });
        });
    }

    /**
     * Create necessary tables for button analytics
     */
    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS button_clicks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                button_type VARCHAR(50) NOT NULL,
                contact_id VARCHAR(50) NOT NULL,
                contact_name VARCHAR(100),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_time_ms INTEGER,
                success BOOLEAN DEFAULT 1,
                metadata TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS chat_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contact_id VARCHAR(50) NOT NULL,
                contact_name VARCHAR(100),
                message_type VARCHAR(20) NOT NULL,
                message_content TEXT,
                response_content TEXT,
                response_time_ms INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ai_quality_score REAL DEFAULT 0,
                conversation_completed BOOLEAN DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS webhook_health (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                status VARCHAR(20) NOT NULL,
                response_time_ms INTEGER,
                error_message TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                uptime_percentage REAL DEFAULT 100
            )`,

            `CREATE INDEX IF NOT EXISTS idx_button_clicks_timestamp ON button_clicks(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_button_clicks_type ON button_clicks(button_type)`,
            `CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_interactions(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_webhook_health_timestamp ON webhook_health(timestamp)`
        ];

        for (const query of queries) {
            await this.runQuery(query);
        }

        console.log('✅ Button analytics tables initialized');
    }

    /**
     * Execute a database query
     */
    runQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function(err) {
                if (err) {
                    console.error('❌ Database query error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Execute a database query and return results
     */
    getQuery(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('❌ Database query error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Record a button click event
     */
    async recordButtonClick(buttonType, contactId, contactName, responseTimeMs = null, metadata = {}) {
        try {
            await this.runQuery(
                `INSERT INTO button_clicks 
                (button_type, contact_id, contact_name, response_time_ms, metadata) 
                VALUES (?, ?, ?, ?, ?)`,
                [buttonType, contactId, contactName, responseTimeMs, JSON.stringify(metadata)]
            );
            
            console.log(`📊 Button click recorded: ${buttonType} by ${contactName}`);
            return true;
        } catch (error) {
            console.error('❌ Error recording button click:', error);
            return false;
        }
    }

    /**
     * Record a chat interaction
     */
    async recordChatInteraction(contactId, contactName, messageType, messageContent, 
                               responseContent, responseTimeMs, qualityScore = 0) {
        try {
            await this.runQuery(
                `INSERT INTO chat_interactions 
                (contact_id, contact_name, message_type, message_content, 
                 response_content, response_time_ms, ai_quality_score) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [contactId, contactName, messageType, messageContent, 
                 responseContent, responseTimeMs, qualityScore]
            );
            
            console.log(`💬 Chat interaction recorded: ${messageType} by ${contactName}`);
            return true;
        } catch (error) {
            console.error('❌ Error recording chat interaction:', error);
            return false;
        }
    }

    /**
     * Record webhook health status
     */
    async recordWebhookHealth(status, responseTimeMs = null, errorMessage = null, uptimePercentage = 100) {
        try {
            await this.runQuery(
                `INSERT INTO webhook_health 
                (status, response_time_ms, error_message, uptime_percentage) 
                VALUES (?, ?, ?, ?)`,
                [status, responseTimeMs, errorMessage, uptimePercentage]
            );
            
            return true;
        } catch (error) {
            console.error('❌ Error recording webhook health:', error);
            return false;
        }
    }

    /**
     * Get button click analytics for today
     */
    async getTodayButtonAnalytics() {
        try {
            const query = `
                SELECT 
                    button_type,
                    COUNT(*) as clicks,
                    AVG(response_time_ms) as avg_response_time,
                    COUNT(DISTINCT contact_id) as unique_users
                FROM button_clicks 
                WHERE DATE(timestamp) = DATE('now')
                GROUP BY button_type
                ORDER BY clicks DESC
            `;
            
            const results = await this.getQuery(query);
            
            return {
                daily_totals: results.reduce((acc, row) => {
                    acc[row.button_type] = row.clicks;
                    return acc;
                }, {}),
                response_times: results.reduce((acc, row) => {
                    acc[row.button_type] = Math.round(row.avg_response_time || 0);
                    return acc;
                }, {}),
                unique_users: results.reduce((acc, row) => {
                    acc[row.button_type] = row.unique_users;
                    return acc;
                }, {}),
                total_clicks: results.reduce((sum, row) => sum + row.clicks, 0)
            };
        } catch (error) {
            console.error('❌ Error getting button analytics:', error);
            return { daily_totals: {}, response_times: {}, unique_users: {}, total_clicks: 0 };
        }
    }

    /**
     * Get hourly button click distribution
     */
    async getHourlyButtonDistribution() {
        try {
            const query = `
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as clicks,
                    button_type
                FROM button_clicks 
                WHERE DATE(timestamp) = DATE('now')
                GROUP BY hour, button_type
                ORDER BY hour
            `;
            
            const results = await this.getQuery(query);
            
            // Initialize 24-hour structure
            const hourlyData = {};
            for (let i = 0; i < 24; i++) {
                hourlyData[i] = { total: 0, by_type: {} };
            }
            
            // Fill with actual data
            results.forEach(row => {
                const hour = parseInt(row.hour);
                hourlyData[hour].total += row.clicks;
                hourlyData[hour].by_type[row.button_type] = row.clicks;
            });
            
            return hourlyData;
        } catch (error) {
            console.error('❌ Error getting hourly distribution:', error);
            return {};
        }
    }

    /**
     * Get chat interaction analytics
     */
    async getChatAnalytics() {
        try {
            const queries = {
                today: `
                    SELECT 
                        COUNT(*) as total_chats,
                        AVG(response_time_ms) as avg_response_time,
                        AVG(ai_quality_score) as avg_quality_score,
                        COUNT(DISTINCT contact_id) as unique_users
                    FROM chat_interactions 
                    WHERE DATE(timestamp) = DATE('now')
                `,
                active: `
                    SELECT COUNT(DISTINCT contact_id) as active_conversations
                    FROM chat_interactions 
                    WHERE timestamp > datetime('now', '-1 hour')
                `,
                completion: `
                    SELECT 
                        (CAST(SUM(CASE WHEN conversation_completed = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*)) * 100 as completion_rate
                    FROM chat_interactions 
                    WHERE DATE(timestamp) = DATE('now')
                `
            };
            
            const [todayStats, activeStats, completionStats] = await Promise.all([
                this.getQuery(queries.today),
                this.getQuery(queries.active),
                this.getQuery(queries.completion)
            ]);
            
            return {
                daily_volume: todayStats[0]?.total_chats || 0,
                avg_response_time: Math.round(todayStats[0]?.avg_response_time || 0),
                quality_score: Math.round((todayStats[0]?.avg_quality_score || 0) * 10) / 10,
                unique_users: todayStats[0]?.unique_users || 0,
                active_conversations: activeStats[0]?.active_conversations || 0,
                completion_rate: Math.round((completionStats[0]?.completion_rate || 0) * 10) / 10
            };
        } catch (error) {
            console.error('❌ Error getting chat analytics:', error);
            return {
                daily_volume: 0,
                avg_response_time: 0,
                quality_score: 0,
                unique_users: 0,
                active_conversations: 0,
                completion_rate: 0
            };
        }
    }

    /**
     * Get webhook health metrics
     */
    async getWebhookHealthMetrics() {
        try {
            const query = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(response_time_ms) as avg_response_time,
                    MAX(timestamp) as last_check
                FROM webhook_health 
                WHERE timestamp > datetime('now', '-24 hours')
                GROUP BY status
            `;
            
            const results = await this.getQuery(query);
            
            const totalChecks = results.reduce((sum, row) => sum + row.count, 0);
            const healthyChecks = results.find(row => row.status === 'healthy')?.count || 0;
            const uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;
            
            return {
                uptime_percentage: Math.round(uptime * 10) / 10,
                total_checks: totalChecks,
                healthy_checks: healthyChecks,
                avg_response_time: Math.round(results.find(row => row.status === 'healthy')?.avg_response_time || 0),
                last_check: results[0]?.last_check || null,
                status_breakdown: results.reduce((acc, row) => {
                    acc[row.status] = row.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('❌ Error getting webhook health metrics:', error);
            return {
                uptime_percentage: 0,
                total_checks: 0,
                healthy_checks: 0,
                avg_response_time: 0,
                last_check: null,
                status_breakdown: {}
            };
        }
    }

    /**
     * Get comprehensive dashboard metrics
     */
    async getDashboardMetrics() {
        try {
            const [buttonAnalytics, chatAnalytics, webhookHealth, hourlyDistribution] = await Promise.all([
                this.getTodayButtonAnalytics(),
                this.getChatAnalytics(),
                this.getWebhookHealthMetrics(),
                this.getHourlyButtonDistribution()
            ]);

            return {
                timestamp: new Date().toISOString(),
                button_analytics: buttonAnalytics,
                chat_analytics: chatAnalytics,
                webhook_health: webhookHealth,
                hourly_distribution: hourlyDistribution,
                summary: {
                    total_interactions: buttonAnalytics.total_clicks + chatAnalytics.daily_volume,
                    system_health: webhookHealth.uptime_percentage > 95 ? 'excellent' : 
                                  webhookHealth.uptime_percentage > 90 ? 'good' : 'needs_attention',
                    most_popular_button: this.getMostPopularButton(buttonAnalytics.daily_totals),
                    peak_hour: this.getPeakHour(hourlyDistribution)
                }
            };
        } catch (error) {
            console.error('❌ Error getting dashboard metrics:', error);
            return null;
        }
    }

    /**
     * Helper: Get most popular button type
     */
    getMostPopularButton(dailyTotals) {
        return Object.keys(dailyTotals).reduce((a, b) => 
            dailyTotals[a] > dailyTotals[b] ? a : b, 'N/A'
        );
    }

    /**
     * Helper: Get peak hour
     */
    getPeakHour(hourlyData) {
        let maxHour = 0;
        let maxClicks = 0;
        
        Object.keys(hourlyData).forEach(hour => {
            if (hourlyData[hour].total > maxClicks) {
                maxClicks = hourlyData[hour].total;
                maxHour = parseInt(hour);
            }
        });
        
        return `${maxHour}:00`;
    }

    /**
     * Clean old data (keep last 30 days)
     */
    async cleanOldData() {
        try {
            const queries = [
                `DELETE FROM button_clicks WHERE timestamp < datetime('now', '-30 days')`,
                `DELETE FROM chat_interactions WHERE timestamp < datetime('now', '-30 days')`,
                `DELETE FROM webhook_health WHERE timestamp < datetime('now', '-7 days')`
            ];

            for (const query of queries) {
                await this.runQuery(query);
            }

            console.log('✅ Old analytics data cleaned');
            return true;
        } catch (error) {
            console.error('❌ Error cleaning old data:', error);
            return false;
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing analytics database:', err);
                } else {
                    console.log('✅ Analytics database connection closed');
                }
            });
        }
    }
}

module.exports = ButtonAnalyticsService;