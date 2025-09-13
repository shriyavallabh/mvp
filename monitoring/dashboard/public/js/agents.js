const socket = io();
let agentHierarchy = {};
let executionTimeline = [];

socket.on('connect', () => {
    console.log('Connected to agent monitor');
    socket.emit('subscribe-agents');
});

socket.on('agent-status-update', (data) => {
    updateAgentStatus(data);
    addToTimeline(data);
});

async function initAgentMonitor() {
    await loadAgentHierarchy();
    await loadAgentStatus();
    
    document.getElementById('agent-log-selector').addEventListener('change', loadAgentLogs);
}

async function loadAgentHierarchy() {
    try {
        const response = await fetch('/api/agents/hierarchy');
        agentHierarchy = await response.json();
        renderHierarchy(agentHierarchy);
    } catch (error) {
        console.error('Error loading agent hierarchy:', error);
    }
}

async function loadAgentStatus() {
    try {
        const response = await fetch('/api/agents/status');
        const status = await response.json();
        
        document.getElementById('total-agents').textContent = status.totalAgents || 10;
        document.getElementById('idle-agents').textContent = status.idleAgents || 10;
        document.getElementById('running-agents').textContent = status.runningAgents || 0;
        document.getElementById('completed-agents').textContent = 
            Object.values(status.agents).filter(a => a.status === 'completed').length || 0;
    } catch (error) {
        console.error('Error loading agent status:', error);
    }
}

function renderHierarchy(node, container = document.getElementById('agent-hierarchy')) {
    container.innerHTML = '';
    renderNode(node, container);
}

function renderNode(node, container) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'agent-hierarchy';
    
    const agentNode = document.createElement('div');
    agentNode.className = `agent-node ${node.status}`;
    agentNode.id = `agent-${node.name}`;
    agentNode.innerHTML = `
        <strong>${node.name}</strong>
        <br>
        <small class="text-muted">Status: ${node.status}</small>
    `;
    nodeDiv.appendChild(agentNode);
    
    if (node.children && node.children.length > 0) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'agent-children';
        
        node.children.forEach(child => {
            renderNode(child, childrenDiv);
        });
        
        nodeDiv.appendChild(childrenDiv);
    }
    
    container.appendChild(nodeDiv);
}

function updateAgentStatus(data) {
    const agentElement = document.getElementById(`agent-${data.agent}`);
    if (agentElement) {
        agentElement.className = `agent-node ${data.status}`;
        agentElement.querySelector('small').textContent = `Status: ${data.status}`;
    }
    
    loadAgentStatus();
}

function addToTimeline(data) {
    executionTimeline.unshift(data);
    if (executionTimeline.length > 50) {
        executionTimeline.pop();
    }
    renderTimeline();
}

function renderTimeline() {
    const timelineContainer = document.getElementById('execution-timeline');
    
    if (executionTimeline.length === 0) {
        timelineContainer.innerHTML = '<div class="text-center text-muted">No executions yet</div>';
        return;
    }
    
    const timelineHtml = executionTimeline.map(item => {
        const time = new Date(item.timestamp).toLocaleTimeString();
        return `
            <div class="timeline-item ${item.status}">
                <strong>${item.agent}</strong>
                <span class="badge bg-${getStatusColor(item.status)} ms-2">${item.status}</span>
                <br>
                <small class="text-muted">${time}</small>
                ${item.metadata?.error ? `<br><small class="text-danger">${item.metadata.error}</small>` : ''}
                ${item.metadata?.duration ? `<br><small class="text-muted">Duration: ${item.metadata.duration}ms</small>` : ''}
            </div>
        `;
    }).join('');
    
    timelineContainer.innerHTML = timelineHtml;
}

async function loadAgentLogs() {
    const agentName = document.getElementById('agent-log-selector').value;
    const logsContainer = document.getElementById('agent-logs');
    
    if (!agentName) {
        logsContainer.innerHTML = '<div class="text-center text-muted">Select an agent to view logs</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/agents/logs/${agentName}`);
        const data = await response.json();
        
        if (data.error) {
            logsContainer.innerHTML = `<div class="text-danger">Error: ${data.error}</div>`;
            return;
        }
        
        if (!data.logs || data.logs.length === 0) {
            logsContainer.innerHTML = '<div class="text-muted">No logs available</div>';
            return;
        }
        
        const logsHtml = data.logs.map(log => {
            const level = log.level || 'info';
            const levelClass = level === 'error' ? 'text-danger' : 
                             level === 'warning' ? 'text-warning' : 'text-info';
            return `
                <div class="mb-1">
                    <span class="${levelClass}">[${level.toUpperCase()}]</span>
                    <span class="text-muted">${log.timestamp}</span>
                    <br>
                    ${log.message}
                </div>
            `;
        }).join('');
        
        logsContainer.innerHTML = logsHtml;
    } catch (error) {
        logsContainer.innerHTML = '<div class="text-danger">Error loading logs</div>';
    }
}

async function triggerAgent(agentName) {
    if (!confirm(`Are you sure you want to trigger ${agentName}?`)) return;
    
    try {
        const response = await fetch('/api/agents/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentName })
        });
        const result = await response.json();
        
        if (result.success) {
            alert(`${agentName} triggered successfully`);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        alert(`Error triggering ${agentName}`);
    }
}

async function simulateExecution() {
    try {
        const response = await fetch('/api/agents/simulate', {
            method: 'POST'
        });
        alert('Simulation started - watch the hierarchy update!');
    } catch (error) {
        console.log('Starting local simulation');
        
        const agents = [
            'content-orchestrator',
            'content-strategist',
            'fatigue-checker',
            'content-generator',
            'image-creator',
            'compliance-validator',
            'distribution-manager'
        ];
        
        agents.forEach((agent, index) => {
            setTimeout(() => {
                updateAgentStatus({
                    agent,
                    status: 'processing',
                    timestamp: new Date().toISOString()
                });
                addToTimeline({
                    agent,
                    status: 'processing',
                    timestamp: new Date().toISOString()
                });
                
                setTimeout(() => {
                    updateAgentStatus({
                        agent,
                        status: 'completed',
                        timestamp: new Date().toISOString()
                    });
                    addToTimeline({
                        agent,
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        metadata: { duration: Math.floor(Math.random() * 3000) + 1000 }
                    });
                }, 2000);
            }, index * 3000);
        });
    }
}

function clearTimeline() {
    executionTimeline = [];
    renderTimeline();
}

function getStatusColor(status) {
    switch(status) {
        case 'processing': return 'primary';
        case 'completed': return 'success';
        case 'error': return 'danger';
        default: return 'secondary';
    }
}

document.addEventListener('DOMContentLoaded', initAgentMonitor);