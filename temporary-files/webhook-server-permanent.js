#!/usr/bin/env node

/**
 * Permanent WhatsApp Webhook Server
 * Production-ready solution for sending WhatsApp messages
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { WhatsAppService } = require('./agents/services/whatsapp-service');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize WhatsApp service
const whatsappService = new WhatsAppService();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'WhatsApp Webhook Server',
        timestamp: new Date().toISOString(),
        whatsapp: whatsappService.getStatus(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'FinAdvise WhatsApp Service',
        version: '2.0.0',
        endpoints: {
            '/': 'Service info',
            '/health': 'Health check',
            '/send': 'Send WhatsApp message (POST)',
            '/send-bulk': 'Send bulk messages (POST)',
            '/status': 'Get service status',
            '/advisors/send': 'Send to specific advisor (POST)'
        }
    });
});

// Send single WhatsApp message
app.post('/send', async (req, res) => {
    try {
        const { phone, message, advisor_name, advisor_arn } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and message are required'
            });
        }
        
        const result = await whatsappService.sendMessage(phone, message, {
            advisor_name,
            advisor_arn,
            source: 'webhook'
        });
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('Send error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send bulk messages
app.post('/send-bulk', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Messages array is required'
            });
        }
        
        const results = [];
        for (const msg of messages) {
            const result = await whatsappService.sendMessage(
                msg.phone,
                msg.message,
                msg.options || {}
            );
            results.push(result);
        }
        
        res.json({
            success: true,
            sent: results.length,
            results: results
        });
        
    } catch (error) {
        console.error('Bulk send error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Send to specific advisor
app.post('/advisors/send', async (req, res) => {
    try {
        const { advisor_arn } = req.body;
        
        if (!advisor_arn) {
            return res.status(400).json({
                success: false,
                error: 'Advisor ARN is required'
            });
        }
        
        // Load advisor data
        const advisors = await loadAdvisors();
        const advisor = advisors.find(a => a.arn === advisor_arn);
        
        if (!advisor) {
            return res.status(404).json({
                success: false,
                error: 'Advisor not found'
            });
        }
        
        // Generate message for advisor
        const message = await generateAdvisorMessage(advisor);
        
        // Send message
        const result = await whatsappService.sendMessage(
            advisor.whatsapp || advisor.phone,
            message,
            {
                advisor_name: advisor.name,
                advisor_arn: advisor.arn,
                segment: advisor.client_segment
            }
        );
        
        res.json({
            success: true,
            advisor: advisor.name,
            ...result
        });
        
    } catch (error) {
        console.error('Advisor send error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get service status
app.get('/status', (req, res) => {
    res.json({
        service: 'operational',
        whatsapp: whatsappService.getStatus(),
        timestamp: new Date().toISOString()
    });
});

// Load advisors from data
async function loadAdvisors() {
    // Your 3 initial advisors
    const initialAdvisors = [
        {
            arn: 'ARN_001',
            name: 'Shruti Petkar',
            phone: '9673758777',
            whatsapp: '919673758777',
            client_segment: 'families',
            tone: 'friendly',
            content_focus: 'balanced'
        },
        {
            arn: 'ARN_002',
            name: 'Shri Avalok Petkar',
            phone: '9765071249',
            whatsapp: '919765071249',
            client_segment: 'entrepreneurs',
            tone: 'professional',
            content_focus: 'growth'
        },
        {
            arn: 'ARN_003',
            name: 'Vidyadhar Petkar',
            phone: '8975758513',
            whatsapp: '918975758513',
            client_segment: 'retirees',
            tone: 'educational',
            content_focus: 'safety'
        }
    ];
    
    try {
        // Try to load from file if exists
        const dataFile = path.join(process.cwd(), 'data', 'advisors.json');
        const data = await fs.readFile(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        // Return initial advisors if file doesn't exist
        return initialAdvisors;
    }
}

// Generate personalized message for advisor
async function generateAdvisorMessage(advisor) {
    const templates = {
        families: `Dear ${advisor.name.split(' ')[0]},

📊 *Family Financial Planning Update*

Today's tip for growing your family's wealth:

✅ Start a SIP of ₹5,000/month - can grow to ₹25 lakhs in 15 years
✅ Ensure adequate term insurance coverage
✅ Build an emergency fund of 6 months expenses

*Market Update*: Sensex shows positive momentum

Would you like to discuss your family's financial goals?

Best regards,
Your Financial Advisor

_Mutual funds subject to market risks._`,

        entrepreneurs: `Dear ${advisor.name.split(' ')[0]},

📈 *Business Growth Investment Strategy*

Smart tips for business owners:

✅ Diversify 30% surplus to equity funds
✅ Save tax through ELSS investments
✅ Maintain liquidity for opportunities

*Market Alert*: Mid-cap funds showing strength!

Ready to optimize your investment strategy?

Best regards,
Your Investment Partner

_Investments subject to market risks._`,

        retirees: `Dear ${advisor.name.split(' ')[0]},

🛡️ *Retirement Security Update*

Safe investment options:

• Senior Citizen Scheme: 8.2% returns
• Debt Funds: Tax-efficient growth
• SWP: Regular income stream

*Update*: New tax benefits announced!

Need a portfolio review?

Warm regards,
Your Retirement Advisor

_Read all documents carefully._`
    };
    
    return templates[advisor.client_segment] || templates.families;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
================================================
WhatsApp Webhook Server Started
================================================
Port: ${PORT}
Time: ${new Date().toISOString()}
Status: Ready to send messages

Available endpoints:
- POST /send - Send single message
- POST /send-bulk - Send multiple messages
- POST /advisors/send - Send to specific advisor
- GET /status - Check service status
- GET /health - Health check

WhatsApp Service Status:
${JSON.stringify(whatsappService.getStatus(), null, 2)}
================================================
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});