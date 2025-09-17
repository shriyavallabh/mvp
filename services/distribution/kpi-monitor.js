/**
 * KPI Monitoring Module
 * Tracks and reports on Key Performance Indicators for distribution
 * Based on research: 99% first-attempt success, <2.5s avg delivery time
 */

class KPIMonitor {
    constructor(targets = {}) {
        this.targets = {
            firstAttemptSuccessRate: targets.firstAttemptSuccessRate || 0.99,
            overallDeliveryRate: targets.overallDeliveryRate || 0.9999,
            avgDeliveryTimeMs: targets.avgDeliveryTimeMs || 2500,
            distributionWindowMinutes: targets.distributionWindowMinutes || 5,
            circuitBreakerTriggersPerMonth: targets.circuitBreakerTriggersPerMonth || 1
        };

        this.metrics = {
            totalDeliveries: 0,
            firstAttemptSuccesses: 0,
            retriedSuccesses: 0,
            totalFailures: 0,
            deliveryTimes: [],
            circuitBreakerTriggers: [],
            startTime: null,
            endTime: null
        };

        this.violations = [];
    }

    /**
     * Record a delivery attempt
     */
    recordDelivery(result) {
        this.metrics.totalDeliveries++;

        if (result.success) {
            if (result.retryCount === 0) {
                this.metrics.firstAttemptSuccesses++;
            } else {
                this.metrics.retriedSuccesses++;
            }
        } else {
            this.metrics.totalFailures++;
        }

        if (result.deliveryTimeMs) {
            this.metrics.deliveryTimes.push(result.deliveryTimeMs);
        }
    }

    /**
     * Record circuit breaker trigger
     */
    recordCircuitBreakerTrigger() {
        this.metrics.circuitBreakerTriggers.push(new Date().toISOString());
    }

    /**
     * Mark distribution start
     */
    startDistribution() {
        this.metrics.startTime = Date.now();
    }

    /**
     * Mark distribution end and calculate KPIs
     */
    endDistribution() {
        this.metrics.endTime = Date.now();
        return this.calculateKPIs();
    }

    /**
     * Calculate current KPIs
     */
    calculateKPIs() {
        const kpis = {
            firstAttemptSuccessRate: this.calculateFirstAttemptSuccessRate(),
            overallDeliveryRate: this.calculateOverallDeliveryRate(),
            avgDeliveryTimeMs: this.calculateAvgDeliveryTime(),
            distributionDurationMinutes: this.calculateDistributionDuration(),
            circuitBreakerTriggersThisMonth: this.getMonthlyCircuitBreakerTriggers()
        };

        // Check for SLA violations
        this.checkViolations(kpis);

        return {
            kpis,
            targets: this.targets,
            violations: this.violations,
            slaCompliant: this.violations.length === 0,
            raw: this.metrics
        };
    }

    /**
     * Calculate first attempt success rate
     */
    calculateFirstAttemptSuccessRate() {
        if (this.metrics.totalDeliveries === 0) return 0;
        return this.metrics.firstAttemptSuccesses / this.metrics.totalDeliveries;
    }

    /**
     * Calculate overall delivery rate (including retries)
     */
    calculateOverallDeliveryRate() {
        if (this.metrics.totalDeliveries === 0) return 0;
        const totalSuccesses = this.metrics.firstAttemptSuccesses + this.metrics.retriedSuccesses;
        return totalSuccesses / this.metrics.totalDeliveries;
    }

    /**
     * Calculate average delivery time
     */
    calculateAvgDeliveryTime() {
        if (this.metrics.deliveryTimes.length === 0) return 0;
        const sum = this.metrics.deliveryTimes.reduce((a, b) => a + b, 0);
        return sum / this.metrics.deliveryTimes.length;
    }

    /**
     * Calculate distribution duration in minutes
     */
    calculateDistributionDuration() {
        if (!this.metrics.startTime || !this.metrics.endTime) return 0;
        return (this.metrics.endTime - this.metrics.startTime) / 60000;
    }

    /**
     * Get circuit breaker triggers for current month
     */
    getMonthlyCircuitBreakerTriggers() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.metrics.circuitBreakerTriggers.filter(timestamp => {
            const date = new Date(timestamp);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
    }

    /**
     * Check for KPI violations
     */
    checkViolations(kpis) {
        this.violations = [];

        if (kpis.firstAttemptSuccessRate < this.targets.firstAttemptSuccessRate) {
            this.violations.push({
                kpi: 'firstAttemptSuccessRate',
                actual: kpis.firstAttemptSuccessRate,
                target: this.targets.firstAttemptSuccessRate,
                severity: 'HIGH'
            });
        }

        if (kpis.overallDeliveryRate < this.targets.overallDeliveryRate) {
            this.violations.push({
                kpi: 'overallDeliveryRate',
                actual: kpis.overallDeliveryRate,
                target: this.targets.overallDeliveryRate,
                severity: 'CRITICAL'
            });
        }

        if (kpis.avgDeliveryTimeMs > this.targets.avgDeliveryTimeMs) {
            this.violations.push({
                kpi: 'avgDeliveryTime',
                actual: kpis.avgDeliveryTimeMs,
                target: this.targets.avgDeliveryTimeMs,
                severity: 'MEDIUM'
            });
        }

        if (kpis.distributionDurationMinutes > this.targets.distributionWindowMinutes) {
            this.violations.push({
                kpi: 'distributionWindow',
                actual: kpis.distributionDurationMinutes,
                target: this.targets.distributionWindowMinutes,
                severity: 'LOW'
            });
        }

        return this.violations;
    }

    /**
     * Generate KPI report
     */
    generateReport() {
        const results = this.calculateKPIs();

        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalDeliveries: this.metrics.totalDeliveries,
                successRate: `${(results.kpis.overallDeliveryRate * 100).toFixed(2)}%`,
                firstAttemptSuccessRate: `${(results.kpis.firstAttemptSuccessRate * 100).toFixed(2)}%`,
                avgDeliveryTime: `${(results.kpis.avgDeliveryTimeMs / 1000).toFixed(2)}s`,
                duration: `${results.kpis.distributionDurationMinutes.toFixed(2)} minutes`,
                slaCompliant: results.slaCompliant
            },
            kpis: results.kpis,
            targets: results.targets,
            violations: results.violations
        };
    }

    /**
     * Reset metrics (for testing or new distribution run)
     */
    reset() {
        this.metrics = {
            totalDeliveries: 0,
            firstAttemptSuccesses: 0,
            retriedSuccesses: 0,
            totalFailures: 0,
            deliveryTimes: [],
            circuitBreakerTriggers: [],
            startTime: null,
            endTime: null
        };
        this.violations = [];
    }
}

module.exports = KPIMonitor;