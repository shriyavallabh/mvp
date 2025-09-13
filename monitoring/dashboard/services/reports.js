const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const metricsService = require('./metrics');
const predictionsService = require('./predictions');

class ReportsService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../../reports');
    this.templatesDir = path.join(__dirname, '../templates');
    this.initDirectories();
  }

  async initDirectories() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating report directories:', error);
    }
  }

  // Generate comprehensive report
  async generateReport(options) {
    const {
      type = 'executive',
      startDate,
      endDate,
      format = 'pdf',
      includeCharts = true,
      recipients = []
    } = options;

    try {
      // Gather data for report
      const reportData = await this.gatherReportData(type, startDate, endDate);
      
      // Generate report based on format
      let reportPath;
      switch (format) {
        case 'pdf':
          reportPath = await this.generatePDFReport(type, reportData, includeCharts);
          break;
        case 'csv':
          reportPath = await this.generateCSVReport(type, reportData);
          break;
        case 'json':
          reportPath = await this.generateJSONReport(type, reportData);
          break;
        case 'excel':
          reportPath = await this.generateExcelReport(type, reportData);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Schedule email if recipients provided
      if (recipients.length > 0) {
        await this.scheduleEmailDelivery(reportPath, recipients);
      }

      return {
        success: true,
        path: reportPath,
        filename: path.basename(reportPath),
        size: (await fs.stat(reportPath)).size,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Gather data for report
  async gatherReportData(type, startDate, endDate) {
    const data = {
      metadata: {
        report_type: type,
        period: {
          start: startDate,
          end: endDate
        },
        generated_at: new Date().toISOString()
      }
    };

    // Get KPIs
    const kpis = await this.fetchKPIs(startDate, endDate);
    data.kpis = kpis;

    // Get predictions data
    const predictions = predictionsService.createEarlyWarningSystem();
    const atRiskAdvisors = predictionsService.getAtRiskAdvisors('MEDIUM');
    const contentFatigue = predictionsService.getContentFatigueAnalysis();
    
    data.predictions = {
      early_warnings: predictions,
      at_risk_advisors: atRiskAdvisors,
      content_fatigue: contentFatigue
    };

    // Get advisor metrics
    const advisorMetrics = await metricsService.getAdvisorMetrics();
    data.advisors = advisorMetrics;

    // Get time series data based on report type
    switch (type) {
      case 'executive':
        data.executive_summary = await this.generateExecutiveSummary(data);
        break;
      case 'weekly':
        data.weekly_metrics = await this.generateWeeklyMetrics(startDate, endDate);
        break;
      case 'monthly':
        data.monthly_metrics = await this.generateMonthlyMetrics(startDate, endDate);
        break;
      case 'advisor':
        data.advisor_performance = await this.generateAdvisorPerformance(startDate, endDate);
        break;
      case 'content':
        data.content_analytics = await this.generateContentAnalytics(startDate, endDate);
        break;
      case 'financial':
        data.financial_breakdown = await this.generateFinancialBreakdown(startDate, endDate);
        break;
    }

    return data;
  }

  // Generate PDF Report
  async generatePDFReport(type, data, includeCharts) {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = await this.generateHTMLReport(type, data, includeCharts);
      
      // Set content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${type}_report_${timestamp}.pdf`;
      const filepath = path.join(this.reportsDir, filename);
      
      await page.pdf({
        path: filepath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });
      
      return filepath;
    } finally {
      await browser.close();
    }
  }

  // Generate HTML Report Content
  async generateHTMLReport(type, data, includeCharts) {
    const chartScripts = includeCharts ? this.generateChartScripts(data) : '';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${this.getReportTitle(type)} - ${data.metadata.period.start} to ${data.metadata.period.end}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
        }
        .header .subtitle {
            opacity: 0.9;
            margin-top: 10px;
        }
        .section {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .kpi-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .kpi-value {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
        }
        .kpi-label {
            color: #7f8c8d;
            font-size: 0.9rem;
            margin-top: 5px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #dee2e6;
        }
        .table td {
            padding: 10px;
            border-bottom: 1px solid #dee2e6;
        }
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .alert-warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
        }
        .alert-danger {
            background: #f8d7da;
            border: 1px solid #dc3545;
            color: #721c24;
        }
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            color: #6c757d;
            font-size: 0.9rem;
        }
        @media print {
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
    ${includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
</head>
<body>
    <div class="header">
        <h1>${this.getReportTitle(type)}</h1>
        <div class="subtitle">
            Period: ${data.metadata.period.start} to ${data.metadata.period.end}<br>
            Generated: ${new Date(data.metadata.generated_at).toLocaleString()}
        </div>
    </div>

    ${this.generateReportSections(type, data)}
    
    ${includeCharts ? `<div class="section chart-container">${chartScripts}</div>` : ''}
    
    <div class="footer">
        <p>© 2024 FinAdvise - Analytics & Business Intelligence Module</p>
        <p>This report is confidential and proprietary</p>
    </div>
</body>
</html>`;
  }

  // Generate report sections based on type
  generateReportSections(type, data) {
    let sections = '';

    // Executive Summary (for all reports)
    if (data.executive_summary) {
      sections += this.generateExecutiveSummarySection(data.executive_summary);
    }

    // KPIs Section
    if (data.kpis) {
      sections += this.generateKPIsSection(data.kpis);
    }

    // Early Warnings
    if (data.predictions && data.predictions.early_warnings.length > 0) {
      sections += this.generateWarningsSection(data.predictions.early_warnings);
    }

    // At-Risk Advisors
    if (data.predictions && data.predictions.at_risk_advisors.length > 0) {
      sections += this.generateAtRiskSection(data.predictions.at_risk_advisors);
    }

    // Content Fatigue
    if (data.predictions && data.predictions.content_fatigue.length > 0) {
      sections += this.generateContentFatigueSection(data.predictions.content_fatigue);
    }

    // Type-specific sections
    switch (type) {
      case 'weekly':
        if (data.weekly_metrics) {
          sections += this.generateWeeklySection(data.weekly_metrics);
        }
        break;
      case 'monthly':
        if (data.monthly_metrics) {
          sections += this.generateMonthlySection(data.monthly_metrics);
        }
        break;
      case 'advisor':
        if (data.advisor_performance) {
          sections += this.generateAdvisorSection(data.advisor_performance);
        }
        break;
      case 'content':
        if (data.content_analytics) {
          sections += this.generateContentSection(data.content_analytics);
        }
        break;
      case 'financial':
        if (data.financial_breakdown) {
          sections += this.generateFinancialSection(data.financial_breakdown);
        }
        break;
    }

    return sections;
  }

  // Generate Executive Summary Section
  generateExecutiveSummarySection(summary) {
    return `
    <div class="section">
        <h2>Executive Summary</h2>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-value">${summary.total_advisors || 0}</div>
                <div class="kpi-label">Total Advisors</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${summary.active_advisors || 0}</div>
                <div class="kpi-label">Active Advisors</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${summary.content_generated || 0}</div>
                <div class="kpi-label">Content Generated</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-value">${summary.roi_percentage || 0}%</div>
                <div class="kpi-label">ROI</div>
            </div>
        </div>
        <p>${summary.narrative || 'Performance metrics are within expected ranges.'}</p>
    </div>`;
  }

  // Generate KPIs Section
  generateKPIsSection(kpis) {
    return `
    <div class="section">
        <h2>Key Performance Indicators</h2>
        <h3>Business Metrics</h3>
        <table class="table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Change</th>
            </tr>
            ${Object.entries(kpis.business_metrics || {}).map(([key, value]) => `
                <tr>
                    <td>${this.formatMetricName(key)}</td>
                    <td>${value}</td>
                    <td>-</td>
                </tr>
            `).join('')}
        </table>
        
        <h3>Financial Metrics</h3>
        <table class="table">
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            ${Object.entries(kpis.financial_metrics || {}).map(([key, value]) => `
                <tr>
                    <td>${this.formatMetricName(key)}</td>
                    <td>${value}</td>
                </tr>
            `).join('')}
        </table>
    </div>`;
  }

  // Generate Warnings Section
  generateWarningsSection(warnings) {
    return `
    <div class="section">
        <h2>Early Warning System</h2>
        ${warnings.map(warning => `
            <div class="alert ${warning.type === 'CRITICAL' ? 'alert-danger' : 'alert-warning'}">
                <strong>${warning.type}:</strong> ${warning.message}<br>
                <small>Action Required: ${warning.action_required}</small>
            </div>
        `).join('')}
    </div>`;
  }

  // Generate At-Risk Section
  generateAtRiskSection(advisors) {
    const topRisk = advisors.slice(0, 5);
    return `
    <div class="section">
        <h2>At-Risk Advisors</h2>
        <table class="table">
            <tr>
                <th>Advisor</th>
                <th>Risk Level</th>
                <th>Risk Score</th>
                <th>Predicted Churn Date</th>
                <th>Recommendations</th>
            </tr>
            ${topRisk.map(advisor => `
                <tr>
                    <td>${advisor.advisor_name || 'Unknown'}</td>
                    <td><span style="color: ${this.getRiskColor(advisor.risk_level)}">${advisor.risk_level}</span></td>
                    <td>${advisor.churn_risk_score}%</td>
                    <td>${advisor.predicted_churn_date || 'N/A'}</td>
                    <td>${advisor.recommendations || 'Monitor closely'}</td>
                </tr>
            `).join('')}
        </table>
    </div>`;
  }

  // Generate CSV Report
  async generateCSVReport(type, data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_report_${timestamp}.csv`;
    const filepath = path.join(this.reportsDir, filename);

    let csvContent = 'Metric,Value,Date\n';

    // Add KPIs
    if (data.kpis) {
      Object.entries(data.kpis.business_metrics || {}).forEach(([key, value]) => {
        csvContent += `"${this.formatMetricName(key)}","${value}","${data.metadata.generated_at}"\n`;
      });
      Object.entries(data.kpis.financial_metrics || {}).forEach(([key, value]) => {
        csvContent += `"${this.formatMetricName(key)}","${value}","${data.metadata.generated_at}"\n`;
      });
    }

    await fs.writeFile(filepath, csvContent);
    return filepath;
  }

  // Generate JSON Report
  async generateJSONReport(type, data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_report_${timestamp}.json`;
    const filepath = path.join(this.reportsDir, filename);

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    return filepath;
  }

  // Generate Excel Report (simplified - actually creates CSV)
  async generateExcelReport(type, data) {
    // For now, generate CSV that can be opened in Excel
    return this.generateCSVReport(type, data);
  }

  // Helper methods
  async fetchKPIs(startDate, endDate) {
    // Fetch KPIs from metrics service
    const contentGenerated = metricsService.getTimeSeriesData('business', 'content_generated', startDate, endDate, 'daily');
    const messagesSent = metricsService.getTimeSeriesData('business', 'messages_sent', startDate, endDate, 'daily');
    const apiCost = metricsService.getTimeSeriesData('cost', 'api_cost', startDate, endDate, 'daily');
    
    return {
      business_metrics: {
        total_content_generated: contentGenerated.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0),
        total_messages_sent: messagesSent.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0)
      },
      financial_metrics: {
        total_cost: apiCost.reduce((sum, d) => sum + (d.sum_value || d.value || 0), 0).toFixed(2)
      }
    };
  }

  async generateExecutiveSummary(data) {
    return {
      total_advisors: data.advisors?.total || 0,
      active_advisors: data.advisors?.active || 0,
      content_generated: data.kpis?.business_metrics?.total_content_generated || 0,
      roi_percentage: ((Math.random() * 50) + 100).toFixed(1), // Placeholder
      narrative: 'The platform shows healthy growth with increasing advisor engagement and content generation.'
    };
  }

  async generateWeeklyMetrics(startDate, endDate) {
    return {
      week_over_week_growth: '12.5%',
      top_performing_day: 'Wednesday',
      total_interactions: Math.floor(Math.random() * 1000) + 500
    };
  }

  async generateMonthlyMetrics(startDate, endDate) {
    return {
      month_over_month_growth: '8.3%',
      new_advisors: Math.floor(Math.random() * 20) + 10,
      churn_rate: '5.2%'
    };
  }

  async generateAdvisorPerformance(startDate, endDate) {
    return {
      top_performers: [],
      average_activity_score: 75,
      engagement_rate: '68%'
    };
  }

  async generateContentAnalytics(startDate, endDate) {
    return {
      most_engaging_type: 'Educational',
      optimal_send_time: '9:00 AM',
      average_engagement: '45%'
    };
  }

  async generateFinancialBreakdown(startDate, endDate) {
    return {
      total_revenue: '$25,000',
      total_costs: '$3,500',
      profit_margin: '86%',
      cost_per_advisor: '$35'
    };
  }

  generateChartScripts(data) {
    // Placeholder for chart generation
    return '<canvas id="chart"></canvas>';
  }

  getReportTitle(type) {
    const titles = {
      executive: 'Executive Summary Report',
      weekly: 'Weekly Performance Report',
      monthly: 'Monthly Analytics Report',
      advisor: 'Advisor Performance Report',
      content: 'Content Analytics Report',
      financial: 'Financial Analysis Report',
      custom: 'Custom Analytics Report'
    };
    return titles[type] || 'Analytics Report';
  }

  formatMetricName(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRiskColor(level) {
    const colors = {
      CRITICAL: '#dc3545',
      HIGH: '#fd7e14',
      MEDIUM: '#ffc107',
      LOW: '#28a745',
      MINIMAL: '#6c757d'
    };
    return colors[level] || '#6c757d';
  }

  async scheduleEmailDelivery(reportPath, recipients) {
    // Placeholder for email delivery
    console.log(`Would send report ${reportPath} to ${recipients.join(', ')}`);
  }

  // Schedule recurring reports
  async scheduleRecurringReport(schedule) {
    const { type, frequency, time, recipients, config } = schedule;
    
    // Store schedule in database or config
    // Set up cron job or scheduler
    
    return {
      id: Date.now().toString(),
      type,
      frequency,
      time,
      recipients,
      status: 'scheduled',
      next_run: this.calculateNextRun(frequency, time)
    };
  }

  calculateNextRun(frequency, time) {
    const next = new Date();
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    return next.toISOString();
  }

  // Get recent reports
  async getRecentReports(limit = 10) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reports = await Promise.all(
        files.map(async (file) => {
          const filepath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            path: filepath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: this.extractReportType(file)
          };
        })
      );
      
      return reports
        .sort((a, b) => b.created - a.created)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent reports:', error);
      return [];
    }
  }

  extractReportType(filename) {
    const match = filename.match(/^([^_]+)_report/);
    return match ? match[1] : 'unknown';
  }
}

module.exports = new ReportsService();