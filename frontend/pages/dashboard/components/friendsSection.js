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
        
        // Fetch pending friend requests
        const requestsResponse = await fetch('http://localhost:3000/api/friends/requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).catch(() => ({ ok: false }));
        
        let pendingRequests = [];
        
        if (requestsResponse && requestsResponse.ok) {
            pendingRequests = await requestsResponse.json();
            console.log('Pending friend requests:', pendingRequests);
        } else {
            // Add dummy pending requests for testing
            pendingRequests = [
                { 
                    requestId: 201, 
                    user: { 
                        id: 201, 
                        username: 'new_collector', 
                        profilePicture: null 
                    } 
                },
                { 
                    requestId: 202, 
                    user: { 
                        id: 202, 
                        username: 'smiski_lover99', 
                        profilePicture: null 
                    } 
                }
            ];
        }
        
        // Create friends section HTML with tabs
        let friendsSectionHtml = `
            <h3 class="section-title">Friends</h3>
            <div class="friends-tabs">
                <button class="tab-button active" data-tab="friends-tab">Friends</button>
                <button class="tab-button" data-tab="requests-tab">Requests ${pendingRequests.length > 0 ? `<span class="request-count">${pendingRequests.length}</span>` : ''}</button>
            </div>
            <div class="tab-content">
                <div id="friends-tab" class="tab-pane active">
                    <div class="friends-list">
        `;
        
        // Add friends to the friends tab
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
                
                friendsSectionHtml += `
                    <div class="friend-item" data-user-id="${friend.id}">
                        <img src="${friend.profilePicture || '/public/no-profile.png'}" alt="${friend.username}" class="friend-profile-img">
                        <div class="friend-info">
                            <div class="friend-name">${friend.username}</div>
                            ${statusText}
                        </div>
                        <button class="unfriend-btn" data-user-id="${friend.id}" data-username="${friend.username}">
                            <i class="fas fa-user-times"></i>
                        </button>
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
                </div>
                <div id="requests-tab" class="tab-pane">
                    <div class="friend-requests-list">
        `;
        
        // Add friend requests to the requests tab
        if (pendingRequests.length > 0) {
            pendingRequests.forEach(request => {
                const user = request.user || {};
                friendsSectionHtml += `
                    <div class="friend-request-item" data-request-id="${request.requestId}">
                        <img src="${user.profilePicture || '/public/no-profile.png'}" alt="${user.username}" class="friend-profile-img">
                        <div class="friend-info">
                            <div class="friend-name">${user.username}</div>
                            <div class="friend-request-actions">
                                <button class="accept-request-btn" data-request-id="${request.requestId}">Accept</button>
                                <button class="decline-request-btn" data-request-id="${request.requestId}">Decline</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            friendsSectionHtml += `
                <div class="no-requests">
                    <p>You don't have any friend requests at the moment.</p>
                </div>
            `;
        }
        
        friendsSectionHtml += `
                    </div>
                </div>
            </div>
        `;
        
        friendsSection.innerHTML = friendsSectionHtml;
        
        // Add event listeners for tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
        // Add event listeners for friend items to open chat
        document.querySelectorAll('.friend-item').forEach(item => {
            item.addEventListener('click', function(e) {
                // Don't open chat if the unfriend button was clicked
                if (e.target.closest('.unfriend-btn')) {
                    return;
                }
                
                const userId = this.getAttribute('data-user-id');
                const username = this.querySelector('.friend-name').textContent;
                openChat(userId, username);
            });
        });
        
        // Add event listeners for unfriend buttons
        document.querySelectorAll('.unfriend-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const userId = this.getAttribute('data-user-id');
                const username = this.getAttribute('data-username');
                
                console.log('Unfriend button clicked:', { userId, username });
                
                if (!userId) {
                    console.error('Error: userId is undefined on button', this);
                    return;
                }
                
                unfriendUser(userId, username);
            });
        });
        
        // Add event listeners for friend request buttons
        document.querySelectorAll('.accept-request-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const requestId = this.getAttribute('data-request-id');
                acceptFriendRequest(requestId);
            });
        });
        
        document.querySelectorAll('.decline-request-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event bubbling
                const requestId = this.getAttribute('data-request-id');
                declineFriendRequest(requestId);
            });
        });
        
    } catch (error) {
        console.error('Error loading friends:', error);
        
        // Fallback with dummy data if API fails
        friendsSection.innerHTML = `
            <h3 class="section-title">Friends</h3>
            <div class="friends-tabs">
                <button class="tab-button active" data-tab="friends-tab">Friends</button>
                <button class="tab-button" data-tab="requests-tab">Requests</button>
            </div>
            <div class="tab-content">
                <div id="friends-tab" class="tab-pane active">
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
                </div>
                <div id="requests-tab" class="tab-pane">
                    <div class="no-requests">
                        <p>You don't have any friend requests at the moment.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for tabs in the fallback UI
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
        
               // Add event listeners for friend items in the fallback UI
               document.querySelectorAll('.friend-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    // Don't open chat if the unfriend button was clicked
                    if (e.target.closest('.unfriend-btn')) {
                        return;
                    }
                    
                    const userId = this.getAttribute('data-user-id');
                    const username = this.querySelector('.friend-name').textContent;
                    openChat(userId, username);
                });
            });
            
            // Add event listeners for unfriend buttons in the fallback UI
            document.querySelectorAll('.unfriend-btn').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent event bubbling
                    const userId = this.getAttribute('data-user-id');
                    const username = this.getAttribute('data-username');
                    unfriendUser(userId, username);
                });
            });
    }
}

// Function to accept a friend request
async function acceptFriendRequest(requestId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/friends/accept/${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('Friend request accepted successfully');
            // Remove the request item from UI
            const requestItem = document.querySelector(`.friend-request-item[data-request-id="${requestId}"]`);
            if (requestItem) {
                requestItem.innerHTML = '<div class="request-success">Friend request accepted!</div>';
                setTimeout(() => {
                    requestItem.remove();
                    // Refresh the friends section to show the new friend
                    initializeFriendsSection();
                }, 2000);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to accept friend request:', errorData.message || 'Unknown error');
            alert(`Failed to accept friend request: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
        alert('Network error. Please try again later.');
    }
}

// Function to decline a friend request
async function declineFriendRequest(requestId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/friends/decline/${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('Friend request declined successfully');
            // Remove the request item from UI
            const requestItem = document.querySelector(`.friend-request-item[data-request-id="${requestId}"]`);
            if (requestItem) {
                requestItem.innerHTML = '<div class="request-declined">Friend request declined</div>';
                setTimeout(() => {
                    requestItem.remove();
                    
                    // Check if there are no more requests
                    const requestsList = document.querySelector('.friend-requests-list');
                    if (requestsList && requestsList.children.length === 0) {
                        requestsList.innerHTML = `
                            <div class="no-requests">
                                <p>You don't have any friend requests at the moment.</p>
                            </div>
                        `;
                    }
                    
                    // Update the request count in the tab
                    const requestsTab = document.querySelector('.tab-button[data-tab="requests-tab"]');
                    if (requestsTab) {
                        const remainingRequests = document.querySelectorAll('.friend-request-item').length;
                        if (remainingRequests > 0) {
                            requestsTab.innerHTML = `Requests <span class="request-count">${remainingRequests}</span>`;
                        } else {
                            requestsTab.textContent = 'Requests';
                        }
                    }
                }, 2000);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to decline friend request:', errorData.message || 'Unknown error');
            alert(`Failed to decline friend request: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error declining friend request:', error);
        alert('Network error. Please try again later.');
    }
}

// Function to unfriend a user
async function unfriendUser(userId, username) {
    // Now we'll use username as the primary identifier
    if (!username) {
        console.error('Error: username is undefined');
        alert('Error: Cannot unfriend user. Username is missing.');
        return;
    }
    
    // Confirm before unfriending
    if (!confirm(`Are you sure you want to unfriend ${username}?`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        console.log(`Attempting to unfriend user: ${username}`);
        
        const response = await fetch(`http://localhost:3000/api/friends/unfriend-by-username/${encodeURIComponent(username)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('Friend removed successfully');
            
            // Remove the friend item from UI - now using username to find the element
            const friendItem = document.querySelector(`.friend-item[data-user-id="${userId}"]`);
            if (friendItem) {
                friendItem.innerHTML = '<div class="friend-removed">Friend removed</div>';
                setTimeout(() => {
                    friendItem.remove();
                    
                    // Check if there are no more friends
                    const friendsList = document.querySelector('.friends-list');
                    if (friendsList && friendsList.querySelectorAll('.friend-item').length === 0) {
                        friendsList.innerHTML = `
                            <div class="no-friends">
                                <p>You haven't added any friends yet.</p>
                                <p>Find friends in the Explore section above!</p>
                            </div>
                        `;
                    }
                }, 2000);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to unfriend user:', errorData.message || 'Unknown error');
            alert(`Failed to unfriend user: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error unfriending user:', error);
        alert('Network error. Please try again later.');
    }
}

// Add CSS for tabs and other elements
const style = document.createElement('style');
style.textContent = `
    /* Tabs styling */
    .friends-tabs {
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 15px;
    }
    
    .tab-button {
        padding: 8px 15px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: #666;
        position: relative;
    }
    
    .tab-button.active {
        color: #4285f4;
        border-bottom: 2px solid #4285f4;
    }
    
    .tab-content {
        position: relative;
    }
    
    .tab-pane {
        display: none;
    }
    
    .tab-pane.active {
        display: block;
    }
    
    .request-count {
        background-color: #ff3b30;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 0.7rem;
        margin-left: 5px;
        font-weight: bold;
    }

    /* Friend requests styling */
    .friend-requests-section {
        margin-bottom: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 10px;
    }
    
    .subsection-title {
        font-size: 0.9rem;
        color: #666;
        margin: 5px 0 10px 0;
    }
    
    .friend-request-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 8px;
        margin-bottom: 8px;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .friend-request-actions {
        display: flex;
        gap: 5px;
        margin-top: 5px;
    }
    
    .accept-request-btn, .decline-request-btn {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    
    .accept-request-btn {
        background-color: #4CAF50;
        color: white;
    }
    
    .decline-request-btn {
        background-color: #f44336;
        color: white;
    }
    
    .request-success {
        color: #4CAF50;
        font-weight: bold;
        padding: 10px;
        text-align: center;
    }
    
    .request-declined {
        color: #f44336;
        font-style: italic;
        padding: 10px;
        text-align: center;
    }
    
    /* Friends list styling */
    .friends-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .friend-item {
        display: flex;
        align-items: center;
        padding: 10px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .friend-item:hover {
        background-color: #f0f0f0;
    }
    
    .friend-profile-img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 10px;
        object-fit: cover;
    }
    
    .friend-info {
        flex: 1;
    }
    
    .friend-name {
        font-weight: bold;
        margin-bottom: 2px;
    }
    
    .friend-status {
        font-size: 0.8rem;
        color: #666;
    }
    
    .friend-status.online {
        color: #4CAF50;
    }
    
    .no-friends {
        text-align: center;
        padding: 20px;
        color: #666;
    }

    /* Unfriend button styling */
    .unfriend-btn {
        background-color: transparent;
        color: #f44336;
        border: 1px solid #f44336;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 0.8rem;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s, background-color 0.2s;
    }
    
    .unfriend-btn:hover {
        opacity: 1;
        background-color: #ffebee;
    }
    
    .friend-removed {
        color: #f44336;
        font-style: italic;
        padding: 10px;
        text-align: center;
    }
`;
document.head.appendChild(style);
