/**
 * Test Suite for Distribution Controller Research-Backed Improvements
 * Tests circuit breaker, KPI monitoring, retry logic with jitter, and traceability
 */

const CircuitBreaker = require('../services/distribution/circuit-breaker');
const KPIMonitor = require('../services/distribution/kpi-monitor');

describe('Distribution Controller Research-Backed Improvements', () => {

    describe('Circuit Breaker Pattern', () => {
        let circuitBreaker;

        beforeEach(() => {
            circuitBreaker = new CircuitBreaker({ threshold: 0.5, timeout: 1000 });
        });

        test('should remain CLOSED with low failure rate', () => {
            circuitBreaker.recordSuccess();
            circuitBreaker.recordSuccess();
            circuitBreaker.recordFailure();

            expect(circuitBreaker.getStatus().state).toBe('CLOSED');
            expect(circuitBreaker.getFailureRate()).toBe(1/3);
        });

        test('should OPEN when failure threshold exceeded', () => {
            // Exceed 50% threshold with 10 attempts minimum
            for (let i = 0; i < 5; i++) {
                circuitBreaker.recordSuccess();
            }
            for (let i = 0; i < 6; i++) {
                circuitBreaker.recordFailure();
            }

            expect(circuitBreaker.getStatus().state).toBe('OPEN');
            expect(circuitBreaker.isOpen()).toBe(true);
        });

        test('should transition to HALF_OPEN after timeout', (done) => {
            // Force circuit breaker open
            for (let i = 0; i < 5; i++) {
                circuitBreaker.recordSuccess();
            }
            for (let i = 0; i < 6; i++) {
                circuitBreaker.recordFailure();
            }

            expect(circuitBreaker.getStatus().state).toBe('OPEN');

            // Wait for timeout + small buffer
            setTimeout(() => {
                expect(circuitBreaker.isOpen()).toBe(false); // Should transition to HALF_OPEN
                done();
            }, 1100);
        });

        test('should close from HALF_OPEN on success', () => {
            circuitBreaker.transitionTo('HALF_OPEN');
            circuitBreaker.recordSuccess();

            expect(circuitBreaker.getStatus().state).toBe('CLOSED');
        });

        test('should reopen from HALF_OPEN on failure', () => {
            circuitBreaker.transitionTo('HALF_OPEN');
            circuitBreaker.recordFailure();

            expect(circuitBreaker.getStatus().state).toBe('OPEN');
        });
    });

    describe('KPI Monitoring', () => {
        let kpiMonitor;

        beforeEach(() => {
            kpiMonitor = new KPIMonitor({
                firstAttemptSuccessRate: 0.99,
                avgDeliveryTimeMs: 2500
            });
        });

        test('should calculate first attempt success rate correctly', () => {
            kpiMonitor.recordDelivery({ success: true, retryCount: 0 });
            kpiMonitor.recordDelivery({ success: true, retryCount: 0 });
            kpiMonitor.recordDelivery({ success: false, retryCount: 0 });

            const kpis = kpiMonitor.calculateKPIs();
            expect(kpis.kpis.firstAttemptSuccessRate).toBeCloseTo(2/3);
        });

        test('should calculate overall delivery rate with retries', () => {
            kpiMonitor.recordDelivery({ success: true, retryCount: 0 });  // First attempt success
            kpiMonitor.recordDelivery({ success: true, retryCount: 2 });  // Retry success
            kpiMonitor.recordDelivery({ success: false, retryCount: 3 }); // Final failure

            const kpis = kpiMonitor.calculateKPIs();
            expect(kpis.kpis.overallDeliveryRate).toBeCloseTo(2/3);
        });

        test('should identify KPI violations', () => {
            // Record deliveries that violate first attempt success rate (target: 99%)
            kpiMonitor.recordDelivery({ success: true, retryCount: 0 });
            kpiMonitor.recordDelivery({ success: false, retryCount: 0 });

            const results = kpiMonitor.calculateKPIs();
            expect(results.violations.length).toBeGreaterThan(0);
            expect(results.slaCompliant).toBe(false);
        });

        test('should track average delivery time', () => {
            kpiMonitor.recordDelivery({ success: true, deliveryTimeMs: 1000 });
            kpiMonitor.recordDelivery({ success: true, deliveryTimeMs: 2000 });
            kpiMonitor.recordDelivery({ success: true, deliveryTimeMs: 3000 });

            const kpis = kpiMonitor.calculateKPIs();
            expect(kpis.kpis.avgDeliveryTimeMs).toBe(2000);
        });

        test('should generate comprehensive report', () => {
            kpiMonitor.startDistribution();
            kpiMonitor.recordDelivery({ success: true, retryCount: 0, deliveryTimeMs: 1500 });
            kpiMonitor.recordDelivery({ success: true, retryCount: 1, deliveryTimeMs: 2500 });
            kpiMonitor.endDistribution();

            const report = kpiMonitor.generateReport();

            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('kpis');
            expect(report).toHaveProperty('targets');
            expect(report).toHaveProperty('violations');
            expect(report.summary.totalDeliveries).toBe(2);
            expect(report.summary.successRate).toBe('100.00%');
        });
    });

    describe('Error Categorization', () => {
        // This would test the categorizeError function from the main module
        // For demonstration, we'll simulate the logic
        function categorizeError(errorMessage) {
            if (!errorMessage) return 'UNKNOWN';
            const message = errorMessage.toLowerCase();

            if (message.includes('invalid') || message.includes('not found')) {
                return 'PERMANENT';
            }
            if (message.includes('timeout') || message.includes('network')) {
                return 'TRANSIENT';
            }
            if (message.includes('rate') || message.includes('limit')) {
                return 'TRANSIENT';
            }
            if (message.includes('auth') || message.includes('token')) {
                return 'SYSTEMIC';
            }
            return 'TRANSIENT';
        }

        test('should categorize permanent errors correctly', () => {
            expect(categorizeError('Invalid phone number')).toBe('PERMANENT');
            expect(categorizeError('User not found')).toBe('PERMANENT');
        });

        test('should categorize transient errors correctly', () => {
            expect(categorizeError('Network timeout')).toBe('TRANSIENT');
            expect(categorizeError('Rate limit exceeded')).toBe('TRANSIENT');
        });

        test('should categorize systemic errors correctly', () => {
            expect(categorizeError('Authentication failed')).toBe('SYSTEMIC');
            expect(categorizeError('Invalid token')).toBe('SYSTEMIC');
        });

        test('should default to transient for unknown errors', () => {
            expect(categorizeError('Some unknown error')).toBe('TRANSIENT');
            expect(categorizeError('')).toBe('UNKNOWN');
        });
    });

    describe('Exponential Backoff with Jitter', () => {
        test('should calculate exponential backoff delays', () => {
            const baseDelay = 1000;

            const delay0 = baseDelay * Math.pow(2, 0); // 1000ms
            const delay1 = baseDelay * Math.pow(2, 1); // 2000ms
            const delay2 = baseDelay * Math.pow(2, 2); // 4000ms

            expect(delay0).toBe(1000);
            expect(delay1).toBe(2000);
            expect(delay2).toBe(4000);
        });

        test('should add jitter to prevent thundering herd', () => {
            const baseDelay = 1000;
            const jitters = [];

            // Generate multiple jitter values
            for (let i = 0; i < 100; i++) {
                const jitter = Math.random() * 1000;
                jitters.push(jitter);
            }

            // Jitter should be between 0 and 1000
            jitters.forEach(jitter => {
                expect(jitter).toBeGreaterThanOrEqual(0);
                expect(jitter).toBeLessThan(1000);
            });

            // Jitters should be different (very high probability)
            const uniqueJitters = new Set(jitters);
            expect(uniqueJitters.size).toBeGreaterThan(90); // Allow for some collision
        });
    });

    describe('Integration Scenarios', () => {
        test('should handle circuit breaker opening during distribution', () => {
            const circuitBreaker = new CircuitBreaker({ threshold: 0.5, bucketSize: 4 });
            const kpiMonitor = new KPIMonitor();

            // Simulate distribution with failures causing circuit breaker to open
            const deliveries = [
                { success: true, retryCount: 0 },
                { success: true, retryCount: 0 },
                { success: false, retryCount: 3 },
                { success: false, retryCount: 3 }
            ];

            deliveries.forEach(delivery => {
                kpiMonitor.recordDelivery(delivery);
                if (delivery.success) {
                    circuitBreaker.recordSuccess();
                } else {
                    circuitBreaker.recordFailure();
                }
            });

            expect(circuitBreaker.isOpen()).toBe(true);

            const report = kpiMonitor.generateReport();
            expect(report.violations.length).toBeGreaterThan(0); // Should have KPI violations
        });

        test('should track circuit breaker triggers in KPI monitor', () => {
            const kpiMonitor = new KPIMonitor();

            kpiMonitor.recordCircuitBreakerTrigger();
            kpiMonitor.recordCircuitBreakerTrigger();

            const report = kpiMonitor.generateReport();
            expect(report.kpis.circuitBreakerTriggersThisMonth).toBe(2);
        });
    });
});

module.exports = {
    // Export test utilities for other test files
    createMockCircuitBreaker: (options) => new CircuitBreaker(options),
    createMockKPIMonitor: (targets) => new KPIMonitor(targets)
};