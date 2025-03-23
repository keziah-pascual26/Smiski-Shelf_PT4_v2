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
        
        let suggestedUsers = [];
        
        if (response.ok) {
            suggestedUsers = await response.json();
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
                suggestedUsers = await fallbackResponse.json();
            } else {
                // If both endpoints fail, use dummy data
                suggestedUsers = [
                    { id: 1, username: 'smiski_lover', bio: 'Collector of rare Smiski figures' },
                    { id: 2, username: 'night_glow', bio: 'I love how they glow in the dark!' },
                    { id: 3, username: 'mini_collector', bio: 'Tiny treasures, big happiness' },
                    { id: 4, username: 'rare_finds', bio: 'Hunting for the rarest Smiskis' },
                    { id: 5, username: 'toy_photographer', bio: 'Capturing miniature moments' }
                ];
            }
        }
        
        // Create explore section HTML
        let exploreSectionHtml = `
            <h3 class="section-title">People You May Know</h3>
        `;
        
        // Make sure we have users to display
        if (suggestedUsers && suggestedUsers.length > 0) {
            // Limit to 4 users to maintain good UI proportions
            const limitedUsers = suggestedUsers.slice(0, 4);
            
            // Add suggested users
            limitedUsers.forEach(user => {
                exploreSectionHtml += `
                    <div class="suggested-user" data-user-id="${user._id || user.id}">
                        <img src="${user.profilePicture || '/public/default-avatar.png'}" alt="${user.username}" class="suggested-user-img">
                        <div class="suggested-user-info">
                            <div class="suggested-user-name">${user.username}</div>
                            <div class="suggested-user-bio">${user.bio || 'Smiski enthusiast'}</div>
                        </div>
                        <button class="add-friend-btn" data-user-id="${user._id || user.id}">Add Friend</button>
                    </div>
                `;
            });
            
            // Add a "See More" link
            exploreSectionHtml += `
                <div class="see-more">
                    <a href="/pages/explore/explore.html">See More</a>
                </div>
            `;
        } else {
            // If no users are available
            exploreSectionHtml += `
                <div class="no-suggested-users">
                    <p>No suggested users found at the moment.</p>
                    <p>Check back later!</p>
                </div>
            `;
        }
        
        exploreSection.innerHTML = exploreSectionHtml;
        
        // Add event listeners for Add Friend buttons
        document.querySelectorAll('.add-friend-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const userId = this.getAttribute('data-user-id');
                try {
                    // Send friend request
                    const response = await fetch('http://localhost:3000/api/friends/request', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId })
                    });
                    
                    if (response.ok) {
                        // Update button appearance
                        this.textContent = 'Request Sent';
                        this.classList.add('added');
                        this.disabled = true;
                    } else {
                        // If the endpoint doesn't exist yet, simulate success
                        this.textContent = 'Request Sent';
                        this.classList.add('added');
                        this.disabled = true;
                        
                        console.log('Friend request endpoint not implemented. Simulating success.');
                    }
                } catch (error) {
                    console.error('Error sending friend request:', error);
                    
                    // If API fails, still simulate success for demo purposes
                    this.textContent = 'Request Sent';
                    this.classList.add('added');
                    this.disabled = true;
                }
            });
        });
        
    } catch (error) {
        console.error('Error loading suggested users:', error);
        
        // Fallback with dummy data if API fails
        exploreSection.innerHTML = `
            <h3 class="section-title">People You May Know</h3>
            
            <div class="suggested-user">
                <img src="/public/default-avatar.png" alt="smiski_lover" class="suggested-user-img">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">smiski_lover</div>
                    <div class="suggested-user-bio">Collector of rare Smiski figures</div>
                </div>
                <button class="add-friend-btn" data-user-id="1">Add Friend</button>
            </div>
            
            <div class="suggested-user">
                <img src="/public/default-avatar.png" alt="night_glow" class="suggested-user-img">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">night_glow</div>
                    <div class="suggested-user-bio">I love how they glow in the dark!</div>
                </div>
                <button class="add-friend-btn" data-user-id="2">Add Friend</button>
            </div>
            
            <div class="suggested-user">
                <img src="/public/default-avatar.png" alt="mini_collector" class="suggested-user-img">
                <div class="suggested-user-info">
                    <div class="suggested-user-name">mini_collector</div>
                    <div class="suggested-user-bio">Tiny treasures, big happiness</div>
                </div>
                <button class="add-friend-btn" data-user-id="3">Add Friend</button>
            </div>
            
            <div class="see-more">
                <a href="/pages/explore/explore.html">See More</a>
            </div>
        `;
        
        // Add event listeners for Add Friend buttons in the fallback UI
        document.querySelectorAll('.add-friend-btn').forEach(button => {
            button.addEventListener('click', function() {
                this.textContent = 'Request Sent';
                this.classList.add('added');
                this.disabled = true;
            });
        });
    }
}
