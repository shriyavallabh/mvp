# 6. Security Architecture

## 6.1 Authentication & Authorization
```yaml
Levels:
  System_Level:
    - SSH key authentication for VM
    - Session token for Claude CLI
    - Environment variables for secrets
    
  API_Level:
    - OAuth 2.0 for Google Services
    - Bearer tokens for WhatsApp
    - API keys for Gemini
    
  Application_Level:
    - Admin authentication via WhatsApp number
    - Reviewer roles in Google Sheets
    - Agent-level permissions
```

## 6.2 Data Security
```yaml
Encryption:
  at_rest:
    - Google Drive: AES-256
    - VM storage: LUKS encryption
    - Credentials: Encrypted env vars
    
  in_transit:
    - HTTPS for all API calls
    - SSH for VM access
    - TLS 1.3 for webhooks
    
Data_Privacy:
  - PII handling: Minimal collection
  - Data retention: 90 days
  - Right to deletion: Supported
  - Audit logs: Immutable
```

## 6.3 Secret Management
```bash
# Environment Variables Structure
CLAUDE_SESSION_TOKEN=encrypted_token
GOOGLE_SHEETS_API_KEY=encrypted_key
WHATSAPP_BEARER_TOKEN=encrypted_token
GEMINI_API_KEY=encrypted_key
WEBHOOK_SECRET=random_string
ADMIN_WHATSAPP_NUMBERS=encrypted_list
```

---
