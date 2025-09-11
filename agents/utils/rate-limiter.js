#!/usr/bin/env node

/**
 * RateLimiter - Manages API rate limiting to prevent quota exhaustion
 * Implements token bucket algorithm for rate limiting
 */
class RateLimiter {
    /**
     * Creates a new rate limiter instance
     * @param {number} maxRequests - Maximum requests allowed per window
     * @param {number} windowMs - Time window in milliseconds
     */
    constructor(maxRequests = 100, windowMs = 100000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.tokens = maxRequests;
        this.lastRefill = Date.now();
        this.queue = [];
        this.processing = false;
    }

    /**
     * Refills tokens based on elapsed time
     * @private
     */
    refillTokens() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = Math.floor((elapsed / this.windowMs) * this.maxRequests);
        
        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }

    /**
     * Acquires a token for making a request
     * @returns {Promise<boolean>} True if token acquired, false if rate limited
     */
    async acquire() {
        return new Promise((resolve) => {
            this.queue.push(resolve);
            this.processQueue();
        });
    }

    /**
     * Processes the queue of pending requests
     * @private
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            this.refillTokens();

            if (this.tokens > 0) {
                const resolve = this.queue.shift();
                this.tokens--;
                resolve(true);
            } else {
                // Wait for tokens to refill
                const waitTime = Math.ceil(this.windowMs / this.maxRequests);
                await this.delay(waitTime);
            }
        }

        this.processing = false;
    }

    /**
     * Delays execution for specified milliseconds
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets current rate limiter status
     * @returns {Object} Status object with tokens and queue info
     */
    getStatus() {
        this.refillTokens();
        return {
            availableTokens: this.tokens,
            maxTokens: this.maxRequests,
            queueLength: this.queue.length,
            windowMs: this.windowMs
        };
    }

    /**
     * Resets the rate limiter
     */
    reset() {
        this.tokens = this.maxRequests;
        this.lastRefill = Date.now();
        this.queue = [];
        this.processing = false;
    }

    /**
     * Executes a function with rate limiting
     * @param {Function} fn - Function to execute
     * @returns {Promise<*>} Result of the function
     */
    async execute(fn) {
        await this.acquire();
        return fn();
    }
}

/**
 * GoogleSheetsRateLimiter - Specific rate limiter for Google Sheets API
 * Google Sheets API has a quota of 100 requests per 100 seconds per user
 */
class GoogleSheetsRateLimiter extends RateLimiter {
    constructor() {
        // Google Sheets API: 100 requests per 100 seconds
        // We'll be conservative and use 90 requests per 100 seconds
        super(90, 100000);
        this.writeLimit = new RateLimiter(30, 100000); // Separate limit for writes
    }

    /**
     * Acquires a token for read operations
     * @returns {Promise<boolean>}
     */
    async acquireRead() {
        return this.acquire();
    }

    /**
     * Acquires a token for write operations (more restrictive)
     * @returns {Promise<boolean>}
     */
    async acquireWrite() {
        // Need tokens from both general and write-specific limiters
        await this.acquire();
        return this.writeLimit.acquire();
    }

    /**
     * Executes a read operation with rate limiting
     * @param {Function} fn - Function to execute
     * @returns {Promise<*>}
     */
    async executeRead(fn) {
        await this.acquireRead();
        return fn();
    }

    /**
     * Executes a write operation with rate limiting
     * @param {Function} fn - Function to execute
     * @returns {Promise<*>}
     */
    async executeWrite(fn) {
        await this.acquireWrite();
        return fn();
    }

    /**
     * Gets comprehensive status including write limits
     * @returns {Object}
     */
    getFullStatus() {
        return {
            read: this.getStatus(),
            write: this.writeLimit.getStatus()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RateLimiter, GoogleSheetsRateLimiter };
}

// Test execution
if (require.main === module) {
    async function test() {
        console.log('=== Rate Limiter Test ===\n');
        
        const limiter = new GoogleSheetsRateLimiter();
        
        console.log('Initial status:', limiter.getFullStatus());
        
        console.log('\nTesting read operations...');
        const readPromises = [];
        for (let i = 0; i < 5; i++) {
            readPromises.push(
                limiter.executeRead(async () => {
                    console.log(`Read operation ${i + 1} executed at ${new Date().toISOString()}`);
                    return `read-${i}`;
                })
            );
        }
        
        await Promise.all(readPromises);
        
        console.log('\nTesting write operations...');
        const writePromises = [];
        for (let i = 0; i < 3; i++) {
            writePromises.push(
                limiter.executeWrite(async () => {
                    console.log(`Write operation ${i + 1} executed at ${new Date().toISOString()}`);
                    return `write-${i}`;
                })
            );
        }
        
        await Promise.all(writePromises);
        
        console.log('\nFinal status:', limiter.getFullStatus());
        console.log('\n=== Test Complete ===');
    }
    
    test();
}