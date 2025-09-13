const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { google } = require('googleapis');
const Database = require('better-sqlite3');

class MetricsService {
  constructor() {
    this.metricsFile = path.join(__dirname, '../../../data/metrics.json');
    this.dbPath = path.join(__dirname, '../database/analytics.db');
    this.sheets = null;
    this.db = null;
    this.initDatabase();
    this.initGoogleSheets();
    this.startAggregationJobs();
  }

  initDatabase() {
    try {
      const dbDir = path.join(__dirname, '../database');
      if (!require('fs').existsSync(dbDir)) {
        require('fs').mkdirSync(dbDir, { recursive: true });
      }
      
      this.db = new Database(this.dbPath);
      
      // Create time-series tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS metrics_raw (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          metric_value REAL NOT NULL,
          metadata TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS metrics_hourly (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          avg_value REAL,
          min_value REAL,
          max_value REAL,
          sum_value REAL,
          count INTEGER,
          hour_timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(metric_type, metric_name, hour_timestamp)
        );
        
        CREATE TABLE IF NOT EXISTS metrics_daily (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          avg_value REAL,
          min_value REAL,
          max_value REAL,
          sum_value REAL,
          count INTEGER,
          date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(metric_type, metric_name, date)
        );
        
        CREATE TABLE IF NOT EXISTS metrics_weekly (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          avg_value REAL,
          min_value REAL,
          max_value REAL,
          sum_value REAL,
          count INTEGER,
          week_start DATE NOT NULL,
          week_end DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(metric_type, metric_name, week_start)
        );
        
        CREATE TABLE IF NOT EXISTS metrics_monthly (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          avg_value REAL,
          min_value REAL,
          max_value REAL,
          sum_value REAL,
          count INTEGER,
          month DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(metric_type, metric_name, month)
        );
        
        CREATE INDEX IF NOT EXISTS idx_raw_timestamp ON metrics_raw(timestamp);
        CREATE INDEX IF NOT EXISTS idx_raw_type_name ON metrics_raw(metric_type, metric_name);
        CREATE INDEX IF NOT EXISTS idx_hourly_timestamp ON metrics_hourly(hour_timestamp);
        CREATE INDEX IF NOT EXISTS idx_daily_date ON metrics_daily(date);
        CREATE INDEX IF NOT EXISTS idx_weekly_start ON metrics_weekly(week_start);
        CREATE INDEX IF NOT EXISTS idx_monthly_month ON metrics_monthly(month);
      `);
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async initGoogleSheets() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, '../../../config/credentials.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error);
    }
  }

  async getMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const dailyMetrics = await this.getDailyMetrics(today);
      const weeklyMetrics = await this.getWeeklyMetrics();
      const monthlyMetrics = await this.getMonthlyMetrics();
      const advisorMetrics = await this.getAdvisorMetrics();
      
      return {
        daily: dailyMetrics,
        weekly: weeklyMetrics,
        monthly: monthlyMetrics,
        advisors: advisorMetrics,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return {
        error: error.message,
        daily: {},
        weekly: {},
        monthly: {},
        advisors: {}
      };
    }
  }

  async getDailyMetrics(date) {
    try {
      const logsPath = path.join(__dirname, '../../../logs');
      const files = await fs.readdir(logsPath);
      
      const contentGenerated = files.filter(f => 
        f.includes('content-orchestrator') && f.includes(date)
      ).length;
      
      const messagesDelivered = files.filter(f => 
        f.includes('distribution') && f.includes(date)
      ).length;
      
      return {
        date,
        contentGenerated,
        messagesDelivered,
        approvalsPending: 0,
        errorsCount: 0
      };
    } catch (error) {
      return {
        date,
        contentGenerated: 0,
        messagesDelivered: 0,
        approvalsPending: 0,
        errorsCount: 0
      };
    }
  }

  async getWeeklyMetrics() {
    const metrics = {
      totalContent: 0,
      totalDeliveries: 0,
      avgResponseTime: 0,
      successRate: 100
    };
    
    try {
      const dataFile = path.join(__dirname, '../../../data/campaigns.json');
      const exists = await fs.access(dataFile).then(() => true).catch(() => false);
      
      if (exists) {
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
        metrics.totalContent = data.campaigns?.length || 0;
        metrics.totalDeliveries = data.deliveries?.length || 0;
      }
    } catch (error) {
      console.error('Error reading weekly metrics:', error);
    }
    
    return metrics;
  }

  async getMonthlyMetrics() {
    return {
      totalAdvisorsServed: 0,
      totalContentPieces: 0,
      avgEngagementRate: 0,
      topPerformingContent: []
    };
  }

  async getAdvisorMetrics() {
    if (!this.sheets) {
      return { total: 0, active: 0, inactive: 0 };
    }
    
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Advisors!A:F'
      });
      
      const rows = response.data.values || [];
      const advisors = rows.slice(1);
      
      return {
        total: advisors.length,
        active: advisors.filter(row => row[3] === 'active').length,
        inactive: advisors.filter(row => row[3] === 'inactive').length,
        newThisWeek: advisors.filter(row => {
          const createdDate = new Date(row[4]);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length
      };
    } catch (error) {
      console.error('Error getting advisor metrics:', error);
      return { total: 0, active: 0, inactive: 0, newThisWeek: 0 };
    }
  }

  async getWhatsAppStatus() {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      );
      
      return {
        status: 'connected',
        phoneNumber: response.data.display_phone_number,
        qualityRating: response.data.quality_rating || 'GREEN',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  async getSheetsStatus() {
    if (!this.sheets) {
      return {
        status: 'disconnected',
        error: 'Google Sheets not configured',
        lastChecked: new Date().toISOString()
      };
    }
    
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID
      });
      
      return {
        status: 'connected',
        spreadsheetName: response.data.properties.title,
        sheets: response.data.sheets.map(s => s.properties.title),
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  recordTimeSeries(metricType, metricName, value, metadata = {}) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO metrics_raw (metric_type, metric_name, metric_value, metadata)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(metricType, metricName, value, JSON.stringify(metadata));
      
      // Also record to legacy JSON file for backward compatibility
      this.recordMetric(metricType, { name: metricName, value, ...metadata });
    } catch (error) {
      console.error('Error recording time series metric:', error);
    }
  }

  getTimeSeriesData(metricType, metricName, startDate, endDate, granularity = 'hourly') {
    try {
      let query;
      let table;
      
      switch (granularity) {
        case 'raw':
          table = 'metrics_raw';
          query = `
            SELECT timestamp as time, metric_value as value, metadata
            FROM ${table}
            WHERE metric_type = ? AND metric_name = ?
              AND timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC
          `;
          break;
        case 'hourly':
          table = 'metrics_hourly';
          query = `
            SELECT hour_timestamp as time, avg_value, min_value, max_value, sum_value, count
            FROM ${table}
            WHERE metric_type = ? AND metric_name = ?
              AND hour_timestamp BETWEEN ? AND ?
            ORDER BY hour_timestamp DESC
          `;
          break;
        case 'daily':
          table = 'metrics_daily';
          query = `
            SELECT date as time, avg_value, min_value, max_value, sum_value, count
            FROM ${table}
            WHERE metric_type = ? AND metric_name = ?
              AND date BETWEEN ? AND ?
            ORDER BY date DESC
          `;
          break;
        case 'weekly':
          table = 'metrics_weekly';
          query = `
            SELECT week_start as time, avg_value, min_value, max_value, sum_value, count
            FROM ${table}
            WHERE metric_type = ? AND metric_name = ?
              AND week_start BETWEEN ? AND ?
            ORDER BY week_start DESC
          `;
          break;
        case 'monthly':
          table = 'metrics_monthly';
          query = `
            SELECT month as time, avg_value, min_value, max_value, sum_value, count
            FROM ${table}
            WHERE metric_type = ? AND metric_name = ?
              AND month BETWEEN ? AND ?
            ORDER BY month DESC
          `;
          break;
      }
      
      const stmt = this.db.prepare(query);
      return stmt.all(metricType, metricName, startDate, endDate);
    } catch (error) {
      console.error('Error fetching time series data:', error);
      return [];
    }
  }

  startAggregationJobs() {
    // Run hourly aggregation every hour
    this.hourlyTimer = setInterval(() => this.aggregateHourly(), 60 * 60 * 1000);
    
    // Run daily aggregation every day at midnight
    this.dailyTimer = setInterval(() => this.aggregateDaily(), 24 * 60 * 60 * 1000);
    
    // Run weekly aggregation every week
    this.weeklyTimer = setInterval(() => this.aggregateWeekly(), 7 * 24 * 60 * 60 * 1000);
    
    // Run monthly aggregation on the first of every month
    // Using a shorter interval and checking dates to avoid 32-bit integer overflow
    this.monthlyTimer = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0) {
        this.aggregateMonthly();
      }
    }, 60 * 60 * 1000); // Check every hour
    
    // Run data retention cleanup daily
    this.cleanupTimer = setInterval(() => this.cleanupOldData(), 24 * 60 * 60 * 1000);
  }
  
  stopAggregationJobs() {
    if (this.hourlyTimer) clearInterval(this.hourlyTimer);
    if (this.dailyTimer) clearInterval(this.dailyTimer);
    if (this.weeklyTimer) clearInterval(this.weeklyTimer);
    if (this.monthlyTimer) clearInterval(this.monthlyTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  aggregateHourly() {
    try {
      const hourAgo = new Date();
      hourAgo.setHours(hourAgo.getHours() - 1);
      const hourTimestamp = hourAgo.toISOString().slice(0, 13) + ':00:00';
      
      const query = `
        INSERT OR REPLACE INTO metrics_hourly (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, hour_timestamp)
        SELECT 
          metric_type,
          metric_name,
          AVG(metric_value) as avg_value,
          MIN(metric_value) as min_value,
          MAX(metric_value) as max_value,
          SUM(metric_value) as sum_value,
          COUNT(*) as count,
          ? as hour_timestamp
        FROM metrics_raw
        WHERE timestamp >= ? AND timestamp < datetime(?, '+1 hour')
        GROUP BY metric_type, metric_name
      `;
      
      this.db.prepare(query).run(hourTimestamp, hourTimestamp, hourTimestamp);
      console.log('Hourly aggregation completed');
    } catch (error) {
      console.error('Error in hourly aggregation:', error);
    }
  }

  aggregateDaily() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().slice(0, 10);
      
      const query = `
        INSERT OR REPLACE INTO metrics_daily (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, date)
        SELECT 
          metric_type,
          metric_name,
          AVG(avg_value) as avg_value,
          MIN(min_value) as min_value,
          MAX(max_value) as max_value,
          SUM(sum_value) as sum_value,
          SUM(count) as count,
          ? as date
        FROM metrics_hourly
        WHERE date(hour_timestamp) = ?
        GROUP BY metric_type, metric_name
      `;
      
      this.db.prepare(query).run(dateStr, dateStr);
      console.log('Daily aggregation completed');
    } catch (error) {
      console.error('Error in daily aggregation:', error);
    }
  }

  aggregateWeekly() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStart = weekAgo.toISOString().slice(0, 10);
      const weekEnd = new Date().toISOString().slice(0, 10);
      
      const query = `
        INSERT OR REPLACE INTO metrics_weekly (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, week_start, week_end)
        SELECT 
          metric_type,
          metric_name,
          AVG(avg_value) as avg_value,
          MIN(min_value) as min_value,
          MAX(max_value) as max_value,
          SUM(sum_value) as sum_value,
          SUM(count) as count,
          ? as week_start,
          ? as week_end
        FROM metrics_daily
        WHERE date BETWEEN ? AND ?
        GROUP BY metric_type, metric_name
      `;
      
      this.db.prepare(query).run(weekStart, weekEnd, weekStart, weekEnd);
      console.log('Weekly aggregation completed');
    } catch (error) {
      console.error('Error in weekly aggregation:', error);
    }
  }

  aggregateMonthly() {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthStr = lastMonth.toISOString().slice(0, 7) + '-01';
      
      const query = `
        INSERT OR REPLACE INTO metrics_monthly (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, month)
        SELECT 
          metric_type,
          metric_name,
          AVG(avg_value) as avg_value,
          MIN(min_value) as min_value,
          MAX(max_value) as max_value,
          SUM(sum_value) as sum_value,
          SUM(count) as count,
          ? as month
        FROM metrics_daily
        WHERE strftime('%Y-%m', date) = strftime('%Y-%m', ?)
        GROUP BY metric_type, metric_name
      `;
      
      this.db.prepare(query).run(monthStr, monthStr);
      console.log('Monthly aggregation completed');
    } catch (error) {
      console.error('Error in monthly aggregation:', error);
    }
  }

  cleanupOldData() {
    try {
      // Keep 90 days of detailed raw data
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const deleteRaw = this.db.prepare(`
        DELETE FROM metrics_raw WHERE timestamp < ?
      `);
      deleteRaw.run(ninetyDaysAgo.toISOString());
      
      // Keep 1 year of aggregated data
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const deleteOldAggregates = this.db.prepare(`
        DELETE FROM metrics_monthly WHERE month < ?
      `);
      deleteOldAggregates.run(oneYearAgo.toISOString());
      
      console.log('Data retention cleanup completed');
    } catch (error) {
      console.error('Error in data cleanup:', error);
    }
  }

  async recordMetric(type, data) {
    try {
      let metrics = {};
      const exists = await fs.access(this.metricsFile).then(() => true).catch(() => false);
      
      if (exists) {
        metrics = JSON.parse(await fs.readFile(this.metricsFile, 'utf8'));
      }
      
      if (!metrics[type]) {
        metrics[type] = [];
      }
      
      metrics[type].push({
        ...data,
        timestamp: new Date().toISOString()
      });
      
      if (metrics[type].length > 1000) {
        metrics[type] = metrics[type].slice(-1000);
      }
      
      await fs.writeFile(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }
}

module.exports = new MetricsService();