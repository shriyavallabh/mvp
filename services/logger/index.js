/**
 * Logger Service
 * Simple logger with timestamp and level support
 */

const config = require('../../config/whatsapp.config');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        // Handle objects and errors
        const formattedArgs = args.map(arg => {
            if (arg instanceof Error) {
                return arg.stack || arg.message;
            }
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return arg;
        });

        return `${prefix} ${message} ${formattedArgs.join(' ')}`;
    }

    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, ...args));
        }
    }

    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, ...args));
        }
    }

    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, ...args));
        }
    }

    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, ...args));
        }
    }
}

module.exports = new Logger();