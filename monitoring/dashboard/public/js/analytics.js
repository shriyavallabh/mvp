// Analytics Dashboard JavaScript

let growthChart = null;
let costChart = null;
let trendsChart = null;

// Load Executive Dashboard
async function loadExecutiveDashboard() {
    try {
        // Load KPIs
        const kpisResponse = await fetch('/api/analytics/kpis');
        const kpis = await kpisResponse.json();
        
        // Update KPI cards
        updateKPICards(kpis);
        
        // Load content analytics
        const contentResponse = await fetch('/api/analytics/content');
        const contentData = await contentResponse.json();
        
        // Load advisor analytics
        const advisorResponse = await fetch('/api/analytics/advisors');
        const advisorData = await advisorResponse.json();
        
        // Initialize charts
        initializeGrowthChart(kpis);
        initializeCostChart(kpis);
        
        // Update tables
        updateContentTypesTable(contentData);
        updateAdvisorRankingsTable(advisorData);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

// Update KPI Cards
function updateKPICards(kpis) {
    // Active Advisors
    const activeAdvisors = document.getElementById('activeAdvisors');
    if (activeAdvisors) {
        activeAdvisors.textContent = kpis.business_metrics?.active_advisors || '0';
    }
    
    // Content Generated
    const contentGenerated = document.getElementById('contentGenerated');
    if (contentGenerated) {
        contentGenerated.textContent = kpis.business_metrics?.total_content_generated || '0';
    }
    
    // ROI Percentage
    const roiPercentage = document.getElementById('roiPercentage');
    if (roiPercentage) {
        roiPercentage.textContent = `${kpis.financial_metrics?.roi_percentage || '0'}%`;
    }
    
    // Monthly Cost
    const monthlyCost = document.getElementById('monthlyCost');
    if (monthlyCost) {
        monthlyCost.textContent = `$${kpis.financial_metrics?.total_cost || '0'}`;
    }
    
    // Update trends
    updateTrendIndicators(kpis.trends);
}

// Update Trend Indicators
function updateTrendIndicators(trends) {
    if (!trends) return;
    
    // Content trend
    const contentTrend = document.getElementById('contentTrend');
    if (contentTrend && trends.content_growth_rate) {
        const rate = parseFloat(trends.content_growth_rate);
        updateTrendElement(contentTrend, rate);
    }
    
    // Cost trend
    const costTrend = document.getElementById('costTrend');
    if (costTrend && trends.cost_growth_rate) {
        const rate = parseFloat(trends.cost_growth_rate);
        updateTrendElement(costTrend, rate, true); // Reverse for cost (down is good)
    }
}

function updateTrendElement(element, rate, reverse = false) {
    const isPositive = rate > 0;
    const isNegative = rate < 0;
    
    let icon, className;
    if (isPositive) {
        icon = 'bi-arrow-up-circle-fill';
        className = reverse ? 'trend-down' : 'trend-up';
    } else if (isNegative) {
        icon = 'bi-arrow-down-circle-fill';
        className = reverse ? 'trend-up' : 'trend-down';
    } else {
        icon = 'bi-dash-circle-fill';
        className = 'trend-stable';
    }
    
    element.innerHTML = `
        <i class="bi ${icon} ${className}"></i> ${rate > 0 ? '+' : ''}${rate}%
    `;
}

// Initialize Growth Chart
function initializeGrowthChart(kpis) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    
    if (growthChart) {
        growthChart.destroy();
    }
    
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: generateDateLabels(30),
            datasets: [{
                label: 'Content Generated',
                data: generateRandomData(30, 10, 50),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }, {
                label: 'Messages Sent',
                data: generateRandomData(30, 20, 100),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4
            }, {
                label: 'Active Advisors',
                data: generateRandomData(30, 5, 20),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Initialize Cost Chart
function initializeCostChart(kpis) {
    const ctx = document.getElementById('costChart');
    if (!ctx) return;
    
    if (costChart) {
        costChart.destroy();
    }
    
    const totalCost = parseFloat(kpis.financial_metrics?.total_cost || 100);
    
    costChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Claude API', 'Gemini API', 'WhatsApp API', 'Infrastructure', 'Other'],
            datasets: [{
                data: [
                    totalCost * 0.4,
                    totalCost * 0.25,
                    totalCost * 0.15,
                    totalCost * 0.15,
                    totalCost * 0.05
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Update Content Types Table
function updateContentTypesTable(contentData) {
    const table = document.getElementById('contentTypesTable');
    if (!table) return;
    
    const contentTypes = contentData.content_by_type || {};
    const rows = Object.entries(contentTypes)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([type, data]) => {
            return `
                <tr>
                    <td>${type}</td>
                    <td>${data.count}</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${data.avgEngagement || 0}%">
                                ${data.avgEngagement || 0}%
                            </div>
                        </div>
                    </td>
                    <td>
                        <i class="bi bi-arrow-up-circle-fill text-success"></i>
                    </td>
                </tr>
            `;
        }).join('');
    
    table.innerHTML = rows || '<tr><td colspan="4" class="text-center">No data available</td></tr>';
}

// Update Advisor Rankings Table
function updateAdvisorRankingsTable(advisorData) {
    const table = document.getElementById('advisorRankingsTable');
    if (!table) return;
    
    // For now, show placeholder data
    const sampleAdvisors = [
        { name: 'John Doe', score: 95, content: 45 },
        { name: 'Jane Smith', score: 92, content: 42 },
        { name: 'Mike Johnson', score: 88, content: 38 },
        { name: 'Sarah Williams', score: 85, content: 35 },
        { name: 'Tom Brown', score: 82, content: 32 }
    ];
    
    const rows = sampleAdvisors.map((advisor, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${advisor.name}</td>
                <td>
                    <span class="badge bg-primary">${advisor.score}</span>
                </td>
                <td>${advisor.content}</td>
            </tr>
        `;
    }).join('');
    
    table.innerHTML = rows;
}

// Load KPIs Page
async function loadKPIs() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const response = await fetch(`/api/analytics/kpis?startDate=${startDate}&endDate=${endDate}`);
        const kpis = await response.json();
        
        // Update Business Metrics
        const businessMetrics = document.getElementById('businessMetrics');
        if (businessMetrics) {
            businessMetrics.innerHTML = createMetricCards(kpis.business_metrics, 'business');
        }
        
        // Update Financial Metrics
        const financialMetrics = document.getElementById('financialMetrics');
        if (financialMetrics) {
            financialMetrics.innerHTML = createMetricCards(kpis.financial_metrics, 'financial');
        }
        
        // Update Efficiency Metrics
        const efficiencyMetrics = document.getElementById('efficiencyMetrics');
        if (efficiencyMetrics) {
            efficiencyMetrics.innerHTML = createMetricCards(kpis.efficiency_metrics, 'efficiency');
        }
        
        // Initialize trends chart
        initializeTrendsChart(kpis.trends);
        
    } catch (error) {
        console.error('Error loading KPIs:', error);
        showAlert('Error loading KPI data', 'danger');
    }
}

// Create Metric Cards
function createMetricCards(metrics, type) {
    if (!metrics) return '<div class="alert alert-info">No data available</div>';
    
    const iconMap = {
        business: 'bi-briefcase-fill',
        financial: 'bi-currency-dollar',
        efficiency: 'bi-speedometer2'
    };
    
    return Object.entries(metrics).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
            <div class="col-md-3 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <i class="bi ${iconMap[type]} text-primary me-3" style="font-size: 2rem;"></i>
                            <div>
                                <h6 class="card-subtitle mb-1 text-muted">${label}</h6>
                                <h4 class="card-title mb-0">${value}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize Trends Chart
function initializeTrendsChart(trends) {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    if (trendsChart) {
        trendsChart.destroy();
    }
    
    const labels = Object.keys(trends || {}).map(key => 
        key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    const data = Object.values(trends || {}).map(v => parseFloat(v) || 0);
    
    trendsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Growth Rate (%)',
                data: data,
                backgroundColor: data.map(v => v >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Generate Report
async function generateReport() {
    try {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const format = document.getElementById('reportFormat').value;
        const includeCharts = document.getElementById('includeCharts').checked;
        
        showAlert('Generating report...', 'info');
        
        const response = await fetch('/api/analytics/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: reportType,
                startDate,
                endDate,
                format,
                includeCharts
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showAlert('Report generated successfully!', 'success');
            
            // If PDF, trigger download
            if (format === 'pdf' && result.downloadUrl) {
                window.open(result.downloadUrl, '_blank');
            }
        } else {
            throw new Error('Failed to generate report');
        }
        
    } catch (error) {
        console.error('Error generating report:', error);
        showAlert('Error generating report', 'danger');
    }
}

// Export Dashboard
async function exportDashboard(format) {
    try {
        showAlert(`Exporting dashboard as ${format.toUpperCase()}...`, 'info');
        
        const response = await fetch(`/api/analytics/export?format=${format}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('Export completed successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
        
    } catch (error) {
        console.error('Error exporting dashboard:', error);
        showAlert('Error exporting dashboard', 'danger');
    }
}

// Change Period
function changePeriod(period) {
    const endDate = new Date();
    let startDate = new Date();
    let label = '';
    
    switch (period) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            label = 'Last 7 Days';
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            label = 'Last 30 Days';
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            label = 'Last 90 Days';
            break;
        case 'custom':
            // Show date picker modal
            showCustomDatePicker();
            return;
    }
    
    document.getElementById('periodLabel').textContent = label;
    loadExecutiveDashboard();
}

// Refresh Dashboard
function refreshDashboard() {
    showAlert('Refreshing dashboard...', 'info');
    loadExecutiveDashboard();
}

// Show Alert
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.maxWidth = '400px';
    document.body.appendChild(container);
    return container;
}

// Helper Functions
function generateDateLabels(days) {
    const labels = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    return labels;
}

function generateRandomData(count, min, max) {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}