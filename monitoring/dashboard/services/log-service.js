const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { createReadStream } = require('fs');

class LogService {
  constructor() {
    this.logsDir = path.join(__dirname, '../../../logs');
    this.logFiles = {
      'content-orchestrator': 'content-orchestrator.log',
      'content-strategist': 'content-strategist.log',
      'compliance-validator': 'compliance-validator.log',
      'fatigue-checker': 'fatigue-checker.log',
      'advisor-manager': 'advisor-manager.log',
      'webhook': 'webhook.log',
      'env-validator': 'env-validator.log'
    };
  }

  async getLogs({ level, search, limit = 100 }) {
    const logs = [];
    
    try {
      for (const [source, filename] of Object.entries(this.logFiles)) {
        const filePath = path.join(this.logsDir, filename);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (exists) {
          const fileLogs = await this.readLogFile(filePath, { level, search, limit });
          logs.push(...fileLogs.map(log => ({ ...log, source })));
        }
      }
      
      return logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  async readLogFile(filePath, { level, search, limit }) {
    const logs = [];
    
    return new Promise((resolve) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        try {
          const log = this.parseLogLine(line);
          
          if (level && log.level !== level) {
            return;
          }
          
          if (search && !line.toLowerCase().includes(search.toLowerCase())) {
            return;
          }
          
          logs.push(log);
          
          if (logs.length >= limit) {
            rl.close();
          }
        } catch (error) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line
          });
        }
      });
      
      rl.on('close', () => {
        resolve(logs.slice(-limit));
      });
      
      rl.on('error', (error) => {
        console.error('Error reading log file:', error);
        resolve(logs);
      });
    });
  }

  parseLogLine(line) {
    try {
      const parsed = JSON.parse(line);
      return {
        timestamp: parsed.timestamp || new Date().toISOString(),
        level: parsed.level || 'info',
        message: parsed.message || line,
        ...parsed
      };
    } catch {
      const timestampMatch = line.match(/\[([\d-T:.Z]+)\]/);
      const levelMatch = line.match(/\[(INFO|ERROR|WARN|DEBUG)\]/);
      
      return {
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        level: levelMatch ? levelMatch[1].toLowerCase() : 'info',
        message: line
      };
    }
  }

  async getErrorLogs(limit = 50) {
    return this.getLogs({ level: 'error', limit });
  }

  async searchLogs(searchTerm, limit = 100) {
    return this.getLogs({ search: searchTerm, limit });
  }

  async getLogStats() {
    const stats = {
      totalLogs: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      bySource: {}
    };
    
    try {
      for (const [source, filename] of Object.entries(this.logFiles)) {
        const filePath = path.join(this.logsDir, filename);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (exists) {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          stats.totalLogs += lines.length;
          stats.bySource[source] = lines.length;
          
          lines.forEach(line => {
            if (line.includes('ERROR')) stats.errors++;
            else if (line.includes('WARN')) stats.warnings++;
            else stats.info++;
          });
        }
      }
    } catch (error) {
      console.error('Error getting log stats:', error);
    }
    
    return stats;
  }

  async clearOldLogs(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    try {
      for (const filename of Object.values(this.logFiles)) {
        const filePath = path.join(this.logsDir, filename);
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        
        if (exists) {
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            const backupPath = `${filePath}.${stats.mtime.toISOString().split('T')[0]}`;
            await fs.rename(filePath, backupPath);
            await fs.writeFile(filePath, '');
          }
        }
      }
      
      return {
        success: true,
        message: `Logs older than ${daysToKeep} days have been archived`
      };
    } catch (error) {
      console.error('Error clearing old logs:', error);
      throw error;
    }
  }

  async getRealtimeLogs(callback) {
    const watchers = [];
    
    for (const [source, filename] of Object.entries(this.logFiles)) {
      const filePath = path.join(this.logsDir, filename);
      
      try {
        const watcher = fs.watch(filePath);
        watcher.on('change', async () => {
          const logs = await this.readLogFile(filePath, { limit: 1 });
          if (logs.length > 0) {
            callback({ source, log: logs[0] });
          }
        });
        watchers.push(watcher);
      } catch (error) {
        console.error(`Error watching ${filename}:`, error);
      }
    }
    
    return () => {
      watchers.forEach(watcher => watcher.close());
    };
  }
}

module.exports = new LogService();