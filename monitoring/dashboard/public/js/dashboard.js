const socket = io();

socket.on('connect', () => {
    console.log('Connected to dashboard server');
    socket.emit('subscribe-agents');
});

socket.on('agent-status-update', (data) => {
    updateActivityLog(data);
});

let operationsChart;

async function initDashboard() {
    await loadSystemHealth();
    await loadMetrics();
    await loadProcesses();
    await loadWhatsAppStatus();
    await loadSheetsStatus();
    initOperationsChart();
    
    setInterval(loadSystemHealth, 5000);
    setInterval(loadMetrics, 10000);
    setInterval(loadProcesses, 5000);
}

async function loadSystemHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        document.getElementById('cpu-usage').textContent = 
            Math.round(data.cpu.loadAverage['1min'] * 100);
        document.getElementById('memory-usage').textContent = 
            data.memory.percentage;
        
        const statusBadge = document.getElementById('system-status');
        if (data.cpu.loadAverage['1min'] > 0.8 || data.memory.percentage > 80) {
            statusBadge.className = 'badge bg-warning';
            statusBadge.textContent = 'High Load';
        } else {
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Healthy';
        }
    } catch (error) {
        console.error('Error loading system health:', error);
    }
}

async function loadMetrics() {
    try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        
        document.getElementById('active-advisors').textContent = 
            data.advisors.active || 0;
        document.getElementById('total-advisors').textContent = 
            data.advisors.total || 0;
        document.getElementById('content-today').textContent = 
            data.daily.contentGenerated || 0;
        document.getElementById('pending-content').textContent = 
            data.daily.approvalsPending || 0;
        document.getElementById('messages-sent').textContent = 
            data.daily.messagesDelivered || 0;
        document.getElementById('success-rate').textContent = 
            data.weekly.successRate || 100;
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

async function loadProcesses() {
    try {
        const response = await fetch('/api/processes');
        const processes = await response.json();
        
        const processListHtml = processes.map(proc => `
            <div class="process-item ${proc.status}">
                <div>
                    <strong>${proc.name}</strong>
                    <small class="text-muted ms-2">PID: ${proc.pid || 'N/A'}</small>
                </div>
                <div>
                    <span class="badge bg-${proc.status === 'online' ? 'success' : 'danger'}">
                        ${proc.status}
                    </span>
                    <small class="text-muted ms-2">CPU: ${proc.cpu}%</small>
                </div>
            </div>
        `).join('');
        
        document.getElementById('process-list').innerHTML = processListHtml || 
            '<div class="text-center text-muted">No processes running</div>';
    } catch (error) {
        console.error('Error loading processes:', error);
        document.getElementById('process-list').innerHTML = 
            '<div class="text-danger">Error loading processes</div>';
    }
}

async function loadWhatsAppStatus() {
    try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        
        const statusHtml = data.status === 'connected' 
            ? `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Connected</span><br>
               <small>${data.phoneNumber}</small>`
            : `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> ${data.error || 'Disconnected'}</span>`;
        
        document.getElementById('whatsapp-status').innerHTML = statusHtml;
    } catch (error) {
        document.getElementById('whatsapp-status').innerHTML = 
            '<span class="text-danger">Error checking status</span>';
    }
}

async function loadSheetsStatus() {
    try {
        const response = await fetch('/api/sheets/status');
        const data = await response.json();
        
        const statusHtml = data.status === 'connected'
            ? `<span class="text-success"><i class="bi bi-check-circle-fill"></i> Connected</span><br>
               <small>${data.spreadsheetName}</small>`
            : `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> ${data.error || 'Disconnected'}</span>`;
        
        document.getElementById('sheets-status').innerHTML = statusHtml;
    } catch (error) {
        document.getElementById('sheets-status').innerHTML = 
            '<span class="text-danger">Error checking status</span>';
    }
}

function updateActivityLog(data) {
    const activityLog = document.getElementById('activity-log');
    const time = new Date(data.timestamp).toLocaleTimeString();
    
    const activityHtml = `
        <div class="activity-item">
            <span class="activity-time">${time}</span>
            <strong class="ms-2">${data.agent}</strong>
            <span class="badge bg-${getStatusColor(data.status)} ms-2">${data.status}</span>
        </div>
    `;
    
    activityLog.insertAdjacentHTML('afterbegin', activityHtml);
    
    const items = activityLog.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'processing': return 'primary';
        case 'completed': return 'success';
        case 'error': return 'danger';
        default: return 'secondary';
    }
}

function initOperationsChart() {
    const ctx = document.getElementById('operations-chart').getContext('2d');
    operationsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Content Generation',
                data: [0, 0, 0, 0, 0, 50, 0],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }, {
                label: 'Message Delivery',
                data: [0, 50, 0, 0, 0, 0, 0],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
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
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

async function refreshDashboard() {
    await loadSystemHealth();
    await loadMetrics();
    await loadProcesses();
    await loadWhatsAppStatus();
    await loadSheetsStatus();
}

async function triggerContentGeneration() {
    if (!confirm('Are you sure you want to trigger content generation?')) return;
    
    try {
        const response = await fetch('/api/agents/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentName: 'content-orchestrator' })
        });
        const result = await response.json();
        alert(result.message || 'Content generation triggered');
    } catch (error) {
        alert('Error triggering content generation');
    }
}

async function triggerDistribution() {
    if (!confirm('Are you sure you want to trigger message distribution?')) return;
    
    try {
        const response = await fetch('/api/agents/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentName: 'distribution-manager' })
        });
        const result = await response.json();
        alert(result.message || 'Distribution triggered');
    } catch (error) {
        alert('Error triggering distribution');
    }
}

async function createBackup() {
    if (!confirm('Are you sure you want to create a backup?')) return;
    
    try {
        const response = await fetch('/api/backup/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        alert(`Backup created: ${result.id}`);
    } catch (error) {
        alert('Error creating backup');
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);