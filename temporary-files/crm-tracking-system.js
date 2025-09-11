#!/usr/bin/env node

/**
 * Story 3.2: CRM Tracking System
 * ================================
 * Tracks all advisor interactions, button clicks, and conversations
 * Provides analytics and insights for business intelligence
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Configuration
const CONFIG = {
    dbPath: '/home/mvp/data/crm.db',
    reportsDir: '/home/mvp/reports',
    analyticsPort: 3001
};

// Advisor mapping
const ADVISOR_INFO = {
    '919022810769': { name: 'Avalok', tier: 'premium', region: 'Mumbai' },
    '918369865935': { name: 'Vidyadhar', tier: 'premium', region: 'Pune' },
    '919137926441': { name: 'Shruti', tier: 'gold', region: 'Mumbai' }
};

/**
 * Initialize SQLite database
 */
async function initializeDatabase() {
    const db = await open({
        filename: CONFIG.dbPath,
        driver: sqlite3.Database
    });
    
    // Create tables if not exist
    await db.exec(`
        -- Advisor profiles
        CREATE TABLE IF NOT EXISTS advisors (
            phone TEXT PRIMARY KEY,
            name TEXT,
            tier TEXT,
            region TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active DATETIME
        );
        
        -- Button click events
        CREATE TABLE IF NOT EXISTS button_clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            advisor_phone TEXT,
            button_id TEXT,
            button_title TEXT,
            clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_id TEXT,
            FOREIGN KEY (advisor_phone) REFERENCES advisors(phone)
        );
        
        -- Chat conversations
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            advisor_phone TEXT,
            message_type TEXT CHECK(message_type IN ('user', 'bot')),
            content TEXT,
            context JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_id TEXT,
            FOREIGN KEY (advisor_phone) REFERENCES advisors(phone)
        );
        
        -- Content delivery log
        CREATE TABLE IF NOT EXISTS content_deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            advisor_phone TEXT,
            content_type TEXT,
            items_count INTEGER,
            success BOOLEAN,
            delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (advisor_phone) REFERENCES advisors(phone)
        );
        
        -- Webhook events
        CREATE TABLE IF NOT EXISTS webhook_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            payload JSON,
            processed BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Analytics summary
        CREATE TABLE IF NOT EXISTS daily_analytics (
            date DATE PRIMARY KEY,
            total_advisors INTEGER,
            active_advisors INTEGER,
            button_clicks INTEGER,
            messages_sent INTEGER,
            messages_received INTEGER,
            content_delivered INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_button_clicks_phone ON button_clicks(advisor_phone);
        CREATE INDEX IF NOT EXISTS idx_button_clicks_date ON button_clicks(clicked_at);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_phone ON chat_messages(advisor_phone);
        CREATE INDEX IF NOT EXISTS idx_content_deliveries_phone ON content_deliveries(advisor_phone);
    `);
    
    // Insert advisor profiles
    for (const [phone, info] of Object.entries(ADVISOR_INFO)) {
        await db.run(`
            INSERT OR IGNORE INTO advisors (phone, name, tier, region)
            VALUES (?, ?, ?, ?)
        `, [phone, info.name, info.tier, info.region]);
    }
    
    console.log('✅ CRM database initialized');
    return db;
}

/**
 * Track button click event
 */
async function trackButtonClick(db, phoneNumber, buttonId, buttonTitle, sessionId = null) {
    try {
        await db.run(`
            INSERT INTO button_clicks (advisor_phone, button_id, button_title, session_id)
            VALUES (?, ?, ?, ?)
        `, [phoneNumber, buttonId, buttonTitle, sessionId || generateSessionId()]);
        
        // Update advisor last active
        await db.run(`
            UPDATE advisors 
            SET last_active = CURRENT_TIMESTAMP 
            WHERE phone = ?
        `, [phoneNumber]);
        
        console.log(`✅ Tracked button click: ${buttonId} from ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Error tracking button click:', error);
        return false;
    }
}

/**
 * Track chat message
 */
async function trackChatMessage(db, phoneNumber, messageType, content, context = null, sessionId = null) {
    try {
        await db.run(`
            INSERT INTO chat_messages (advisor_phone, message_type, content, context, session_id)
            VALUES (?, ?, ?, ?, ?)
        `, [
            phoneNumber,
            messageType,
            content,
            context ? JSON.stringify(context) : null,
            sessionId || generateSessionId()
        ]);
        
        // Update advisor last active
        await db.run(`
            UPDATE advisors 
            SET last_active = CURRENT_TIMESTAMP 
            WHERE phone = ?
        `, [phoneNumber]);
        
        console.log(`✅ Tracked ${messageType} message from ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Error tracking chat message:', error);
        return false;
    }
}

/**
 * Track content delivery
 */
async function trackContentDelivery(db, phoneNumber, contentType, itemsCount, success = true) {
    try {
        await db.run(`
            INSERT INTO content_deliveries (advisor_phone, content_type, items_count, success)
            VALUES (?, ?, ?, ?)
        `, [phoneNumber, contentType, itemsCount, success ? 1 : 0]);
        
        console.log(`✅ Tracked content delivery: ${contentType} to ${phoneNumber}`);
        return true;
    } catch (error) {
        console.error('Error tracking content delivery:', error);
        return false;
    }
}

/**
 * Get advisor analytics
 */
async function getAdvisorAnalytics(db, phoneNumber) {
    const analytics = {};
    
    // Basic info
    analytics.profile = await db.get(`
        SELECT * FROM advisors WHERE phone = ?
    `, [phoneNumber]);
    
    // Button click stats
    analytics.buttonClicks = await db.all(`
        SELECT 
            button_id,
            COUNT(*) as count,
            MAX(clicked_at) as last_clicked
        FROM button_clicks
        WHERE advisor_phone = ?
        GROUP BY button_id
    `, [phoneNumber]);
    
    // Chat activity
    analytics.chatStats = await db.get(`
        SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
            COUNT(CASE WHEN message_type = 'bot' THEN 1 END) as bot_messages,
            MAX(created_at) as last_chat
        FROM chat_messages
        WHERE advisor_phone = ?
    `, [phoneNumber]);
    
    // Content delivery
    analytics.contentDelivery = await db.all(`
        SELECT 
            content_type,
            COUNT(*) as delivery_count,
            SUM(items_count) as total_items,
            AVG(items_count) as avg_items
        FROM content_deliveries
        WHERE advisor_phone = ?
        GROUP BY content_type
    `, [phoneNumber]);
    
    // Engagement score (0-100)
    const recentActivity = await db.get(`
        SELECT 
            COUNT(DISTINCT DATE(clicked_at)) as active_days
        FROM button_clicks
        WHERE advisor_phone = ?
        AND clicked_at >= datetime('now', '-30 days')
    `, [phoneNumber]);
    
    analytics.engagementScore = Math.min(100, (recentActivity.active_days / 30) * 100 + 
                                         (analytics.buttonClicks.length * 10));
    
    return analytics;
}

/**
 * Get daily analytics summary
 */
async function getDailyAnalytics(db, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const summary = {};
    
    // Active advisors
    summary.activeAdvisors = await db.get(`
        SELECT COUNT(DISTINCT advisor_phone) as count
        FROM (
            SELECT advisor_phone FROM button_clicks WHERE DATE(clicked_at) = ?
            UNION
            SELECT advisor_phone FROM chat_messages WHERE DATE(created_at) = ?
        )
    `, [targetDate, targetDate]);
    
    // Button clicks
    summary.buttonClicks = await db.all(`
        SELECT 
            button_id,
            COUNT(*) as count
        FROM button_clicks
        WHERE DATE(clicked_at) = ?
        GROUP BY button_id
    `, [targetDate]);
    
    // Messages
    summary.messages = await db.get(`
        SELECT 
            COUNT(CASE WHEN message_type = 'user' THEN 1 END) as received,
            COUNT(CASE WHEN message_type = 'bot' THEN 1 END) as sent
        FROM chat_messages
        WHERE DATE(created_at) = ?
    `, [targetDate]);
    
    // Content delivered
    summary.contentDelivered = await db.get(`
        SELECT 
            COUNT(*) as deliveries,
            SUM(items_count) as total_items
        FROM content_deliveries
        WHERE DATE(delivered_at) = ?
    `, [targetDate]);
    
    // Hourly distribution
    summary.hourlyActivity = await db.all(`
        SELECT 
            strftime('%H', clicked_at) as hour,
            COUNT(*) as clicks
        FROM button_clicks
        WHERE DATE(clicked_at) = ?
        GROUP BY hour
        ORDER BY hour
    `, [targetDate]);
    
    return summary;
}

/**
 * Generate engagement report
 */
async function generateEngagementReport(db) {
    const report = {
        generated_at: new Date().toISOString(),
        period: 'last_30_days',
        metrics: {}
    };
    
    // Overall metrics
    report.metrics.overview = await db.get(`
        SELECT 
            COUNT(DISTINCT advisor_phone) as total_advisors,
            COUNT(DISTINCT CASE 
                WHEN clicked_at >= datetime('now', '-7 days') 
                THEN advisor_phone 
            END) as active_last_7_days,
            COUNT(DISTINCT CASE 
                WHEN clicked_at >= datetime('now', '-30 days') 
                THEN advisor_phone 
            END) as active_last_30_days
        FROM button_clicks
    `);
    
    // Top engaged advisors
    report.metrics.topAdvisors = await db.all(`
        SELECT 
            a.name,
            a.phone,
            COUNT(bc.id) as total_clicks,
            COUNT(DISTINCT DATE(bc.clicked_at)) as active_days
        FROM advisors a
        LEFT JOIN button_clicks bc ON a.phone = bc.advisor_phone
        WHERE bc.clicked_at >= datetime('now', '-30 days')
        GROUP BY a.phone
        ORDER BY total_clicks DESC
        LIMIT 10
    `);
    
    // Button performance
    report.metrics.buttonPerformance = await db.all(`
        SELECT 
            button_id,
            COUNT(*) as total_clicks,
            COUNT(DISTINCT advisor_phone) as unique_advisors,
            AVG(CASE 
                WHEN time(clicked_at) BETWEEN '05:00' AND '09:00' THEN 1 
                ELSE 0 
            END) * 100 as morning_click_rate
        FROM button_clicks
        WHERE clicked_at >= datetime('now', '-30 days')
        GROUP BY button_id
    `);
    
    // Peak activity times
    report.metrics.peakTimes = await db.all(`
        SELECT 
            strftime('%H', clicked_at) as hour,
            COUNT(*) as clicks,
            COUNT(DISTINCT advisor_phone) as unique_advisors
        FROM button_clicks
        WHERE clicked_at >= datetime('now', '-30 days')
        GROUP BY hour
        ORDER BY clicks DESC
        LIMIT 5
    `);
    
    // Save report
    const reportPath = path.join(CONFIG.reportsDir, `engagement-${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(CONFIG.reportsDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Engagement report saved to ${reportPath}`);
    return report;
}

/**
 * Generate session ID
 */
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * CRM Analytics API
 */
async function startAnalyticsAPI(db) {
    const express = require('express');
    const app = express();
    
    // Advisor analytics
    app.get('/api/advisor/:phone', async (req, res) => {
        const analytics = await getAdvisorAnalytics(db, req.params.phone);
        res.json(analytics);
    });
    
    // Daily analytics
    app.get('/api/daily/:date?', async (req, res) => {
        const analytics = await getDailyAnalytics(db, req.params.date);
        res.json(analytics);
    });
    
    // Engagement report
    app.get('/api/report/engagement', async (req, res) => {
        const report = await generateEngagementReport(db);
        res.json(report);
    });
    
    // Real-time stats
    app.get('/api/stats/realtime', async (req, res) => {
        const stats = await db.get(`
            SELECT 
                (SELECT COUNT(*) FROM button_clicks WHERE clicked_at >= datetime('now', '-1 hour')) as clicks_last_hour,
                (SELECT COUNT(*) FROM chat_messages WHERE created_at >= datetime('now', '-1 hour')) as messages_last_hour,
                (SELECT COUNT(DISTINCT advisor_phone) FROM button_clicks WHERE clicked_at >= datetime('now', '-24 hours')) as active_today
        `);
        res.json(stats);
    });
    
    app.listen(CONFIG.analyticsPort, () => {
        console.log(`📊 CRM Analytics API running on port ${CONFIG.analyticsPort}`);
    });
}

/**
 * Export for webhook integration
 */
module.exports = {
    initializeDatabase,
    trackButtonClick,
    trackChatMessage,
    trackContentDelivery,
    getAdvisorAnalytics,
    getDailyAnalytics,
    generateEngagementReport
};

// Run if executed directly
if (require.main === module) {
    (async () => {
        const db = await initializeDatabase();
        
        // Start analytics API
        await startAnalyticsAPI(db);
        
        // Generate sample report
        const report = await generateEngagementReport(db);
        console.log('\n📊 Sample Engagement Report:');
        console.log(JSON.stringify(report.metrics.overview, null, 2));
    })();
}