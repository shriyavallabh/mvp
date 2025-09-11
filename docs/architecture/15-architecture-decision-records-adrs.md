# 15. Architecture Decision Records (ADRs)

## ADR-001: Use Claude Code CLI instead of API
**Status:** Accepted  
**Context:** Need to minimize costs while maintaining functionality  
**Decision:** Use CLI with existing Max subscription  
**Consequences:** 80% cost savings, some complexity in session management  

## ADR-002: Google Sheets as primary database
**Status:** Accepted  
**Context:** Need simple, cost-effective data management  
**Decision:** Use Google Sheets for MVP, plan migration path  
**Consequences:** Zero cost, easy management, scaling limitations  

## ADR-003: No fallback templates
**Status:** Accepted  
**Context:** Quality over speed in auto-approval  
**Decision:** Regenerate until quality standards met  
**Consequences:** Better content quality, slightly longer processing  

## ADR-004: Single VM deployment
**Status:** Accepted  
**Context:** MVP needs to be cost-effective  
**Decision:** Deploy everything on one $6/month VM  
**Consequences:** Simple management, limited scalability  

---
