# Analytics & Business Intelligence Module - API Documentation

## Overview
The Analytics & Business Intelligence Module (Story 4.4) extends the existing Story 4.2 monitoring dashboard with comprehensive analytics capabilities, predictive insights, and reporting functionality.

## Table of Contents
1. [Architecture](#architecture)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Integration Points](#integration-points)
5. [Usage Examples](#usage-examples)
6. [Performance Considerations](#performance-considerations)

## Architecture

### Components
- **Time-Series Database**: SQLite-based storage for historical metrics
- **Analytics Engine**: Real-time KPI calculations and trend analysis
- **Predictive Analytics**: Machine learning models for churn prediction and content fatigue
- **Reporting Service**: PDF/CSV/JSON report generation using Puppeteer
- **Caching Layer**: In-memory cache for expensive queries

### File Structure
```
monitoring/dashboard/
├── services/
│   ├── metrics.js (ENHANCED - time-series support)
│   ├── predictions.js (NEW - predictive analytics)
│   ├── reports.js (NEW - report generation)
│   └── analytics-cache.js (NEW - caching layer)
├── routes/
│   └── api.js (ENHANCED - analytics endpoints)
├── views/analytics/
│   ├── executive.ejs
│   ├── kpis.ejs
│   └── reports.ejs
├── public/js/
│   └── analytics.js
└── database/
    └── analytics.db (SQLite database)
```

## API Endpoints

### KPIs and Business Metrics

#### GET /api/analytics/kpis
Returns comprehensive business KPIs.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-31T23:59:59.999Z"
  },
  "business_metrics": {
    "total_content_generated": 500,
    "total_messages_sent": 2500,
    "total_api_calls": 10000,
    "active_advisors": 75,
    "new_advisors_this_week": 5
  },
  "financial_metrics": {
    "total_cost": "1250.00",
    "avg_cost_per_content": "2.50",
    "avg_cost_per_message": "0.50",
    "avg_cost_per_advisor": "16.67",
    "advisor_lifetime_value": "10000.00",
    "roi_percentage": "59900.0"
  },
  "efficiency_metrics": {
    "content_per_advisor": "6.7",
    "messages_per_content": "5.0",
    "api_calls_per_content": "20.0"
  },
  "trends": {
    "content_growth_rate": "12.5",
    "message_growth_rate": "15.3",
    "cost_growth_rate": "8.2"
  }
}
```

### Content Analytics

#### GET /api/analytics/content
Analyzes content performance and engagement patterns.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)
- `groupBy` (optional): 'type', 'advisor', 'day'

**Response:**
```json
{
  "content_by_type": {
    "daily_update": {
      "count": 150,
      "engagement": 45,
      "avgEngagement": 68.5
    }
  },
  "optimal_posting_times": {
    "peak_hours": [9, 12, 17],
    "hourly_distribution": {}
  },
  "engagement_patterns": {
    "avg_engagement_rate": "45.2",
    "trending_content_types": ["educational", "market_insights"]
  }
}
```

### Advisor Analytics

#### GET /api/analytics/advisors
Returns detailed advisor performance metrics.

**Response:**
```json
{
  "overview": {
    "total_advisors": 100,
    "active_advisors": 75,
    "inactive_advisors": 25,
    "activation_rate": "75.0"
  },
  "activity_metrics": {
    "daily_active_avg": "65.3",
    "peak_activity_day": "2024-01-15",
    "activity_trend": "increasing"
  },
  "performance_rankings": [],
  "retention_metrics": {
    "monthly_churn_rate": "5.0",
    "avg_advisor_tenure_days": 180,
    "reactivation_rate": "12.5"
  }
}
```

### Predictive Analytics

#### GET /api/analytics/predictions
Returns predictive insights and early warnings.

**Response:**
```json
{
  "early_warnings": [
    {
      "type": "CRITICAL",
      "category": "advisor_churn",
      "message": "5 advisors at critical risk",
      "action_required": "Immediate intervention needed"
    }
  ],
  "at_risk_advisors": {
    "total": 15,
    "critical": 5,
    "high": 7,
    "medium": 3
  },
  "content_fatigue": {
    "total_analyzed": 10,
    "severe": 2,
    "high": 3
  }
}
```

#### POST /api/analytics/predictions/churn
Calculate churn risk for specific advisor.

**Request Body:**
```json
{
  "advisorData": {
    "id": "advisor_123",
    "name": "John Doe",
    "last_activity_date": "2024-01-15",
    "content_history": [10, 8, 5, 2],
    "engagement_history": [75, 70, 60, 45]
  }
}
```

### Reporting

#### POST /api/analytics/report
Generate comprehensive report.

**Request Body:**
```json
{
  "type": "executive",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "pdf",
  "includeCharts": true,
  "recipients": ["admin@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "path": "/reports/executive_report_2024-01-31.pdf",
  "filename": "executive_report_2024-01-31.pdf",
  "size": 245678,
  "generated_at": "2024-01-31T12:00:00.000Z"
}
```

#### GET /api/analytics/export
Export data in various formats.

**Query Parameters:**
- `format`: 'csv', 'json', 'pdf'
- `startDate`
- `endDate`

### CRM Conversion Analytics

#### GET /api/analytics/crm/conversions
Analyzes Click-to-Unlock conversion funnel.

**Response:**
```json
{
  "click_to_unlock_funnel": {
    "total_button_clicks": 1000,
    "unlock_interactions": {
      "unlock_images": 300,
      "unlock_content": 400,
      "unlock_updates": 300
    },
    "content_retrieved": 600,
    "shared_with_clients": 200,
    "unlock_to_retrieve_rate": "60.0",
    "retrieve_to_share_rate": "33.3"
  },
  "ai_chat_engagement": {
    "total_conversations": 500,
    "completion_rate": "85.0"
  },
  "roi_metrics": {
    "total_value_generated": "50000.00",
    "cost_per_conversion": "5.00",
    "roi_percentage": "900.0"
  }
}
```

### Cost Tracking

#### GET /api/analytics/costs
Comprehensive cost analytics.

**Response:**
```json
{
  "total_costs": {
    "overall": "1500.00",
    "by_service": {
      "claude_api": {
        "cost": "600.00",
        "calls": 3500,
        "avg_cost_per_call": "0.015",
        "percentage": "40%"
      },
      "gemini_api": {
        "cost": "375.00",
        "percentage": "25%"
      }
    }
  },
  "per_advisor_costs": {
    "avg_cost_per_advisor": "20.00"
  },
  "optimization_opportunities": [
    {
      "type": "CACHING",
      "description": "Implement response caching",
      "potential_savings": "20-25%"
    }
  ]
}
```

#### GET /api/analytics/costs/forecast
Cost forecasting and projections.

**Query Parameters:**
- `months`: Number of months to forecast (default: 3)

## Data Models

### Time Series Data Structure
```javascript
{
  id: INTEGER,
  metric_type: TEXT,    // 'business', 'cost', 'engagement'
  metric_name: TEXT,    // 'content_generated', 'api_calls'
  metric_value: REAL,
  metadata: TEXT,       // JSON string
  timestamp: DATETIME
}
```

### Advisor Risk Score
```javascript
{
  advisor_id: TEXT,
  churn_risk_score: REAL,      // 0-100
  risk_level: TEXT,             // CRITICAL, HIGH, MEDIUM, LOW
  risk_factors: TEXT,
  predicted_churn_date: DATE,
  confidence_score: REAL,       // 0-100
  recommendations: TEXT
}
```

### Content Fatigue Score
```javascript
{
  content_type: TEXT,
  fatigue_score: REAL,          // 0-100
  fatigue_level: TEXT,          // SEVERE, HIGH, MODERATE, LOW
  avg_engagement_rate: REAL,
  optimal_frequency: TEXT,
  recommendations: TEXT
}
```

## Integration Points

### Story 4.2 Dashboard Integration
- Shares authentication system
- Uses existing WebSocket for real-time updates
- Extends navigation with Analytics section
- Compatible with existing PM2 configuration

### Story 3.2 Webhook Integration
- Connects via webhook-connector.js service
- Retrieves button click analytics
- Accesses CRM conversation data
- Monitors AI chat interactions

## Usage Examples

### JavaScript/Node.js
```javascript
// Fetch KPIs
const response = await fetch('/api/analytics/kpis?startDate=2024-01-01&endDate=2024-01-31');
const kpis = await response.json();
console.log('ROI:', kpis.financial_metrics.roi_percentage);

// Generate Report
const reportData = {
  type: 'executive',
  format: 'pdf',
  includeCharts: true
};

const report = await fetch('/api/analytics/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

### cURL
```bash
# Get KPIs
curl http://localhost:8080/api/analytics/kpis

# Generate PDF Report
curl -X POST http://localhost:8080/api/analytics/report \
  -H "Content-Type: application/json" \
  -d '{"type":"executive","format":"pdf"}'

# Export CSV Data
curl http://localhost:8080/api/analytics/export?format=csv > analytics.csv
```

## Performance Considerations

### Caching Strategy
- KPI queries cached for 2 minutes
- Content analytics cached for 2 minutes
- Cache invalidated on new data insertion

### Database Optimization
- Indexes on timestamp columns
- Aggregation tables for hourly/daily/weekly/monthly data
- 90-day retention for raw data
- 1-year retention for aggregated data

### Query Performance
- Analytics queries complete < 2 seconds
- Report generation < 30 seconds
- Real-time updates via WebSocket

### Scaling Recommendations
1. Implement read replicas for heavy query loads
2. Use Redis for distributed caching
3. Consider time-series database (InfluxDB) for large datasets
4. Implement query result pagination

## Error Handling

All endpoints return standard error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common error codes:
- `INVALID_DATE_RANGE`: Start date after end date
- `INSUFFICIENT_DATA`: Not enough data for analysis
- `REPORT_GENERATION_FAILED`: Report creation error
- `PREDICTION_ERROR`: Predictive model error

## Security Considerations

1. **Authentication Required**: All endpoints require valid session
2. **Rate Limiting**: 100 requests per minute per user
3. **Data Sanitization**: All inputs validated and sanitized
4. **CORS**: Configured for dashboard domain only
5. **SQL Injection Prevention**: Parameterized queries used

## Support

For issues or questions:
- Check dashboard logs: `/logs/dashboard.log`
- Review analytics logs: `/logs/analytics.log`
- Contact: support@finadvise.com