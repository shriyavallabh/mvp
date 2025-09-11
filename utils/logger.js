/**
 * Enhanced Logging Utility
 * Provides structured logging with different levels and context
 */

const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/env.config');

/**
 * Log levels with numeric priorities
 */
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[90m', // Gray
    RESET: '\x1b[0m'
};

class Logger {
    constructor(options = {}) {
        this.name = options.name || 'App';
        this.level = LOG_LEVELS[options.level?.toUpperCase() || appConfig.logLevel?.toUpperCase() || 'INFO'];
        this.logToFile = options.logToFile || false;
        this.logDir = options.logDir || path.join(__dirname, '..', 'logs');
        this.contextData = {};
        
        // Create log directory if file logging is enabled
        if (this.logToFile) {
            this.ensureLogDirectory();
        }
    }
    
    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    /**
     * Format log message
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @returns {Object} Formatted log entry
     */
    formatLogEntry(level, message, data = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            logger: this.name,
            message,
            ...this.contextData,
            ...data,
            // Add error stack if present
            ...(data.error && {
                error: {
                    message: data.error.message,
                    stack: data.error.stack,
                    code: data.error.code
                }
            })
        };
    }
    
    /**
     * Write log to console
     * @param {string} level - Log level
     * @param {Object} entry - Log entry
     */
    writeToConsole(level, entry) {
        const color = COLORS[level] || COLORS.RESET;
        const prefix = `${color}[${entry.timestamp}] [${level}] [${entry.logger}]${COLORS.RESET}`;
        
        // Format message for console
        let output = `${prefix} ${entry.message}`;
        
        // Add additional data if present
        const { timestamp, level: _, logger, message, ...additionalData } = entry;
        if (Object.keys(additionalData).length > 0) {
            output += ` ${JSON.stringify(additionalData, null, 2)}`;
        }
        
        // Use appropriate console method
        if (level === 'ERROR') {
            console.error(output);
        } else if (level === 'WARN') {
            console.warn(output);
        } else {
            console.log(output);
        }
    }
    
    /**
     * Write log to file
     * @param {string} level - Log level
     * @param {Object} entry - Log entry
     */
    writeToFile(level, entry) {
        if (!this.logToFile) return;
        
        const date = new Date().toISOString().split('T')[0];
        const filename = `${date}-${this.name.toLowerCase()}.log`;
        const filepath = path.join(this.logDir, filename);
        
        const logLine = JSON.stringify(entry) + '\n';
        
        fs.appendFileSync(filepath, logLine, 'utf8');
    }
    
    /**
     * Core logging method
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    log(level, message, data = {}) {
        // Check if should log based on level
        if (LOG_LEVELS[level] > this.level) {
            return;
        }
        
        const entry = this.formatLogEntry(level, message, data);
        
        this.writeToConsole(level, entry);
        this.writeToFile(level, entry);
    }
    
    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error|Object} errorOrData - Error object or additional data
     */
    error(message, errorOrData = {}) {
        const data = errorOrData instanceof Error 
            ? { error: errorOrData }
            : errorOrData;
        this.log('ERROR', message, data);
    }
    
    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} data - Additional data
     */
    warn(message, data = {}) {
        this.log('WARN', message, data);
    }
    
    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} data - Additional data
     */
    info(message, data = {}) {
        this.log('INFO', message, data);
    }
    
    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} data - Additional data
     */
    debug(message, data = {}) {
        this.log('DEBUG', message, data);
    }
    
    /**
     * Set context data that will be included in all logs
     * @param {Object} context - Context data
     */
    setContext(context) {
        this.contextData = { ...this.contextData, ...context };
    }
    
    /**
     * Clear context data
     */
    clearContext() {
        this.contextData = {};
    }
    
    /**
     * Create a child logger with additional context
     * @param {string} name - Child logger name
     * @param {Object} context - Additional context
     * @returns {Logger} Child logger
     */
    child(name, context = {}) {
        const childLogger = new Logger({
            name: `${this.name}:${name}`,
            level: Object.keys(LOG_LEVELS)[this.level],
            logToFile: this.logToFile,
            logDir: this.logDir
        });
        childLogger.setContext({ ...this.contextData, ...context });
        return childLogger;
    }
    
    /**
     * Log API request
     * @param {Object} req - Request details
     */
    logApiRequest(req) {
        this.info('API Request', {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body
        });
    }
    
    /**
     * Log API response
     * @param {Object} res - Response details
     */
    logApiResponse(res) {
        const level = res.status >= 400 ? 'ERROR' : 'INFO';
        this.log(level, 'API Response', {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            body: res.body,
            duration: res.duration
        });
    }
    
    /**
     * Log WhatsApp message send
     * @param {Object} details - Message details
     */
    logWhatsAppSend(details) {
        this.info('WhatsApp Message Sent', {
            to: details.to,
            type: details.type,
            template: details.template,
            messageId: details.messageId,
            status: details.status
        });
    }
    
    /**
     * Log WhatsApp webhook event
     * @param {Object} event - Webhook event
     */
    logWhatsAppWebhook(event) {
        this.debug('WhatsApp Webhook Received', {
            type: event.type,
            from: event.from,
            messageId: event.messageId,
            status: event.status,
            timestamp: event.timestamp
        });
    }
    
    /**
     * Create a timer for performance measurement
     * @param {string} label - Timer label
     * @returns {Function} End timer function
     */
    startTimer(label) {
        const start = Date.now();
        return (additionalData = {}) => {
            const duration = Date.now() - start;
            this.debug(`${label} completed`, {
                duration: `${duration}ms`,
                ...additionalData
            });
            return duration;
        };
    }
}

/**
 * Create a default logger instance
 */
const defaultLogger = new Logger({
    name: 'FinAdvise',
    logToFile: appConfig.isProduction()
});

/**
 * Express middleware for request logging
 */
function expressLoggingMiddleware(logger = defaultLogger) {
    return (req, res, next) => {
        const start = Date.now();
        
        // Log request
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        
        // Override res.end to log response
        const originalEnd = res.end;
        res.end = function(...args) {
            const duration = Date.now() - start;
            
            logger.info('HTTP Response', {
                method: req.method,
                url: req.url,
                status: res.statusCode,
                duration: `${duration}ms`
            });
            
            originalEnd.apply(res, args);
        };
        
        next();
    };
}

module.exports = {
    Logger,
    defaultLogger,
    expressLoggingMiddleware,
    LOG_LEVELS
};