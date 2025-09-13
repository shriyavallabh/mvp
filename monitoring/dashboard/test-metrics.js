const metricsService = require('./services/metrics');

// Test recording time series data
console.log('Testing time series recording...');

// Record some sample metrics
metricsService.recordTimeSeries('api', 'response_time', 125, { endpoint: '/api/analytics' });
metricsService.recordTimeSeries('api', 'response_time', 95, { endpoint: '/api/analytics' });
metricsService.recordTimeSeries('api', 'response_time', 150, { endpoint: '/api/analytics' });

metricsService.recordTimeSeries('business', 'content_generated', 5, { type: 'daily_update' });
metricsService.recordTimeSeries('business', 'messages_sent', 15, { channel: 'whatsapp' });
metricsService.recordTimeSeries('business', 'advisor_active', 3, {});

metricsService.recordTimeSeries('cost', 'api_calls', 25, { service: 'claude' });
metricsService.recordTimeSeries('cost', 'api_calls', 10, { service: 'gemini' });
metricsService.recordTimeSeries('cost', 'api_cost', 0.05, { service: 'claude' });

console.log('Metrics recorded successfully');

// Test fetching time series data
const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);

const apiMetrics = metricsService.getTimeSeriesData(
  'api', 
  'response_time', 
  yesterday.toISOString(), 
  now.toISOString(), 
  'raw'
);

console.log('API Metrics:', apiMetrics);

// Clean up
if (metricsService.stopAggregationJobs) {
  metricsService.stopAggregationJobs();
}
if (metricsService.db) {
  metricsService.db.close();
}

console.log('Test completed');
process.exit(0);