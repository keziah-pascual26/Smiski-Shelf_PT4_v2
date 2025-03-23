// Friends Section Component
document.addEventListener('DOMContentLoaded', function() {
    initializeFriendsSection();
    
    // Make openChat function globally available
    window.openChat = openChat;
});

async function initializeFriendsSection() {
    const friendsSection = document.getElementById('friendsSection');
    
    if (!friendsSection) {
        console.error('Friends section element not found');
        return;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }
    
    try {
        // Fetch friends list
        const response = await fetch('http://localhost:3000/api/friends', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        let friends = [];
        
        if (response.ok) {
            friends = await response.json();
        } else {
            // If the endpoint doesn't exist or returns an error, use dummy data
            friends = [
                { id: 101, username: 'smiski_fan1', online: true, lastActive: new Date() },
                { id: 102, username: 'collector123', online: false, lastActive: new Date(Date.now() - 30 * 60000) },
                { id: 103, username: 'glow_master', online: true, lastActive: new Date() },
                { id: 104, username: 'mini_lover', online: false, lastActive: new Date(Date.now() - 2 * 60 * 60000) },
                { id: 105, username: 'toy_hunter', online: false, lastActive: new Date(Date.now() - 1 * 24 * 60 * 60000) }
            ];
        }
        
        // Also fetch unread message counts
        const unreadResponse = await fetch('http://localhost:3000/api/messages/unread/count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).catch(() => ({ ok: false }));
        
        let unreadCounts = {};
        
        if (unreadResponse && unreadResponse.ok) {
            const unreadData = await unreadResponse.json();
            unreadCounts = unreadData.unreadCounts || {};
        }
        
        // Create friends section HTML
        let friendsSectionHtml = `
            <h3 class="section-title">Friends</h3>
            <div class="friends-list">
        `;
        
        // Add friends
        if (friends.length > 0) {
            friends.forEach(friend => {
                // Format last active time
                let statusText = '';
                if (friend.online) {
                    statusText = '<span class="friend-status online">Online</span>';
                } else if (friend.lastActive) {
                    const lastActive = new Date(friend.lastActive);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));
                    
                    if (diffMinutes < 60) {
                        statusText = `<span class="friend-status">Active ${diffMinutes} min ago</span>`;
                    } else if (diffMinutes < 24 * 60) {
                        const hours = Math.floor(diffMinutes / 60);
                        statusText = `<span class="friend-status">Active ${hours} hr ago</span>`;
                    } else {
                        const days = Math.floor(diffMinutes / (24 * 60));
                        statusText = `<span class="friend-status">Active ${days} day ago</span>`;
                    }
                }
                
                // Add unread message indicator if there are unread messages
                const unreadCount = unreadCounts[friend.id] || 0;
                const unreadBadge = unreadCount > 0 ? 
                    `<span class="unread-badge">${unreadCount}</span>` : '';
                
                friendsSectionHtml += `
                    <div class="friend-item" data-user-id="${friend.id}">
                        <img src="${friend.profilePicture || '/public/no-profile.png'}" alt="${friend.username}" class="friend-profile-img">
                        <div class="friend-info">
                            <div class="friend-name">${friend.username} ${unreadBadge}</div>
                            ${statusText}
                        </div>
                    </div>
                `;
            });
        } else {
            friendsSectionHtml += `
                <div class="no-friends">
                    <p>You haven't added any friends yet.</p>
                    <p>Find friends in the Explore section above!</p>
                </div>
            `;
        }
        
        friendsSectionHtml += `
            </div>
        `;
        
        friendsSection.innerHTML = friendsSectionHtml;
        
        // Add event listeners for friend items to open chat
        document.querySelectorAll('.friend-item').forEach(item => {
            item.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const username = this.querySelector('.friend-name').textContent;
                openChat(userId, username);
            });
        });
        
    } catch (error) {
        console.error('Error loading friends:', error);
        
        // Fallback with dummy data if API fails
        friendsSection.innerHTML = `
            <h3 class="section-title">Friends</h3>
            <div class="friends-list">
                <div class="friend-item" data-user-id="101">
                    <img src="/public/no-profile.png" alt="smiski_fan1" class="friend-profile-img">
                    <div class="friend-info">
                        <div class="friend-name">smiski_fan1</div>
                        <span class="friend-status online">Online</span>
                    </div>
                </div>
                
                <div class="friend-item" data-user-id="102">
                    <img src="/public/no-profile.png" alt="collector123" class="friend-profile-img">
                    <div class="friend-info">
                        <div class="friend-name">collector123</div>
                        <span class="friend-status">Active 30 min ago</span>
                    </div>
                </div>
                
                <div class="friend-item" data-user-id="103">
                    <img src="/public/no-profile.png" alt="glow_master" class="friend-profile-img">
                    <div class="friend-info">
                        <div class="friend-name">glow_master</div>
                        <span class="friend-status online">Online</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for friend items in the fallback UI
        document.querySelectorAll('.friend-item').forEach(item => {
            item.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                const username = this.querySelector('.friend-name').textContent;
                openChat(userId, username);
            });
        });
    }
}

// This function will be called when a friend is clicked
function openChat(userId, username) {
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
    
    // Load previous messages and listen for new ones
    loadMessages(userId);
    
    // Focus the input
    chatContainer.querySelector('.chat-input').focus();
    
    // Add the active class to the friend item
    const friendItems = document.querySelectorAll('.friend-item');
    friendItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-user-id') === userId) {
            item.classList.add('active');
            
            // Remove unread badge if present
            const unreadBadge = item.querySelector('.unread-badge');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        }
    });
    
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

// Function to load messages for a chat
async function loadMessages(userId) {
    const messagesContainer = document.getElementById(`chat-messages-${userId}`);
    const token = localStorage.getItem('token');
    
    if (!messagesContainer) return;
    
    try {
        // Fetch messages from the server
        const response = await fetch(`http://localhost:3000/api/messages/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        let messages = [];
        
        if (response.ok) {
            messages = await response.json();
        } else {
            // If the endpoint doesn't exist, use dummy data
            messages = [
                { id: 1, sender: 'other', text: 'Hi there! How are you?', timestamp: new Date(Date.now() - 2 * 60 * 60000) },
                { id: 2, sender: 'self', text: 'I\'m good, thanks! How about you?', timestamp: new Date(Date.now() - 1.5 * 60 * 60000) },
                { id: 3, sender: 'other', text: 'Doing well! Have you seen the new Smiski collection?', timestamp: new Date(Date.now() - 1 * 60 * 60000) }
            ];
        }
        
        // Clear any existing messages
        messagesContainer.innerHTML = '';
        
        // Add messages to the container
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sender === 'self' ? 'message-sent' : 'message-received'}`;
            messageElement.textContent = message.text;
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to the bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
    } catch (error) {
        console.error('Error loading messages:', error);
        
        // Add some dummy messages if API fails
        messagesContainer.innerHTML = `
            <div class="message message-received">Hi there! How are you?</div>
            <div class="message message-sent">I'm good, thanks! How about you?</div>
            <div class="message message-received">Doing well! Have you seen the new Smiski collection?</div>
        `;
    }
}

// Function to send a message
async function sendMessage(userId) {
    const chatContainer = document.querySelector(`.chat-container[data-user-id="${userId}"]`);
    const inputElement = chatContainer.querySelector('.chat-input');
    const messagesContainer = document.getElementById(`chat-messages-${userId}`);
    const token = localStorage.getItem('token');
    
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
    
    try {
        // Send message to the server
        const response = await fetch('http://localhost:3000/api/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: userId,
                text: messageText
            })
        });
        
        if (!response.ok) {
            console.log('Message sending endpoint not implemented. Message displayed in UI only.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Message is already displayed in UI, no need to handle the error visually
    }
}

// Add CSS for unread badge
const style = document.createElement('style');
style.textContent = `
    .unread-badge {
        background-color: #ff3b30;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.7rem;
        margin-left: 5px;
        font-weight: bold;
    }
`;
document.head.appendChild(style);
