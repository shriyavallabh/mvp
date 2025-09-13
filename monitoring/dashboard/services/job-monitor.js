const schedulerState = require('../../../services/scheduler-state');
const logger = require('../../../agents/utils/logger');

class JobMonitor {
    constructor() {
        this.monitoringLogger = new logger('job-monitor');
        this.refreshInterval = 30000; // 30 seconds
        this.jobHistory = new Map();
        this.alertThresholds = {
            maxDuration: {
                'daily-content-generation': 30 * 60 * 1000, // 30 minutes
                'auto-approval-guardian': 10 * 60 * 1000,   // 10 minutes
                'morning-distribution': 15 * 60 * 1000       // 15 minutes
            },
            retryLimit: 3
        };
    }

    async startMonitoring() {
        this.monitoringLogger.info('Job monitor started');
        this.monitorInterval = setInterval(() => {
            this.checkJobHealth().catch(error => {
                this.monitoringLogger.error('Job health check failed:', error);
            });
        }, this.refreshInterval);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitoringLogger.info('Job monitor stopped');
        }
    }

    async checkJobHealth() {
        try {
            const jobStatuses = await schedulerState.getAllJobStatuses();
            
            for (const jobName of Object.keys(this.alertThresholds.maxDuration)) {
                await this.checkJobTimeout(jobName, jobStatuses);
                await this.updateJobHistory(jobName, jobStatuses);
            }
            
        } catch (error) {
            this.monitoringLogger.error('Error during job health check:', error);
        }
    }

    async checkJobTimeout(jobName, jobStatuses) {
        const job = jobStatuses.jobs[jobName];
        if (!job || job.status !== 'RUNNING') return;

        const maxDuration = this.alertThresholds.maxDuration[jobName];
        const startTime = new Date(job.startTime);
        const duration = Date.now() - startTime.getTime();

        if (duration > maxDuration) {
            this.monitoringLogger.error(`Job timeout detected: ${jobName}`, {
                jobName,
                duration,
                maxDuration,
                sessionId: job.sessionId
            });

            await this.triggerJobAlert({
                type: 'TIMEOUT',
                jobName,
                duration,
                maxDuration,
                sessionId: job.sessionId
            });
        }
    }

    async updateJobHistory(jobName, jobStatuses) {
        const job = jobStatuses.jobs[jobName];
        const lastExecution = jobStatuses.lastExecution[jobName];
        
        if (!this.jobHistory.has(jobName)) {
            this.jobHistory.set(jobName, {
                executions: [],
                failures: 0,
                successRate: 100
            });
        }

        const history = this.jobHistory.get(jobName);
        
        if (job && job.status === 'COMPLETED') {
            history.executions.push({
                timestamp: job.endTime,
                duration: new Date(job.endTime) - new Date(job.startTime),
                status: 'SUCCESS'
            });
        } else if (job && job.status === 'FAILED') {
            history.executions.push({
                timestamp: job.endTime,
                duration: new Date(job.endTime) - new Date(job.startTime),
                status: 'FAILED',
                error: job.result?.error
            });
            history.failures++;
        }

        // Keep only last 24 executions
        if (history.executions.length > 24) {
            history.executions = history.executions.slice(-24);
        }

        // Calculate success rate
        const totalExecutions = history.executions.length;
        const successfulExecutions = history.executions.filter(e => e.status === 'SUCCESS').length;
        history.successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;

        this.jobHistory.set(jobName, history);
    }

    async triggerJobAlert(alert) {
        try {
            // Store alert in database for dashboard display
            await this.storeAlert(alert);
            
            // Send notification if critical
            if (alert.type === 'TIMEOUT' || alert.type === 'REPEATED_FAILURE') {
                await this.sendNotification(alert);
            }
            
        } catch (error) {
            this.monitoringLogger.error('Failed to trigger job alert:', error);
        }
    }

    async storeAlert(alert) {
        const fs = require('fs').promises;
        const path = require('path');
        
        const alertsFile = path.join(__dirname, '..', '..', '..', 'data', 'job-alerts.json');
        
        let alerts = [];
        try {
            const existing = await fs.readFile(alertsFile, 'utf8');
            alerts = JSON.parse(existing);
        } catch (error) {
            // File doesn't exist, start with empty array
        }
        
        alerts.push({
            ...alert,
            timestamp: new Date().toISOString(),
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        
        // Keep only last 100 alerts
        if (alerts.length > 100) {
            alerts = alerts.slice(-100);
        }
        
        await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
    }

    async sendNotification(alert) {
        // Integrate with WhatsApp notification system
        try {
            const WhatsAppService = require('../../../services/whatsapp/whatsapp.service');
            const whatsappService = new WhatsAppService();
            
            const message = this.formatAlertMessage(alert);
            
            await whatsappService.sendMessage({
                to: process.env.ADMIN_WHATSAPP_NUMBER,
                message: message,
                type: 'text'
            });
            
        } catch (error) {
            this.monitoringLogger.error('Failed to send alert notification:', error);
        }
    }

    formatAlertMessage(alert) {
        switch (alert.type) {
            case 'TIMEOUT':
                return `🚨 *Job Timeout Alert*

Job: ${alert.jobName}
Duration: ${Math.round(alert.duration / 1000)}s
Max Allowed: ${Math.round(alert.maxDuration / 1000)}s
Session: ${alert.sessionId}

Please check job status and logs.

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

            case 'REPEATED_FAILURE':
                return `🔥 *Repeated Job Failure*

Job: ${alert.jobName}
Failures: ${alert.failureCount}
Last Error: ${alert.lastError}

Immediate attention required.

Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

            default:
                return `⚠️ Job Alert: ${alert.type} for ${alert.jobName}`;
        }
    }

    async getJobDashboardData() {
        try {
            const jobStatuses = await schedulerState.getAllJobStatuses();
            
            return {
                activeJobs: jobStatuses.activeJobs,
                jobStatuses: jobStatuses.jobs,
                lastExecutions: jobStatuses.lastExecution,
                jobHistory: Object.fromEntries(this.jobHistory),
                nextScheduledTimes: this.getNextScheduledTimes(),
                alerts: await this.getRecentAlerts(),
                healthSummary: this.getHealthSummary(jobStatuses)
            };
            
        } catch (error) {
            this.monitoringLogger.error('Failed to get job dashboard data:', error);
            throw error;
        }
    }

    getNextScheduledTimes() {
        const now = new Date();
        const schedules = {
            'daily-content-generation': this.getNextTime(now, 20, 30), // 8:30 PM
            'auto-approval-guardian': this.getNextTime(now, 23, 0),    // 11:00 PM
            'morning-distribution': this.getNextTime(now, 5, 0)        // 5:00 AM
        };
        
        return schedules;
    }

    getNextTime(now, hour, minute) {
        const next = new Date(now);
        next.setHours(hour, minute, 0, 0);
        
        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }
        
        return next.toISOString();
    }

    getHealthSummary(jobStatuses) {
        const jobs = ['daily-content-generation', 'auto-approval-guardian', 'morning-distribution'];
        let healthy = 0;
        let total = jobs.length;
        
        jobs.forEach(jobName => {
            const history = this.jobHistory.get(jobName);
            if (history && history.successRate >= 80) {
                healthy++;
            }
        });
        
        return {
            healthy,
            total,
            healthPercentage: Math.round((healthy / total) * 100),
            status: healthy === total ? 'healthy' : healthy >= total * 0.5 ? 'degraded' : 'unhealthy'
        };
    }

    async getRecentAlerts(limit = 10) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            const alertsFile = path.join(__dirname, '..', '..', '..', 'data', 'job-alerts.json');
            
            const content = await fs.readFile(alertsFile, 'utf8');
            const alerts = JSON.parse(content);
            
            return alerts.slice(-limit).reverse(); // Most recent first
            
        } catch (error) {
            return []; // No alerts file exists yet
        }
    }
}

module.exports = JobMonitor;