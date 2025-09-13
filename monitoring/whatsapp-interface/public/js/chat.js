// WhatsApp Interface Client-Side JavaScript

class WhatsAppInterface {
    constructor() {
        this.socket = null;
        this.currentAdvisor = null;
        this.advisors = new Map();
        this.messages = new Map();
        this.initializeElements();
        this.initializeSocketConnection();
        this.bindEvents();
        this.loadAdvisors();
    }
    
    initializeElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.advisorList = document.getElementById('advisorList');
        this.searchInput = document.getElementById('searchInput');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.filterBtn = document.getElementById('filterBtn');
        this.broadcastBtn = document.getElementById('broadcastBtn');
        
        // Chat elements
        this.emptyChat = document.getElementById('emptyChat');
        this.chatContent = document.getElementById('chatContent');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.chatName = document.getElementById('chatName');
        this.chatStatus = document.getElementById('chatStatus');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.attachmentBtn = document.getElementById('attachmentBtn');
        this.fileInput = document.getElementById('fileInput');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Export elements
        this.exportBtn = document.getElementById('exportBtn');
        this.exportModal = document.getElementById('exportModal');
        this.searchChatBtn = document.getElementById('searchChatBtn');
        this.moreBtn = document.getElementById('moreBtn');
    }
    
    initializeSocketConnection() {
        // Connect to WebSocket server - check if Socket.io is available
        if (typeof io !== 'undefined') {
            try {
                this.socket = io('/whatsapp', {
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000
                });
            } catch (error) {
                console.log('WebSocket connection not available, running in offline mode');
                this.socket = null;
            }
        } else {
            console.log('Socket.io not loaded, running in offline mode');
            this.socket = null;
        }
        
        // Socket event listeners - only if socket is available
        if (this.socket) {
            this.socket.on('connect', () => {
                console.log('Connected to WebSocket server');
                this.showNotification('Connected to server', 'success');
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket server');
                this.showNotification('Disconnected from server', 'error');
            });
            
            this.socket.on('new_message', (data) => {
                this.handleNewMessage(data);
            });
            
            this.socket.on('status_update', (data) => {
                this.handleStatusUpdate(data);
            });
            
            this.socket.on('typing', (data) => {
                this.handleTypingIndicator(data);
            });
            
            this.socket.on('advisor_online', (data) => {
                this.updateAdvisorStatus(data);
            });
        }
    }
    
    bindEvents() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.filterAdvisors(e.target.value);
        });
        
        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.loadAdvisors();
            this.showNotification('Advisors refreshed', 'success');
        });
        
        // Filter button
        this.filterBtn.addEventListener('click', () => {
            this.showFilterOptions();
        });
        
        // Broadcast button
        this.broadcastBtn.addEventListener('click', () => {
            this.openBroadcastModal();
        });
        
        // Message input
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.emitTyping();
        });
        
        // Send button
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Attachment button
        this.attachmentBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.sendMediaMessage(e.target.files[0]);
            }
        });
        
        // Export button
        this.exportBtn.addEventListener('click', () => {
            this.exportModal.classList.add('active');
        });
        
        // Export format buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportConversation(format);
            });
        });
        
        // Search in chat
        this.searchChatBtn.addEventListener('click', () => {
            this.searchInChat();
        });
        
        // More options
        this.moreBtn.addEventListener('click', () => {
            this.showMoreOptions();
        });
    }
    
    async loadAdvisors() {
        try {
            const response = await fetch('/whatsapp/api/advisors');
            const advisors = await response.json();
            
            this.advisors.clear();
            this.advisorList.innerHTML = '';
            
            advisors.forEach(advisor => {
                this.advisors.set(advisor.id, advisor);
                this.renderAdvisor(advisor);
            });
        } catch (error) {
            console.error('Error loading advisors:', error);
            this.showNotification('Failed to load advisors', 'error');
        }
    }
    
    renderAdvisor(advisor) {
        const advisorElement = document.createElement('div');
        advisorElement.className = 'advisor-item';
        advisorElement.dataset.advisorId = advisor.id;
        
        const lastMessage = advisor.lastMessage || 'No messages yet';
        const lastTime = advisor.lastTime ? this.formatTime(advisor.lastTime) : '';
        const unreadCount = advisor.unreadCount || 0;
        
        advisorElement.innerHTML = `
            <div class="advisor-avatar">${this.getInitials(advisor.name)}</div>
            <div class="advisor-info">
                <div class="advisor-name">${advisor.name}</div>
                <div class="advisor-last-message">${this.truncateMessage(lastMessage)}</div>
            </div>
            <div class="advisor-meta">
                ${lastTime ? `<span class="advisor-time">${lastTime}</span>` : ''}
                ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
            </div>
        `;
        
        advisorElement.addEventListener('click', () => {
            this.selectAdvisor(advisor.id);
        });
        
        this.advisorList.appendChild(advisorElement);
    }
    
    async selectAdvisor(advisorId) {
        // Remove active class from all advisors
        document.querySelectorAll('.advisor-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected advisor
        const selectedElement = document.querySelector(`[data-advisor-id="${advisorId}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }
        
        this.currentAdvisor = this.advisors.get(advisorId);
        
        // Update chat header
        this.updateChatHeader();
        
        // Show chat content
        this.emptyChat.style.display = 'none';
        this.chatContent.style.display = 'flex';
        
        // Load conversation history
        await this.loadConversation(advisorId);
        
        // Join conversation room via WebSocket (if available)
        if (this.socket) {
            this.socket.emit('join_conversation', { advisor_id: advisorId });
        }
        
        // Mark messages as read
        this.markMessagesAsRead(advisorId);
    }
    
    updateChatHeader() {
        if (!this.currentAdvisor) return;
        
        this.chatAvatar.textContent = this.getInitials(this.currentAdvisor.name);
        this.chatName.textContent = this.currentAdvisor.name;
        
        const status = this.currentAdvisor.online ? 
            'online' : 
            `last seen ${this.formatLastSeen(this.currentAdvisor.lastSeen)}`;
        this.chatStatus.textContent = status;
    }
    
    async loadConversation(advisorId) {
        try {
            const response = await fetch(`/whatsapp/api/conversations/${advisorId}`);
            const messages = await response.json();
            
            this.messagesContainer.innerHTML = '';
            this.messages.set(advisorId, messages);
            
            let currentDate = null;
            
            messages.forEach(message => {
                const messageDate = this.getDateString(message.timestamp);
                
                if (messageDate !== currentDate) {
                    this.renderDateDivider(messageDate);
                    currentDate = messageDate;
                }
                
                this.renderMessage(message);
            });
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.showNotification('Failed to load conversation', 'error');
        }
    }
    
    renderDateDivider(dateString) {
        const divider = document.createElement('div');
        divider.className = 'message-date';
        divider.innerHTML = `<span>${dateString}</span>`;
        this.messagesContainer.appendChild(divider);
    }
    
    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.direction}`;
        messageElement.dataset.messageId = message.id;
        
        let content = '';
        
        // Handle different message types
        if (message.type === 'image') {
            content = `
                <div class="message-media">
                    <img src="${message.media_url}" alt="Image" onclick="window.open('${message.media_url}', '_blank')">
                </div>
            `;
        } else if (message.type === 'document') {
            content = `
                <div class="message-media">
                    <a href="${message.media_url}" target="_blank" style="color: #007bff;">
                        <i class="fas fa-file-pdf"></i> ${message.filename || 'Document'}
                    </a>
                </div>
            `;
        }
        
        if (message.content) {
            content += `<div class="message-content">${this.escapeHtml(message.content)}</div>`;
        }
        
        // Add buttons if present
        if (message.buttons && message.buttons.length > 0) {
            content += '<div class="message-buttons">';
            message.buttons.forEach(button => {
                content += `<button class="message-button" data-button-id="${button.id}">${button.text}</button>`;
            });
            content += '</div>';
        }
        
        // Message status
        const statusIcon = this.getStatusIcon(message.status);
        const timeString = this.formatTime(message.timestamp);
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${content}
                <div class="message-time">
                    ${timeString}
                    ${message.direction === 'sent' ? `<span class="message-status ${message.status}">${statusIcon}</span>` : ''}
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageElement);
        
        // Bind button click events
        if (message.buttons) {
            messageElement.querySelectorAll('.message-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleButtonClick(e.target.dataset.buttonId, message.id);
                });
            });
        }
    }
    
    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.currentAdvisor) return;
        
        try {
            const response = await fetch('/whatsapp/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    advisor_id: this.currentAdvisor.id,
                    phone: this.currentAdvisor.phone,
                    content: content,
                    type: 'text'
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Clear input
                this.messageInput.value = '';
                this.adjustTextareaHeight();
                
                // Add message to UI immediately
                const message = {
                    id: result.message_id,
                    direction: 'sent',
                    type: 'text',
                    content: content,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                };
                
                this.renderMessage(message);
                this.scrollToBottom();
                
                // Emit via WebSocket (if available)
                if (this.socket) {
                    this.socket.emit('send_message', {
                        advisor_id: this.currentAdvisor.id,
                        content: content,
                        type: 'text'
                    });
                }
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }
    
    async sendMediaMessage(file) {
        if (!this.currentAdvisor) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('advisor_id', this.currentAdvisor.id);
        formData.append('phone', this.currentAdvisor.phone);
        
        try {
            const response = await fetch('/whatsapp/api/messages/send-media', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Add message to UI
                const message = {
                    id: result.message_id,
                    direction: 'sent',
                    type: file.type.startsWith('image/') ? 'image' : 'document',
                    media_url: result.media_url,
                    filename: file.name,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                };
                
                this.renderMessage(message);
                this.scrollToBottom();
            } else {
                throw new Error('Failed to send media');
            }
        } catch (error) {
            console.error('Error sending media:', error);
            this.showNotification('Failed to send media', 'error');
        }
        
        // Reset file input
        this.fileInput.value = '';
    }
    
    handleNewMessage(data) {
        // Check if message is for current conversation
        if (this.currentAdvisor && data.advisor_id === this.currentAdvisor.id) {
            this.renderMessage(data.message);
            this.scrollToBottom();
        }
        
        // Update advisor list
        this.updateAdvisorLastMessage(data.advisor_id, data.message);
        
        // Show notification if not in focus
        if (document.hidden) {
            this.showDesktopNotification(data);
        }
    }
    
    handleStatusUpdate(data) {
        // Update message status in UI
        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                statusElement.className = `message-status ${data.status}`;
                statusElement.innerHTML = this.getStatusIcon(data.status);
            }
        }
    }
    
    handleTypingIndicator(data) {
        if (this.currentAdvisor && data.advisor_id === this.currentAdvisor.id) {
            if (data.is_typing) {
                this.typingIndicator.style.display = 'block';
            } else {
                this.typingIndicator.style.display = 'none';
            }
        }
    }
    
    updateAdvisorStatus(data) {
        const advisor = this.advisors.get(data.advisor_id);
        if (advisor) {
            advisor.online = data.online;
            advisor.lastSeen = data.last_seen;
            
            if (this.currentAdvisor && this.currentAdvisor.id === data.advisor_id) {
                this.updateChatHeader();
            }
        }
    }
    
    updateAdvisorLastMessage(advisorId, message) {
        const advisor = this.advisors.get(advisorId);
        if (advisor) {
            advisor.lastMessage = message.content || '[Media]';
            advisor.lastTime = message.timestamp;
            
            if (message.direction === 'received') {
                advisor.unreadCount = (advisor.unreadCount || 0) + 1;
            }
            
            // Re-render advisor in list
            const advisorElement = document.querySelector(`[data-advisor-id="${advisorId}"]`);
            if (advisorElement) {
                const parent = advisorElement.parentNode;
                parent.removeChild(advisorElement);
                this.renderAdvisor(advisor);
            }
        }
    }
    
    async markMessagesAsRead(advisorId) {
        try {
            await fetch('/whatsapp/api/messages/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ advisor_id: advisorId })
            });
            
            // Clear unread count
            const advisor = this.advisors.get(advisorId);
            if (advisor) {
                advisor.unreadCount = 0;
                this.updateAdvisorLastMessage(advisorId, { direction: 'none' });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }
    
    async exportConversation(format) {
        if (!this.currentAdvisor) return;
        
        try {
            const response = await fetch(`/whatsapp/api/export/${this.currentAdvisor.id}?format=${format}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `conversation_${this.currentAdvisor.name}_${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.exportModal.classList.remove('active');
                this.showNotification('Conversation exported successfully', 'success');
            }
        } catch (error) {
            console.error('Error exporting conversation:', error);
            this.showNotification('Failed to export conversation', 'error');
        }
    }
    
    filterAdvisors(query) {
        const lowerQuery = query.toLowerCase();
        
        document.querySelectorAll('.advisor-item').forEach(item => {
            const name = item.querySelector('.advisor-name').textContent.toLowerCase();
            const message = item.querySelector('.advisor-last-message').textContent.toLowerCase();
            
            if (name.includes(lowerQuery) || message.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    openBroadcastModal() {
        // Implementation for broadcast modal
        alert('Broadcast functionality coming soon!');
    }
    
    searchInChat() {
        const query = prompt('Search in this conversation:');
        if (query) {
            // Highlight matching messages
            const messages = this.messagesContainer.querySelectorAll('.message-content');
            messages.forEach(msg => {
                const content = msg.textContent;
                if (content.toLowerCase().includes(query.toLowerCase())) {
                    msg.style.backgroundColor = '#ffeb3b';
                    setTimeout(() => {
                        msg.style.backgroundColor = '';
                    }, 3000);
                }
            });
        }
    }
    
    showMoreOptions() {
        // Implementation for more options menu
        alert('More options coming soon!');
    }
    
    showFilterOptions() {
        // Implementation for filter options
        alert('Filter options coming soon!');
    }
    
    emitTyping() {
        if (this.currentAdvisor && this.socket) {
            this.socket.emit('typing', {
                advisor_id: this.currentAdvisor.id,
                is_typing: this.messageInput.value.length > 0
            });
        }
    }
    
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    truncateMessage(message, maxLength = 50) {
        if (message.length <= maxLength) return message;
        return message.slice(0, maxLength) + '...';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    formatLastSeen(timestamp) {
        if (!timestamp) return 'recently';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        if (diff < 172800000) return `yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    getDateString(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    getStatusIcon(status) {
        switch (status) {
            case 'pending': return '🕐';
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            case 'failed': return '❌';
            default: return '';
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    showDesktopNotification(data) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`New message from ${data.advisor_name}`, {
                body: data.message.content || '[Media]',
                icon: '/favicon.ico'
            });
            
            notification.onclick = () => {
                window.focus();
                this.selectAdvisor(data.advisor_id);
            };
        }
    }
}

// Initialize the WhatsApp interface when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize the interface
    window.whatsappInterface = new WhatsAppInterface();
});