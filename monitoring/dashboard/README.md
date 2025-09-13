# FinAdvise Production Monitoring Dashboard

## Overview
Web-based monitoring dashboard and operations center for FinAdvise MVP. Provides real-time system health monitoring, agent execution visualization, advisor management, and content review capabilities.

## Features
- 🔐 Secure authentication with session management
- 📊 Real-time system health monitoring (CPU, memory, disk)
- 🤖 Live agent execution viewer with hierarchy visualization
- 👥 Advisor management interface (CRUD operations)
- 📝 Content approval dashboard
- 📈 Analytics and metrics tracking
- 🔍 Searchable error logs
- 💾 Backup/restore functionality with Google Drive integration
- 📱 Mobile-responsive design

## Installation

### Prerequisites
- Node.js 16+
- PM2 installed globally
- Google Sheets API credentials
- WhatsApp Business API credentials

### Setup
```bash
cd monitoring/dashboard
npm install

# Generate password hash for admin
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(h => console.log(h));"

# Set environment variables
export ADMIN_PASSWORD_HASH="<generated-hash>"
export GOOGLE_SHEET_ID="<your-sheet-id>"
export WHATSAPP_PHONE_NUMBER_ID="<your-phone-id>"
export WHATSAPP_ACCESS_TOKEN="<your-token>"
```

### Running Locally
```bash
# Development mode
npm run dev

# Production mode with PM2
pm2 start ecosystem.config.js
```

## Default Credentials
- Username: `admin`
- Password: `admin123`

**Important:** Change these in production!

## Access Points
- Dashboard: http://localhost:8080
- API Endpoints: http://localhost:8080/api/*
- WebSocket: ws://localhost:8080

## API Endpoints

### System Monitoring
- `GET /api/health` - System health status
- `GET /api/processes` - PM2 process list
- `GET /api/metrics` - Performance metrics

### Agent Management
- `GET /api/agents/status` - Agent status summary
- `GET /api/agents/hierarchy` - Agent hierarchy structure
- `GET /api/agents/logs/:agentName` - Agent-specific logs
- `POST /api/agents/trigger` - Manually trigger agent

### Advisor Management
- `GET /api/advisors` - List all advisors
- `POST /api/advisors` - Create new advisor
- `PUT /api/advisors/:id` - Update advisor
- `DELETE /api/advisors/:id` - Delete advisor

### Content Management
- `GET /api/content/pending` - Pending content for approval
- `POST /api/content/approve/:id` - Approve content
- `POST /api/content/reject/:id` - Reject content

### Logs & Backup
- `GET /api/logs` - Search and filter logs
- `GET /api/backup/list` - List available backups
- `POST /api/backup/create` - Create new backup
- `POST /api/backup/restore/:id` - Restore from backup

## WebSocket Events
The dashboard uses WebSocket for real-time updates:
- `agent-status-update` - Agent status changes
- `subscribe-agents` - Subscribe to agent updates

## Security
- Session-based authentication
- Password hashing with bcrypt
- HTTPS recommended for production
- Rate limiting on API endpoints

## Deployment on VM

### Using PM2
```bash
# Copy to VM
scp -r monitoring/dashboard user@vm-ip:/home/mvp/monitoring/

# On VM
cd /home/mvp/monitoring/dashboard
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Dashboard not loading
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs monitoring-dashboard`
- Verify port 8080 is not in use

### Authentication issues
- Regenerate password hash
- Check session secret is set
- Clear browser cookies

### No metrics showing
- Verify Google Sheets credentials
- Check WhatsApp API token
- Ensure log files exist in `/logs` directory

## Architecture
```
monitoring/dashboard/
├── server.js          # Main Express server
├── routes/
│   ├── api.js        # API endpoints
│   ├── auth.js       # Authentication
│   └── views.js      # Page routes
├── services/
│   ├── pm2-monitor.js     # PM2 integration
│   ├── metrics.js         # Metrics collection
│   ├── agent-monitor.js   # Agent monitoring
│   ├── advisor-service.js # Advisor management
│   ├── content-service.js # Content management
│   ├── log-service.js     # Log aggregation
│   └── backup.js          # Backup service
├── views/
│   ├── index.ejs     # Main dashboard
│   ├── agents.ejs    # Agent monitor
│   └── ...           # Other views
└── public/
    ├── css/          # Stylesheets
    └── js/           # Client-side scripts
```

## Support
For issues or questions, contact the development team.