# 7. Quality Assurance & Human Review

## 7.1 Content Review Workflow
**Evening Review (8:30 PM):**
- Content generated for next day
- Single core template + personalization samples
- Admin reviews via WhatsApp (2-3 minutes)
- Options: Approve / Request Changes / Skip

**Real-time Revisions:**
- Changes trigger instant webhook to VM
- Regeneration within 30 seconds
- Revised content sent back immediately
- Multiple revision cycles supported

## 7.2 Auto-Approval Guardian (After 11 PM)
**Iterative Improvement Process:**
- Activates if no manual approval by 11 PM
- Runs quality checks (fatigue, compliance, relevance)
- If any check fails, regenerates with specific feedback
- Maximum 3 regeneration attempts
- No fallback templates - ensures quality
- Logs all decisions for audit

## 7.3 Multiple Reviewers System
| Priority | Reviewer | Time Window | Escalation |
|----------|----------|-------------|------------|
| 1 | Primary Admin | 8:30-10:00 PM | Send to next |
| 2 | Backup Reviewer | 10:00-11:00 PM | Auto-approve |
| 3 | Auto-Guardian | After 11:00 PM | Iterative checks |
