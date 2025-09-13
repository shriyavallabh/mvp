// Configuration for Analytics Module
// All values can be overridden via environment variables

module.exports = {
  // Predictive Analytics Configuration
  predictions: {
    // Churn Risk Weights (should sum to ~100)
    churnRisk: {
      daysInactiveWeight: parseInt(process.env.CHURN_DAYS_INACTIVE_WEIGHT || '40'),
      contentDeclineWeight: parseInt(process.env.CHURN_CONTENT_DECLINE_WEIGHT || '30'),
      engagementDeclineWeight: parseInt(process.env.CHURN_ENGAGEMENT_DECLINE_WEIGHT || '20'),
      
      // Thresholds
      inactiveDaysThreshold: parseInt(process.env.CHURN_INACTIVE_DAYS_THRESHOLD || '30'),
      criticalRiskThreshold: parseInt(process.env.CHURN_CRITICAL_RISK_THRESHOLD || '70'),
      highRiskThreshold: parseInt(process.env.CHURN_HIGH_RISK_THRESHOLD || '50'),
      mediumRiskThreshold: parseInt(process.env.CHURN_MEDIUM_RISK_THRESHOLD || '30'),
      
      // Engagement thresholds
      severeEngagementDecline: parseInt(process.env.CHURN_SEVERE_ENGAGEMENT_DECLINE || '40'),
      moderateEngagementDecline: parseInt(process.env.CHURN_MODERATE_ENGAGEMENT_DECLINE || '20')
    },
    
    // Content Fatigue Configuration
    contentFatigue: {
      // Weights
      frequencyWeight: parseInt(process.env.FATIGUE_FREQUENCY_WEIGHT || '40'),
      repetitionWeight: parseInt(process.env.FATIGUE_REPETITION_WEIGHT || '30'),
      engagementWeight: parseInt(process.env.FATIGUE_ENGAGEMENT_WEIGHT || '30'),
      
      // Thresholds
      highFrequencyThreshold: parseFloat(process.env.FATIGUE_HIGH_FREQUENCY || '0.7'),
      mediumFrequencyThreshold: parseFloat(process.env.FATIGUE_MEDIUM_FREQUENCY || '0.5'),
      lowFrequencyThreshold: parseFloat(process.env.FATIGUE_LOW_FREQUENCY || '0.2'),
      
      highRepetitionThreshold: parseFloat(process.env.FATIGUE_HIGH_REPETITION || '0.3'),
      mediumRepetitionThreshold: parseFloat(process.env.FATIGUE_MEDIUM_REPETITION || '0.15'),
      
      severeFatigueThreshold: parseInt(process.env.FATIGUE_SEVERE_THRESHOLD || '50'),
      moderateFatigueThreshold: parseInt(process.env.FATIGUE_MODERATE_THRESHOLD || '30')
    },
    
    // Default history days for analysis
    defaultHistoryDays: parseInt(process.env.PREDICTION_HISTORY_DAYS || '30'),
    
    // Confidence calculation weights
    confidence: {
      contentHistoryWeight: parseInt(process.env.CONFIDENCE_CONTENT_WEIGHT || '20'),
      engagementHistoryWeight: parseInt(process.env.CONFIDENCE_ENGAGEMENT_WEIGHT || '20'),
      dataCompleteness: parseInt(process.env.CONFIDENCE_COMPLETENESS_WEIGHT || '20')
    }
  },
  
  // API Cost Configuration (per 1000 requests)
  apiCosts: {
    claude: {
      costPer1000: parseFloat(process.env.CLAUDE_COST_PER_1000 || '15.00'),
      multiplier: parseFloat(process.env.CLAUDE_COST_MULTIPLIER || '0.4')
    },
    gemini: {
      costPer1000: parseFloat(process.env.GEMINI_COST_PER_1000 || '10.00'),
      multiplier: parseFloat(process.env.GEMINI_COST_MULTIPLIER || '0.25')
    },
    whatsapp: {
      costPer1000: parseFloat(process.env.WHATSAPP_COST_PER_1000 || '5.00'),
      multiplier: parseFloat(process.env.WHATSAPP_COST_MULTIPLIER || '0.15')
    },
    sheets: {
      costPer1000: parseFloat(process.env.SHEETS_COST_PER_1000 || '2.00'),
      multiplier: parseFloat(process.env.SHEETS_COST_MULTIPLIER || '0.15')
    },
    infrastructure: {
      dailyCost: parseFloat(process.env.INFRASTRUCTURE_DAILY_COST || '5.00'),
      multiplier: parseFloat(process.env.INFRASTRUCTURE_COST_MULTIPLIER || '0.05')
    }
  },
  
  // Operational Thresholds
  operations: {
    // Budget alerts
    budgetWarningThreshold: parseFloat(process.env.BUDGET_WARNING_THRESHOLD || '0.8'), // 80% of budget
    budgetCriticalThreshold: parseFloat(process.env.BUDGET_CRITICAL_THRESHOLD || '0.95'), // 95% of budget
    
    // Performance thresholds
    acceptableResponseTime: parseInt(process.env.ACCEPTABLE_RESPONSE_TIME || '2000'), // ms
    criticalResponseTime: parseInt(process.env.CRITICAL_RESPONSE_TIME || '5000'), // ms
    
    // Usage thresholds
    highApiUsageThreshold: parseInt(process.env.HIGH_API_USAGE_THRESHOLD || '10000'), // requests per day
    criticalApiUsageThreshold: parseInt(process.env.CRITICAL_API_USAGE_THRESHOLD || '50000') // requests per day
  },
  
  // Report Generation Configuration
  reports: {
    retentionDays: {
      detailed: parseInt(process.env.REPORT_RETENTION_DETAILED || '90'),
      aggregated: parseInt(process.env.REPORT_RETENTION_AGGREGATED || '365')
    },
    
    // Schedule configurations
    schedules: {
      weekly: {
        dayOfWeek: parseInt(process.env.WEEKLY_REPORT_DAY || '1'), // Monday
        hour: parseInt(process.env.WEEKLY_REPORT_HOUR || '9') // 9 AM
      },
      monthly: {
        dayOfMonth: parseInt(process.env.MONTHLY_REPORT_DAY || '1'), // 1st of month
        hour: parseInt(process.env.MONTHLY_REPORT_HOUR || '9') // 9 AM
      }
    }
  },
  
  // Cache Configuration
  cache: {
    ttl: {
      kpis: parseInt(process.env.CACHE_TTL_KPIS || '300'), // 5 minutes
      analytics: parseInt(process.env.CACHE_TTL_ANALYTICS || '600'), // 10 minutes
      predictions: parseInt(process.env.CACHE_TTL_PREDICTIONS || '1800'), // 30 minutes
      reports: parseInt(process.env.CACHE_TTL_REPORTS || '3600') // 1 hour
    },
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100') // Max items in cache
  }
};