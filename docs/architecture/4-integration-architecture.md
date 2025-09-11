# 4. Integration Architecture

## 4.1 Google Sheets Integration
```yaml
Connection:
  type: Google Apps Script + API
  authentication: OAuth 2.0
  rate_limits: 100 requests/100 seconds
  
Operations:
  READ:
    - Get active advisors
    - Fetch content history
    - Load templates
  WRITE:
    - Update content status
    - Log analytics
    - Record approvals
  TRIGGER:
    - On form submission
    - On cell edit
    - Scheduled functions
    
Data_Sync:
  strategy: EVENTUAL_CONSISTENCY
  cache_ttl: 300 seconds
  conflict_resolution: LAST_WRITE_WINS
```

## 4.2 WhatsApp Business API Integration
```yaml
Connection:
  endpoint: https://api.whatsapp.com/v1/
  authentication: Bearer Token
  rate_limits:
    messages_per_second: 80
    messages_per_day: 100000
    
Message_Types:
  template_message:
    - Content notification
    - Review request
  media_message:
    - Image attachment
    - Document sharing
    
Error_Handling:
  retry_strategy: EXPONENTIAL_BACKOFF
  max_retries: 5
  fallback: Email notification
```

## 4.3 Gemini API Integration
```yaml
Connection:
  endpoint: https://generativelanguage.googleapis.com/v1/
  model: gemini-pro-vision
  authentication: API Key
  
Image_Generation:
  input:
    - Text prompt
    - Style parameters
    - Brand guidelines
  output:
    format: PNG
    resolution: 1080x1080
    color_mode: RGB
    
Rate_Management:
  daily_quota: 10000
  requests_per_minute: 60
  caching: Enabled (24 hours)
```

## 4.4 Webhook Architecture
```python
# Flask Webhook Server Structure
@app.route('/trigger', methods=['POST'])
def handle_trigger():
    """
    Receives real-time triggers from Google Apps Script
    """
    payload = request.json
    action = payload.get('action')
    
    if action == 'revise':
        trigger_agent('revision-handler', payload)
    elif action == 'approve':
        update_approval_status(payload)
    
    return jsonify({'status': 'processed'}), 200

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health endpoint for monitoring
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_processes': get_active_processes()
    }), 200
```

---
