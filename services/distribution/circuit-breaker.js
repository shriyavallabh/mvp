/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring error rates and temporarily blocking requests
 * Based on research: 20% failure rate threshold, 10-minute cooldown
 */

class CircuitBreaker {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.20; // 20% failure rate
        this.timeout = options.timeout || 600000; // 10 minutes in ms
        this.bucketSize = options.bucketSize || 10; // Minimum attempts before evaluation

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttempt = null;
        this.stateChangeCallbacks = [];
    }

    /**
     * Check if circuit breaker is open (blocking requests)
     */
    isOpen() {
        // Check if we should transition from OPEN to HALF_OPEN
        if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
            this.transitionTo('HALF_OPEN');
        }
        return this.state === 'OPEN';
    }

    /**
     * Record a successful operation
     */
    recordSuccess() {
        this.failures = 0;
        this.successes++;

        if (this.state === 'HALF_OPEN') {
            // Success in half-open state means we can close the circuit
            this.transitionTo('CLOSED');
        }
    }

    /**
     * Record a failed operation
     */
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();

        const totalAttempts = this.failures + this.successes;

        // Only evaluate after minimum bucket size
        if (totalAttempts >= this.bucketSize) {
            const failureRate = this.failures / totalAttempts;

            if (failureRate >= this.threshold) {
                this.transitionTo('OPEN');
            }
        }

        if (this.state === 'HALF_OPEN') {
            // Failure in half-open state means we need to reopen
            this.transitionTo('OPEN');
        }
    }

    /**
     * Transition to a new state
     */
    transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;

        switch (newState) {
            case 'OPEN':
                this.nextAttempt = Date.now() + this.timeout;
                console.log(`⚠️ Circuit Breaker OPENED - Pausing distribution for ${this.timeout/1000} seconds`);
                break;
            case 'HALF_OPEN':
                console.log('🔄 Circuit Breaker HALF-OPEN - Testing with single delivery');
                break;
            case 'CLOSED':
                this.failures = 0;
                this.successes = 0;
                console.log('✅ Circuit Breaker CLOSED - Normal operation resumed');
                break;
        }

        // Notify listeners of state change
        this.stateChangeCallbacks.forEach(callback => {
            callback(oldState, newState, {
                failures: this.failures,
                successes: this.successes,
                failureRate: this.getFailureRate()
            });
        });
    }

    /**
     * Get current failure rate
     */
    getFailureRate() {
        const total = this.failures + this.successes;
        return total > 0 ? (this.failures / total) : 0;
    }

    /**
     * Register callback for state changes
     */
    onStateChange(callback) {
        this.stateChangeCallbacks.push(callback);
    }

    /**
     * Get circuit breaker status
     */
    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            failureRate: this.getFailureRate(),
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt
        };
    }

    /**
     * Reset circuit breaker (for testing or manual intervention)
     */
    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttempt = null;
        console.log('🔧 Circuit Breaker manually reset');
    }
}

module.exports = CircuitBreaker;