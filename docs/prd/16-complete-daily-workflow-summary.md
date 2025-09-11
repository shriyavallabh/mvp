# 16. Complete Daily Workflow Summary

## 16.1 Automated Daily Flow
```
8:30 PM - Evening Content Generation
├── PM2 triggers /content-engine on VM
├── Generates content for all advisors
├── Creates single review package
├── Sends to admin WhatsApp
└── Waits for response

8:30-11:00 PM - Review Window
├── Admin reviews on phone (2-3 min)
├── Options: Approve / Change / Skip
├── If changes requested:
│   ├── Webhook triggers instantly
│   ├── VM regenerates in 30 seconds
│   └── Sends revised for approval
└── Multiple reviewers supported

11:00 PM - Auto-Approval
├── If no manual approval received
├── Approval-guardian activates
├── Iterative quality checks
├── Regenerates if needed (no fallbacks)
└── Logs final approval

5:00 AM - Morning Distribution
├── PM2 triggers distribution
├── Reads approved content
├── Sends to all advisors
└── Updates analytics
```

## 16.2 Manual Intervention Points
- **Any time:** Connect VS Code Remote to VM
- **See logs:** `pm2 logs` shows everything
- **Manual trigger:** `claude /agent-name`
- **Debug:** Set breakpoints in webhook
- **Override:** Direct database edits

## 16.3 Monitoring Options
1. **VS Code Remote:** Full IDE control
2. **Web Dashboard:** http://VM_IP:8080
3. **Terminal:** SSH status checks
4. **Mobile:** Terminus/Termux apps
5. **Alerts:** WhatsApp notifications
