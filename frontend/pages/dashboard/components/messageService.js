// Message Service for real-time messaging (simulation)
let messageListeners = [];
let connected = false;
let simulationInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeMessageService();
});

function initializeMessageService() {
    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Simulate connecting to a websocket service
    console.log('Initializing message service...');
    connected = true;
    
    // Check for real-time messages periodically (polling fallback)
    checkForNewMessages();
    
    // Simulate receiving messages periodically
    simulateIncomingMessages();
}

// Function to check for new messages from the server
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
                const friendsSection = document.getElementById('friendsSection');
                if (friendsSection) {
                    initializeFriendsSection(); // Re-initialize to show unread counts
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
    
    // Check again in 30 seconds
    setTimeout(checkForNewMessages, 30000);
}

function simulateIncomingMessages() {
    // Clear any existing interval
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    
    // This simulates receiving messages in real-time
    // In a real app, this would be replaced with WebSocket or server events
    const possibleMessages = [
        'Hey, how are you?',
        'Have you seen the new Smiski collection?',
        'I just got a rare Smiski figure!',
        'When are you going to post your collection?',
        'Thanks for the friend request!'
    ];
    
    const possibleSenders = [101, 102, 103, 104, 105];
    
    // Simulate a message every 30-120 seconds
    simulationInterval = setInterval(() => {
        if (!connected) return;
        
        // Randomly decide whether to send a message (20% chance)
        if (Math.random() < 0.2) {
            const randomSenderIndex = Math.floor(Math.random() * possibleSenders.length);
            const randomMessageIndex = Math.floor(Math.random() * possibleMessages.length);
            
            const senderId = possibleSenders[randomSenderIndex];
            const message = possibleMessages[randomMessageIndex];
            
            // Get the sender's name from the DOM
            let senderName = 'Friend';
            const friendElement = document.querySelector(`.friend-item[data-user-id="${senderId}"]`);
            if (friendElement) {
                senderName = friendElement.querySelector('.friend-name').textContent.trim();
                
                // Remove any unread badge from the name
                if (senderName.includes('Request')) {
                    senderName = senderName.split('Request')[0].trim();
                }
            }
            
            // Notify all listeners
            notifyMessageReceived(senderId, senderName, message);
        }
    }, 30000); // Check every 30 seconds
}

function notifyMessageReceived(senderId, senderName, messageText) {
    // Check if chat is already open
    const existingChat = document.querySelector(`.chat-container[data-user-id="${senderId}"]`);
    
    if (existingChat) {
        // Add message to existing chat
        const messagesContainer = existingChat.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-received';
        messageElement.textContent = messageText;
        messagesContainer.appendChild(messageElement);
        
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
                messageElement.className = 'message message-received';
                messageElement.textContent = messageText;
                messagesContainer.appendChild(messageElement);
                
                // Scroll to the bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100); // Small delay to ensure chat is created
    }
    
    // Create a notification
    createNotification(senderName, messageText);
}

function openChat(userId, username) {
    // Check if the friends section has an openChat function
    if (typeof window.openChat === 'function') {
        window.openChat(userId, username);
    } else {
        // If not found, create our own implementation
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
            <div class="chat-messages" id="chat-messages-${userId}"></div>
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

// Function to send a message - this is a duplicate for the simulation service
function sendMessage(userId) {
    const chatContainer = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
    if (!chatContainer) return;
    
    const inputElement = chatContainer.querySelector('.chat-input');
    const messagesContainer = document.getElementById(`chat-messages-${userId}`);
    
    const messageText = inputElement.value.trim();
    
    if (!messageText) return;
    
    // Clear the input
    inputElement.value = '';
    
    // Add message to UI immediately
    const messageElement = document.createElement('div');
    messageElement.className = 'message message-sent';
    messageElement.textContent = messageText;
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate a response after a delay (1-5 seconds)
    const responseDelay = 1000 + Math.random() * 4000;
    
    setTimeout(() => {
        // 50% chance to respond
        if (Math.random() < 0.5) {
            // Get the sender's name
            let senderName = 'Friend';
            const friendElement = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
            if (friendElement) {
                senderName = friendElement.querySelector('.friend-name').textContent;
            }
            
            // Possible responses
            const possibleResponses = [
                'Thanks for the message!',
                'That\'s great to hear!',
                'I\'ll check it out later.',
                'Nice! How\'s your Smiski collection going?',
                'Cool! Talk to you later!'
            ];
            
            const randomIndex = Math.floor(Math.random() * possibleResponses.length);
            const responseText = possibleResponses[randomIndex];
            
            // Add response message
            const responseElement = document.createElement('div');
            responseElement.className = 'message message-received';
            responseElement.textContent = responseText;
            messagesContainer.appendChild(responseElement);
            
            // Scroll to the bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, responseDelay);
}

// Cleanup function to prevent memory leaks
function cleanup() {
    connected = false;
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
}

// Export functions
window.messageService = {
    initialize: initializeMessageService,
    sendMessage: sendMessage,
    cleanup: cleanup
};

// Ensure cleanup on page unload
window.addEventListener('beforeunload', cleanup);
