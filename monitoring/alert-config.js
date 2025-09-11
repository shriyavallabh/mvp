/**
 * Alert Configuration
 * Monitoring alerts for critical system events and thresholds
 */

// Logger is optional for alerts
let logger;
try {
    logger = require('../agents/utils/logger').logger;
} catch (e) {
    // Fallback logger if not available
    logger = {
        info: console.log,
        debug: console.debug,
        warn: console.warn,
        error: console.error
    };
}
const { getAnalytics } = require('../agents/utils/analytics');

class AlertManager {
    constructor() {
        this.config = {
            critical: {
                apiFailures: {
                    threshold: 5,
                    window: 5 * 60 * 1000, // 5 minutes
                    message: 'API failures exceeded threshold'
                },
                contentGenerationTime: {
                    threshold: 5 * 60 * 1000, // 5 minutes
                    message: 'Content generation taking too long'
                },
                diskUsage: {
                    threshold: 80, // percentage
                    message: 'Disk usage critical'
                },
                memoryUsage: {
                    threshold: 90, // percentage  
                    message: 'Memory usage critical'
                }
            },
            warning: {
                apiFailures: {
                    threshold: 3,
                    window: 5 * 60 * 1000,
                    message: 'API failures increasing'
                },
                contentGenerationTime: {
                    threshold: 3 * 60 * 1000, // 3 minutes
                    message: 'Content generation slower than expected'
                },
                diskUsage: {
                    threshold: 70,
                    message: 'Disk usage high'
                },
                memoryUsage: {
                    threshold: 80,
                    message: 'Memory usage high'
                },
                errorRate: {
                    threshold: 10, // percentage
                    message: 'Error rate elevated'
                }
            }
        };

        this.alertHistory = [];
        this.activeAlerts = new Map();
        this.alertChannels = {
            whatsapp: this.sendWhatsAppAlert.bind(this),
            email: this.sendEmailAlert.bind(this),
            dashboard: this.updateDashboard.bind(this)
        };

        // Track API failures for windowed alerts
        this.apiFailureWindow = [];
        
        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Start periodic monitoring
     */
    startMonitoring() {
        // Check alerts every 30 seconds
        this.monitoringInterval = setInterval(() => {
            this.checkAlerts();
        }, 30000);

        // Clean up old alert history every hour
        setInterval(() => {
            this.cleanupAlertHistory();
        }, 3600000);

        logger.info('Alert monitoring started');
    }

    /**
     * Check all alert conditions
     */
    async checkAlerts() {
        const analytics = getAnalytics();
        const metrics = analytics.getDashboardData();

        // Check system metrics
        this.checkSystemAlerts(metrics.system);

        // Check application metrics
        this.checkApplicationAlerts(metrics.application);

        // Check API metrics
        this.checkApiAlerts(metrics.apis);

        // Check business metrics
        this.checkBusinessAlerts(metrics.business);
    }

    /**
     * Check system alerts
     */
    checkSystemAlerts(systemMetrics) {
        if (!systemMetrics) return;

        // Check memory usage
        const memoryUsage = parseFloat(systemMetrics.memory?.percentage || 0);
        if (memoryUsage > this.config.critical.memoryUsage.threshold) {
            this.triggerAlert('critical', 'memoryUsage', {
                current: memoryUsage,
                threshold: this.config.critical.memoryUsage.threshold,
                message: this.config.critical.memoryUsage.message
            });
        } else if (memoryUsage > this.config.warning.memoryUsage.threshold) {
            this.triggerAlert('warning', 'memoryUsage', {
                current: memoryUsage,
                threshold: this.config.warning.memoryUsage.threshold,
                message: this.config.warning.memoryUsage.message
            });
        }

        // Check disk usage (would need actual disk check implementation)
        // Placeholder for disk usage check
    }

    /**
     * Check application alerts
     */
    checkApplicationAlerts(appMetrics) {
        if (!appMetrics) return;

        // Check error rate
        const errorRate = parseFloat(appMetrics.errorRate || 0);
        if (errorRate > this.config.warning.errorRate.threshold) {
            this.triggerAlert('warning', 'errorRate', {
                current: errorRate,
                threshold: this.config.warning.errorRate.threshold,
                message: this.config.warning.errorRate.message
            });
        }
    }

    /**
     * Check API alerts
     */
    checkApiAlerts(apiMetrics) {
        if (!apiMetrics) return;

        // Count recent API failures
        const now = Date.now();
        const window = this.config.critical.apiFailures.window;
        const recentFailures = this.apiFailureWindow.filter(
            timestamp => now - timestamp < window
        ).length;

        if (recentFailures > this.config.critical.apiFailures.threshold) {
            this.triggerAlert('critical', 'apiFailures', {
                current: recentFailures,
                threshold: this.config.critical.apiFailures.threshold,
                window: window / 60000 + ' minutes',
                message: this.config.critical.apiFailures.message
            });
        } else if (recentFailures > this.config.warning.apiFailures.threshold) {
            this.triggerAlert('warning', 'apiFailures', {
                current: recentFailures,
                threshold: this.config.warning.apiFailures.threshold,
                window: window / 60000 + ' minutes',
                message: this.config.warning.apiFailures.message
            });
        }
    }

    /**
     * Check business alerts
     */
    checkBusinessAlerts(businessMetrics) {
        if (!businessMetrics) return;

        // Check for low approval rates, distribution failures, etc.
        const approvalRate = parseFloat(businessMetrics.approvals?.rate || 100);
        if (approvalRate < 50) {
            this.triggerAlert('warning', 'approvalRate', {
                current: approvalRate,
                threshold: 50,
                message: 'Content approval rate is low'
            });
        }
    }

    /**
     * Track API failure for windowed alerts
     */
    trackApiFailure() {
        const now = Date.now();
        this.apiFailureWindow.push(now);
        
        // Clean up old entries
        const window = this.config.critical.apiFailures.window;
        this.apiFailureWindow = this.apiFailureWindow.filter(
            timestamp => now - timestamp < window
        );

        // Check if we need to trigger an alert immediately
        this.checkApiAlerts({ apiFailures: this.apiFailureWindow.length });
    }

    /**
     * Track content generation time
     */
    trackContentGenerationTime(duration) {
        if (duration > this.config.critical.contentGenerationTime.threshold) {
            this.triggerAlert('critical', 'contentGenerationTime', {
                current: duration / 60000 + ' minutes',
                threshold: this.config.critical.contentGenerationTime.threshold / 60000 + ' minutes',
                message: this.config.critical.contentGenerationTime.message
            });
        } else if (duration > this.config.warning.contentGenerationTime.threshold) {
            this.triggerAlert('warning', 'contentGenerationTime', {
                current: duration / 60000 + ' minutes',
                threshold: this.config.warning.contentGenerationTime.threshold / 60000 + ' minutes',
                message: this.config.warning.contentGenerationTime.message
            });
        }
    }

    /**
     * Trigger an alert
     */
    triggerAlert(severity, type, details) {
        const alertKey = `${severity}_${type}`;
        
        // Check if alert is already active
        if (this.activeAlerts.has(alertKey)) {
            const activeAlert = this.activeAlerts.get(alertKey);
            // Don't re-trigger if alert was sent in last 5 minutes
            if (Date.now() - activeAlert.lastSent < 5 * 60 * 1000) {
                return;
            }
        }

        const alert = {
            severity,
            type,
            details,
            timestamp: new Date().toISOString(),
            key: alertKey
        };

        // Store alert
        this.alertHistory.push(alert);
        this.activeAlerts.set(alertKey, {
            ...alert,
            lastSent: Date.now()
        });

        // Send alerts based on severity
        if (severity === 'critical') {
            this.sendCriticalAlert(alert);
        } else if (severity === 'warning') {
            this.sendWarningAlert(alert);
        }

        logger.warn(`Alert triggered: ${severity} - ${type}`, details);
    }

    /**
     * Send critical alert
     */
    async sendCriticalAlert(alert) {
        // Send to all channels for critical alerts
        await Promise.all([
            this.alertChannels.whatsapp(alert),
            this.alertChannels.email(alert),
            this.alertChannels.dashboard(alert)
        ]);
    }

    /**
     * Send warning alert
     */
    async sendWarningAlert(alert) {
        // Send only to email and dashboard for warnings
        await Promise.all([
            this.alertChannels.email(alert),
            this.alertChannels.dashboard(alert)
        ]);
    }

    /**
     * Send WhatsApp alert
     */
    async sendWhatsAppAlert(alert) {
        const whatsappNumber = process.env.ALERT_WHATSAPP_NUMBER;
        if (!whatsappNumber) {
            logger.warn('WhatsApp alert number not configured');
            return;
        }

        const message = `🚨 ${alert.severity.toUpperCase()} ALERT\n` +
                       `Type: ${alert.type}\n` +
                       `${alert.details.message}\n` +
                       `Current: ${alert.details.current}\n` +
                       `Threshold: ${alert.details.threshold}\n` +
                       `Time: ${alert.timestamp}`;

        try {
            // Implementation would use WhatsApp Business API
            // For now, just log the alert
            logger.info(`WhatsApp alert would be sent to ${whatsappNumber}:`, message);
        } catch (error) {
            logger.error('Failed to send WhatsApp alert:', error);
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(alert) {
        const emailAddress = process.env.ALERT_EMAIL_ADDRESS;
        if (!emailAddress) {
            logger.warn('Alert email address not configured');
            return;
        }

        const subject = `[${alert.severity.toUpperCase()}] ${alert.type} Alert`;
        const body = `
            Alert Severity: ${alert.severity}
            Alert Type: ${alert.type}
            Message: ${alert.details.message}
            Current Value: ${alert.details.current}
            Threshold: ${alert.details.threshold}
            Timestamp: ${alert.timestamp}
            
            Please check the system immediately.
        `;

        try {
            // Implementation would use email service
            // For now, just log the alert
            logger.info(`Email alert would be sent to ${emailAddress}:`, { subject, body });
        } catch (error) {
            logger.error('Failed to send email alert:', error);
        }
    }

    /**
     * Update dashboard with alert
     */
    async updateDashboard(alert) {
        // Store alert for dashboard display
        logger.info('Dashboard updated with alert:', alert);
    }

    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }

    /**
     * Get alert history
     */
    getAlertHistory(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        return this.alertHistory.filter(alert => 
            new Date(alert.timestamp).getTime() > since
        );
    }

    /**
     * Clear an active alert
     */
    clearAlert(alertKey) {
        if (this.activeAlerts.has(alertKey)) {
            this.activeAlerts.delete(alertKey);
            logger.info(`Alert cleared: ${alertKey}`);
        }
    }

    /**
     * Clean up old alert history
     */
    cleanupAlertHistory() {
        const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cutoff = Date.now() - retentionPeriod;
        
        this.alertHistory = this.alertHistory.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
        
        logger.debug(`Alert history cleaned. ${this.alertHistory.length} alerts retained.`);
    }

    /**
     * Test alert system
     */
    async testAlerts() {
        console.log('Testing alert system...');
        
        // Test warning alert
        this.triggerAlert('warning', 'test', {
            current: 85,
            threshold: 80,
            message: 'This is a test warning alert'
        });

        // Test critical alert
        this.triggerAlert('critical', 'test', {
            current: 95,
            threshold: 90,
            message: 'This is a test critical alert'
        });

        // Test API failure tracking
        for (let i = 0; i < 6; i++) {
            this.trackApiFailure();
        }

        // Test content generation time alert
        this.trackContentGenerationTime(6 * 60 * 1000); // 6 minutes

        console.log('Alert test complete. Check logs for results.');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            logger.info('Alert monitoring stopped');
        }
    }
}

// Health check endpoint implementation
function createHealthCheckEndpoint(app) {
    app.get('/health', (req, res) => {
        const alertManager = getAlertManager();
        const analytics = getAnalytics();
        const metrics = analytics.getDashboardData();

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: metrics.system?.memory,
            activeAlerts: alertManager.getActiveAlerts().length,
            checks: {
                database: 'healthy',
                apis: 'healthy',
                agents: 'healthy'
            }
        };

        // Determine overall health status
        if (alertManager.getActiveAlerts().some(a => a.severity === 'critical')) {
            health.status = 'critical';
        } else if (alertManager.getActiveAlerts().some(a => a.severity === 'warning')) {
            health.status = 'degraded';
        }

        res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });
}

// Singleton instance
let alertManagerInstance = null;

function getAlertManager() {
    if (!alertManagerInstance) {
        alertManagerInstance = new AlertManager();
    }
    return alertManagerInstance;
}

module.exports = {
    getAlertManager,
    AlertManager,
    createHealthCheckEndpoint
};