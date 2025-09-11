#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
    constructor(agentId = 'default') {
        this.agentId = agentId;
        this.logDir = path.join(process.cwd(), 'logs');
        this.logFile = path.join(this.logDir, `${agentId}.log`);
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 5;
        this.logLevel = process.env.LOG_LEVEL || 'INFO';
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        this.performanceMetrics = new Map();
        this.initializeLogger();
    }

    initializeLogger() {
        try {
            // Create logs directory if it doesn't exist
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            
            // Initialize log file
            if (!fs.existsSync(this.logFile)) {
                fs.writeFileSync(this.logFile, '');
            }
            
            // Check file size and rotate if necessary
            this.checkAndRotate();
            
        } catch (error) {
            console.error('Failed to initialize logger:', error);
        }
    }

    log(level, message, metadata = {}) {
        if (this.logLevels[level] < this.logLevels[this.logLevel]) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            agentId: this.agentId,
            message,
            ...metadata
        };
        
        // Format for console output
        const consoleFormat = this.formatForConsole(logEntry);
        
        // Format for file output
        const fileFormat = this.formatForFile(logEntry);
        
        // Output to console
        this.outputToConsole(level, consoleFormat);
        
        // Write to file
        this.writeToFile(fileFormat);
        
        // Check if rotation is needed
        this.checkAndRotate();
    }

    debug(message, metadata = {}) {
        this.log('DEBUG', message, metadata);
    }

    info(message, metadata = {}) {
        this.log('INFO', message, metadata);
    }

    warn(message, metadata = {}) {
        this.log('WARN', message, metadata);
    }

    error(message, errorOrMetadata = {}) {
        let metadata = {};
        
        if (errorOrMetadata instanceof Error) {
            metadata = {
                error: errorOrMetadata.message,
                stack: errorOrMetadata.stack,
                code: errorOrMetadata.code
            };
        } else {
            metadata = errorOrMetadata;
        }
        
        this.log('ERROR', message, metadata);
    }

    formatForConsole(logEntry) {
        const { timestamp, level, agentId, message, ...metadata } = logEntry;
        let output = `[${timestamp}] [${level}] [${agentId}] ${message}`;
        
        if (Object.keys(metadata).length > 0) {
            // Remove sensitive data from console output
            const sanitized = this.sanitizeMetadata(metadata);
            if (Object.keys(sanitized).length > 0) {
                output += ` | ${util.inspect(sanitized, { depth: 2, colors: true })}`;
            }
        }
        
        return output;
    }

    formatForFile(logEntry) {
        // JSON format for easy parsing
        return JSON.stringify(logEntry) + '\n';
    }

    outputToConsole(level, message) {
        switch (level) {
            case 'DEBUG':
                console.debug(message);
                break;
            case 'INFO':
                console.log(message);
                break;
            case 'WARN':
                console.warn(message);
                break;
            case 'ERROR':
                console.error(message);
                break;
            default:
                console.log(message);
        }
    }

    writeToFile(message) {
        try {
            fs.appendFileSync(this.logFile, message);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    checkAndRotate() {
        try {
            const stats = fs.statSync(this.logFile);
            
            if (stats.size > this.maxFileSize) {
                this.rotateLogFiles();
            }
        } catch (error) {
            // File doesn't exist or other error, ignore
        }
    }

    rotateLogFiles() {
        try {
            // Delete oldest file if at max
            const oldestFile = path.join(this.logDir, `${this.agentId}.log.${this.maxFiles}`);
            if (fs.existsSync(oldestFile)) {
                fs.unlinkSync(oldestFile);
            }
            
            // Rotate existing files
            for (let i = this.maxFiles - 1; i > 0; i--) {
                const oldFile = path.join(this.logDir, `${this.agentId}.log.${i}`);
                const newFile = path.join(this.logDir, `${this.agentId}.log.${i + 1}`);
                
                if (fs.existsSync(oldFile)) {
                    fs.renameSync(oldFile, newFile);
                }
            }
            
            // Rotate current file
            fs.renameSync(this.logFile, path.join(this.logDir, `${this.agentId}.log.1`));
            
            // Create new empty log file
            fs.writeFileSync(this.logFile, '');
            
            this.info('Log files rotated');
            
        } catch (error) {
            console.error('Failed to rotate log files:', error);
        }
    }

    sanitizeMetadata(metadata) {
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
        const sanitized = {};
        
        for (const [key, value] of Object.entries(metadata)) {
            const lowerKey = key.toLowerCase();
            
            if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeMetadata(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // Performance metrics logging
    startMetric(metricName) {
        this.performanceMetrics.set(metricName, {
            start: process.hrtime.bigint(),
            end: null
        });
    }

    endMetric(metricName) {
        const metric = this.performanceMetrics.get(metricName);
        if (!metric) {
            this.warn(`Metric ${metricName} was not started`);
            return;
        }
        
        metric.end = process.hrtime.bigint();
        const duration = Number(metric.end - metric.start) / 1000000; // Convert to milliseconds
        
        this.info(`Performance metric: ${metricName}`, {
            duration: `${duration.toFixed(2)}ms`,
            metric: metricName
        });
        
        this.performanceMetrics.delete(metricName);
        return duration;
    }

    // Get recent logs
    getRecentLogs(lines = 100) {
        try {
            const content = fs.readFileSync(this.logFile, 'utf-8');
            const logLines = content.trim().split('\n');
            
            return logLines.slice(-lines).map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            this.error('Failed to read recent logs', error);
            return [];
        }
    }

    // Search logs
    searchLogs(query, options = {}) {
        const { level, startDate, endDate, limit = 100 } = options;
        const results = [];
        
        try {
            const content = fs.readFileSync(this.logFile, 'utf-8');
            const logLines = content.trim().split('\n');
            
            for (const line of logLines) {
                try {
                    const entry = JSON.parse(line);
                    
                    // Filter by level
                    if (level && entry.level !== level) continue;
                    
                    // Filter by date range
                    if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
                    if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;
                    
                    // Search in message
                    if (query && !entry.message.toLowerCase().includes(query.toLowerCase())) continue;
                    
                    results.push(entry);
                    
                    if (results.length >= limit) break;
                    
                } catch {
                    // Skip invalid JSON lines
                }
            }
            
            return results;
            
        } catch (error) {
            this.error('Failed to search logs', error);
            return [];
        }
    }

    // Get log statistics
    getStatistics() {
        const stats = {
            DEBUG: 0,
            INFO: 0,
            WARN: 0,
            ERROR: 0,
            total: 0,
            fileSize: 0,
            oldestEntry: null,
            newestEntry: null
        };
        
        try {
            const fileStats = fs.statSync(this.logFile);
            stats.fileSize = fileStats.size;
            
            const content = fs.readFileSync(this.logFile, 'utf-8');
            const logLines = content.trim().split('\n').filter(line => line);
            
            stats.total = logLines.length;
            
            logLines.forEach((line, index) => {
                try {
                    const entry = JSON.parse(line);
                    
                    if (stats[entry.level] !== undefined) {
                        stats[entry.level]++;
                    }
                    
                    if (index === 0) {
                        stats.oldestEntry = entry.timestamp;
                    }
                    if (index === logLines.length - 1) {
                        stats.newestEntry = entry.timestamp;
                    }
                } catch {
                    // Skip invalid JSON lines
                }
            });
            
            return stats;
            
        } catch (error) {
            this.error('Failed to get log statistics', error);
            return stats;
        }
    }

    // Clear logs
    clearLogs() {
        try {
            fs.writeFileSync(this.logFile, '');
            this.info('Logs cleared');
        } catch (error) {
            this.error('Failed to clear logs', error);
        }
    }

    // Test method
    async test() {
        console.log('=== Logger Test Mode ===\n');
        
        console.log('1. Testing log levels...');
        this.debug('This is a debug message');
        this.info('This is an info message');
        this.warn('This is a warning message');
        this.error('This is an error message');
        
        console.log('\n2. Testing metadata logging...');
        this.info('User action', {
            userId: 'user123',
            action: 'login',
            ipAddress: '192.168.1.1'
        });
        
        console.log('\n3. Testing sensitive data sanitization...');
        this.info('Authentication attempt', {
            username: 'john',
            password: 'secret123',
            token: 'abc123xyz',
            regularData: 'visible'
        });
        
        console.log('\n4. Testing error logging...');
        const testError = new Error('Test error occurred');
        testError.code = 'TEST_ERROR';
        this.error('Error during processing', testError);
        
        console.log('\n5. Testing performance metrics...');
        this.startMetric('testOperation');
        await new Promise(resolve => setTimeout(resolve, 100));
        const duration = this.endMetric('testOperation');
        console.log(`  Operation took: ${duration.toFixed(2)}ms`);
        
        console.log('\n6. Testing log statistics...');
        const stats = this.getStatistics();
        console.log('  Log Statistics:');
        console.log(`    Total entries: ${stats.total}`);
        console.log(`    ERROR: ${stats.ERROR}, WARN: ${stats.WARN}, INFO: ${stats.INFO}, DEBUG: ${stats.DEBUG}`);
        console.log(`    File size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
        
        console.log('\n7. Testing log search...');
        const searchResults = this.searchLogs('message', { level: 'INFO', limit: 3 });
        console.log(`  Found ${searchResults.length} matching entries`);
        
        console.log('\n8. Testing recent logs retrieval...');
        const recentLogs = this.getRecentLogs(5);
        console.log(`  Retrieved ${recentLogs.length} recent log entries`);
        
        console.log('\n=== Test Complete ===');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}

// Test execution
if (require.main === module) {
    const logger = new Logger('test-logger');
    logger.test();
}