// Message Service for real-time messaging
let connected = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeMessageService();
    
    // Add CSS for message errors
    const style = document.createElement('style');
    style.textContent = `
        .message-error {
            opacity: 0.7;
            position: relative;
        }
        
        .message-error::after {
            content: '⚠️';
            position: absolute;
            right: -20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .loading-messages, .no-messages, .error-message {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        .date-separator {
            text-align: center;
            margin: 10px 0;
            font-size: 0.8rem;
            color: #666;
            position: relative;
        }
        
        /* Chat message alignment styles */
        .chat-messages {
            display: flex;
            flex-direction: column;
            padding: 10px;
            overflow-y: auto;
        }
        
        .message {
            max-width: 70%;
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 12px;
            position: relative;
        }
        
        .message.sent {
            align-self: flex-end;
            background-color: #dcf8c6;
            margin-left: auto;
        }
        
        .message.message-received {
            align-self: flex-start;
            background-color: #f1f0f0;
            margin-right: auto;
        }
        
        .message-content {
            display: flex;
            flex-direction: column;
        }
        
        .message-time {
            font-size: 0.7rem;
            color: #888;
            align-self: flex-end;
            margin-top: 2px;
        }
    `;
    document.head.appendChild(style);
});

function initializeMessageService() {
    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (!token) return;
    
    console.log('Initializing message service...');
    connected = true;
    
    // Check for real-time messages periodically (polling fallback)
    checkForNewMessages();
}

async function checkForNewMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Check for unread messages count
        const response = await fetch('http://localhost:3000/api/messages/unread/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // If there are unread messages, update the UI
            if (data.count > 0) {
                // Update friend list to show unread indicators
                updateFriendsListWithUnreadCounts();
                
                // Add unread indicator to the page if not already present
                updateUnreadIndicator(data.count);
                
                // Get unread messages details
                fetchUnreadMessages();
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
    
    // Check again in 30 seconds
    setTimeout(checkForNewMessages, 30000);
}

// New function to fetch unread messages
async function fetchUnreadMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/messages/unread', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const unreadMessages = await response.json();
            
            // Group messages by sender
            const messagesBySender = {};
            unreadMessages.forEach(msg => {
                if (!messagesBySender[msg.senderId]) {
                    messagesBySender[msg.senderId] = {
                        count: 0,
                        senderName: msg.senderName,
                        messages: []
                    };
                }
                messagesBySender[msg.senderId].count++;
                messagesBySender[msg.senderId].messages.push(msg);
            });
            
            // Update UI for each sender's unread messages
            Object.keys(messagesBySender).forEach(senderId => {
                const senderInfo = messagesBySender[senderId];
                
                // Update existing chat if open
                const existingChat = document.querySelector(`.chat-container[data-user-id="${senderId}"]`);
                if (existingChat) {
                    // Update header with unread count
                    const headerSpan = existingChat.querySelector('.chat-header span');
                    if (!headerSpan.querySelector('.unread-count')) {
                        const unreadCountSpan = document.createElement('span');
                        unreadCountSpan.className = 'unread-count';
                        unreadCountSpan.textContent = senderInfo.count;
                        headerSpan.appendChild(unreadCountSpan);
                    } else {
                        headerSpan.querySelector('.unread-count').textContent = senderInfo.count;
                    }
                } else {
                    // If chat is not open, we'll show notification when user opens the app
                    const latestMessage = senderInfo.messages[senderInfo.messages.length - 1];
                    notifyMessageReceived(senderId, senderInfo.senderName, latestMessage.text);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching unread messages:', error);
    }
}

// New function to show all chats with unread messages
function showUnreadChats() {
    // This will be implemented to open all chats with unread messages
    // For now, we'll just fetch unread messages again
    fetchUnreadMessages();
}

function notifyMessageReceived(senderId, senderName, messageText) {
    // Check if chat is already open
    const existingChat = document.querySelector(`.chat-container[data-user-id="${senderId}"]`);
    
    if (existingChat) {
        // Add message to existing chat
        const messagesContainer = existingChat.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-received unread';
        
        // Format the message with proper styling
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${messageText}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // Add unread indicator to chat header if not already there
        const headerSpan = existingChat.querySelector('.chat-header span');
        let unreadCount = headerSpan.querySelector('.unread-count');
        if (!unreadCount) {
            unreadCount = document.createElement('span');
            unreadCount.className = 'unread-count';
            unreadCount.textContent = '1';
            headerSpan.appendChild(unreadCount);
        } else {
            unreadCount.textContent = parseInt(unreadCount.textContent) + 1;
        }
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        // Create a new chat
        openChat(senderId, senderName);
        
        // Now add the message
        setTimeout(() => {
            const messagesContainer = document.getElementById(`chat-messages-${senderId}`);
            if (messagesContainer) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message message-received unread';
                
                // Format the message with proper styling
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-text">${messageText}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
                
                messagesContainer.appendChild(messageElement);
                
                // Add unread indicator to chat header
                const chatContainer = document.querySelector(`.chat-container[data-user-id="${senderId}"]`);
                if (chatContainer) {
                    const headerSpan = chatContainer.querySelector('.chat-header span');
                    const unreadCount = document.createElement('span');
                    unreadCount.className = 'unread-count';
                    unreadCount.textContent = '1';
                    headerSpan.appendChild(unreadCount);
                }
                
                // Scroll to the bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100); // Small delay to ensure chat is created
    }
    
    // Create a notification
    createNotification(senderName, messageText);
}

function openChat(userId, username) {
    // Add more detailed logging
    console.log('openChat called with:', { userId, username, type: typeof userId });
    
    // Add validation for userId and username
    if (!userId) {
        console.error('Cannot open chat: userId is undefined or empty');
        return;
    }
    
    if (!username) {
        console.error('Cannot open chat: username is undefined or empty');
        return;
    }
    
    // Rest of your existing code...
    
    // Check if the friends section has an openChat function
    if (typeof window.openChat === 'function' && window.openChat !== openChat) {
        // Call the external openChat function only if it's not this same function
        window.openChat(userId, username);
    } else {
        // If not found or it's the same function, create our own implementation
        // Check if chat already exists
        const existingChat = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
        if (existingChat) {
            // If chat exists, just focus it
            existingChat.style.display = 'flex';
            existingChat.querySelector('.chat-input').focus();
            return;
        }
        
        // Create new chat container
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.setAttribute('data-user-id', userId);
        
        chatContainer.innerHTML = `
            <div class="chat-header">
                <span>${username}</span>
                <button class="chat-close-btn">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages-${userId}">
                <div class="loading-messages">Loading messages...</div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" placeholder="Type a message...">
                <button class="chat-send-btn">Send</button>
            </div>
        `;
        
        document.body.appendChild(chatContainer);
        
        // Focus the input
        chatContainer.querySelector('.chat-input').focus();
        
        // Add event listeners
        chatContainer.querySelector('.chat-close-btn').addEventListener('click', function() {
            chatContainer.remove();
        });
        
        chatContainer.querySelector('.chat-send-btn').addEventListener('click', function() {
            sendMessage(userId);
        });
        
        chatContainer.querySelector('.chat-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage(userId);
            }
        });
        
        // Load messages from the database
        loadMessages(userId);
    }
}

async function loadMessages(userId) {
    // Get the chat container - try by userId first, but have a fallback
    let chatContainer = null;
    
    if (userId) {
        chatContainer = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
    }
    
    // If no container found and no userId, try to find the most recently opened chat
    if (!chatContainer && !userId) {
        chatContainer = document.querySelector('.chat-container');
    }
    
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }
    
    // Get username from chat header and trim any whitespace
    const recipientUsername = chatContainer.querySelector('.chat-header span').textContent.trim();
    const chatMessages = chatContainer.querySelector('.chat-messages');
    chatMessages.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    
    const token = localStorage.getItem('token');
    if (!token) {
        chatMessages.innerHTML = '<div class="error-message">Authentication error. Please log in again.</div>';
        return;
    }
    
    try {
        console.log('Loading messages for chat with username:', recipientUsername);
        
        // Use the username endpoint instead of userId
        const response = await fetch(`http://localhost:3000/api/messages/by-username/${encodeURIComponent(recipientUsername)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        let messages = [];
        
        if (response.ok) {
            messages = await response.json();
            console.log('Loaded messages:', messages);
            
            // Mark messages as read on the server
            markMessagesAsRead(recipientUsername);
            
            // Remove unread indicator from chat header if present
            const headerSpan = chatContainer.querySelector('.chat-header span');
            const unreadCount = headerSpan.querySelector('.unread-count');
            if (unreadCount) {
                unreadCount.remove();
            }
        } else {
            console.error('Failed to load messages:', response.status);
            chatMessages.innerHTML = '<div class="error-message">Failed to load messages. Please try again later.</div>';
            return;
        }
        
        // Clear loading message
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="no-messages">No messages yet. Say hello!</div>';
            return;
        }
        
        // Render each message
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sender === 'self' ? 'sent' : 'message-received'}`;
            
            const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            chatMessages.appendChild(messageElement);
        });
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
        chatMessages.innerHTML = '<div class="error-message">Failed to load messages. Please try again later.</div>';
    }
}

// New function to mark messages as read
async function markMessagesAsRead(username) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        await fetch(`http://localhost:3000/api/messages/mark-read/${encodeURIComponent(username)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Update global unread count and friends list
        checkForNewMessages();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

async function sendMessage(userId) {
    const chatContainer = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }
    
    // Get username from chat header and trim any whitespace
    const recipientUser = chatContainer.querySelector('.chat-header span').textContent.trim();
    const messageInput = chatContainer.querySelector('.chat-input');
    const chatMessages = chatContainer.querySelector('.chat-messages');
        
    if (!messageInput || !chatMessages) {
        console.error('Cannot find message input or chat messages container');
        return;
    }
    
    const text = messageInput.value.trim();
    if (!text) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Authentication error. Please log in again.');
        return;
    }
    
    // Clear input field immediately for better UX
    messageInput.value = '';
    
    // Add message to UI immediately (optimistic UI update)
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        console.log('Sending message to:', recipientUser, 'Text:', text);
        
        // Log the exact data being sent to help debug
        const requestData = { 
            recipientUsername: recipientUser,
            text: text
        };
        console.log('Request data:', requestData);
        
        const response = await fetch('http://localhost:3000/api/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        
        
        const responseData = await response.json();
        console.log('Message send response:', responseData);
        
        if (!response.ok) {
            console.error('Failed to send message:', response.status, responseData);
            const errorElement = document.createElement('div');
            errorElement.className = 'message-error';
            errorElement.textContent = `Message failed to send: ${responseData.message || 'Unknown error'}`;
            chatMessages.appendChild(errorElement);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        const errorElement = document.createElement('div');
        errorElement.className = 'message-error';
        errorElement.textContent = 'Network error. Please check your connection.';
        chatMessages.appendChild(errorElement);
    }
}

function createNotification(sender, message) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return;
    }
    
    // Check if permission is already granted
    if (Notification.permission === "granted") {
        showNotification(sender, message);
    }
    // Otherwise, request permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function(permission) {
            if (permission === "granted") {
                showNotification(sender, message);
            }
        });
    }
}

function showNotification(sender, message) {
    const notification = new Notification(`Message from ${sender}`, {
        body: message,
        icon: '/public/notification-icon.png' // You should add this icon
    });
    
    notification.onclick = function() {
        window.focus();
        this.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);
}

// Cleanup function to prevent memory leaks
function cleanup() {
    connected = false;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeMessageService();
    
    // Add CSS for message errors and unread indicators
    const style = document.createElement('style');
    style.textContent = `
        .message-error {
            opacity: 0.7;
            position: relative;
        }
        
        .message-error::after {
            content: '⚠️';
            position: absolute;
            right: -20px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .loading-messages, .no-messages, .error-message {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        .date-separator {
            text-align: center;
            margin: 10px 0;
            font-size: 0.8rem;
            color: #666;
            position: relative;
        }
        
    `;
    document.head.appendChild(style);
});

// Export functions
window.messageService = {
    initialize: initializeMessageService,
    sendMessage: sendMessage,
    cleanup: cleanup
};

// Ensure cleanup on page unload
window.addEventListener('beforeunload', cleanup);