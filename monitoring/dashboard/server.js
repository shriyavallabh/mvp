const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const ejs = require('ejs');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

// Story 3.2 Integration: WebSocket Server for real-time updates
const WebSocketServer = require('./services/websocket-server');

// Story 4.3 Integration: WhatsApp Web-Style Interface
const WhatsAppInterface = require('../whatsapp-interface/server');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'finadvise-dashboard-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const authMiddleware = (req, res, next) => {
  if (!req.session.user && !req.path.startsWith('/auth')) {
    return res.redirect('/auth/login');
  }
  next();
};

app.use('/auth', authRoutes);

app.use(authMiddleware);

app.use('/api', apiRoutes);
app.use('/', viewRoutes);

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('subscribe-agents', () => {
    socket.join('agent-updates');
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

global.io = io;

// Initialize Story 3.2 WebSocket server for real-time webhook monitoring
let webhookWsServer = null;
try {
  webhookWsServer = new WebSocketServer(3001);
  console.log('🔌 Story 3.2 WebSocket server initialized on port 3001');
  
  // Start event simulation for demonstration
  setTimeout(() => {
    if (webhookWsServer) {
      webhookWsServer.startEventSimulation();
    }
  }, 5000); // Start simulation after 5 seconds
  
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
}

// Initialize Story 4.3 WhatsApp Web-Style Interface
let whatsappInterface = null;
try {
  whatsappInterface = new WhatsAppInterface(app, io);
  console.log('💬 Story 4.3 WhatsApp interface initialized');
} catch (error) {
  console.error('❌ Failed to initialize WhatsApp interface:', error);
}

server.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
  console.log(`Access dashboard at http://localhost:${PORT}`);
  console.log('');
  console.log('🔗 Story 3.2 Integration Active:');
  console.log('  📊 Real-time webhook monitoring enabled');
  console.log('  📈 Button analytics tracking active');
  console.log('  💬 CRM chat interaction monitoring enabled');
  console.log('  📡 WebSocket server: ws://localhost:3001/ws');
  console.log('');
  console.log('💬 Story 4.3 WhatsApp Interface Active:');
  console.log('  🗨️ WhatsApp Web-style interface: http://localhost:8080/whatsapp');
  console.log('  📱 Real-time message synchronization enabled');
  console.log('  📤 Send/receive messages with advisors');
  console.log('  📊 Export conversations to PDF/CSV/JSON');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔌 Shutting down servers...');
  if (webhookWsServer) {
    webhookWsServer.stop();
  }
  server.close(() => {
    console.log('✅ Servers shut down gracefully');
    process.exit(0);
  });
});

module.exports = { app, server, io, webhookWsServer };