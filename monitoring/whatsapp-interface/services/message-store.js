// Message Storage Service using SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class MessageStore {
    constructor() {
        this.dbPath = path.join(__dirname, '../../../../data/conversations.db');
        this.db = null;
        this.initDatabase();
    }
    
    async initDatabase() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            await fs.mkdir(dataDir, { recursive: true });
            
            // Open database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                } else {
                    console.log('Connected to conversations database');
                    this.createTables();
                }
            });
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }
    
    createTables() {
        const createMessagesTable = `
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                advisor_id TEXT NOT NULL,
                phone TEXT NOT NULL,
                direction TEXT CHECK(direction IN ('sent', 'received')),
                type TEXT CHECK(type IN ('text', 'image', 'document', 'template', 'button')),
                content TEXT,
                media_url TEXT,
                status TEXT DEFAULT 'pending',
                timestamp TEXT NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        const createAdvisorsTable = `
            CREATE TABLE IF NOT EXISTS advisors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                arn TEXT UNIQUE,
                email TEXT,
                online BOOLEAN DEFAULT 0,
                last_seen TEXT,
                unread_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // Create tables synchronously first
        this.db.serialize(() => {
            // Create messages table
            this.db.run(createMessagesTable, (err) => {
                if (err) {
                    console.error('Error creating messages table:', err);
                } else {
                    console.log('Messages table ready');
                    
                    // Create indexes for messages table after table is created
                    const messageIndexes = [
                        'CREATE INDEX IF NOT EXISTS idx_messages_advisor ON messages(advisor_id)',
                        'CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone)',
                        'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
                        'CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)'
                    ];
                    
                    messageIndexes.forEach(index => {
                        this.db.run(index, (err) => {
                            if (err) console.error('Error creating index:', err);
                        });
                    });
                }
            });
            
            // Create advisors table
            this.db.run(createAdvisorsTable, (err) => {
                if (err) {
                    console.error('Error creating advisors table:', err);
                } else {
                    console.log('Advisors table ready');
                    
                    // Create index for advisors table after table is created
                    this.db.run('CREATE INDEX IF NOT EXISTS idx_advisors_phone ON advisors(phone)', (err) => {
                        if (err) console.error('Error creating index:', err);
                    });
                }
            });
        });
        
        // Set up trigger to update updated_at timestamp
        const updateTrigger = `
            CREATE TRIGGER IF NOT EXISTS update_messages_timestamp 
            AFTER UPDATE ON messages 
            BEGIN 
                UPDATE messages SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = NEW.id; 
            END
        `;
        
        this.db.run(updateTrigger);
    }
    
    // Save a new message
    async saveMessage(message) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO messages (id, advisor_id, phone, direction, type, content, media_url, status, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                message.id || this.generateMessageId(),
                message.advisor_id,
                message.phone,
                message.direction,
                message.type || 'text',
                message.content,
                message.media_url,
                message.status || 'pending',
                message.timestamp || new Date().toISOString(),
                JSON.stringify(message.metadata || {})
            ];
            
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error saving message:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, message_id: params[0] });
                }
            });
        });
    }
    
    // Get conversation history for an advisor
    async getConversation(advisorId, limit = 100, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM messages 
                WHERE advisor_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(sql, [advisorId, limit, offset], (err, rows) => {
                if (err) {
                    console.error('Error fetching conversation:', err);
                    reject(err);
                } else {
                    // Parse metadata and reverse order for display
                    const messages = rows.map(row => ({
                        ...row,
                        metadata: row.metadata ? JSON.parse(row.metadata) : {}
                    })).reverse();
                    resolve(messages);
                }
            });
        });
    }
    
    // Update message status
    async updateMessageStatus(messageId, status) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE messages 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            
            this.db.run(sql, [status, messageId], function(err) {
                if (err) {
                    console.error('Error updating message status:', err);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }
    
    // Save or update advisor
    async saveAdvisor(advisor) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO advisors (id, name, phone, arn, email, online, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(phone) DO UPDATE SET
                    name = excluded.name,
                    arn = excluded.arn,
                    email = excluded.email,
                    online = excluded.online,
                    last_seen = excluded.last_seen,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            const params = [
                advisor.id || advisor.arn || this.generateAdvisorId(),
                advisor.name,
                advisor.phone,
                advisor.arn,
                advisor.email,
                advisor.online || false,
                advisor.last_seen || new Date().toISOString()
            ];
            
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error saving advisor:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }
    
    // Get all advisors with last message
    async getAdvisors() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    a.*,
                    m.content as lastMessage,
                    m.timestamp as lastTime,
                    (SELECT COUNT(*) FROM messages 
                     WHERE advisor_id = a.id 
                     AND direction = 'received' 
                     AND status != 'read') as unreadCount
                FROM advisors a
                LEFT JOIN (
                    SELECT advisor_id, content, timestamp
                    FROM messages
                    WHERE (advisor_id, timestamp) IN (
                        SELECT advisor_id, MAX(timestamp)
                        FROM messages
                        GROUP BY advisor_id
                    )
                ) m ON a.id = m.advisor_id
                ORDER BY m.timestamp DESC NULLS LAST
            `;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching advisors:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    // Get advisor by ID
    async getAdvisor(advisorId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM advisors WHERE id = ?';
            
            this.db.get(sql, [advisorId], (err, row) => {
                if (err) {
                    console.error('Error fetching advisor:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
    
    // Mark messages as read
    async markMessagesAsRead(advisorId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE messages 
                SET status = 'read' 
                WHERE advisor_id = ? 
                AND direction = 'received' 
                AND status != 'read'
            `;
            
            this.db.run(sql, [advisorId], function(err) {
                if (err) {
                    console.error('Error marking messages as read:', err);
                    reject(err);
                } else {
                    // Reset unread count for advisor
                    const resetSql = 'UPDATE advisors SET unread_count = 0 WHERE id = ?';
                    this.db.run(resetSql, [advisorId]);
                    resolve({ changes: this.changes });
                }
            });
        });
    }
    
    // Search messages
    async searchMessages(query, advisorId = null) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT m.*, a.name as advisor_name 
                FROM messages m
                JOIN advisors a ON m.advisor_id = a.id
                WHERE m.content LIKE ?
            `;
            
            const params = [`%${query}%`];
            
            if (advisorId) {
                sql += ' AND m.advisor_id = ?';
                params.push(advisorId);
            }
            
            sql += ' ORDER BY m.timestamp DESC LIMIT 50';
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error searching messages:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    // Get messages by date range
    async getMessagesByDateRange(startDate, endDate, advisorId = null) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT * FROM messages 
                WHERE timestamp BETWEEN ? AND ?
            `;
            
            const params = [startDate, endDate];
            
            if (advisorId) {
                sql += ' AND advisor_id = ?';
                params.push(advisorId);
            }
            
            sql += ' ORDER BY timestamp DESC';
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error fetching messages by date:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    // Delete old messages (data retention)
    async deleteOldMessages(daysToKeep = 90) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const sql = `
                DELETE FROM messages 
                WHERE timestamp < ?
            `;
            
            this.db.run(sql, [cutoffDate.toISOString()], function(err) {
                if (err) {
                    console.error('Error deleting old messages:', err);
                    reject(err);
                } else {
                    console.log(`Deleted ${this.changes} old messages`);
                    resolve({ deleted: this.changes });
                }
            });
        });
    }
    
    // Get message statistics
    async getMessageStats(advisorId = null) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN direction = 'sent' THEN 1 ELSE 0 END) as sent,
                    SUM(CASE WHEN direction = 'received' THEN 1 ELSE 0 END) as received,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN type = 'image' OR type = 'document' THEN 1 ELSE 0 END) as media
                FROM messages
            `;
            
            const params = [];
            
            if (advisorId) {
                sql += ' WHERE advisor_id = ?';
                params.push(advisorId);
            }
            
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error fetching stats:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
    
    // Sync advisors from Google Sheets (called on startup)
    async syncAdvisorsFromSheets(advisorsData) {
        const promises = advisorsData.map(advisor => this.saveAdvisor(advisor));
        return Promise.all(promises);
    }
    
    // Generate unique IDs
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateAdvisorId() {
        return `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = MessageStore;