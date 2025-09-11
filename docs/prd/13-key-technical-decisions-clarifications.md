# 13. Key Technical Decisions & Clarifications

## 13.1 Why DigitalOcean VM Instead of Local Machine
- **24/7 Availability:** VM runs continuously without interruption
- **Real-time Webhooks:** Always ready to receive instant triggers
- **No Local Dependencies:** Your computer can be off/sleeping
- **Professional Reliability:** No home internet/power issues
- **Cost Effective:** Only ₹500/month for complete infrastructure

## 13.2 Claude Code CLI vs API
- **Using CLI with Max Plan:** Leverages existing ₹1,650/month subscription
- **No Additional API Costs:** Would be ₹8,000+/month with API
- **Session Persistence:** One-time login, token lasts months
- **Full Feature Access:** All Claude capabilities available
- **Cost Advantage:** 80% cheaper than API approach

## 13.3 Process Independence & Monitoring
- **Processes Run Independently:** Everything happens whether you're watching or not
- **VS Code Remote is Observer:** Connect anytime to see what happened
- **Historical Logs:** All activities timestamped and stored
- **Multiple Monitoring Options:** VS Code, Web Dashboard, Terminal, Mobile
- **Interrupt Capability:** Can manually intervene anytime via VS Code

## 13.4 No Fallback Templates Policy
- **Quality Over Speed:** Auto-approval guardian regenerates until quality met
- **Iterative Improvement:** Up to 3 attempts with specific feedback
- **No Generic Content:** Every piece customized and validated
- **Continuous Learning:** System improves with each iteration

## 13.5 Evening Review Workflow Rationale
- **8:30 PM Review:** More practical than early morning
- **Single Core Review:** Review one template, not 30 variations
- **2-3 Minutes Only:** Efficient approval process
- **Real-time Revisions:** Changes processed in 30 seconds
- **Multiple Reviewers:** Backup reviewers if primary unavailable
