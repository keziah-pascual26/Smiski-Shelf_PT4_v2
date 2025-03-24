// Explore Section Component for Suggested Users
document.addEventListener('DOMContentLoaded', function() {
    initializeExploreSection();
});

async function initializeExploreSection() {
    const exploreSection = document.getElementById('exploreSection');
    
    if (!exploreSection) {
        console.error('Explore section element not found');
        return;
    }
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }
    
    // Store all users for later use when expanding
    let allSuggestedUsers = [];
    let currentDisplayCount = 4; // Initial number of users to display
    
    try {
        // Show loading state
        exploreSection.innerHTML = `
            <h3 class="section-title">People You May Know</h3>
            <div class="loading-indicator">
                <p>Loading suggestions...</p>
            </div>
        `;
        
        // Fetch all users instead of just suggestions for better testing
        const response = await fetch('http://localhost:3000/api/users/all', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            allSuggestedUsers = await response.json();
        } else {
            // If the endpoint doesn't exist, try the suggestions endpoint
            const fallbackResponse = await fetch('http://localhost:3000/api/users/suggestions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(() => ({ ok: false }));
            
            if (fallbackResponse && fallbackResponse.ok) {
                allSuggestedUsers = await fallbackResponse.json();
            } else {
                // If both endpoints fail, use dummy data
                allSuggestedUsers = [
                    { id: 1, username: 'smiski_lover', bio: 'Collector of rare Smiski figures' },
                    { id: 2, username: 'night_glow', bio: 'I love how they glow in the dark!' },
                    { id: 3, username: 'mini_collector', bio: 'Tiny treasures, big happiness' },
                    { id: 4, username: 'rare_finds', bio: 'Hunting for the rarest Smiskis' },
                    { id: 5, username: 'toy_photographer', bio: 'Capturing miniature moments' },
                    { id: 6, username: 'glow_master', bio: 'Specializing in glow-in-the-dark Smiskis' },
                    { id: 7, username: 'tiny_world', bio: 'Creating miniature scenes with Smiskis' },
                    { id: 8, username: 'smiski_fan', bio: 'Biggest Smiski fan in town!' }
                ];
            }
        }
        
// Function to render users
function renderUsers() {
    // Create explore section HTML
    let exploreSectionHtml = `
        <h3 class="section-title">People You May Know</h3>
        <div id="suggestedUsersContainer">
    `;
    
    // Make sure we have users to display
    if (allSuggestedUsers && allSuggestedUsers.length > 0) {
        // Sort users - move users who are already friends to the end
        const sortedUsers = [...allSuggestedUsers].sort((a, b) => {
            // If user has a friendStatus property (added during checkFriendStatus)
            if (a.friendStatus === 'accepted' && b.friendStatus !== 'accepted') {
                return 1; // Move 'a' to the end if it's a friend
            } else if (a.friendStatus !== 'accepted' && b.friendStatus === 'accepted') {
                return -1; // Move 'b' to the end if it's a friend
            }
            return 0; // Keep original order for other cases
        });
        
        // Limit to currentDisplayCount users
        const limitedUsers = sortedUsers.slice(0, currentDisplayCount);
        
        // Add suggested users
        limitedUsers.forEach(user => {
            exploreSectionHtml += `
                <div class="suggested-user" data-user-id="${user._id || user.id}">
                    <img src="${user.profilePicture || '/public/default-avatar.png'}" alt="${user.username}" class="suggested-user-img">
                    <div class="suggested-user-info">
                        <div class="suggested-user-name">${user.username}</div>
                        <div class="suggested-user-bio">${user.bio || 'Smiski enthusiast'}</div>
                    </div>
                    <button class="add-friend-btn ${user.friendStatus === 'pending' ? 'added' : ''} ${user.friendStatus === 'accepted' ? 'friends' : ''}" 
                            data-user-id="${user._id || user.id}"
                            ${user.friendStatus === 'accepted' ? 'disabled' : ''}>
                        ${user.friendStatus === 'pending' ? 'Request Sent' : 
                          user.friendStatus === 'accepted' ? 'Friends' : 'Add Friend'}
                    </button>
                </div>
            `;
        });
        
        exploreSectionHtml += `</div>`;
        
        // Add a "See More" link if there are more users to show
        if (currentDisplayCount < allSuggestedUsers.length) {
            exploreSectionHtml += `
                <div class="see-more">
                    <a href="#" id="seeMoreLink">See More</a>
                </div>
            `;
        } else if (currentDisplayCount > 4) {
            // Add a "See Less" link if we're showing expanded list
            exploreSectionHtml += `
                <div class="see-more">
                    <a href="#" id="seeLessLink">See Less</a>
                </div>
            `;
        }
    } else {
        // If no users are available
        exploreSectionHtml += `
            <div class="no-suggested-users">
                <p>No suggested users found at the moment.</p>
                <p>Check back later!</p>
            </div>
        </div>
        `;
    }
    
    exploreSection.innerHTML = exploreSectionHtml;
    
    // Add event listeners for Add Friend buttons
    document.querySelectorAll('.add-friend-btn').forEach(button => {
        button.addEventListener('click', handleFriendButtonClick);
    });
    
    // Add event listener for See More link
    const seeMoreLink = document.getElementById('seeMoreLink');
    if (seeMoreLink) {
        seeMoreLink.addEventListener('click', function(e) {
            e.preventDefault();
            currentDisplayCount = allSuggestedUsers.length; // Show all users
            renderUsers();
        });
    }
    
    // Add event listener for See Less link
    const seeLessLink = document.getElementById('seeLessLink');
    if (seeLessLink) {
        seeLessLink.addEventListener('click', function(e) {
            e.preventDefault();
            currentDisplayCount = 4; // Reset to initial count
            renderUsers();
        });
    }
    
    // Check friend status after rendering if we don't already have status info
    if (!allSuggestedUsers.some(user => user.hasOwnProperty('friendStatus'))) {
        checkFriendStatus();
    }
}

// Separate the friend button click handler for clarity
async function handleFriendButtonClick() {
    const userId = this.getAttribute('data-user-id');
    // Get the username from the DOM element
    const recipientUsername = this.closest('.suggested-user').querySelector('.suggested-user-name').textContent;
    
    // Check if this is a cancel request action
    if (this.classList.contains('added')) {
        // This is a cancel request action
        try {
            this.disabled = true;
            this.textContent = 'Canceling...';
            
            // Send request to cancel the friend request
            const response = await fetch(`http://localhost:3000/api/friends/cancel/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Reset button to original state
                this.textContent = 'Add Friend';
                this.classList.remove('added');
                this.disabled = false;
                console.log('Friend request canceled successfully');
            } else {
                // Handle error
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to cancel friend request:', errorData.message || 'Unknown error');
                
                // Keep the button in "Request Sent" state
                this.textContent = 'Request Sent';
                this.disabled = false;
                
                alert(`Failed to cancel friend request: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error canceling friend request:', error);
            this.textContent = 'Request Sent';
            this.disabled = false;
            alert('Network error. Please try again later.');
        }
        return;
    }
    
    // Original add friend functionality
    try {
        // Disable button immediately to prevent multiple clicks
        this.disabled = true;
        this.textContent = 'Sending...';
        
        // Send friend request with both userId and recipientUsername
        const response = await fetch('http://localhost:3000/api/friends/request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                userId,
                recipientUsername 
            })
        });
        
        // Try to get response data regardless of status code
        const responseData = await response.json().catch(() => ({}));
        console.log('Friend request response:', response.status, responseData);
        
        if (response.ok) {
            // Update button appearance based on response status
            if (responseData.status === 'pending') {
                this.textContent = 'Request Sent';
                this.classList.add('added');
            } else if (responseData.status === 'accepted') {
                this.textContent = 'Friends';
                this.classList.add('friends');
            } else if (responseData.status === 'already_requested') {
                this.textContent = 'Request Sent';
                this.classList.add('added');
            } else if (responseData.status === 'already_friends') {
                this.textContent = 'Friends';
                this.classList.add('friends');
            } else {
                this.textContent = 'Add Friend';
                this.disabled = false;
            }
        } else {
            // Handle specific error cases
            if (response.status === 400 && responseData.message && responseData.message.includes('already pending')) {
                // If request is already pending, update UI to show that
                console.log('Request already pending, updating UI');
                this.textContent = 'Request Sent';
                this.classList.add('added');
                this.disabled = false; // Enable button to allow cancellation
            } else if (response.status === 400 && responseData.message && responseData.message.includes('already friends')) {
                // If already friends, update UI to show that
                console.log('Already friends, updating UI');
                this.textContent = 'Friends';
                this.classList.add('friends');
                this.disabled = true;
            } else {
                // For other errors, reset the button
                console.error('Friend request failed:', responseData.message || 'Unknown error');
                this.textContent = 'Add Friend';
                this.disabled = false;
                
                // Only show alert for errors that aren't related to request already sent
                if (!(responseData.message && responseData.message.includes('already pending'))) {
                    alert(`Failed to send friend request: ${responseData.message || 'Unknown error'}`);
                }
            }
        }
    } catch (error) {
        console.error('Error sending friend request:', error);
        
        // Reset button state on error
        this.textContent = 'Add Friend';
        this.disabled = false;
        alert('Network error. Please try again later.');
    }
}

// Function to check friend status for all users
async function checkFriendStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/friends/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const statusData = await response.json();
            console.log('Friend status data:', statusData); // Debug log
            
            // Update user objects with friend status
            allSuggestedUsers = allSuggestedUsers.map(user => {
                const userId = user._id || user.id;
                const status = statusData[userId];
                return {
                    ...user,
                    friendStatus: status || null
                };
            });
            
            // Update buttons based on friend status
            document.querySelectorAll('.add-friend-btn').forEach(button => {
                const userId = button.getAttribute('data-user-id');
                const status = statusData[userId];
                
                if (status === 'pending') {
                    button.textContent = 'Request Sent';
                    button.classList.add('added');
                    button.disabled = false; // Enable button to allow cancellation
                } else if (status === 'accepted') {
                    button.textContent = 'Friends';
                    button.classList.add('friends');
                    button.disabled = true;
                }
            });
            
            // Re-render the users to apply the sorting
            renderUsers();
        } else {
            console.error('Failed to fetch friend status');
        }
    } catch (error) {
        console.error('Error checking friend status:', error);
    }
}
        
        // Initial render
        renderUsers();
        
    } catch (error) {
        console.error('Error loading suggested users:', error);
        
        // Fallback with dummy data if API fails
        allSuggestedUsers = [
            { id: 1, username: 'smiski_lover', bio: 'Collector of rare Smiski figures' },
            { id: 2, username: 'night_glow', bio: 'I love how they glow in the dark!' },
            { id: 3, username: 'mini_collector', bio: 'Tiny treasures, big happiness' },
            { id: 4, username: 'rare_finds', bio: 'Hunting for the rarest Smiskis' },
            { id: 5, username: 'toy_photographer', bio: 'Capturing miniature moments' }
        ];
        
        // Render with fallback data
        renderUsers();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add CSS styles for button states
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .add-friend-btn.added {
            background-color: #f0f0f0;
            color: #666;
        }
        
        .add-friend-btn.friends {
            background-color: #4267B2;
            color: white;
        }
    `;
    document.head.appendChild(styleElement);
    
    initializeExploreSection();
});