/**
 * Analytics Module
 * Tracks system metrics, agent performance, and business KPIs
 */

const os = require('os');
const fs = require('fs').promises;
const path = require('path');
// Logger is optional for analytics
let logger;
try {
    logger = require('./logger').logger;
} catch (e) {
    // Fallback logger if not available
    logger = {
        info: console.log,
        debug: console.debug,
        warn: console.warn,
        error: console.error
    };
}

class AnalyticsTracker {
    constructor() {
        this.metricsConfig = {
            system: ['cpu', 'memory', 'disk', 'network'],
            application: [
                'agent_execution_time',
                'api_response_time',
                'error_rate',
                'success_rate'
            ],
            business: [
                'daily_content_count',
                'approval_rate',
                'distribution_success',
                'advisor_satisfaction'
            ]
        };

        this.metrics = {
            system: {},
            application: {},
            business: {},
            agents: new Map(),
            api: new Map()
        };

        this.startTime = Date.now();
        this.metricsFilePath = path.join(process.cwd(), 'logs', 'analytics.json');
        
        // Start periodic metrics collection
        this.startMetricsCollection();
    }

    /**
     * System Metrics Collection
     */
    collectSystemMetrics() {
        const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const loadAverage = os.loadavg();

        // CPU metrics
        const cpuUsage = cpus.map(cpu => {
            const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
            const idle = cpu.times.idle;
            return ((total - idle) / total * 100).toFixed(2);
        });

        this.metrics.system = {
            cpu: {
                usage: cpuUsage,
                average: (cpuUsage.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / cpuUsage.length).toFixed(2),
                loadAverage: loadAverage[0].toFixed(2),
                cores: cpus.length
            },
            memory: {
                total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + 'GB',
                free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + 'GB',
                used: ((totalMemory - freeMemory) / 1024 / 1024 / 1024).toFixed(2) + 'GB',
                percentage: ((1 - freeMemory / totalMemory) * 100).toFixed(2)
            },
            uptime: {
                system: os.uptime(),
                process: process.uptime()
            },
            timestamp: new Date().toISOString()
        };

        return this.metrics.system;
    }

    /**
     * Agent Performance Tracking
     */
    trackAgentExecution(agentId, executionTime, status = 'success') {
        if (!this.metrics.agents.has(agentId)) {
            this.metrics.agents.set(agentId, {
                executions: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                successes: 0,
                failures: 0,
                errorRate: 0
            });
        }

        const agentMetrics = this.metrics.agents.get(agentId);
        agentMetrics.executions++;
        agentMetrics.totalTime += executionTime;
        agentMetrics.avgTime = agentMetrics.totalTime / agentMetrics.executions;
        agentMetrics.minTime = Math.min(agentMetrics.minTime, executionTime);
        agentMetrics.maxTime = Math.max(agentMetrics.maxTime, executionTime);

        if (status === 'success') {
            agentMetrics.successes++;
        } else {
            agentMetrics.failures++;
        }

        agentMetrics.errorRate = (agentMetrics.failures / agentMetrics.executions * 100).toFixed(2);
        agentMetrics.successRate = (agentMetrics.successes / agentMetrics.executions * 100).toFixed(2);

        logger.debug(`Agent ${agentId} execution tracked: ${executionTime}ms, status: ${status}`);
    }

    /**
     * API Response Time Tracking
     */
    trackApiCall(apiName, responseTime, status = 'success') {
        if (!this.metrics.api.has(apiName)) {
            this.metrics.api.set(apiName, {
                calls: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0,
                successes: 0,
                failures: 0,
                errorRate: 0
            });
        }

        const apiMetrics = this.metrics.api.get(apiName);
        apiMetrics.calls++;
        apiMetrics.totalTime += responseTime;
        apiMetrics.avgTime = apiMetrics.totalTime / apiMetrics.calls;
        apiMetrics.minTime = Math.min(apiMetrics.minTime, responseTime);
        apiMetrics.maxTime = Math.max(apiMetrics.maxTime, responseTime);

        if (status === 'success') {
            apiMetrics.successes++;
        } else {
            apiMetrics.failures++;
        }

        apiMetrics.errorRate = (apiMetrics.failures / apiMetrics.calls * 100).toFixed(2);

        logger.debug(`API ${apiName} call tracked: ${responseTime}ms, status: ${status}`);
    }

    /**
     * Business KPI Tracking
     */
    trackBusinessMetric(metric, value) {
        if (!this.metrics.business[metric]) {
            this.metrics.business[metric] = {
                value: 0,
                count: 0,
                history: []
            };
        }

        const businessMetric = this.metrics.business[metric];
        
        if (typeof value === 'number') {
            businessMetric.value += value;
            businessMetric.count++;
            businessMetric.average = businessMetric.value / businessMetric.count;
        } else {
            businessMetric.value = value;
            businessMetric.count++;
        }

        businessMetric.history.push({
            value,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 entries in history
        if (businessMetric.history.length > 100) {
            businessMetric.history.shift();
        }

        logger.debug(`Business metric ${metric} tracked: ${value}`);
    }

    /**
     * Daily Content Count
     */
    incrementDailyContent() {
        const today = new Date().toISOString().split('T')[0];
        if (!this.metrics.business.daily_content) {
            this.metrics.business.daily_content = {};
        }
        
        if (!this.metrics.business.daily_content[today]) {
            this.metrics.business.daily_content[today] = 0;
        }
        
        this.metrics.business.daily_content[today]++;
    }

    /**
     * Approval Rate Tracking
     */
    trackApproval(approved, method = 'auto') {
        if (!this.metrics.business.approvals) {
            this.metrics.business.approvals = {
                total: 0,
                approved: 0,
                rejected: 0,
                auto: 0,
                manual: 0,
                rate: 0
            };
        }

        this.metrics.business.approvals.total++;
        
        if (approved) {
            this.metrics.business.approvals.approved++;
            if (method === 'auto') {
                this.metrics.business.approvals.auto++;
            } else {
                this.metrics.business.approvals.manual++;
            }
        } else {
            this.metrics.business.approvals.rejected++;
        }

        this.metrics.business.approvals.rate = 
            (this.metrics.business.approvals.approved / this.metrics.business.approvals.total * 100).toFixed(2);
    }

    /**
     * Distribution Success Tracking
     */
    trackDistribution(success, channel = 'whatsapp') {
        if (!this.metrics.business.distribution) {
            this.metrics.business.distribution = {
                total: 0,
                successful: 0,
                failed: 0,
                byChannel: {},
                rate: 0
            };
        }

        this.metrics.business.distribution.total++;
        
        if (!this.metrics.business.distribution.byChannel[channel]) {
            this.metrics.business.distribution.byChannel[channel] = {
                sent: 0,
                delivered: 0,
                failed: 0
            };
        }

        this.metrics.business.distribution.byChannel[channel].sent++;
        
        if (success) {
            this.metrics.business.distribution.successful++;
            this.metrics.business.distribution.byChannel[channel].delivered++;
        } else {
            this.metrics.business.distribution.failed++;
            this.metrics.business.distribution.byChannel[channel].failed++;
        }

        this.metrics.business.distribution.rate = 
            (this.metrics.business.distribution.successful / this.metrics.business.distribution.total * 100).toFixed(2);
    }

    /**
     * Advisor Satisfaction Score
     */
    trackSatisfaction(advisorId, score, feedback = '') {
        if (!this.metrics.business.satisfaction) {
            this.metrics.business.satisfaction = {
                total: 0,
                sumScores: 0,
                average: 0,
                byAdvisor: {},
                feedback: []
            };
        }

        this.metrics.business.satisfaction.total++;
        this.metrics.business.satisfaction.sumScores += score;
        this.metrics.business.satisfaction.average = 
            (this.metrics.business.satisfaction.sumScores / this.metrics.business.satisfaction.total).toFixed(2);

        this.metrics.business.satisfaction.byAdvisor[advisorId] = {
            score,
            feedback,
            timestamp: new Date().toISOString()
        };

        if (feedback) {
            this.metrics.business.satisfaction.feedback.push({
                advisorId,
                feedback,
                score,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Application Metrics
     */
    calculateApplicationMetrics() {
        // Calculate overall error rate
        let totalCalls = 0;
        let totalErrors = 0;

        for (const agentMetrics of this.metrics.agents.values()) {
            totalCalls += agentMetrics.executions;
            totalErrors += agentMetrics.failures;
        }

        for (const apiMetrics of this.metrics.api.values()) {
            totalCalls += apiMetrics.calls;
            totalErrors += apiMetrics.failures;
        }

        this.metrics.application = {
            totalCalls,
            totalErrors,
            errorRate: totalCalls > 0 ? (totalErrors / totalCalls * 100).toFixed(2) : 0,
            successRate: totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls * 100).toFixed(2) : 0,
            uptime: process.uptime(),
            avgAgentExecutionTime: this.calculateAvgAgentTime(),
            avgApiResponseTime: this.calculateAvgApiTime()
        };

        return this.metrics.application;
    }

    calculateAvgAgentTime() {
        let totalTime = 0;
        let totalExecutions = 0;

        for (const agentMetrics of this.metrics.agents.values()) {
            totalTime += agentMetrics.totalTime;
            totalExecutions += agentMetrics.executions;
        }

        return totalExecutions > 0 ? (totalTime / totalExecutions).toFixed(2) : 0;
    }

    calculateAvgApiTime() {
        let totalTime = 0;
        let totalCalls = 0;

        for (const apiMetrics of this.metrics.api.values()) {
            totalTime += apiMetrics.totalTime;
            totalCalls += apiMetrics.calls;
        }

        return totalCalls > 0 ? (totalTime / totalCalls).toFixed(2) : 0;
    }

    /**
     * Dashboard Endpoint Data
     */
    getDashboardData() {
        this.collectSystemMetrics();
        this.calculateApplicationMetrics();

        return {
            system: this.metrics.system,
            application: this.metrics.application,
            business: this.metrics.business,
            agents: Object.fromEntries(this.metrics.agents),
            apis: Object.fromEntries(this.metrics.api),
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime
        };
    }

    /**
     * Metric Aggregation and Reporting
     */
    async generateReport(period = 'daily') {
        const report = {
            period,
            generatedAt: new Date().toISOString(),
            metrics: this.getDashboardData(),
            summary: this.generateSummary()
        };

        // Save report to file
        const reportPath = path.join(
            process.cwd(), 
            'logs', 
            `analytics-report-${period}-${Date.now()}.json`
        );

        try {
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            logger.info(`Analytics report saved to ${reportPath}`);
        } catch (error) {
            logger.error('Failed to save analytics report:', error);
        }

        return report;
    }

    generateSummary() {
        const dashboard = this.getDashboardData();
        
        return {
            systemHealth: {
                cpu: `${dashboard.system.cpu.average}%`,
                memory: `${dashboard.system.memory.percentage}%`,
                status: this.getSystemHealthStatus()
            },
            applicationPerformance: {
                errorRate: `${dashboard.application.errorRate}%`,
                successRate: `${dashboard.application.successRate}%`,
                avgResponseTime: `${dashboard.application.avgApiResponseTime}ms`,
                status: this.getApplicationStatus()
            },
            businessMetrics: {
                dailyContent: dashboard.business.daily_content,
                approvalRate: dashboard.business.approvals?.rate || 'N/A',
                distributionRate: dashboard.business.distribution?.rate || 'N/A',
                satisfactionScore: dashboard.business.satisfaction?.average || 'N/A'
            }
        };
    }

    getSystemHealthStatus() {
        const cpu = parseFloat(this.metrics.system.cpu?.average || 0);
        const memory = parseFloat(this.metrics.system.memory?.percentage || 0);

        if (cpu > 90 || memory > 90) return 'CRITICAL';
        if (cpu > 75 || memory > 75) return 'WARNING';
        return 'HEALTHY';
    }

    getApplicationStatus() {
        const errorRate = parseFloat(this.metrics.application?.errorRate || 0);
        
        if (errorRate > 10) return 'CRITICAL';
        if (errorRate > 5) return 'WARNING';
        return 'HEALTHY';
    }

    /**
     * Start periodic metrics collection
     */
    startMetricsCollection() {
        // Collect system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // Save metrics to file every 5 minutes
        setInterval(async () => {
            await this.saveMetrics();
        }, 300000);

        logger.info('Analytics metrics collection started');
    }

    /**
     * Save metrics to file
     */
    async saveMetrics() {
        try {
            const metricsData = this.getDashboardData();
            await fs.writeFile(this.metricsFilePath, JSON.stringify(metricsData, null, 2));
            logger.debug('Metrics saved to file');
        } catch (error) {
            logger.error('Failed to save metrics:', error);
        }
    }

    /**
     * Load historical metrics
     */
    async loadHistoricalMetrics() {
        try {
            const data = await fs.readFile(this.metricsFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Failed to load historical metrics:', error);
            return null;
        }
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            system: {},
            application: {},
            business: {},
            agents: new Map(),
            api: new Map()
        };
        logger.info('Analytics metrics reset');
    }
}

// Singleton instance
let analyticsInstance = null;

function getAnalytics() {
    if (!analyticsInstance) {
        analyticsInstance = new AnalyticsTracker();
    }
    return analyticsInstance;
}

module.exports = {
    getAnalytics,
    AnalyticsTracker
};