// STORY 3.2 DASHBOARD INTEGRATION - EVENTS LOGGER
// SQLite database for webhook event tracking - ZERO impact on production webhook

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class WebhookEventsLogger {
    constructor() {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.dbPath = path.join(dataDir, 'webhook_events.db');
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Events Logger DB Error:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Events Logger connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const createEventsTable = `
            CREATE TABLE IF NOT EXISTS webhook_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                advisor_phone TEXT,
                event_data JSON,
                button_id TEXT,
                message_type TEXT,
                processed BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createMetricsTable = `
            CREATE TABLE IF NOT EXISTS webhook_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                button_clicks INTEGER DEFAULT 0,
                text_messages INTEGER DEFAULT 0,
                content_deliveries INTEGER DEFAULT 0,
                successful_deliveries INTEGER DEFAULT 0,
                failed_deliveries INTEGER DEFAULT 0,
                response_time_avg REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date)
            )
        `;

        const createConversationsTable = `
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                advisor_phone TEXT NOT NULL,
                message_type TEXT,
                content TEXT,
                direction TEXT, -- 'incoming' or 'outgoing'
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ai_response_time REAL,
                satisfaction_score INTEGER
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(createEventsTable);
                this.db.run(createMetricsTable);
                this.db.run(createConversationsTable, (err) => {
                    if (err) {
                        console.error('❌ Error creating tables:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Events Logger tables initialized');
                        resolve();
                    }
                });
            });
        });
    }

    // Core logging methods for webhook integration
    logButtonClick(advisorPhone, buttonId, eventData = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO webhook_events 
            (event_type, advisor_phone, button_id, event_data, message_type) 
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(['button_click', advisorPhone, buttonId, JSON.stringify(eventData), 'interactive']);
        stmt.finalize();

        // Update daily metrics
        this.updateDailyMetrics('button_clicks', 1);
        
        console.log(`📊 [EVENTS] Button click logged: ${buttonId} from ${advisorPhone}`);
    }

    logTextMessage(advisorPhone, messageText, direction = 'incoming') {
        const stmt = this.db.prepare(`
            INSERT INTO webhook_events 
            (event_type, advisor_phone, event_data, message_type) 
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run(['text_message', advisorPhone, JSON.stringify({text: messageText, direction}), 'text']);
        stmt.finalize();

        // Also log in conversations table
        const convStmt = this.db.prepare(`
            INSERT INTO conversations 
            (advisor_phone, message_type, content, direction) 
            VALUES (?, ?, ?, ?)
        `);
        
        convStmt.run([advisorPhone, 'text', messageText, direction]);
        convStmt.finalize();

        if (direction === 'incoming') {
            this.updateDailyMetrics('text_messages', 1);
        }

        console.log(`📊 [EVENTS] Text message logged: ${direction} from ${advisorPhone}`);
    }

    logContentDelivery(advisorPhone, contentId, success, responseTime = 0) {
        const stmt = this.db.prepare(`
            INSERT INTO webhook_events 
            (event_type, advisor_phone, event_data, message_type) 
            VALUES (?, ?, ?, ?)
        `);
        
        const eventData = {
            contentId,
            success,
            responseTime,
            deliveryTime: new Date().toISOString()
        };
        
        stmt.run(['content_delivery', advisorPhone, JSON.stringify(eventData), 'content']);
        stmt.finalize();

        // Update metrics
        this.updateDailyMetrics('content_deliveries', 1);
        if (success) {
            this.updateDailyMetrics('successful_deliveries', 1);
        } else {
            this.updateDailyMetrics('failed_deliveries', 1);
        }

        console.log(`📊 [EVENTS] Content delivery logged: ${contentId} - ${success ? 'SUCCESS' : 'FAILED'}`);
    }

    updateDailyMetrics(metric, increment) {
        const today = new Date().toISOString().split('T')[0];
        
        // Upsert daily metrics
        const stmt = this.db.prepare(`
            INSERT INTO webhook_metrics (date, ${metric}) 
            VALUES (?, ?)
            ON CONFLICT(date) DO UPDATE SET 
            ${metric} = ${metric} + ?
        `);
        
        stmt.run([today, increment, increment]);
        stmt.finalize();
    }

    // Query methods for dashboard API
    async getButtonClickMetrics(days = 7) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE(timestamp) as date,
                    button_id,
                    COUNT(*) as clicks
                FROM webhook_events 
                WHERE event_type = 'button_click' 
                AND timestamp >= datetime('now', '-${days} days')
                GROUP BY DATE(timestamp), button_id
                ORDER BY date DESC
            `;
            
            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getConversationMetrics(days = 7) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as total_conversations,
                    AVG(ai_response_time) as avg_response_time,
                    AVG(satisfaction_score) as avg_satisfaction
                FROM conversations 
                WHERE timestamp >= datetime('now', '-${days} days')
                GROUP BY DATE(timestamp)
                ORDER BY date DESC
            `;
            
            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getDashboardMetrics() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    SUM(button_clicks) as total_button_clicks,
                    SUM(text_messages) as total_text_messages,
                    SUM(content_deliveries) as total_content_deliveries,
                    SUM(successful_deliveries) as successful_deliveries,
                    SUM(failed_deliveries) as failed_deliveries,
                    AVG(response_time_avg) as avg_response_time
                FROM webhook_metrics 
                WHERE date >= date('now', '-30 days')
            `;
            
            this.db.get(query, (err, row) => {
                if (err) reject(err);
                else resolve(row || {});
            });
        });
    }

    async getRecentEvents(limit = 50) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM webhook_events 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getActiveConversations(limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    advisor_phone,
                    MAX(timestamp) as last_activity,
                    COUNT(*) as message_count
                FROM conversations 
                WHERE timestamp >= datetime('now', '-24 hours')
                GROUP BY advisor_phone
                ORDER BY last_activity DESC
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Error closing events database:', err.message);
                } else {
                    console.log('✅ Events database connection closed');
                }
            });
        }
    }
}

// Singleton instance for global use
const eventsLogger = new WebhookEventsLogger();

module.exports = eventsLogger;