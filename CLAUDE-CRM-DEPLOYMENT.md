# 🤖 CLAUDE-POWERED CRM AGENT DEPLOYMENT

## Architecture Overview

```
Advisor → WhatsApp → Webhook → Message Router
                                      ↓
                              [Button Click] → Content Delivery
                              [Text Message] → Claude CRM Agent
                                                     ↓
                                              Claude Code on VM
                                                     ↓
                                              Intelligent Response
```

## Benefits of This Approach

1. **ZERO API COSTS** - Uses Claude Code already on your VM
2. **Intelligent Responses** - Claude understands context and provides helpful answers
3. **CRM Functionality** - Tracks preferences, handles feedback, provides support
4. **Differentiated Handling**:
   - Button clicks → Immediate content delivery
   - Text messages → AI-powered responses
5. **Conversation Memory** - Maintains context across messages

## Files to Deploy

### On Your Local/Cloud Server (Webhook Handler):
- `claude-crm-agent-handler.js` - Main webhook that routes messages

### On Your VM (Where Claude Code Lives):
- `claude-api-wrapper-for-vm.js` - HTTP wrapper for Claude Code

## Deployment Steps

### Step 1: Deploy Claude Wrapper on VM

```bash
# SSH into your VM
ssh user@your-vm-ip

# Copy the wrapper file
nano claude-api-wrapper-for-vm.js
# Paste the content

# Install dependencies
npm install express

# Start with PM2 for persistence
pm2 start claude-api-wrapper-for-vm.js --name claude-api
pm2 save
pm2 startup
```

### Step 2: Test Claude on VM

```bash
# Test the endpoint
curl -X POST http://localhost:8080/claude \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, test response please"}'

# Should return Claude's response
```

### Step 3: Update Webhook Handler

Edit `claude-crm-agent-handler.js`:
```javascript
const CONFIG = {
    // ... other config
    vmClaudeEndpoint: 'http://YOUR_VM_IP:8080/claude' // Update this
};
```

### Step 4: Deploy Webhook Handler

```bash
# On your webhook server
pm2 stop all
pm2 start claude-crm-agent-handler.js --name crm-webhook
pm2 save
```

### Step 5: Test Complete Flow

1. Send a text message to your WhatsApp number
2. Watch webhook logs: `pm2 logs crm-webhook`
3. Should see: Message → Claude → Response

## Message Routing Logic

```javascript
if (message.type === 'interactive') {
    // BUTTON CLICK
    if (buttonId.includes('UNLOCK')) {
        deliverContent();  // Send marketing materials
    }
} else if (message.type === 'text') {
    // TEXT MESSAGE
    const claudeResponse = await askClaude(message.text);
    sendMessage(claudeResponse);  // Send AI response
}
```

## Example Interactions

### Advisor: "I don't like today's content"
**Claude Response:**
"I understand you're not satisfied with today's content. What type of financial insights would be more valuable for you? Would you prefer:
• More technical analysis
• Client acquisition strategies
• Tax planning updates
• Product comparisons
Let me know and I'll customize tomorrow's content."

### Advisor: "Send me mutual fund analysis"
**Claude Response:**
"I'll arrange for mutual fund analysis in your next update. You'll receive:
• Top performing funds
• Category-wise comparisons
• Risk-return metrics
• SIP recommendations
This will be included in tomorrow's morning update."

### Advisor: "Stop messages"
**Claude Response:**
"I understand. I've noted your preference to pause daily updates. You can restart anytime by sending 'START'. If you'd like less frequent updates instead (weekly/monthly), just let me know."

## Monitoring

```bash
# Watch webhook logs
pm2 logs crm-webhook --lines 100

# Watch Claude API logs
pm2 logs claude-api --lines 100

# Check status
pm2 status

# Monitor conversations
pm2 monit
```

## Cost Analysis

### Traditional Approach:
- Gemini API: $0.002 per message
- OpenAI GPT-4: $0.03 per 1K tokens
- Monthly cost for 1000 advisors: ~$60-600

### Your Approach:
- Claude Code on VM: $0 (already running)
- No external API calls
- Only infrastructure cost

## Production Checklist

- [ ] Claude Code installed and working on VM
- [ ] PM2 managing all processes
- [ ] Webhook handler routing correctly
- [ ] Claude wrapper responding to requests
- [ ] Message differentiation working
- [ ] Context persistence implemented
- [ ] Error handling in place
- [ ] Monitoring active

## Troubleshooting

### Claude not responding:
```bash
# Check if Claude Code is installed
which claude-code

# Test Claude directly
echo "test" | claude-code

# Check wrapper logs
pm2 logs claude-api
```

### Messages not routing:
```bash
# Check webhook logs
pm2 logs crm-webhook

# Test webhook health
curl http://localhost:3000/health
```

### Slow responses:
- Add caching for common questions
- Reduce max_tokens for faster responses
- Use async processing for non-urgent queries

## Future Enhancements

1. **Advisor Profiles**: Store preferences, language, content topics
2. **Scheduled Responses**: Queue non-urgent responses
3. **Analytics**: Track common questions, satisfaction
4. **Multi-language**: Hindi, regional language support
5. **Voice Notes**: Transcribe and respond to voice messages

This architecture gives you an intelligent CRM agent with ZERO API costs!