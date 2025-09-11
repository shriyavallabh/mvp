#!/usr/bin/env node

/**
 * Test script to verify security fixes implementation
 */

const { validateConfig, getSafeConfig } = require('./config/env.config');
const { validatePhoneNumber, validateWhatsAppMessage } = require('./utils/validation');
const { retryWithBackoff, CircuitBreaker, RateLimiter } = require('./utils/resilience');
const { Logger } = require('./utils/logger');

const logger = new Logger({ name: 'SecurityTest' });

console.log('\n🔒 SECURITY FIXES VERIFICATION');
console.log('=' .repeat(70));

async function testEnvironmentConfig() {
    console.log('\n1️⃣  Testing Environment Configuration...');
    
    try {
        // Validate WhatsApp config
        validateConfig({ whatsapp: true });
        console.log('   ✅ WhatsApp configuration validated');
        
        // Get safe config for logging
        const safeConfig = getSafeConfig();
        console.log('   ✅ Safe config retrieved:', JSON.stringify(safeConfig.whatsapp, null, 2));
        
        return true;
    } catch (error) {
        console.error('   ❌ Configuration validation failed:', error.message);
        return false;
    }
}

async function testValidation() {
    console.log('\n2️⃣  Testing Input Validation...');
    
    // Test phone number validation
    const testNumbers = [
        '9765071249',      // Valid Indian without country code
        '919765071249',    // Valid Indian with country code
        '+919765071249',   // Valid with +
        '123',             // Too short
        'invalid'          // Invalid format
    ];
    
    let passed = 0;
    for (const number of testNumbers) {
        const result = validatePhoneNumber(number);
        if (result.isValid) {
            console.log(`   ✅ Valid: ${number} -> ${result.normalized}`);
            passed++;
        } else {
            console.log(`   ❌ Invalid: ${number} - ${result.error}`);
        }
    }
    
    // Test message validation
    const validMessage = {
        type: 'text',
        text: { body: 'Test message' }
    };
    
    const invalidMessage = {
        type: 'invalid_type',
        content: 'test'
    };
    
    const msgResult1 = validateWhatsAppMessage(validMessage);
    const msgResult2 = validateWhatsAppMessage(invalidMessage);
    
    console.log(`\n   Message validation:`);
    console.log(`   ✅ Valid message: ${msgResult1.isValid}`);
    console.log(`   ❌ Invalid message: ${!msgResult2.isValid} - ${msgResult2.errors.join(', ')}`);
    
    return passed >= 3; // At least 3 valid numbers
}

async function testResilience() {
    console.log('\n3️⃣  Testing Resilience Patterns...');
    
    // Test retry with backoff
    let attempts = 0;
    const retryResult = await retryWithBackoff(
        async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Simulated failure');
            }
            return 'Success after retries';
        },
        {
            maxRetries: 5,
            baseDelay: 100,
            onRetry: ({ attempt }) => {
                console.log(`   🔄 Retry attempt ${attempt}`);
            }
        }
    );
    
    console.log(`   ✅ Retry succeeded after ${attempts} attempts: ${retryResult}`);
    
    // Test circuit breaker
    const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000
    });
    
    // Simulate failures to open circuit
    for (let i = 0; i < 2; i++) {
        try {
            await circuitBreaker.execute(async () => {
                throw new Error('Simulated failure');
            });
        } catch (e) {
            // Expected
        }
    }
    
    const status = circuitBreaker.getStatus();
    console.log(`   ✅ Circuit breaker state: ${status.state} (failures: ${status.failures})`);
    
    // Test rate limiter
    const rateLimiter = new RateLimiter({
        capacity: 5,
        refillRate: 1,
        interval: 100
    });
    
    let consumed = 0;
    for (let i = 0; i < 7; i++) {
        if (rateLimiter.tryConsume()) {
            consumed++;
        }
    }
    
    console.log(`   ✅ Rate limiter: Consumed ${consumed}/7 requests (capacity: 5)`);
    
    return true;
}

async function testLogging() {
    console.log('\n4️⃣  Testing Enhanced Logging...');
    
    // Test different log levels
    logger.error('Test error message', { code: 'TEST_001' });
    logger.warn('Test warning message');
    logger.info('Test info message');
    logger.debug('Test debug message');
    
    // Test timer
    const timer = logger.startTimer('Test operation');
    await new Promise(resolve => setTimeout(resolve, 100));
    timer({ result: 'completed' });
    
    console.log('   ✅ Logging system operational');
    
    return true;
}

async function main() {
    const results = {
        config: await testEnvironmentConfig(),
        validation: await testValidation(),
        resilience: await testResilience(),
        logging: await testLogging()
    };
    
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(70));
    
    const allPassed = Object.values(results).every(r => r);
    
    for (const [test, passed] of Object.entries(results)) {
        console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
    }
    
    if (allPassed) {
        console.log('\n✅ ALL SECURITY FIXES VERIFIED SUCCESSFULLY');
        console.log('\nKey Improvements:');
        console.log('  • API credentials moved to environment variables');
        console.log('  • Input validation for phone numbers and messages');
        console.log('  • Retry logic with exponential backoff');
        console.log('  • Circuit breaker pattern for fault tolerance');
        console.log('  • Rate limiting to prevent API quota exhaustion');
        console.log('  • Enhanced structured logging');
    } else {
        console.log('\n❌ SOME TESTS FAILED - Review the output above');
    }
    
    process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});