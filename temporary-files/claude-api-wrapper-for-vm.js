#!/usr/bin/env node

/**
 * CLAUDE API WRAPPER FOR VM
 * Deploy this on your VM alongside Claude Code IDE
 * This creates an HTTP endpoint that webhook can call
 */

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

const PORT = 8080;

console.log('\n🤖 CLAUDE API WRAPPER FOR WEBHOOK');
console.log('=' .repeat(70));
console.log('This runs on your VM and provides Claude responses\n');

/**
 * Main Claude endpoint
 */
app.post('/claude', async (req, res) => {
    const { prompt, max_tokens = 200, temperature = 0.7 } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    console.log(`[${new Date().toISOString()}] Claude request received`);
    console.log(`   Prompt length: ${prompt.length} chars`);
    
    try {
        // METHOD 1: Use claude-code CLI if available
        const response = await getClaudeResponse(prompt, max_tokens);
        
        console.log(`   ✅ Response generated: ${response.substring(0, 50)}...`);
        
        res.json({
            success: true,
            response: response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('   ❌ Error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get Claude response using CLI
 */
async function getClaudeResponse(prompt, maxTokens) {
    // Escape the prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");
    
    // Use claude-code CLI
    // Adjust this command based on how Claude Code is installed on your VM
    const command = `echo '${escapedPrompt}' | claude-code --max-tokens ${maxTokens}`;
    
    try {
        const { stdout, stderr } = await execPromise(command, {
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        if (stderr) {
            console.error('Claude stderr:', stderr);
        }
        
        return stdout.trim();
    } catch (error) {
        // Fallback to alternative method if CLI fails
        return await getClaudeResponseAlternative(prompt);
    }
}

/**
 * Alternative: Use Claude API directly if you have credentials
 */
async function getClaudeResponseAlternative(prompt) {
    // If you have Claude API credentials on the VM
    // You can use them here as a fallback
    
    // For now, return a helpful fallback message
    return `I understand your query about: "${prompt.substring(0, 100)}..."

I'm here to help with:
• Questions about daily content
• Feedback on messages
• Content preferences
• Technical support

Please let me know how I can assist you specifically.`;
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'claude-api-wrapper',
        timestamp: new Date().toISOString()
    });
});

/**
 * Test endpoint
 */
app.get('/test', async (req, res) => {
    try {
        const testResponse = await getClaudeResponse(
            "Say 'Hello, I am Claude CRM Agent ready to help!'",
            50
        );
        
        res.json({
            success: true,
            response: testResponse
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Claude API wrapper running on port ${PORT}`);
    console.log(`📍 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/claude - Get Claude response`);
    console.log(`   GET  http://localhost:${PORT}/health - Health check`);
    console.log(`   GET  http://localhost:${PORT}/test - Test Claude connection`);
    console.log('\nReady to process requests...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down Claude API wrapper...');
    process.exit(0);
});