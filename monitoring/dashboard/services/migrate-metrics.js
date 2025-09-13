const fs = require('fs').promises;
const path = require('path');
const Database = require('better-sqlite3');

async function migrateExistingMetrics() {
  try {
    console.log('Starting metrics migration...');
    
    // Create database directory if it doesn't exist
    const dbDir = path.join(__dirname, '../database');
    await fs.mkdir(dbDir, { recursive: true });
    
    // Initialize database
    const dbPath = path.join(__dirname, '../database/analytics.db');
    const db = new Database(dbPath);
    
    // Check for existing metrics.json file
    const metricsFile = path.join(__dirname, '../../../data/metrics.json');
    const exists = await fs.access(metricsFile).then(() => true).catch(() => false);
    
    if (!exists) {
      console.log('No existing metrics.json file found, skipping migration');
      return;
    }
    
    // Read existing metrics
    const existingMetrics = JSON.parse(await fs.readFile(metricsFile, 'utf8'));
    
    // Prepare insert statement
    const stmt = db.prepare(`
      INSERT INTO metrics_raw (metric_type, metric_name, metric_value, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // Migrate each metric type
    let migratedCount = 0;
    
    for (const [type, metrics] of Object.entries(existingMetrics)) {
      if (Array.isArray(metrics)) {
        for (const metric of metrics) {
          const { timestamp, ...metadata } = metric;
          
          // Extract value from metric
          let value = metric.value || metric.count || metric.total || 1;
          if (typeof value !== 'number') {
            value = 1;
          }
          
          // Determine metric name
          let name = metric.name || type;
          
          try {
            stmt.run(
              type,
              name,
              value,
              JSON.stringify(metadata),
              timestamp || new Date().toISOString()
            );
            migratedCount++;
          } catch (error) {
            console.error(`Error migrating metric: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`Migration completed. Migrated ${migratedCount} metrics.`);
    
    // Run initial aggregations
    console.log('Running initial aggregations...');
    
    // Aggregate to hourly
    db.exec(`
      INSERT OR REPLACE INTO metrics_hourly (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, hour_timestamp)
      SELECT 
        metric_type,
        metric_name,
        AVG(metric_value) as avg_value,
        MIN(metric_value) as min_value,
        MAX(metric_value) as max_value,
        SUM(metric_value) as sum_value,
        COUNT(*) as count,
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour_timestamp
      FROM metrics_raw
      GROUP BY metric_type, metric_name, strftime('%Y-%m-%d %H', timestamp)
    `);
    
    // Aggregate to daily
    db.exec(`
      INSERT OR REPLACE INTO metrics_daily (metric_type, metric_name, avg_value, min_value, max_value, sum_value, count, date)
      SELECT 
        metric_type,
        metric_name,
        AVG(avg_value) as avg_value,
        MIN(min_value) as min_value,
        MAX(max_value) as max_value,
        SUM(sum_value) as sum_value,
        SUM(count) as count,
        date(hour_timestamp) as date
      FROM metrics_hourly
      GROUP BY metric_type, metric_name, date(hour_timestamp)
    `);
    
    console.log('Aggregations completed');
    
    db.close();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingMetrics().then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  });
}

module.exports = migrateExistingMetrics;