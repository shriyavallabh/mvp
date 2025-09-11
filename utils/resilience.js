/**
 * Resilience Utilities
 * Provides retry logic, circuit breaker pattern, and rate limiting
 */

/**
 * Exponential backoff retry with jitter
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {Function} options.onRetry - Callback on each retry
 * @param {Function} options.shouldRetry - Function to determine if should retry
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        onRetry = () => {},
        shouldRetry = (error) => true
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Check if we should retry
            if (attempt === maxRetries || !shouldRetry(error)) {
                throw error;
            }
            
            // Calculate delay with exponential backoff and jitter
            const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
            const delay = exponentialDelay + jitter;
            
            // Notify about retry
            onRetry({
                attempt: attempt + 1,
                maxRetries,
                delay,
                error
            });
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 1 minute
        this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
        this.onStateChange = options.onStateChange || (() => {});
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failures = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
        this.requestCount = 0;
        this.nextAttempt = Date.now();
    }
    
    /**
     * Execute function with circuit breaker protection
     * @param {Function} fn - Async function to execute
     * @returns {Promise} Result of the function
     */
    async execute(fn) {
        // Check if circuit is open
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error(`Circuit breaker is OPEN. Service unavailable. Retry after ${new Date(this.nextAttempt).toISOString()}`);
            }
            // Try half-open state
            this.changeState('HALF_OPEN');
        }
        
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failures = 0;
        this.requestCount++;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            // Need multiple successes to fully close
            if (this.successCount >= 3) {
                this.changeState('CLOSED');
            }
        }
    }
    
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        this.requestCount++;
        
        if (this.state === 'HALF_OPEN') {
            this.changeState('OPEN');
        } else if (this.failures >= this.failureThreshold) {
            this.changeState('OPEN');
        }
    }
    
    changeState(newState) {
        const oldState = this.state;
        this.state = newState;
        
        switch (newState) {
            case 'OPEN':
                this.nextAttempt = Date.now() + this.resetTimeout;
                this.successCount = 0;
                break;
            case 'HALF_OPEN':
                this.successCount = 0;
                break;
            case 'CLOSED':
                this.failures = 0;
                this.successCount = 0;
                break;
        }
        
        this.onStateChange({
            from: oldState,
            to: newState,
            failures: this.failures,
            requestCount: this.requestCount
        });
    }
    
    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            requestCount: this.requestCount,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.state === 'OPEN' ? this.nextAttempt : null
        };
    }
}

/**
 * Rate Limiter implementation using token bucket algorithm
 */
class RateLimiter {
    constructor(options = {}) {
        this.capacity = options.capacity || 10; // Maximum tokens
        this.refillRate = options.refillRate || 1; // Tokens per interval
        this.interval = options.interval || 1000; // Interval in ms
        
        this.tokens = this.capacity;
        this.lastRefill = Date.now();
        
        // Start refill timer
        this.startRefillTimer();
    }
    
    /**
     * Try to consume tokens
     * @param {number} tokens - Number of tokens to consume (default: 1)
     * @returns {boolean} True if tokens were consumed, false if rate limited
     */
    tryConsume(tokens = 1) {
        this.refill();
        
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        
        return false;
    }
    
    /**
     * Wait until tokens are available
     * @param {number} tokens - Number of tokens needed (default: 1)
     * @returns {Promise<void>}
     */
    async waitForTokens(tokens = 1) {
        while (!this.tryConsume(tokens)) {
            await new Promise(resolve => setTimeout(resolve, this.interval));
        }
    }
    
    /**
     * Refill tokens based on elapsed time
     */
    refill() {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        const tokensToAdd = Math.floor(elapsed / this.interval) * this.refillRate;
        
        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }
    
    /**
     * Start automatic refill timer
     */
    startRefillTimer() {
        setInterval(() => this.refill(), this.interval);
    }
    
    /**
     * Get current status
     * @returns {Object} Rate limiter status
     */
    getStatus() {
        this.refill();
        return {
            tokens: this.tokens,
            capacity: this.capacity,
            refillRate: this.refillRate,
            interval: this.interval
        };
    }
}

/**
 * Create a resilient API client with retry, circuit breaker, and rate limiting
 * @param {Object} options - Client options
 * @returns {Function} Wrapped API function
 */
function createResilientClient(options = {}) {
    const circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    const rateLimiter = new RateLimiter(options.rateLimiter);
    
    return async function(apiCall, retryOptions = {}) {
        // Wait for rate limit
        await rateLimiter.waitForTokens();
        
        // Execute with circuit breaker and retry
        return circuitBreaker.execute(async () => {
            return retryWithBackoff(apiCall, {
                ...options.retry,
                ...retryOptions
            });
        });
    };
}

module.exports = {
    retryWithBackoff,
    CircuitBreaker,
    RateLimiter,
    createResilientClient
};