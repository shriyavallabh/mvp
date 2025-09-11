# 12. Technology Decisions

## 12.1 Why Claude Code CLI over API
- **Cost Efficiency:** Leverages existing ₹1,650/month subscription vs ₹8,000+ for API
- **Full Features:** Access to all Claude capabilities
- **Session Persistence:** One-time authentication lasting months
- **No Rate Limits:** Unlimited within Max plan constraints

## 12.2 Why Google Sheets as Database
- **Zero Cost:** Free tier sufficient for 10,000 advisors
- **Easy Management:** Non-technical team can manage data
- **Built-in UI:** No admin panel needed
- **Real-time Sync:** Native Google integration
- **Migration Path:** Easy export to SQL when needed

## 12.3 Why DigitalOcean over AWS/GCP
- **Simplicity:** Straightforward pricing and setup
- **Cost:** Predictable $6/month pricing
- **Performance:** Sufficient for current scale
- **Location:** Bangalore datacenter for low latency
- **Support:** Good documentation and community

## 12.4 Why PM2 over Kubernetes
- **Complexity:** K8s overkill for current scale
- **Cost:** No orchestration overhead
- **Maintenance:** Simple process management
- **Monitoring:** Built-in dashboard and logs
- **Future Path:** Can migrate to K8s at 5000+ users

---
