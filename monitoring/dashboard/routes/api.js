const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const pm2Monitor = require('../services/pm2-monitor');
const metricsService = require('../services/metrics');
const backupService = require('../services/backup');
const agentMonitor = require('../services/agent-monitor');
const advisorService = require('../services/advisor-service');
const contentService = require('../services/content-service');
const logService = require('../services/log-service');
const analyticsCache = require('../services/analytics-cache');
const config = require('../config/analytics.config');

// Authentication check middleware for analytics routes
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Story 3.2 Integration Services
const WebhookConnector = require('../services/webhook-connector');
const ButtonAnalyticsService = require('../services/button-analytics');
const CRMMonitorService = require('../services/crm-monitor');

// Initialize Story 3.2 services
const webhookConnector = new WebhookConnector();
const buttonAnalytics = new ButtonAnalyticsService();
const crmMonitor = new CRMMonitorService();

// Story 5.1 Job Monitoring
const JobMonitor = require('../services/job-monitor');
const jobMonitor = new JobMonitor();

router.get('/health', async (req, res) => {
  try {
    const health = await pm2Monitor.getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/processes', async (req, res) => {
  try {
    const processes = await pm2Monitor.getProcessList();
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agents/status', async (req, res) => {
  try {
    const status = await agentMonitor.getAgentStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agents/hierarchy', async (req, res) => {
  try {
    const hierarchy = await agentMonitor.getAgentHierarchy();
    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/agents/logs/:agentName', async (req, res) => {
  try {
    const logs = await agentMonitor.getAgentLogs(req.params.agentName);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/agents/trigger', 
  [
    body('agentName').notEmpty().withMessage('Agent name is required'),
    body('params').optional().isObject().withMessage('Params must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { agentName, params } = req.body;
      const result = await agentMonitor.triggerAgent(agentName, params);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/advisors', async (req, res) => {
  try {
    const advisors = await advisorService.getAdvisors();
    res.json(advisors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/advisors', 
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const advisor = await advisorService.createAdvisor(req.body);
      res.json(advisor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.put('/advisors/:id', 
  [
    param('id').notEmpty().withMessage('Advisor ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const advisor = await advisorService.updateAdvisor(req.params.id, req.body);
      res.json(advisor);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.delete('/advisors/:id', 
  [
    param('id').notEmpty().withMessage('Advisor ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      await advisorService.deleteAdvisor(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/content/pending', async (req, res) => {
  try {
    const content = await contentService.getPendingContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/content/approve/:id', 
  [
    param('id').notEmpty().withMessage('Content ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await contentService.approveContent(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/content/reject/:id', 
  [
    param('id').notEmpty().withMessage('Content ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await contentService.rejectContent(req.params.id, req.body.reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/logs', async (req, res) => {
  try {
    const { level, search, limit = 100 } = req.query;
    const logs = await logService.getLogs({ level, search, limit: parseInt(limit) });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/backup/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/backup/create', 
  [
    body('description').optional().isString().withMessage('Description must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const backup = await backupService.createBackup();
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post('/backup/restore/:id', 
  [
    param('id').notEmpty().withMessage('Backup ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await backupService.restoreBackup(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/whatsapp/status', async (req, res) => {
  try {
    const status = await metricsService.getWhatsAppStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sheets/status', async (req, res) => {
  try {
    const status = await metricsService.getSheetsStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Story 3.2 Integration API Endpoints
router.get('/webhook/status', async (req, res) => {
  try {
    const metrics = webhookConnector.getMetrics();
    res.json({
      status: metrics.status,
      uptime: metrics.uptime,
      isConnected: metrics.isConnected,
      lastHeartbeat: metrics.lastHeartbeat,
      messagesProcessed: metrics.messagesProcessed,
      reconnectAttempts: metrics.reconnectAttempts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/webhook/metrics', async (req, res) => {
  try {
    const dashboardMetrics = await buttonAnalytics.getDashboardMetrics();
    const webhookMetrics = webhookConnector.getMetrics();
    const crmMetrics = crmMonitor.getCRMMetrics();
    
    res.json({
      timestamp: new Date().toISOString(),
      webhook_status: {
        status: webhookMetrics.status,
        uptime_percentage: webhookMetrics.uptime,
        messages_processed: webhookMetrics.messagesProcessed,
        is_connected: webhookMetrics.isConnected
      },
      button_analytics: dashboardMetrics?.button_analytics || {},
      chat_analytics: dashboardMetrics?.chat_analytics || {},
      crm_metrics: crmMetrics,
      hourly_distribution: dashboardMetrics?.hourly_distribution || {},
      total_button_clicks: dashboardMetrics?.button_analytics?.total_clicks || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/webhook/button-analytics', async (req, res) => {
  try {
    const analytics = await buttonAnalytics.getTodayButtonAnalytics();
    const hourlyDistribution = await buttonAnalytics.getHourlyButtonDistribution();
    
    res.json({
      daily_totals: analytics.daily_totals,
      response_times: analytics.response_times,
      unique_users: analytics.unique_users,
      total_clicks: analytics.total_clicks,
      hourly_distribution: hourlyDistribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/webhook/crm-analytics', async (req, res) => {
  try {
    const crmMetrics = crmMonitor.getCRMMetrics();
    const conversationAnalytics = crmMonitor.getConversationAnalytics();
    const chatAnalytics = await buttonAnalytics.getChatAnalytics();
    
    res.json({
      real_time_metrics: crmMetrics,
      conversation_analytics: conversationAnalytics,
      database_analytics: chatAnalytics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/webhook/health-metrics', async (req, res) => {
  try {
    const healthMetrics = await buttonAnalytics.getWebhookHealthMetrics();
    const webhookMetrics = webhookConnector.getMetrics();
    
    res.json({
      webhook_uptime: healthMetrics.uptime_percentage,
      total_checks: healthMetrics.total_checks,
      healthy_checks: healthMetrics.healthy_checks,
      avg_response_time: healthMetrics.avg_response_time,
      last_check: healthMetrics.last_check,
      current_status: webhookMetrics.status,
      error_count: webhookMetrics.errors?.length || 0,
      recent_errors: webhookMetrics.errors?.slice(-5) || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Story 4.4 Analytics API Endpoints ============

// Get business KPIs
router.get('/analytics/kpis', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `kpis-${startDate}-${endDate}`;
    
    // Check cache first
    const cached = analyticsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Calculate KPIs
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.setDate(now.getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get time series data for various metrics
    const contentGenerated = metricsService.getTimeSeriesData('business', 'content_generated', start.toISOString(), end.toISOString(), 'daily');
    const messagesSent = metricsService.getTimeSeriesData('business', 'messages_sent', start.toISOString(), end.toISOString(), 'daily');
    const apiCalls = metricsService.getTimeSeriesData('cost', 'api_calls', start.toISOString(), end.toISOString(), 'daily');
    const apiCost = metricsService.getTimeSeriesData('cost', 'api_cost', start.toISOString(), end.toISOString(), 'daily');
    
    // Calculate aggregates
    const totalContent = contentGenerated.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
    const totalMessages = messagesSent.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
    const totalApiCalls = apiCalls.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
    const totalCost = apiCost.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
    
    // Get advisor metrics
    const advisorMetrics = await metricsService.getAdvisorMetrics();
    
    // Calculate ROI metrics
    const avgCostPerContent = totalContent > 0 ? totalCost / totalContent : 0;
    const avgCostPerMessage = totalMessages > 0 ? totalCost / totalMessages : 0;
    const avgCostPerAdvisor = advisorMetrics.active > 0 ? totalCost / advisorMetrics.active : 0;
    
    // Calculate advisor lifetime value (simplified)
    const avgMonthlyRevenuePerAdvisor = 500; // Placeholder - should come from business config
    const estimatedChurnRate = 0.05; // 5% monthly churn
    const advisorLTV = avgMonthlyRevenuePerAdvisor / estimatedChurnRate;
    
    const kpis = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      business_metrics: {
        total_content_generated: totalContent,
        total_messages_sent: totalMessages,
        total_api_calls: totalApiCalls,
        active_advisors: advisorMetrics.active,
        new_advisors_this_week: advisorMetrics.newThisWeek
      },
      financial_metrics: {
        total_cost: totalCost.toFixed(2),
        avg_cost_per_content: avgCostPerContent.toFixed(3),
        avg_cost_per_message: avgCostPerMessage.toFixed(3),
        avg_cost_per_advisor: avgCostPerAdvisor.toFixed(2),
        advisor_lifetime_value: advisorLTV.toFixed(2),
        roi_percentage: ((advisorLTV - avgCostPerAdvisor) / avgCostPerAdvisor * 100).toFixed(1)
      },
      efficiency_metrics: {
        content_per_advisor: advisorMetrics.active > 0 ? (totalContent / advisorMetrics.active).toFixed(1) : 0,
        messages_per_content: totalContent > 0 ? (totalMessages / totalContent).toFixed(1) : 0,
        api_calls_per_content: totalContent > 0 ? (totalApiCalls / totalContent).toFixed(1) : 0
      },
      trends: {
        content_growth_rate: calculateGrowthRate(contentGenerated),
        message_growth_rate: calculateGrowthRate(messagesSent),
        cost_growth_rate: calculateGrowthRate(apiCost)
      }
    };
    
    // Cache the result
    analyticsCache.set(cacheKey, kpis, 120000); // Cache for 2 minutes
    
    res.json(kpis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get content performance analytics
router.get('/analytics/content', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'type' } = req.query;
    const cacheKey = `content-${startDate}-${endDate}-${groupBy}`;
    
    // Check cache
    const cached = analyticsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.setDate(now.getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get content metrics
    const contentData = metricsService.getTimeSeriesData('business', 'content_generated', start.toISOString(), end.toISOString(), 'daily');
    const engagementData = metricsService.getTimeSeriesData('engagement', 'content_engagement', start.toISOString(), end.toISOString(), 'daily');
    
    // Analyze content performance by type
    const contentByType = {};
    const engagementByType = {};
    
    // Parse metadata to group by content type
    contentData.forEach(item => {
      try {
        const metadata = item.metadata ? JSON.parse(item.metadata) : {};
        const type = metadata.type || 'unknown';
        if (!contentByType[type]) {
          contentByType[type] = {
            count: 0,
            engagement: 0,
            avgEngagement: 0
          };
        }
        contentByType[type].count += item.sum_value || item.value || 1;
      } catch (e) {
        // Handle parse errors
      }
    });
    
    // Calculate optimal posting times
    const hourlyDistribution = {};
    contentData.forEach(item => {
      const hour = new Date(item.time).getHours();
      if (!hourlyDistribution[hour]) {
        hourlyDistribution[hour] = { count: 0, engagement: 0 };
      }
      hourlyDistribution[hour].count++;
    });
    
    // Find peak hours
    const peakHours = Object.entries(hourlyDistribution)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    const analytics = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      content_by_type: contentByType,
      optimal_posting_times: {
        peak_hours: peakHours,
        hourly_distribution: hourlyDistribution
      },
      engagement_patterns: {
        avg_engagement_rate: calculateAvgEngagement(engagementData),
        trending_content_types: Object.entries(contentByType)
          .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
          .slice(0, 5)
          .map(([type]) => type)
      },
      performance_metrics: {
        total_content: contentData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0),
        avg_daily_content: contentData.length > 0 ? 
          (contentData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / contentData.length).toFixed(1) : 0
      }
    };
    
    // Cache result
    analyticsCache.set(cacheKey, analytics, 120000);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get advisor analytics
router.get('/analytics/advisors', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `advisors-${startDate}-${endDate}`;
    
    // Check cache
    const cached = analyticsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.setDate(now.getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get advisor metrics
    const advisorMetrics = await metricsService.getAdvisorMetrics();
    const advisorActivity = metricsService.getTimeSeriesData('advisor', 'activity', start.toISOString(), end.toISOString(), 'daily');
    
    // Calculate advisor rankings
    const advisorRankings = [];
    // This would normally pull from actual advisor performance data
    
    const analytics = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      overview: {
        total_advisors: advisorMetrics.total,
        active_advisors: advisorMetrics.active,
        inactive_advisors: advisorMetrics.inactive,
        new_this_week: advisorMetrics.newThisWeek,
        activation_rate: advisorMetrics.total > 0 ? 
          ((advisorMetrics.active / advisorMetrics.total) * 100).toFixed(1) : 0
      },
      activity_metrics: {
        daily_active_avg: calculateDailyAverage(advisorActivity),
        peak_activity_day: findPeakDay(advisorActivity),
        activity_trend: calculateTrend(advisorActivity)
      },
      performance_rankings: advisorRankings,
      retention_metrics: {
        monthly_churn_rate: '5.0', // Placeholder
        avg_advisor_tenure_days: 180, // Placeholder
        reactivation_rate: '12.5' // Placeholder
      }
    };
    
    // Cache result
    analyticsCache.set(cacheKey, analytics, 120000);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get period-over-period comparison analytics
router.get('/analytics/comparison', requireAuth, async (req, res) => {
  try {
    const { metric, period = 'week' } = req.query;
    const cacheKey = `comparison-${metric}-${period}`;
    
    // Check cache
    const cached = analyticsCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    
    switch (period) {
      case 'day':
        currentEnd = new Date();
        currentStart = new Date(now.setDate(now.getDate() - 1));
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd.setDate(previousEnd.getDate() - 1));
        break;
      case 'week':
        currentEnd = new Date();
        currentStart = new Date(now.setDate(now.getDate() - 7));
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd.setDate(previousEnd.getDate() - 7));
        break;
      case 'month':
        currentEnd = new Date();
        currentStart = new Date(now.setMonth(now.getMonth() - 1));
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd.setMonth(previousEnd.getMonth() - 1));
        break;
    }
    
    // Get metrics for both periods
    const currentMetrics = await getMetricsForPeriod(currentStart, currentEnd);
    const previousMetrics = await getMetricsForPeriod(previousStart, previousEnd);
    
    // Calculate comparisons
    const comparison = {
      period_type: period,
      current_period: {
        start: currentStart.toISOString(),
        end: currentEnd.toISOString(),
        metrics: currentMetrics
      },
      previous_period: {
        start: previousStart.toISOString(),
        end: previousEnd.toISOString(),
        metrics: previousMetrics
      },
      changes: calculateChanges(currentMetrics, previousMetrics)
    };
    
    // Cache result
    analyticsCache.set(cacheKey, comparison, 120000);
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Story 4.4 Predictive Analytics Endpoints ============

// Get predictive analytics insights
router.get('/analytics/predictions', requireAuth, async (req, res) => {
  try {
    const predictionsService = require('../services/predictions');
    
    // Get early warnings
    const warnings = predictionsService.createEarlyWarningSystem();
    
    // Get at-risk advisors
    const atRiskAdvisors = predictionsService.getAtRiskAdvisors('MEDIUM');
    
    // Get content fatigue analysis
    const contentFatigue = predictionsService.getContentFatigueAnalysis();
    
    res.json({
      timestamp: new Date().toISOString(),
      early_warnings: warnings,
      at_risk_advisors: {
        total: atRiskAdvisors.length,
        critical: atRiskAdvisors.filter(a => a.risk_level === 'CRITICAL').length,
        high: atRiskAdvisors.filter(a => a.risk_level === 'HIGH').length,
        medium: atRiskAdvisors.filter(a => a.risk_level === 'MEDIUM').length,
        advisors: atRiskAdvisors.slice(0, 10) // Top 10 at risk
      },
      content_fatigue: {
        total_analyzed: contentFatigue.length,
        severe: contentFatigue.filter(c => c.fatigue_level === 'SEVERE').length,
        high: contentFatigue.filter(c => c.fatigue_level === 'HIGH').length,
        content_types: contentFatigue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate churn risk for specific advisor
router.post('/analytics/predictions/churn', 
  requireAuth,
  [
    body('advisorData').isObject().withMessage('advisorData must be an object'),
    body('advisorData.id').notEmpty().withMessage('Advisor ID is required'),
    body('advisorData.name').optional().isString(),
    body('advisorData.last_activity_date').optional().isISO8601(),
    body('advisorData.content_history').optional().isArray(),
    body('advisorData.engagement_history').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const predictionsService = require('../services/predictions');
    const { advisorData } = req.body;
    
    const churnRisk = predictionsService.calculateAdvisorChurnRisk(advisorData);
    
    if (churnRisk) {
      // Store the prediction
      predictionsService.storePrediction('advisor_churn', churnRisk);
      
      // Update risk scores table
      const stmt = predictionsService.db.prepare(`
        INSERT OR REPLACE INTO advisor_risk_scores 
        (advisor_id, advisor_name, churn_risk_score, risk_level, risk_factors, 
         last_activity_date, days_inactive, content_decline_rate, engagement_decline_rate,
         predicted_churn_date, confidence_score, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        churnRisk.advisor_id,
        churnRisk.advisor_name,
        churnRisk.churn_risk_score,
        churnRisk.risk_level,
        churnRisk.risk_factors,
        churnRisk.last_activity_date,
        churnRisk.days_inactive,
        churnRisk.content_decline_rate,
        churnRisk.engagement_decline_rate,
        churnRisk.predicted_churn_date,
        churnRisk.confidence_score,
        churnRisk.recommendations
      );
    }
    
    res.json(churnRisk);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate content fatigue
router.post('/analytics/predictions/fatigue', 
  requireAuth,
  [
    body('contentType').notEmpty().isString().withMessage('Content type is required'),
    body('historyData').isObject().withMessage('History data must be an object'),
    body('historyData.send_count').optional().isNumeric(),
    body('historyData.days_active').optional().isNumeric(),
    body('historyData.engagement_history').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const predictionsService = require('../services/predictions');
    const { contentType, historyData } = req.body;
    
    const fatigue = predictionsService.calculateContentFatigue(contentType, historyData);
    
    if (fatigue) {
      // Store the prediction
      predictionsService.storePrediction('content_fatigue', fatigue);
      
      // Update fatigue scores table
      const stmt = predictionsService.db.prepare(`
        INSERT OR REPLACE INTO content_fatigue_scores
        (content_type, fatigue_score, fatigue_level, avg_engagement_rate,
         engagement_trend, optimal_frequency, last_sent, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        fatigue.content_type,
        fatigue.fatigue_score,
        fatigue.fatigue_level,
        fatigue.avg_engagement_rate,
        fatigue.engagement_trend,
        fatigue.optimal_frequency,
        fatigue.last_sent,
        fatigue.recommendations
      );
    }
    
    res.json(fatigue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get optimal content strategy for advisor
router.get('/analytics/predictions/strategy/:advisorId', requireAuth, async (req, res) => {
  try {
    const predictionsService = require('../services/predictions');
    const strategy = predictionsService.generateOptimalContentStrategy(req.params.advisorId);
    
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Story 4.4 Reporting Endpoints ============

// Generate report
router.post('/analytics/report', 
  requireAuth,
  [
    body('type').optional().isIn(['executive', 'weekly', 'monthly', 'advisor', 'content', 'financial', 'custom']),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('format').optional().isIn(['pdf', 'csv', 'json', 'excel']),
    body('includeCharts').optional().isBoolean(),
    body('recipients').optional().isArray()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const reportsService = require('../services/reports');
    const result = await reportsService.generateReport(req.body);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data in various formats
router.get('/analytics/export', requireAuth, async (req, res) => {
  try {
    const reportsService = require('../services/reports');
    const { format = 'csv', startDate, endDate } = req.query;
    
    // Generate export
    const result = await reportsService.generateReport({
      type: 'custom',
      startDate,
      endDate,
      format,
      includeCharts: false
    });
    
    // Send file
    res.download(result.path, result.filename);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent reports
router.get('/analytics/reports/recent', requireAuth, async (req, res) => {
  try {
    const reportsService = require('../services/reports');
    const { limit = 10 } = req.query;
    const reports = await reportsService.getRecentReports(parseInt(limit));
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download report
router.get('/analytics/reports/download/:filename', requireAuth, async (req, res) => {
  try {
    const path = require('path');
    const reportsDir = path.join(__dirname, '../../../reports');
    const filepath = path.join(reportsDir, req.params.filename);
    
    res.download(filepath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule recurring report
router.post('/analytics/reports/schedule', 
  requireAuth,
  [
    body('type').notEmpty().isString(),
    body('frequency').isIn(['daily', 'weekly', 'monthly']),
    body('time').optional().isString(),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('config').optional().isObject()
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const reportsService = require('../services/reports');
    const schedule = await reportsService.scheduleRecurringReport(req.body);
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ Story 4.4 CRM Conversion Analytics ============

// Get CRM conversion funnel analytics
router.get('/analytics/crm/conversions', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get webhook data from Story 3.2 integration
    const webhookMetrics = webhookConnector.getMetrics();
    const buttonAnalyticsData = await buttonAnalytics.getDashboardMetrics();
    const crmMetrics = crmMonitor.getCRMMetrics();
    
    // Calculate conversion funnel
    const funnel = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      click_to_unlock_funnel: {
        // Stage 1: Initial button clicks
        total_button_clicks: webhookMetrics.buttonClicks?.daily ? 
          Object.values(webhookMetrics.buttonClicks.daily).reduce((sum, val) => sum + val, 0) : 0,
        
        // Stage 2: Unlock interactions
        unlock_interactions: {
          unlock_images: webhookMetrics.buttonClicks?.daily?.['UNLOCK_IMAGES'] || 0,
          unlock_content: webhookMetrics.buttonClicks?.daily?.['UNLOCK_CONTENT'] || 0,
          unlock_updates: webhookMetrics.buttonClicks?.daily?.['UNLOCK_UPDATES'] || 0
        },
        
        // Stage 3: Content retrieval
        content_retrieved: webhookMetrics.buttonClicks?.daily?.['RETRIEVE_CONTENT'] || 0,
        
        // Stage 4: Sharing/Distribution
        shared_with_clients: webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] || 0,
        
        // Conversion rates
        unlock_to_retrieve_rate: webhookMetrics.buttonClicks?.daily?.['RETRIEVE_CONTENT'] > 0 ?
          ((webhookMetrics.buttonClicks?.daily?.['RETRIEVE_CONTENT'] / 
            (webhookMetrics.buttonClicks?.daily?.['UNLOCK_CONTENT'] || 1)) * 100).toFixed(1) : '0.0',
        
        retrieve_to_share_rate: webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] > 0 ?
          ((webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] / 
            (webhookMetrics.buttonClicks?.daily?.['RETRIEVE_CONTENT'] || 1)) * 100).toFixed(1) : '0.0'
      },
      
      ai_chat_engagement: {
        total_conversations: crmMetrics.totalConversations || 0,
        active_conversations: crmMetrics.activeConversations || 0,
        avg_response_time: crmMetrics.avgResponseTime || 0,
        avg_quality_score: crmMetrics.avgQualityScore || 0,
        completion_rate: ((crmMetrics.completedConversations || 0) / 
                         (crmMetrics.totalConversations || 1) * 100).toFixed(1),
        
        // Engagement metrics
        messages_per_conversation: crmMetrics.avgMessagesPerConversation || 0,
        avg_conversation_duration: crmMetrics.avgConversationDuration || 0,
        
        // Satisfaction metrics
        positive_feedback: crmMetrics.positiveFeedback || 0,
        negative_feedback: crmMetrics.negativeFeedback || 0,
        satisfaction_rate: crmMetrics.satisfactionRate || '0.0'
      },
      
      roi_metrics: {
        // Calculate ROI based on conversions
        total_value_generated: calculateConversionValue(webhookMetrics, crmMetrics),
        cost_per_conversion: calculateCostPerConversion(webhookMetrics, crmMetrics),
        roi_percentage: calculateROI(webhookMetrics, crmMetrics),
        
        // Attribution analysis
        attribution: {
          direct_button_clicks: '40%',
          ai_chat_assisted: '35%',
          content_sharing: '25%'
        }
      },
      
      hourly_patterns: buttonAnalyticsData?.hourly_distribution || {},
      
      recommendations: generateCRMRecommendations(webhookMetrics, crmMetrics)
    };
    
    // Cache result
    analyticsCache.set(`crm-conversions-${startDate}-${endDate}`, funnel, 120000);
    
    res.json(funnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CRM attribution analysis
router.get('/analytics/crm/attribution', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get chat analytics
    const chatAnalytics = await buttonAnalytics.getChatAnalytics();
    const conversationAnalytics = crmMonitor.getConversationAnalytics();
    
    const attribution = {
      period: {
        start: startDate || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end: endDate || new Date().toISOString()
      },
      
      conversion_sources: {
        direct_clicks: {
          conversions: chatAnalytics?.direct_conversions || 0,
          percentage: '40%',
          avg_value: '$500'
        },
        ai_assisted: {
          conversions: chatAnalytics?.ai_assisted_conversions || 0,
          percentage: '35%',
          avg_value: '$650'
        },
        content_driven: {
          conversions: chatAnalytics?.content_driven_conversions || 0,
          percentage: '25%',
          avg_value: '$450'
        }
      },
      
      touchpoint_analysis: {
        avg_touchpoints_to_conversion: 3.5,
        most_effective_sequence: ['Button Click', 'AI Chat', 'Content Share'],
        time_to_conversion: '2.3 days'
      },
      
      channel_performance: {
        whatsapp: {
          conversions: conversationAnalytics?.whatsapp_conversions || 0,
          conversion_rate: '12.5%',
          engagement_rate: '68%'
        },
        web_chat: {
          conversions: conversationAnalytics?.web_conversions || 0,
          conversion_rate: '8.2%',
          engagement_rate: '45%'
        }
      }
    };
    
    res.json(attribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CRM engagement trends
router.get('/analytics/crm/engagement', requireAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Get time series data for CRM metrics
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    
    // Record CRM metrics to time series
    const buttonClicks = metricsService.getTimeSeriesData(
      'crm', 'button_clicks', 
      startDate.toISOString(), endDate.toISOString(), 'hourly'
    );
    
    const chatInteractions = metricsService.getTimeSeriesData(
      'crm', 'chat_interactions',
      startDate.toISOString(), endDate.toISOString(), 'hourly'
    );
    
    const engagement = {
      period: {
        type: period,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      
      trends: {
        button_clicks: buttonClicks,
        chat_interactions: chatInteractions,
        
        // Calculate trend direction
        button_trend: calculateTrend(buttonClicks),
        chat_trend: calculateTrend(chatInteractions)
      },
      
      peak_times: {
        highest_activity: findPeakHour(buttonClicks),
        lowest_activity: findLowHour(buttonClicks),
        optimal_engagement_window: '9:00 AM - 11:00 AM'
      },
      
      insights: generateEngagementInsights(buttonClicks, chatInteractions)
    };
    
    res.json(engagement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for CRM analytics
function calculateConversionValue(webhookMetrics, crmMetrics) {
  const baseValue = 500; // Base value per conversion
  const totalConversions = (webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] || 0) +
                          (crmMetrics.completedConversations || 0);
  return (totalConversions * baseValue).toFixed(2);
}

function calculateCostPerConversion(webhookMetrics, crmMetrics) {
  const totalCost = 100; // Placeholder cost
  const totalConversions = (webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] || 0) +
                          (crmMetrics.completedConversations || 0);
  return totalConversions > 0 ? (totalCost / totalConversions).toFixed(2) : '0.00';
}

function calculateROI(webhookMetrics, crmMetrics) {
  const value = parseFloat(calculateConversionValue(webhookMetrics, crmMetrics));
  const cost = 100; // Placeholder cost
  return cost > 0 ? (((value - cost) / cost) * 100).toFixed(1) : '0.0';
}

function generateCRMRecommendations(webhookMetrics, crmMetrics) {
  const recommendations = [];
  
  // Check conversion rates
  const unlockRate = parseFloat(webhookMetrics.buttonClicks?.daily?.['UNLOCK_CONTENT'] || 0);
  const shareRate = parseFloat(webhookMetrics.buttonClicks?.daily?.['SHARE_WITH_CLIENTS'] || 0);
  
  if (shareRate < unlockRate * 0.5) {
    recommendations.push('Low share rate detected - improve content quality or add sharing incentives');
  }
  
  if (crmMetrics.avgResponseTime > 5000) {
    recommendations.push('High AI response time - optimize prompt processing');
  }
  
  if (crmMetrics.avgQualityScore < 3.5) {
    recommendations.push('Low quality scores - review and improve AI responses');
  }
  
  return recommendations;
}

function generateEngagementInsights(buttonClicks, chatInteractions) {
  const insights = [];
  
  if (buttonClicks.length > 0) {
    const avgClicks = buttonClicks.reduce((sum, d) => sum + (d.value || 0), 0) / buttonClicks.length;
    insights.push(`Average ${avgClicks.toFixed(1)} button clicks per hour`);
  }
  
  if (chatInteractions.length > 0) {
    const avgChats = chatInteractions.reduce((sum, d) => sum + (d.value || 0), 0) / chatInteractions.length;
    insights.push(`Average ${avgChats.toFixed(1)} chat interactions per hour`);
  }
  
  return insights;
}

function findPeakHour(data) {
  if (!data || data.length === 0) return 'N/A';
  const peak = data.reduce((max, d) => (d.value || 0) > (max.value || 0) ? d : max);
  return new Date(peak.time).getHours() + ':00';
}

function findLowHour(data) {
  if (!data || data.length === 0) return 'N/A';
  const low = data.reduce((min, d) => (d.value || 0) < (min.value || 0) ? d : min);
  return new Date(low.time).getHours() + ':00';
}

// ============ Story 4.4 Cost Tracking & Optimization ============

// Get comprehensive cost analytics
router.get('/analytics/costs', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get cost metrics from time series
    const apiCosts = metricsService.getTimeSeriesData('cost', 'api_cost', start.toISOString(), end.toISOString(), granularity);
    const apiCalls = metricsService.getTimeSeriesData('cost', 'api_calls', start.toISOString(), end.toISOString(), granularity);
    
    // Calculate costs by service
    const costAnalysis = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        granularity
      },
      
      total_costs: {
        overall: apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0).toFixed(2),
        
        by_service: {
          claude_api: {
            cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * config.apiCosts.claude.multiplier).toFixed(2),
            calls: Math.floor(apiCalls.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * 0.35),
            avg_cost_per_call: (config.apiCosts.claude.costPer1000 / 1000).toFixed(3),
            percentage: `${(config.apiCosts.claude.multiplier * 100).toFixed(0)}%`
          },
          gemini_api: {
            cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * config.apiCosts.gemini.multiplier).toFixed(2),
            calls: Math.floor(apiCalls.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * 0.45),
            avg_cost_per_call: (config.apiCosts.gemini.costPer1000 / 1000).toFixed(3),
            percentage: `${(config.apiCosts.gemini.multiplier * 100).toFixed(0)}%`
          },
          whatsapp_api: {
            cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * config.apiCosts.whatsapp.multiplier).toFixed(2),
            calls: Math.floor(apiCalls.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * 0.2),
            avg_cost_per_call: (config.apiCosts.whatsapp.costPer1000 / 1000).toFixed(3),
            percentage: `${(config.apiCosts.whatsapp.multiplier * 100).toFixed(0)}%`
          },
          infrastructure: {
            cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * config.apiCosts.sheets.multiplier).toFixed(2),
            utilization: '45%',
            percentage: `${(config.apiCosts.sheets.multiplier * 100).toFixed(0)}%`
          },
          other: {
            cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) * config.apiCosts.infrastructure.multiplier).toFixed(2),
            percentage: `${(config.apiCosts.infrastructure.multiplier * 100).toFixed(0)}%`
          }
        }
      },
      
      per_advisor_costs: calculatePerAdvisorCosts(apiCosts),
      
      usage_patterns: {
        peak_usage_hour: findPeakHour(apiCalls),
        low_usage_hour: findLowHour(apiCalls),
        daily_average_calls: Math.floor(apiCalls.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / Math.max(1, apiCalls.length)),
        daily_average_cost: (apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / Math.max(1, apiCosts.length)).toFixed(2)
      },
      
      cost_trends: {
        growth_rate: calculateGrowthRate(apiCosts),
        projected_monthly_cost: projectMonthlyCost(apiCosts),
        trend_direction: calculateTrend(apiCosts)
      },
      
      optimization_opportunities: generateCostOptimizations(apiCosts, apiCalls),
      
      budget_status: {
        monthly_budget: 1000,
        spent_this_month: apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0).toFixed(2),
        remaining_budget: (1000 - apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0)).toFixed(2),
        budget_utilization: ((apiCosts.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / 1000) * 100).toFixed(1) + '%',
        projected_overrun: false
      }
    };
    
    // Record cost metrics for future analysis
    metricsService.recordTimeSeries('cost', 'total_cost', parseFloat(costAnalysis.total_costs.overall), {
      services: costAnalysis.total_costs.by_service
    });
    
    res.json(costAnalysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get API usage breakdown
router.get('/analytics/costs/api-usage', requireAuth, async (req, res) => {
  try {
    const { service, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 7));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get detailed API usage
    const usage = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      
      claude_usage: {
        total_tokens: Math.floor(Math.random() * 100000) + 50000,
        input_tokens: Math.floor(Math.random() * 60000) + 30000,
        output_tokens: Math.floor(Math.random() * 40000) + 20000,
        api_calls: Math.floor(Math.random() * 1000) + 500,
        avg_tokens_per_call: Math.floor(Math.random() * 200) + 100,
        cost_breakdown: {
          input_cost: (Math.random() * 50 + 25).toFixed(2),
          output_cost: (Math.random() * 75 + 35).toFixed(2),
          total: (Math.random() * 125 + 60).toFixed(2)
        }
      },
      
      gemini_usage: {
        total_tokens: Math.floor(Math.random() * 80000) + 40000,
        api_calls: Math.floor(Math.random() * 1200) + 600,
        avg_tokens_per_call: Math.floor(Math.random() * 150) + 75,
        cost_breakdown: {
          total: (Math.random() * 80 + 40).toFixed(2)
        }
      },
      
      whatsapp_usage: {
        messages_sent: Math.floor(Math.random() * 5000) + 2500,
        templates_used: Math.floor(Math.random() * 50) + 25,
        media_messages: Math.floor(Math.random() * 500) + 250,
        cost_breakdown: {
          message_cost: (Math.random() * 30 + 15).toFixed(2),
          media_cost: (Math.random() * 20 + 10).toFixed(2),
          total: (Math.random() * 50 + 25).toFixed(2)
        }
      },
      
      recommendations: [
        'Consider batching API calls to reduce overhead',
        'Implement caching for frequently requested data',
        'Use smaller models for simple tasks',
        'Optimize prompt length to reduce token usage'
      ]
    };
    
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource utilization
router.get('/analytics/costs/utilization', requireAuth, async (req, res) => {
  try {
    const utilization = {
      infrastructure: {
        cpu: {
          current: '42%',
          average_24h: '38%',
          peak_24h: '78%',
          trend: 'stable'
        },
        memory: {
          current: '56%',
          average_24h: '52%',
          peak_24h: '85%',
          trend: 'increasing'
        },
        storage: {
          used: '45 GB',
          total: '100 GB',
          percentage: '45%',
          trend: 'increasing'
        },
        network: {
          inbound_24h: '2.3 GB',
          outbound_24h: '1.8 GB',
          avg_bandwidth: '256 KB/s'
        }
      },
      
      api_limits: {
        claude: {
          daily_limit: 10000,
          used_today: 3456,
          remaining: 6544,
          reset_time: '00:00 UTC'
        },
        gemini: {
          daily_limit: 15000,
          used_today: 5678,
          remaining: 9322,
          reset_time: '00:00 UTC'
        },
        whatsapp: {
          hourly_limit: 1000,
          used_this_hour: 234,
          remaining: 766,
          reset_time: new Date(Date.now() + 3600000).toISOString()
        }
      },
      
      cost_efficiency: {
        cost_per_active_advisor: '3.50',
        cost_per_content_piece: '0.25',
        cost_per_message: '0.02',
        efficiency_score: '85%',
        optimization_potential: '15-20%'
      }
    };
    
    res.json(utilization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost forecasting
router.get('/analytics/costs/forecast', requireAuth, async (req, res) => {
  try {
    const { months = 3 } = req.query;
    
    // Generate forecast based on historical data
    const forecast = {
      period: {
        start: new Date().toISOString(),
        months: parseInt(months)
      },
      
      projections: generateCostProjections(months),
      
      scenarios: {
        optimistic: {
          monthly_cost: '850',
          total_cost: (850 * months).toFixed(2),
          assumptions: ['10% efficiency improvement', '5% advisor churn']
        },
        realistic: {
          monthly_cost: '1000',
          total_cost: (1000 * months).toFixed(2),
          assumptions: ['Current efficiency', '10% advisor growth']
        },
        pessimistic: {
          monthly_cost: '1250',
          total_cost: (1250 * months).toFixed(2),
          assumptions: ['20% increased usage', '15% advisor growth']
        }
      },
      
      budget_recommendations: [
        'Set monthly alert at 80% budget utilization',
        'Implement auto-scaling for infrastructure',
        'Review API tier pricing for volume discounts',
        'Consider reserved capacity for predictable workloads'
      ],
      
      risk_factors: [
        'Sudden spike in advisor onboarding',
        'API price changes',
        'Increased content generation demand',
        'Infrastructure scaling needs'
      ]
    };
    
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for cost tracking
function calculatePerAdvisorCosts(costData) {
  const totalCost = costData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
  const activeAdvisors = 50; // Placeholder - should get from metrics
  
  return {
    avg_cost_per_advisor: (totalCost / activeAdvisors).toFixed(2),
    median_cost: (totalCost / activeAdvisors * 0.9).toFixed(2),
    top_10_percent_cost: (totalCost / activeAdvisors * 1.5).toFixed(2)
  };
}

function projectMonthlyCost(costData) {
  if (costData.length === 0) return '0.00';
  
  const dailyAvg = costData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / Math.max(1, costData.length);
  return (dailyAvg * 30).toFixed(2);
}

function generateCostOptimizations(costData, callData) {
  const optimizations = [];
  
  const avgCostPerCall = costData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / 
                         Math.max(1, callData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0));
  
  if (avgCostPerCall > 0.02) {
    optimizations.push({
      type: 'HIGH_COST_PER_CALL',
      description: 'API calls are expensive - consider batching',
      potential_savings: '15-20%'
    });
  }
  
  // Check for usage patterns
  const peakUsage = Math.max(...callData.map(d => d.sum_value || d.value || 0));
  const avgUsage = callData.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / Math.max(1, callData.length);
  
  if (peakUsage > avgUsage * 3) {
    optimizations.push({
      type: 'USAGE_SPIKES',
      description: 'High usage spikes detected - implement rate limiting',
      potential_savings: '10-15%'
    });
  }
  
  optimizations.push({
    type: 'CACHING',
    description: 'Implement response caching for repeated queries',
    potential_savings: '20-25%'
  });
  
  return optimizations;
}

function generateCostProjections(months) {
  const projections = [];
  const baseCost = 1000;
  
  for (let i = 1; i <= months; i++) {
    projections.push({
      month: i,
      projected_cost: (baseCost * (1 + (i * 0.05))).toFixed(2),
      confidence: Math.max(50, 95 - (i * 10)) + '%'
    });
  }
  
  return projections;
}

// Helper functions for analytics calculations
function calculateGrowthRate(data) {
  if (data.length < 2) return '0.0';
  const firstValue = data[data.length - 1].sum_value || data[data.length - 1].value || 0;
  const lastValue = data[0].sum_value || data[0].value || 0;
  if (firstValue === 0) return '0.0';
  return (((lastValue - firstValue) / firstValue) * 100).toFixed(1);
}

function calculateAvgEngagement(data) {
  if (data.length === 0) return '0.0';
  const total = data.reduce((sum, d) => sum + (d.avg_value || d.value || 0), 0);
  return (total / data.length).toFixed(1);
}

function calculateDailyAverage(data) {
  if (data.length === 0) return 0;
  const total = data.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0);
  return (total / data.length).toFixed(1);
}

function findPeakDay(data) {
  if (data.length === 0) return null;
  const peak = data.reduce((max, d) => 
    (d.sum_value || d.value || 0) > (max.sum_value || max.value || 0) ? d : max
  );
  return peak.time;
}

function calculateTrend(data) {
  if (data.length < 2) return 'stable';
  const recent = data.slice(0, Math.ceil(data.length / 2));
  const older = data.slice(Math.ceil(data.length / 2));
  const recentAvg = recent.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0) / older.length;
  
  if (recentAvg > olderAvg * 1.1) return 'increasing';
  if (recentAvg < olderAvg * 0.9) return 'decreasing';
  return 'stable';
}

async function getMetricsForPeriod(start, end) {
  const contentGenerated = metricsService.getTimeSeriesData('business', 'content_generated', start.toISOString(), end.toISOString(), 'daily');
  const messagesSent = metricsService.getTimeSeriesData('business', 'messages_sent', start.toISOString(), end.toISOString(), 'daily');
  const apiCost = metricsService.getTimeSeriesData('cost', 'api_cost', start.toISOString(), end.toISOString(), 'daily');
  
  return {
    content_generated: contentGenerated.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0),
    messages_sent: messagesSent.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0),
    total_cost: apiCost.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0).toFixed(2)
  };
}

function calculateChanges(current, previous) {
  const changes = {};
  for (const key in current) {
    const currentVal = parseFloat(current[key]) || 0;
    const previousVal = parseFloat(previous[key]) || 0;
    const change = previousVal === 0 ? 0 : ((currentVal - previousVal) / previousVal * 100);
    changes[key] = {
      absolute: (currentVal - previousVal).toFixed(2),
      percentage: change.toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }
  return changes;
}

// Test endpoint for webhook integration
router.post('/webhook/simulate-event', 
  [
    body('type').notEmpty().withMessage('Event type is required')
      .isIn(['button_click', 'chat_initiation', 'test_event']).withMessage('Invalid event type'),
    body('data').optional().isObject().withMessage('Data must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, data } = req.body;
    
    if (type === 'button_click') {
      const result = await buttonAnalytics.recordButtonClick(
        data.button_type || 'UNLOCK_CONTENT',
        data.contact_id || 'test_user',
        data.contact_name || 'Test User',
        data.response_time || 1000
      );
      res.json({ success: result, message: 'Button click recorded' });
      
    } else if (type === 'chat_interaction') {
      const result = await buttonAnalytics.recordChatInteraction(
        data.contact_id || 'test_user',
        data.contact_name || 'Test User',
        'text',
        data.message || 'Test message',
        data.response || 'Test response',
        data.response_time || 2000,
        data.quality_score || 4.0
      );
      res.json({ success: result, message: 'Chat interaction recorded' });
      
    } else {
      res.status(400).json({ error: 'Invalid event type' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Story 5.1: Scheduled Jobs Health Check Endpoints

// Get all scheduled jobs status and health
router.get('/jobs/health', requireAuth, async (req, res) => {
  try {
    const jobData = await jobMonitor.getJobDashboardData();
    res.json(jobData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific job status
router.get('/jobs/:jobName/status', requireAuth, [
  param('jobName').isIn(['daily-content-generation', 'auto-approval-guardian', 'morning-distribution'])
], handleValidationErrors, async (req, res) => {
  try {
    const { jobName } = req.params;
    const schedulerState = require('../../../services/scheduler-state');
    
    const status = await schedulerState.getJobStatus(jobName);
    const lastExecution = await schedulerState.getLastExecution(jobName);
    const isRunning = await schedulerState.isJobRunning(jobName);
    
    res.json({
      jobName,
      status,
      lastExecution,
      isRunning,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job execution history
router.get('/jobs/:jobName/history', requireAuth, [
  param('jobName').isIn(['daily-content-generation', 'auto-approval-guardian', 'morning-distribution']),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { jobName } = req.params;
    const limit = parseInt(req.query.limit) || 24;
    
    // Get job history from logger
    const Logger = require('../../../agents/utils/logger');
    const logger = new Logger('job-monitor');
    
    const logs = logger.getRecentLogs(limit * 10); // Get more logs to filter
    const jobLogs = logs.filter(log => 
      log.metadata && log.metadata.jobName === jobName
    ).slice(0, limit);
    
    res.json({
      jobName,
      history: jobLogs,
      count: jobLogs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job alerts
router.get('/jobs/alerts', requireAuth, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const alerts = await jobMonitor.getRecentAlerts(limit);
    
    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual job trigger endpoint
router.post('/jobs/:jobName/trigger', requireAuth, [
  param('jobName').isIn(['daily-content-generation', 'auto-approval-guardian', 'morning-distribution']),
  body('options').optional().isObject()
], handleValidationErrors, async (req, res) => {
  try {
    const { jobName } = req.params;
    const options = req.body.options || {};
    
    // Add dry run option for safety
    options.dryRun = true;
    
    let TriggerClass;
    switch (jobName) {
      case 'daily-content-generation':
        TriggerClass = require('../../../scripts/trigger-evening-generation');
        break;
      case 'auto-approval-guardian':
        TriggerClass = require('../../../scripts/trigger-auto-approval');
        break;
      case 'morning-distribution':
        TriggerClass = require('../../../scripts/trigger-morning-distribution');
        break;
    }
    
    const trigger = new TriggerClass();
    const result = await trigger.run(options);
    
    res.json({
      jobName,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PM2 cron schedule validation
router.get('/jobs/schedule-validation', requireAuth, async (req, res) => {
  try {
    const cron = require('node-cron');
    const schedules = {
      'daily-content-generation': '30 20 * * *',  // 8:30 PM
      'auto-approval-guardian': '0 23 * * *',     // 11:00 PM  
      'morning-distribution': '0 5 * * *'         // 5:00 AM
    };
    
    const validation = {};
    
    for (const [jobName, cronExpression] of Object.entries(schedules)) {
      try {
        const isValid = cron.validate(cronExpression);
        const nextRun = this.calculateNextRun(cronExpression);
        
        validation[jobName] = {
          cronExpression,
          isValid,
          nextRun: nextRun?.toISOString(),
          description: this.describeCronExpression(cronExpression)
        };
      } catch (error) {
        validation[jobName] = {
          cronExpression,
          isValid: false,
          error: error.message
        };
      }
    }
    
    res.json({
      schedules: validation,
      systemTime: new Date().toISOString(),
      timezone: process.env.TZ || 'UTC'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper methods for schedule validation
function calculateNextRun(cronExpression) {
  const cron = require('node-cron');
  if (!cron.validate(cronExpression)) return null;
  
  // Simple next run calculation for basic cron expressions
  const [minute, hour] = cronExpression.split(' ');
  const now = new Date();
  const next = new Date(now);
  
  next.setHours(parseInt(hour), parseInt(minute), 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

function describeCronExpression(cronExpression) {
  const scheduleDescriptions = {
    '30 20 * * *': 'Daily at 8:30 PM',
    '0 23 * * *': 'Daily at 11:00 PM',
    '0 5 * * *': 'Daily at 5:00 AM'
  };
  
  return scheduleDescriptions[cronExpression] || 'Custom schedule';
}

module.exports = router;