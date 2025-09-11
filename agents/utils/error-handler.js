#!/usr/bin/env node

class ErrorHandler {
    constructor() {
        this.retryDefaults = {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2
        };
        
        this.errorCategories = {
            TRANSIENT: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'EHOSTUNREACH'],
            RATE_LIMIT: ['RATE_LIMIT_EXCEEDED', 'TOO_MANY_REQUESTS', '429'],
            AUTH: ['UNAUTHORIZED', 'FORBIDDEN', '401', '403'],
            DATA: ['VALIDATION_ERROR', 'INVALID_DATA', 'MISSING_REQUIRED_FIELD'],
            SYSTEM: ['OUT_OF_MEMORY', 'DISK_FULL', 'PERMISSION_DENIED'],
            PERMANENT: ['NOT_FOUND', '404', 'METHOD_NOT_ALLOWED', '405']
        };
        
        this.circuitBreakers = new Map();
    }

    async handleError(error, context = {}) {
        try {
            const errorInfo = this.categorizeError(error);
            const strategy = this.determineStrategy(errorInfo, context);
            
            if (this.logger) {
                this.logger.error('Error occurred', {
                    error: error.message,
                    category: errorInfo.category,
                    strategy: strategy.type,
                    context
                });
            }
            
            switch (strategy.type) {
                case 'RETRY':
                    return await this.handleRetry(error, context, strategy.config);
                
                case 'CIRCUIT_BREAK':
                    return await this.handleCircuitBreak(error, context);
                
                case 'FALLBACK':
                    return await this.handleFallback(error, context);
                
                case 'PROPAGATE':
                    throw error;
                
                case 'GRACEFUL_DEGRADATION':
                    return await this.handleGracefulDegradation(error, context);
                
                default:
                    console.error('Unknown error strategy:', strategy.type);
                    throw error;
            }
        } catch (handlingError) {
            console.error('Error in error handler:', handlingError);
            throw error;
        }
    }

    categorizeError(error) {
        const errorString = error.toString();
        const errorCode = error.code || error.statusCode || '';
        
        for (const [category, patterns] of Object.entries(this.errorCategories)) {
            if (patterns.some(pattern => 
                errorString.includes(pattern) || 
                errorCode.toString().includes(pattern)
            )) {
                return {
                    category,
                    isTransient: category === 'TRANSIENT' || category === 'RATE_LIMIT',
                    isRetryable: category !== 'PERMANENT' && category !== 'AUTH',
                    requiresIntervention: category === 'AUTH' || category === 'SYSTEM'
                };
            }
        }
        
        return {
            category: 'UNKNOWN',
            isTransient: false,
            isRetryable: true,
            requiresIntervention: false
        };
    }

    determineStrategy(errorInfo, context) {
        if (errorInfo.category === 'PERMANENT') {
            return { type: 'PROPAGATE' };
        }
        
        if (errorInfo.category === 'AUTH') {
            return { type: 'PROPAGATE' };
        }
        
        if (errorInfo.category === 'SYSTEM') {
            return { type: 'GRACEFUL_DEGRADATION' };
        }
        
        if (errorInfo.isTransient) {
            const retryCount = context.retryCount || 0;
            const maxRetries = context.maxRetries || this.retryDefaults.maxRetries;
            
            if (retryCount < maxRetries) {
                return {
                    type: 'RETRY',
                    config: {
                        ...this.retryDefaults,
                        ...context.retryConfig
                    }
                };
            } else {
                return { type: 'CIRCUIT_BREAK' };
            }
        }
        
        if (errorInfo.category === 'DATA') {
            return { type: 'FALLBACK' };
        }
        
        return { type: 'PROPAGATE' };
    }

    async handleRetry(error, context, config) {
        const retryCount = (context.retryCount || 0) + 1;
        const delay = this.calculateBackoff(retryCount, config);
        
        console.log(`Retrying operation (attempt ${retryCount}/${config.maxRetries}) after ${delay}ms`);
        
        await this.delay(delay);
        
        return {
            retry: true,
            retryCount,
            delay,
            originalError: error
        };
    }

    calculateBackoff(retryCount, config) {
        const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, retryCount - 1);
        const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
        return Math.min(jitteredDelay, config.maxDelay);
    }

    async handleCircuitBreak(error, context) {
        const circuitKey = context.circuitKey || 'default';
        
        if (!this.circuitBreakers.has(circuitKey)) {
            this.circuitBreakers.set(circuitKey, {
                state: 'CLOSED',
                failures: 0,
                lastFailure: null,
                nextAttempt: null
            });
        }
        
        const circuit = this.circuitBreakers.get(circuitKey);
        
        circuit.failures++;
        circuit.lastFailure = new Date();
        
        if (circuit.failures >= 5) {
            circuit.state = 'OPEN';
            circuit.nextAttempt = new Date(Date.now() + 60000);
            
            console.error(`Circuit breaker OPEN for ${circuitKey}. Will retry after ${circuit.nextAttempt}`);
            
            return {
                retry: false,
                circuitOpen: true,
                nextAttempt: circuit.nextAttempt,
                originalError: error
            };
        }
        
        return {
            retry: false,
            circuitOpen: false,
            failures: circuit.failures,
            originalError: error
        };
    }

    async handleFallback(error, context) {
        console.log('Executing fallback strategy');
        
        if (context.fallbackData) {
            return {
                success: true,
                fallback: true,
                data: context.fallbackData,
                originalError: error
            };
        }
        
        if (context.fallbackFunction) {
            try {
                const fallbackResult = await context.fallbackFunction();
                return {
                    success: true,
                    fallback: true,
                    data: fallbackResult,
                    originalError: error
                };
            } catch (fallbackError) {
                console.error('Fallback function failed:', fallbackError);
                throw error;
            }
        }
        
        return {
            success: false,
            fallback: true,
            data: null,
            originalError: error
        };
    }

    async handleGracefulDegradation(error, context) {
        console.log('Applying graceful degradation');
        
        const degradedResponse = {
            success: false,
            degraded: true,
            originalError: error,
            timestamp: new Date().toISOString()
        };
        
        if (context.degradationStrategy === 'CACHE') {
            degradedResponse.data = context.cachedData || null;
            degradedResponse.fromCache = true;
        } else if (context.degradationStrategy === 'DEFAULT') {
            degradedResponse.data = context.defaultData || {};
            degradedResponse.isDefault = true;
        } else {
            degradedResponse.data = null;
            degradedResponse.serviceUnavailable = true;
        }
        
        return degradedResponse;
    }

    createErrorRecoveryPlan(error, context) {
        const errorInfo = this.categorizeError(error);
        const plan = {
            steps: [],
            estimatedRecoveryTime: 0,
            requiresManualIntervention: false
        };
        
        switch (errorInfo.category) {
            case 'TRANSIENT':
                plan.steps.push('Wait for network to stabilize');
                plan.steps.push('Retry with exponential backoff');
                plan.estimatedRecoveryTime = 30;
                break;
            
            case 'RATE_LIMIT':
                plan.steps.push('Implement request throttling');
                plan.steps.push('Wait for rate limit window to reset');
                plan.estimatedRecoveryTime = 60;
                break;
            
            case 'AUTH':
                plan.steps.push('Check authentication credentials');
                plan.steps.push('Refresh authentication token');
                plan.steps.push('Contact administrator if issue persists');
                plan.requiresManualIntervention = true;
                break;
            
            case 'DATA':
                plan.steps.push('Validate input data format');
                plan.steps.push('Check for missing required fields');
                plan.steps.push('Sanitize and retry');
                plan.estimatedRecoveryTime = 5;
                break;
            
            case 'SYSTEM':
                plan.steps.push('Check system resources');
                plan.steps.push('Clear temporary files');
                plan.steps.push('Restart service if necessary');
                plan.requiresManualIntervention = true;
                break;
            
            default:
                plan.steps.push('Log error for investigation');
                plan.steps.push('Notify development team');
                plan.requiresManualIntervention = true;
        }
        
        return plan;
    }

    resetCircuitBreaker(circuitKey) {
        if (this.circuitBreakers.has(circuitKey)) {
            this.circuitBreakers.set(circuitKey, {
                state: 'CLOSED',
                failures: 0,
                lastFailure: null,
                nextAttempt: null
            });
            console.log(`Circuit breaker reset for ${circuitKey}`);
        }
    }

    getCircuitBreakerStatus(circuitKey) {
        if (!this.circuitBreakers.has(circuitKey)) {
            return { state: 'CLOSED', healthy: true };
        }
        
        const circuit = this.circuitBreakers.get(circuitKey);
        
        if (circuit.state === 'OPEN' && circuit.nextAttempt) {
            if (new Date() >= circuit.nextAttempt) {
                circuit.state = 'HALF_OPEN';
            }
        }
        
        return {
            ...circuit,
            healthy: circuit.state === 'CLOSED'
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    attachLogger(logger) {
        this.logger = logger;
    }

    async test() {
        console.log('=== Error Handler Test Mode ===\n');
        
        console.log('1. Testing error categorization...');
        const testErrors = [
            new Error('ECONNREFUSED: Connection refused'),
            new Error('401 Unauthorized'),
            new Error('VALIDATION_ERROR: Invalid input'),
            new Error('404 Not Found'),
            { code: 'ETIMEDOUT', message: 'Request timeout' }
        ];
        
        testErrors.forEach(error => {
            const category = this.categorizeError(error);
            console.log(`  Error: "${error.message || error.code}" -> Category: ${category.category}`);
        });
        
        console.log('\n2. Testing retry mechanism...');
        const retryContext = { retryCount: 0, maxRetries: 3 };
        const retryError = new Error('ECONNREFUSED');
        
        for (let i = 0; i < 3; i++) {
            const delay = this.calculateBackoff(i + 1, this.retryDefaults);
            console.log(`  Retry ${i + 1}: Delay = ${Math.round(delay)}ms`);
        }
        
        console.log('\n3. Testing circuit breaker...');
        const circuitKey = 'test-service';
        
        for (let i = 0; i < 6; i++) {
            await this.handleCircuitBreak(new Error('Service unavailable'), { circuitKey });
            const status = this.getCircuitBreakerStatus(circuitKey);
            console.log(`  Failure ${i + 1}: Circuit state = ${status.state}`);
        }
        
        this.resetCircuitBreaker(circuitKey);
        const resetStatus = this.getCircuitBreakerStatus(circuitKey);
        console.log(`  After reset: Circuit state = ${resetStatus.state}`);
        
        console.log('\n4. Testing error recovery plans...');
        const planErrors = [
            { error: new Error('ECONNREFUSED'), name: 'Network Error' },
            { error: new Error('429 Too Many Requests'), name: 'Rate Limit' },
            { error: new Error('VALIDATION_ERROR'), name: 'Data Error' }
        ];
        
        planErrors.forEach(({ error, name }) => {
            const plan = this.createErrorRecoveryPlan(error);
            console.log(`\n  ${name} Recovery Plan:`);
            console.log(`    Steps: ${plan.steps.join(' -> ')}`);
            console.log(`    Est. Recovery: ${plan.estimatedRecoveryTime}s`);
            console.log(`    Manual Intervention: ${plan.requiresManualIntervention}`);
        });
        
        console.log('\n5. Testing fallback handling...');
        const fallbackResult = await this.handleFallback(
            new Error('Service unavailable'),
            {
                fallbackData: { status: 'cached', data: 'fallback data' }
            }
        );
        console.log(`  Fallback successful: ${fallbackResult.success}`);
        console.log(`  Fallback data: ${JSON.stringify(fallbackResult.data)}`);
        
        console.log('\n=== Test Complete ===');
    }
}

if (require.main === module) {
    const handler = new ErrorHandler();
    handler.test();
}

module.exports = ErrorHandler;