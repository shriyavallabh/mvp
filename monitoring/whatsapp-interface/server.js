// WhatsApp Interface Server Extension for Story 4.2 Dashboard
const express = require('express');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Initialize services with error handling
let MessageStore, WhatsAppSync, exportService;
try {
    MessageStore = require('./services/message-store');
    WhatsAppSync = require('./services/whatsapp-sync');
    exportService = require('./services/export');
} catch (error) {
    console.error('Warning: Some WhatsApp services not fully loaded:', error.message);
}

class WhatsAppInterface {
    constructor(app, io) {
        this.app = app;
        this.io = io;
        this.router = express.Router();
        
        try {
            if (MessageStore) {
                this.messageStore = new MessageStore();
            }
            if (WhatsAppSync && this.messageStore) {
                this.whatsappSync = new WhatsAppSync(this.messageStore);
            }
        } catch (error) {
            console.error('Error initializing WhatsApp services:', error);
        }
        
        this.setupRoutes();
        if (this.io && this.whatsappSync) {
            this.setupWebSocket();
        }
        if (this.whatsappSync) {
            this.initializeSync();
        }
    }
    
    setupRoutes() {
        // Serve static files
        this.router.use('/css', express.static(path.join(__dirname, 'public/css')));
        this.router.use('/js', express.static(path.join(__dirname, 'public/js')));
        
        // Main WhatsApp interface view
        this.router.get('/', (req, res) => {
            res.render(path.join(__dirname, 'views/whatsapp'), {
                user: req.session.user
            });
        });
        
        // API Routes
        
        // Get all advisors
        this.router.get('/api/advisors', async (req, res) => {
            try {
                if (!this.messageStore) {
                    return res.json([]); // Return empty array if service not available
                }
                const advisors = await this.messageStore.getAdvisors();
                res.json(advisors);
            } catch (error) {
                console.error('Error fetching advisors:', error);
                res.json([]); // Return empty array on error
            }
        });
        
        // Get conversation for an advisor
        this.router.get('/api/conversations/:advisorId', async (req, res) => {
            try {
                const { advisorId } = req.params;
                const limit = parseInt(req.query.limit) || 100;
                const offset = parseInt(req.query.offset) || 0;
                
                const messages = await this.messageStore.getConversation(advisorId, limit, offset);
                res.json(messages);
            } catch (error) {
                console.error('Error fetching conversation:', error);
                res.status(500).json({ error: 'Failed to fetch conversation' });
            }
        });
        
        // Send text message
        this.router.post('/api/messages/send', async (req, res) => {
            try {
                const { advisor_id, phone, content, type } = req.body;
                
                const result = await this.whatsappSync.sendMessage(
                    advisor_id,
                    phone,
                    content,
                    type || 'text'
                );
                
                res.json(result);
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).json({ error: 'Failed to send message' });
            }
        });
        
        // Send media message
        this.router.post('/api/messages/send-media', async (req, res) => {
            try {
                // Handle file upload with multer (to be implemented)
                const { advisor_id, phone } = req.body;
                const file = req.file;
                
                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }
                
                // Upload file and get URL
                const mediaUrl = await this.uploadMedia(file);
                
                const result = await this.whatsappSync.sendMessage(
                    advisor_id,
                    phone,
                    file.originalname,
                    file.mimetype.startsWith('image/') ? 'image' : 'document',
                    mediaUrl
                );
                
                res.json(result);
            } catch (error) {
                console.error('Error sending media:', error);
                res.status(500).json({ error: 'Failed to send media' });
            }
        });
        
        // Mark messages as read
        this.router.post('/api/messages/mark-read', async (req, res) => {
            try {
                const { advisor_id } = req.body;
                await this.messageStore.markMessagesAsRead(advisor_id);
                res.json({ success: true });
            } catch (error) {
                console.error('Error marking messages as read:', error);
                res.status(500).json({ error: 'Failed to mark messages as read' });
            }
        });
        
        // Search messages
        this.router.get('/api/messages/search', async (req, res) => {
            try {
                const { query, advisor_id } = req.query;
                const results = await this.messageStore.searchMessages(query, advisor_id);
                res.json(results);
            } catch (error) {
                console.error('Error searching messages:', error);
                res.status(500).json({ error: 'Failed to search messages' });
            }
        });
        
        // Export conversation
        this.router.get('/api/export/:advisorId', async (req, res) => {
            try {
                const { advisorId } = req.params;
                const { format } = req.query;
                
                const advisor = await this.messageStore.getAdvisor(advisorId);
                const messages = await this.messageStore.getConversation(advisorId, 1000);
                
                let result;
                let contentType;
                let filename;
                
                switch (format) {
                    case 'pdf':
                        result = await exportService.exportToPDF(advisor, messages);
                        contentType = 'application/pdf';
                        filename = `conversation_${advisor.name}_${Date.now()}.pdf`;
                        break;
                        
                    case 'csv':
                        result = await exportService.exportToCSV(advisor, messages);
                        contentType = 'text/csv';
                        filename = `conversation_${advisor.name}_${Date.now()}.csv`;
                        break;
                        
                    case 'json':
                        result = JSON.stringify({ advisor, messages }, null, 2);
                        contentType = 'application/json';
                        filename = `conversation_${advisor.name}_${Date.now()}.json`;
                        break;
                        
                    default:
                        return res.status(400).json({ error: 'Invalid export format' });
                }
                
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.send(result);
            } catch (error) {
                console.error('Error exporting conversation:', error);
                res.status(500).json({ error: 'Failed to export conversation' });
            }
        });
        
        // Send broadcast message
        this.router.post('/api/broadcast', async (req, res) => {
            try {
                const { advisor_ids, content, type, media_url } = req.body;
                
                const results = await this.whatsappSync.sendBroadcast(
                    advisor_ids,
                    content,
                    type || 'text',
                    media_url
                );
                
                res.json({ success: true, results });
            } catch (error) {
                console.error('Error sending broadcast:', error);
                res.status(500).json({ error: 'Failed to send broadcast' });
            }
        });
        
        // Get message statistics
        this.router.get('/api/stats', async (req, res) => {
            try {
                const { advisor_id } = req.query;
                const stats = await this.messageStore.getMessageStats(advisor_id);
                res.json(stats);
            } catch (error) {
                console.error('Error fetching stats:', error);
                res.status(500).json({ error: 'Failed to fetch statistics' });
            }
        });
        
        // Mount router
        this.app.use('/whatsapp', this.router);
    }
    
    setupWebSocket() {
        // Set up WebSocket namespace for WhatsApp interface
        const whatsappNamespace = this.io.of('/whatsapp');
        
        whatsappNamespace.on('connection', (socket) => {
            console.log('Client connected to WhatsApp interface');
            
            // Join conversation room
            socket.on('join_conversation', (data) => {
                socket.join(`advisor_${data.advisor_id}`);
                console.log(`Client joined conversation: ${data.advisor_id}`);
            });
            
            // Handle message sending via WebSocket
            socket.on('send_message', async (data) => {
                try {
                    const result = await this.whatsappSync.sendMessage(
                        data.advisor_id,
                        data.phone,
                        data.content,
                        data.type || 'text',
                        data.media_url
                    );
                    
                    socket.emit('message_sent', result);
                } catch (error) {
                    socket.emit('message_error', { error: error.message });
                }
            });
            
            // Handle typing indicator
            socket.on('typing', (data) => {
                socket.to(`advisor_${data.advisor_id}`).emit('typing', data);
            });
            
            // Handle search
            socket.on('search', async (data) => {
                try {
                    const results = await this.messageStore.searchMessages(
                        data.query,
                        data.advisor_id
                    );
                    socket.emit('search_results', results);
                } catch (error) {
                    socket.emit('search_error', { error: error.message });
                }
            });
            
            // Mark messages as read
            socket.on('mark_read', async (data) => {
                try {
                    await this.messageStore.markMessagesAsRead(data.advisor_id);
                    socket.emit('marked_read', { advisor_id: data.advisor_id });
                } catch (error) {
                    console.error('Error marking as read:', error);
                }
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected from WhatsApp interface');
            });
        });
        
        // Forward events from WhatsApp sync to clients
        this.whatsappSync.on('new_message', (data) => {
            whatsappNamespace.to(`advisor_${data.advisor_id}`).emit('new_message', data);
            whatsappNamespace.emit('advisor_update', data); // Update advisor list
        });
        
        this.whatsappSync.on('status_update', (data) => {
            whatsappNamespace.emit('status_update', data);
        });
        
        this.whatsappSync.on('button_click', (data) => {
            whatsappNamespace.emit('button_click', data);
        });
    }
    
    async initializeSync() {
        try {
            // Load advisors from Google Sheets on startup
            await this.whatsappSync.loadAdvisorsFromSheets();
            
            // Set up periodic data retention cleanup (run daily)
            setInterval(() => {
                this.messageStore.deleteOldMessages(90);
            }, 24 * 60 * 60 * 1000);
            
            console.log('WhatsApp interface initialized successfully');
        } catch (error) {
            console.error('Error initializing WhatsApp interface:', error);
        }
    }
    
    async uploadMedia(file) {
        // TODO: Implement media upload to cloud storage
        // For now, return a placeholder URL
        return `https://example.com/media/${file.filename}`;
    }
}

module.exports = WhatsAppInterface;