# Send Grammy Content - Simple Direct Delivery

Execute this command to send Grammy-certified content from latest session directly to advisors via AiSensy (no webhook, no templates needed).

## Task

1. Find latest session in output/ directory
2. Load Grammy-certified content (LinkedIn + WhatsApp)
3. Send directly to 4 advisors via AiSensy text message API
4. Save delivery report

## Implementation

Use AiSensy's direct message API (not templates):
- Endpoint: `https://backend.aisensy.com/direct-messages/v1/text`
- No template approval needed
- Immediate delivery
- Plain text messages

## Requirements

- AISENSY_API_KEY must be in .env
- Content must exist in output/session_*/
- Use session with highest timestamp
