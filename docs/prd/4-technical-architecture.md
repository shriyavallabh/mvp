# 4. Technical Architecture

## 4.1 Tech Stack
```yaml
Frontend:
  - Landing Page: HTML/JS on GitHub Pages (FREE)
  - Payment Gateway: Razorpay (2% transaction fee)

Backend:
  - Database: Google Sheets (FREE)
  - File Storage: Google Drive (15GB FREE)
  - Automation: Google Apps Script (FREE)
  - Hosting: DigitalOcean Droplet ($6/month)

Infrastructure:
  - VM Provider: DigitalOcean (1GB RAM, 25GB SSD)
  - Process Manager: PM2 for reliability
  - Webhook Server: Flask Python (real-time triggers)
  - Session Management: Persistent Claude CLI session

Content Engine:
  - Core: Claude Code CLI using Max Plan (₹1,650/month existing)
  - Image Generation: Google Gemini API (~₹20/month)
  - Distribution: WhatsApp Business API (~₹25/month)
  - No Additional API Keys: Uses existing Claude Max subscription
```

## 4.2 Claude Code Agent Architecture

```yaml
Master Command: /content-engine

Sub-Agents:
  1. advisor-manager:
     - CRUD operations for advisors
     - Subscription management
     - Bulk operations

  2. content-orchestrator:
     - Parent agent controlling workflow
     - Reads active advisors daily
     - Triggers sub-agents sequentially

  3. content-strategist:
     - Web scraping for trending topics
     - Viral content identification
     - Content calendar generation

  4. fatigue-checker:
     - Historical content analysis
     - Deduplication across advisors
     - Novelty scoring

  5. compliance-validator:
     - SEBI guidelines checking
     - Disclaimer addition
     - Risk statement validation

  6. content-generator:
     - Text generation using Claude Opus
     - Platform-specific formatting
     - Personalization layer

  7. image-creator:
     - Gemini API integration
     - Logo embedding
     - Brand color application

  8. distribution-manager:
     - WhatsApp formatting
     - Google Drive upload
     - Sheet updates

  9. analytics-tracker:
     - Performance monitoring
     - A/B testing
     - Engagement tracking

  10. backup-restore:
      - Daily backups
      - Version control
      - Emergency rollback
      
  11. approval-guardian:
      - Auto-approval after 11 PM
      - Iterative content improvement
      - Quality scoring (no fallbacks)
      - Re-triggers generation until satisfied
      
  12. revision-handler:
      - Real-time change processing
      - Instant webhook triggers
      - Regenerates based on feedback
      - Sends revised for approval
```

## 4.3 Data Architecture

### 4.3.1 Google Sheets Structure

**Sheet 1: Advisor_Master**
```
| ARN | Name | WhatsApp | Email | Logo_URL | Brand_Colors | Tone | Client_Segment | Ticket_Size | Content_Focus | Status | Payment_Mode | Payment_Date | Subscription_End | Review_Mode | Auto_Send | Override | Notes |
```

**Sheet 2: Content_Queue**
```
| Date | ARN | Topic | Priority | Custom_Content | Skip_Reason | Approved |
```

**Sheet 3: Content_History**
```
| Date | ARN | Topic | Content_Hash | WhatsApp_Img | WhatsApp_Text | LinkedIn_Post | Status_Img | Drive_Folder | Performance |
```

**Sheet 4: Template_Library**
```
| Template_ID | Category | Title | Last_Used | Performance_Score | Compliance_Status | Version |
```

**Sheet 5: Analytics**
```
| Date | ARN | Messages_Sent | Delivered | Variant | Engagement_Score | Feedback |
```

### 4.3.2 Google Drive Structure
```
Content_Engine_Drive/
├── Advisor_Assets/
│   ├── ARN_12345/
│   │   ├── logo.png
│   │   ├── brand_guide.json
│   │   └── preferences.yaml
├── Generated_Content/
│   ├── 2025-01-15/
│   │   ├── ARN_12345/
│   │   │   ├── whatsapp_image.png
│   │   │   ├── whatsapp_text.txt
│   │   │   ├── linkedin_post.md
│   │   │   └── status_image.png
├── Templates/
│   ├── evergreen/
│   ├── seasonal/
│   └── compliance/
└── Backups/
    └── daily/
```

## 4.4 Workflow Architecture

```yaml
Evening Review Workflow (8:30 PM):
1. PM2 cron triggers /content-engine --generate
2. Orchestrator reads active advisors from Google Sheets
3. Content generation for all advisors:
   a. Fatigue-checker analyzes last 30 days
   b. Content-strategist selects viral topic
   c. Core content template created
   d. Sample personalizations generated
4. Review package sent to admin WhatsApp
5. Admin reviews and approves/requests changes

Real-time Revision Flow (8:30-11:00 PM):
1. Admin replies with changes via WhatsApp
2. Google Apps Script captures response instantly
3. Webhook triggers revision-handler on VM
4. Content regenerated within 30 seconds
5. Revised version sent back for approval

Auto-Approval Flow (11:00 PM):
1. If no admin response by 11 PM
2. Approval-guardian agent activates
3. Iterative quality checks (max 3 attempts):
   - Fatigue score > 0.8
   - Compliance score = 1.0
   - Quality score > 0.8
   - Relevance score > 0.8
4. If any check fails, regenerates with feedback
5. No fallback templates - keeps improving
6. Final approval logged

Morning Distribution (5:00 AM):
1. PM2 cron triggers /content-engine --distribute
2. Reads approved content from sheets
3. Personalizes for each advisor
4. Sends to all advisors via WhatsApp
5. Updates analytics and history
```

## 4.5 Deployment Architecture

```yaml
DigitalOcean VM Setup:
  - OS: Ubuntu 22.04 LTS
  - RAM: 1GB
  - Storage: 25GB SSD
  - Location: Bangalore (low latency)
  - Cost: $6/month (₹500)
  
Software Stack:
  - Node.js 20.x for Claude CLI
  - Python 3.10 for webhook server
  - PM2 for process management
  - VS Code Remote-SSH for monitoring
  
File Structure on VM:
  /home/mvp/
  ├── agents/           # All .md agent files
  ├── webhook_server.py # Real-time trigger handler
  ├── ecosystem.config.js # PM2 configuration
  ├── monitor_dashboard.py # Web monitoring
  ├── logs/            # All execution logs
  ├── data/            # Advisor data
  └── .claude/         # Session credentials

Process Management:
  - PM2 keeps all processes alive 24/7
  - Auto-restart on crash
  - Cron-based scheduling
  - Everything runs independently of local machine
  
Security:
  - UFW firewall (ports 22, 5000, 8080)
  - SSH key authentication
  - Automated security updates
  - Session token encryption
```

## 4.6 Monitoring & Control Architecture

```yaml
VS Code Remote Monitoring:
  Purpose: Real-time observation and manual intervention
  
  Connection Method:
    1. Install Remote-SSH extension locally
    2. Connect to VM via SSH
    3. Full IDE experience on VM
    4. Can interrupt/debug anytime
  
  What You See:
    - Live process execution
    - Real-time logs
    - Can manually trigger agents
    - Debug webhook server
    - Edit agents on-the-fly
  
  Process Persistence:
    - Processes run whether VS Code connected or not
    - Connect anytime to see historical logs
    - All activities logged with timestamps
    - Can review what happened hours/days ago

Web Dashboard (http://VM_IP:8080):
  - Auto-refreshes every 10 seconds
  - Shows process status
  - Recent logs display
  - Health checks
  - Accessible from any device

Terminal Monitoring (Local Machine):
  - SSH-based status checks
  - Runs independently
  - Shows PM2 process status
  - Recent activity logs

Mobile Monitoring:
  - Via Terminus/Termux apps
  - Quick status checks
  - Emergency interventions
```

---
