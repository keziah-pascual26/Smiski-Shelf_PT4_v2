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
        
        /* Media sharing styles */
        .media-upload-btn {
            background: none;
            border: none;
            color: #555;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 5px 10px;
        }
        
        .media-upload-btn:hover {
            color: #007bff;
        }
        
        .media-upload-placeholder {
            padding: 10px;
            background-color: rgba(0,0,0,0.05);
            border-radius: 5px;
        }
        
        .shared-image {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .shared-video {
            max-width: 100%;
            max-height: 200px;
            border-radius: 5px;
        }
        
        .message-media {
            margin-bottom: 5px;
        }
        
        /* Chat input container with media button */
        .chat-input-container {
            display: flex;
            padding: 10px;
            border-top: 1px solid #eee;
        }
        
        .chat-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 20px;
            margin-right: 5px;
        }
        
        .chat-send-btn {
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 15px;
            cursor: pointer;
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
                    const messageText = latestMessage.mediaUrl ? 
                        `[${latestMessage.mediaType === 'image' ? 'Image' : 'Video'}]${latestMessage.text ? ' ' + latestMessage.text : ''}` : 
                        latestMessage.text;
                    notifyMessageReceived(senderId, senderInfo.senderName, messageText, latestMessage);
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

function notifyMessageReceived(senderId, senderName, messageText, messageData) {
    // Check if chat is already open
    const existingChat = document.querySelector(`.chat-container[data-user-id="${senderId}"]`);
    
    if (existingChat) {
        // Add message to existing chat
        const messagesContainer = existingChat.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-received unread';
        
        // Format the message with proper styling
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Check if message has media
        if (messageData && messageData.mediaUrl) {
            if (messageData.mediaType === 'image') {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-media">
                            <img src="/uploads/${messageData.mediaUrl}" alt="Shared image" class="shared-image">
                        </div>
                        ${messageData.text ? `<div class="message-text">${messageData.text}</div>` : ''}
                        <div class="message-time">${time}</div>
                    </div>
                `;
            } else if (messageData.mediaType === 'video') {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-media">
                            <video controls class="shared-video">
                                <source src="/uploads/${messageData.mediaUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        ${messageData.text ? `<div class="message-text">${messageData.text}</div>` : ''}
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }
        } else {
            // Regular text message
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${messageText}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        
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
                
                // Check if message has media
                if (messageData && messageData.mediaUrl) {
                    if (messageData.mediaType === 'image') {
                        messageElement.innerHTML = `
                            <div class="message-content">
                                <div class="message-media">
                                    <img src="/uploads/${messageData.mediaUrl}" alt="Shared image" class="shared-image">
                                </div>
                                ${messageData.text ? `<div class="message-text">${messageData.text}</div>` : ''}
                                <div class="message-time">${time}</div>
                            </div>
                        `;
                    } else if (messageData.mediaType === 'video') {
                        messageElement.innerHTML = `
                            <div class="message-content">
                                <div class="message-media">
                                    <video controls class="shared-video">
                                        <source src="/uploads/${messageData.mediaUrl}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                                ${messageData.text ? `<div class="message-text">${messageData.text}</div>` : ''}
                                <div class="message-time">${time}</div>
                            </div>
                        `;
                    }
                } else {
                    // Regular text message
                    messageElement.innerHTML = `
                        <div class="message-content">
                            <div class="message-text">${messageText}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    `;
                }
                
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
                <button class="media-upload-btn" title="Attach media">
                    <i class="fas fa-paperclip"></i>
                </button>
                <input type="file" class="media-file-input" accept="image/*,video/*" style="display:none">
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
        
        // Add media upload functionality
        const mediaUploadBtn = chatContainer.querySelector('.media-upload-btn');
        const mediaFileInput = chatContainer.querySelector('.media-file-input');
        
        mediaUploadBtn.addEventListener('click', function() {
            mediaFileInput.click();
        });
        
        mediaFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                handleMediaUpload(userId, this.files[0]);
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
    console.log('Loading messages for chat with username:', recipientUsername);
    
    const token = localStorage.getItem('token');
    if (!token) {
        chatMessages.innerHTML = '<div class="error-message">Authentication error. Please log in again.</div>';
        return;
    }
    
    try {
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
            
            // Always update the UI with the latest messages
            // Clear loading message
            chatMessages.innerHTML = '';
            
            if (messages.length === 0) {
                chatMessages.innerHTML = '<div class="no-messages">No messages yet. Say hello!</div>';
            } else {
                // Render each message
                messages.forEach(message => {
                    const messageElement = document.createElement('div');
                    messageElement.className = `message ${message.sender === 'self' ? 'sent' : 'message-received'}`;
                    
                    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    // Check if message has media
                    if (message.mediaUrl) {
                        if (message.mediaType === 'image') {
                            messageElement.innerHTML = `
                                <div class="message-content">
                                    <div class="message-media">
                                        <img src="/uploads/${message.mediaUrl}" alt="Shared image" class="shared-image">
                                    </div>
                                    ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
                                    <div class="message-time">${time}</div>
                                </div>
                            `;
                        } else if (message.mediaType === 'video') {
                            messageElement.innerHTML = `
                                <div class="message-content">
                                    <div class="message-media">
                                        <video controls class="shared-video">
                                            <source src="/uploads/${message.mediaUrl}" type="video/mp4">
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                    ${message.text ? `<div class="message-text">${message.text}</div>` : ''}
                                    <div class="message-time">${time}</div>
                                </div>
                            `;
                        }
                    } else {
                        // Regular text message
                        messageElement.innerHTML = `
                            <div class="message-content">
                                <div class="message-text">${message.text}</div>
                                <div class="message-time">${time}</div>
                            </div>
                        `;
                    }
                    
                    chatMessages.appendChild(messageElement);
                });
            }
            
            // Scroll to the bottom of the chat
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Store the message count for future reference
            chatContainer.setAttribute('data-message-count', messages.length.toString());
        } else {
            console.error('Failed to load messages:', response.status);
            chatMessages.innerHTML = '<div class="error-message">Failed to load messages. Please try again later.</div>';
            return;
        }
        
        // Set up automatic refresh if not already set
        if (!chatContainer.hasAttribute('data-refresh-set')) {
            chatContainer.setAttribute('data-refresh-set', 'true');
            
            // Store the interval ID on the container so we can clear it later
            const intervalId = setInterval(() => {
                // Only refresh if the container is still in the DOM
                if (document.body.contains(chatContainer)) {
                    loadMessages(userId);
                } else {
                    // Clean up the interval if the container is removed
                    clearInterval(intervalId);
                }
            }, 5000); // Refresh every 5 seconds
            
            // Store the interval ID for cleanup
            chatContainer.setAttribute('data-refresh-interval', intervalId);
            
            // Add cleanup when chat is closed
            const closeButton = chatContainer.querySelector('.chat-close-btn');
            if (closeButton) {
                const originalClickHandler = closeButton.onclick;
                closeButton.onclick = function() {
                    // Clear the refresh interval
                    clearInterval(parseInt(chatContainer.getAttribute('data-refresh-interval')));
                    
                    // Call the original handler if it exists
                    if (originalClickHandler) {
                        originalClickHandler.call(this);
                    } else {
                        chatContainer.remove();
                    }
                };
            }
        }
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

// New function to handle media uploads
async function handleMediaUpload(userId, file) {
    const chatContainer = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
    if (!chatContainer) {
        console.error('Chat container not found');
        return;
    }
    
    const recipientUser = chatContainer.querySelector('.chat-header span').textContent.trim();
    const messageInput = chatContainer.querySelector('.chat-input');
    const chatMessages = chatContainer.querySelector('.chat-messages');
    const messageText = messageInput.value.trim();
    
    if (!chatMessages) {
        console.error('Cannot find chat messages container');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Authentication error. Please log in again.');
        return;
    }
    
    // Clear input field
    messageInput.value = '';
    
    // Create a placeholder for the uploading media
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `
        <div class="message-content">
            <div class="message-media">
                <div class="media-upload-placeholder">
                    <i class="fas fa-spinner fa-spin"></i> Uploading ${file.name}...
                </div>
            </div>
            ${messageText ? `<div class="message-text">${messageText}</div>` : ''}
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // Create FormData to send the file
        const formData = new FormData();
        formData.append('media', file);
        formData.append('recipientUsername', recipientUser);
        formData.append('mediaType', file.type.startsWith('image/') ? 'image' : 'video');
        if (messageText) {
            formData.append('text', messageText);
        }
        
        const response = await fetch('http://localhost:3000/api/messages/send-media', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            // Update the placeholder with the actual media
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            const mediaUrl = `/uploads/${responseData.mediaFilename}`;
            
            if (mediaType === 'image') {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-media">
                            <img src="${mediaUrl}" alt="Shared image" class="shared-image">
                        </div>
                        ${messageText ? `<div class="message-text">${messageText}</div>` : ''}
                        <div class="message-time">${time}</div>
                    </div>
                `;
            } else {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="message-media">
                            <video controls class="shared-video">
                                <source src="${mediaUrl}" type="${file.type}">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        ${messageText ? `<div class="message-text">${messageText}</div>` : ''}
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }
        } else {
            console.error('Failed to upload media:', response.status, responseData);
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-text message-error">
                        Failed to upload: ${responseData.message || 'Unknown error'}
                    </div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error uploading media:', error);
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text message-error">
                    Network error. Please check your connection.
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }
}


// Function to create browser notifications
function createNotification(senderName, messageText) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return;
    }
    
    // Check if permission is already granted
    if (Notification.permission === "granted") {
        // Create notification
        const notification = new Notification(`New message from ${senderName}`, {
            body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
            icon: '/assets/images/logo.png'
        });
        
        // Close notification after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // Handle notification click
        notification.onclick = function() {
            window.focus();
            this.close();
        };
    } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                createNotification(senderName, messageText);
            }
        });
    }
}

// Function to update unread indicator in the UI
function updateUnreadIndicator(count) {
    // Find or create the unread indicator
    let unreadIndicator = document.getElementById('unread-messages-indicator');
    
    if (!unreadIndicator) {
        // Create the indicator if it doesn't exist
        unreadIndicator = document.createElement('div');
        unreadIndicator.id = 'unread-messages-indicator';
        unreadIndicator.className = 'unread-indicator';
        unreadIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #ff4d4f;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            z-index: 1000;
        `;
        
        // Add click handler to show unread chats
        unreadIndicator.addEventListener('click', showUnreadChats);
        
        document.body.appendChild(unreadIndicator);
    }
    
    // Update the count
    unreadIndicator.textContent = count;
    unreadIndicator.style.display = count > 0 ? 'flex' : 'none';
}

// Function to update friends list with unread message counts
async function updateFriendsListWithUnreadCounts() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        // Get unread messages
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
                        senderName: msg.senderName
                    };
                }
                messagesBySender[msg.senderId].count++;
            });
            
            // Update friend list items
            Object.keys(messagesBySender).forEach(senderId => {
                const senderInfo = messagesBySender[senderId];
                
                // Find friend list item by user ID or username
                const friendItem = document.querySelector(`.friend-item[data-user-id="${senderId}"], .friend-item[data-username="${senderInfo.senderName}"]`);
                
                if (friendItem) {
                    // Add or update unread badge
                    let unreadBadge = friendItem.querySelector('.unread-badge');
                    
                    if (!unreadBadge) {
                        unreadBadge = document.createElement('span');
                        unreadBadge.className = 'unread-badge';
                        unreadBadge.style.cssText = `
                            background-color: #ff4d4f;
                            color: white;
                            border-radius: 10px;
                            padding: 2px 6px;
                            font-size: 0.7rem;
                            margin-left: 5px;
                        `;
                        friendItem.appendChild(unreadBadge);
                    }
                    
                    unreadBadge.textContent = senderInfo.count;
                    unreadBadge.style.display = 'inline-block';
                }
            });
        }
    } catch (error) {
        console.error('Error updating friends list with unread counts:', error);
    }
}

// Function to handle image preview when clicked
function setupImagePreview() {
    // Create modal for image preview if it doesn't exist
    if (!document.getElementById('image-preview-modal')) {
        const modal = document.createElement('div');
        modal.id = 'image-preview-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1001;
            justify-content: center;
            align-items: center;
            cursor: zoom-out;
        `;
        
        const modalImg = document.createElement('img');
        modalImg.id = 'image-preview-content';
        modalImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;
        
        modal.appendChild(modalImg);
        document.body.appendChild(modal);
        
        // Close modal when clicked
        modal.addEventListener('click', function() {
            this.style.display = 'none';
        });
    }
    
    // Add click event to all shared images
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('shared-image')) {
            const modal = document.getElementById('image-preview-modal');
            const modalImg = document.getElementById('image-preview-content');
            
            modal.style.display = 'flex';
            modalImg.src = e.target.src;
        }
    });
}

// Call setupImagePreview when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupImagePreview();
});

// Export functions for external use
window.messageService = {
    openChat,
    sendMessage,
    loadMessages,
    handleMediaUpload,
    checkForNewMessages
};