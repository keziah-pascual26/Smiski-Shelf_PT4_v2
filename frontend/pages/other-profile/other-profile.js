document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/login.html';
        return;
    }
    
    // Get the username from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromUrl = urlParams.get('username');
    const usernameFromSession = sessionStorage.getItem('viewProfileUsername');
    
    // Use username from URL or sessionStorage, clear sessionStorage after using it
    let targetUsername = usernameFromUrl || usernameFromSession;
    
    // Store the username in sessionStorage to preserve it during page reloads
    // Only if it came from the URL and not already in sessionStorage
    if (usernameFromUrl && !usernameFromSession) {
        sessionStorage.setItem('viewProfileUsername', usernameFromUrl);
    }
    
    // If we have a username in sessionStorage but not in URL, update the URL
    // This ensures the URL is correct after a page reload
    if (!usernameFromUrl && usernameFromSession) {
        // Update URL without reloading the page
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('username', usernameFromSession);
        window.history.pushState({}, '', newUrl.toString());
        targetUsername = usernameFromSession;
    }
    
    if (!targetUsername) {
        showError('No username provided. Unable to load profile.');
        return;
    }
    
    console.log('Loading profile for username:', targetUsername); // Debug log
    
    // Elements - Add null checks to prevent errors if elements don't exist
    const profileUsername = document.getElementById('profileUsername');
    const profileBio = document.getElementById('profileBio');
    const profilePicture = document.getElementById('profilePicture');
    const postsCount = document.getElementById('postsCount');
    const friendsCount = document.getElementById('friendsCount');
    const storiesCount = document.getElementById('storiesCount');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const friendActionBtn = document.getElementById('friendActionBtn');
    
    // Add this function to retrieve and display profile picture
    async function retrieveProfilePicture(username) {
        try {
            console.log('Retrieving profile picture for:', username);
            
            // Fetch user data to get profile picture
            const response = await fetch(`http://localhost:3000/api/users/byUsername/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch user data: ${response.status}`);
            }
            
            const userData = await response.json();
            console.log('User data retrieved:', userData);
            
            // Update profile picture if element exists
            if (profilePicture) {
                if (userData.profilePicture) {
                    // Use the full URL to the profile picture
                    profilePicture.src = `http://localhost:3000${userData.profilePicture}`;
                    console.log('Profile picture set to:', profilePicture.src);
                } else {
                    // Use default profile picture
                    profilePicture.src = '/public/no-profile.png';
                    console.log('Using default profile picture');
                }
            }
            
            return userData;
        } catch (error) {
            console.error('Error retrieving profile picture:', error);
            // Set default profile picture on error
            if (profilePicture) {
                profilePicture.src = '/public/no-profile.png';
            }
            return null;
        }
    }
    
    // Call the function to retrieve profile picture when loading the profile
    try {
        // Load user profile data
        const userData = await loadTargetUserProfile(targetUsername);
        
        // Retrieve and display profile picture
        await retrieveProfilePicture(targetUsername);
        
        // Load user stats
        await loadUserStats(targetUsername);
        
        // Load initial tab content (posts by default)
        await loadUserPosts(targetUsername);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile. Please try again later.');
    }
        
        // Tab switching functionality
if (tabButtons && tabButtons.length > 0) {
    // Initialize tab content containers
    tabContents.forEach(content => {
        // Hide all tabs except the active one
        if (!content.classList.contains('active')) {
            content.style.display = 'none';
        } else {
            content.style.display = 'block';
        }
    });
    
    // Track which tabs have been loaded
    const loadedTabs = {
        'posts-content': true, // Posts tab is loaded by default
        'stories-content': false,
        'liked-content': false
    };
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the tab ID from the button
            const tabName = button.getAttribute('data-tab');
            const tabId = `${tabName}-content`;
            
            // Hide all tab contents
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // Show the selected tab content
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.style.display = 'block';
                tabContent.classList.add('active');
                
                // Load content if it hasn't been loaded before
                if (!loadedTabs[tabId]) {
                    if (tabId === 'posts-content') {
                        loadUserPosts(targetUsername);
                    } else if (tabId === 'stories-content') {
                        loadUserStories(targetUsername);
                    } else if (tabId === 'liked-content') {
                        loadUserLikedPosts(targetUsername);
                    }
                    loadedTabs[tabId] = true;
                } else {
                    // Reload content even if it was loaded before
                    // This ensures content is always displayed
                    if (tabId === 'posts-content') {
                        loadUserPosts(targetUsername);
                    } else if (tabId === 'stories-content') {
                        loadUserStories(targetUsername);
                    } else if (tabId === 'liked-content') {
                        loadUserLikedPosts(targetUsername);
                    }
                }
            }
        });
    });
}
    
// Update the loadUserLikedPosts function to check privacy
async function loadUserLikedPosts(username) {
    const userLikedFeed = document.getElementById('userLikedFeed');
    userLikedFeed.innerHTML = '<div class="loading">Loading liked posts...</div>';
    
    // Check if profile is private
    const profileContainer = document.querySelector('.profile-container');
    
    try {
        // Make sure we're passing the visited user's username, not the logged-in user
        const response = await fetch(`http://localhost:3000/posts/liked?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch liked posts: ${response.status} ${response.statusText}`);
        }
        
        const posts = await response.json();
        console.log(`Loaded ${posts.length} liked posts for user ${username}:`, posts);
        
        if (posts.length === 0) {
            userLikedFeed.innerHTML = `
                <div class="empty-state">
                    <h3>No liked posts yet</h3>
                    <p>${username} hasn't liked any posts yet.</p>
                </div>
            `;
            return;
        }
        
        // Render posts
        userLikedFeed.innerHTML = '';
        posts.forEach(post => {
            const postElement = createPostElement(post);
            userLikedFeed.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading liked posts:', error);
        userLikedFeed.innerHTML = `
            <div class="empty-state">
                <h3>Error loading liked posts</h3>
                <p>We couldn't load the liked posts. Please try again later.</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}

async function loadTargetUserProfile(username) {
    try {
        console.log('Fetching profile data for:', username); // Debug log
        
        // Try to get user data directly from the user profile endpoint
        try {
            // FIXED: Use the correct API endpoint that matches your backend routes
            // The endpoint in userRoutes.js is '/user/profile' not '/api/users/profile/:username'
            const userResponse = await fetch(`http://localhost:3000/api/user/profile/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Check if response is OK before trying to parse JSON
            if (!userResponse.ok) {
                console.error(`API returned status: ${userResponse.status}`);
                // Try to get the error message from the response
                const errorText = await userResponse.text();
                console.error('Error response:', errorText);
                throw new Error(`Failed to fetch user profile: ${userResponse.status}`);
            }
            
            // Now try to parse the JSON
            const userData = await userResponse.json();
            console.log('User data received directly:', userData);
            
            // Store privacy setting in the profile container
            const profileContainer = document.querySelector('.profile-page-container');
            if (profileContainer) {
                // Explicitly check the boolean value to ensure correct privacy setting
                profileContainer.dataset.isPublic = userData.isProfilePublic === false ? 'false' : 'true';
                console.log('Profile privacy status from DB:', userData.isProfilePublic);
            }
            
            updateProfileUI(userData);
            
            // Apply privacy restrictions to tabs based on profile privacy
            applyPrivacyRestrictions(userData.isProfilePublic);
            
            return userData;
        } catch (userError) {
            console.error('Could not fetch user directly:', userError);
            
            // Try another endpoint specifically for getting user by username
            try {
                const usernameResponse = await fetch(`http://localhost:3000/api/users/byUsername/${encodeURIComponent(username)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (usernameResponse.ok) {
                    const userData = await usernameResponse.json();
                    console.log('User data received by username:', userData);
                    
                    // Store privacy setting
                    const profileContainer = document.querySelector('.profile-page-container');
                    if (profileContainer) {
                        profileContainer.dataset.isPublic = userData.isProfilePublic === false ? 'false' : 'true';
                    }
                    
                    updateProfileUI(userData);
                    applyPrivacyRestrictions(userData.isProfilePublic);
                    return userData;
                }
            } catch (usernameError) {
                console.error('Could not fetch user by username:', usernameError);
            }
        }
        
        // Fallback to posts endpoint
let response = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
}

const posts = await response.json();
console.log('Posts data received:', posts); // Debug log

// Try to get privacy status directly from the database
let isProfilePublic = true; // Default value
try {
    const privacyResponse = await fetch(`http://localhost:3000/api/users/privacy/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (privacyResponse.ok) {
        const privacyData = await privacyResponse.json();
        isProfilePublic = privacyData.isProfilePublic;
        console.log('Privacy status from DB:', isProfilePublic);
    }
} catch (privacyError) {
    console.log('Could not fetch privacy status, using default (public):', privacyError);
}

if (posts && posts.length > 0) {
    // Extract user info from the first post
    const userData = {
        username: posts[0].username,
        bio: 'No bio available', // Posts don't contain bio
        profilePicture: posts[0].userProfilePicture || null,
        _id: posts[0].userId, // This might be undefined depending on your post model
        isProfilePublic: isProfilePublic // Use the value from the database
    };
    
    console.log('Extracted user data from posts:', userData);
    
    // FIXED: Use the correct container selector
    const profileContainer = document.querySelector('.profile-page-container');
    if (profileContainer) {
        profileContainer.dataset.isPublic = userData.isProfilePublic ? 'true' : 'false';
    }
    // Add this line before returning userData in each case:
    applyPrivacyRestrictions(isProfilePublic);
    // Update profile information
    updateProfileUI(userData);
    return userData;
} else {
    // No posts found, create basic profile
    const userData = {
        username: username,
        bio: 'No bio available',
        profilePicture: null,
        _id: null,
        isProfilePublic: isProfilePublic // Use the value from the database
    };
    
    console.log('No posts found, created basic user data:', userData);
            
            // FIXED: Use the correct container selector
            const profileContainer = document.querySelector('.profile-page-container');
            if (profileContainer) {
                profileContainer.dataset.isPublic = userData.isProfilePublic ? 'true' : 'false';
            }
            
            // Update profile information with basic data
            updateProfileUI(userData);
            return userData;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        
        // Even if there's an error, still create a basic profile
        const userData = {
            username: username,
            bio: 'No bio available',
            profilePicture: null,
            _id: null,
            isProfilePublic: true // Default to public if we can't determine
        };
        
        // FIXED: Use the correct container selector
        const profileContainer = document.querySelector('.profile-page-container');
        if (profileContainer) {
            profileContainer.dataset.isPublic = userData.isProfilePublic ? 'true' : 'false';
        }
        
        updateProfileUI(userData);
        return userData;
    }
}

// Update the applyPrivacyRestrictions function to consider friendship
function applyPrivacyRestrictions(isPublic) {
    console.log('Applying privacy restrictions, isPublic:', isPublic);
    
    // Get all tab buttons and content sections
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Get the user ID from the profile container
    const profileContainer = document.querySelector('.profile-page-container');
    const userId = profileContainer ? profileContainer.dataset.userId : null;
    
    // If the profile is private, check if the users are friends before restricting access
    if (!isPublic && userId) {
        checkIsFriend(userId).then(isFriend => {
            if (isFriend) {
                // If they're friends, don't restrict access
                console.log('Users are friends, not restricting access to private profile');
                enableAllTabs(tabButtons, tabContents);
            } else {
                // If they're not friends, restrict access
                console.log('Users are not friends, restricting access to private profile');
                restrictAccess(tabButtons, tabContents);
            }
        });
    } else if (!isPublic) {
        // If we don't have the user ID or the profile is private, restrict access
        restrictAccess(tabButtons, tabContents);
    } else {
        // If the profile is public, enable all tabs
        enableAllTabs(tabButtons, tabContents);
    }
}

// Helper function to enable all tabs
function enableAllTabs(tabButtons, tabContents) {
    // If profile is public, ensure all tabs are enabled
    tabButtons.forEach(button => {
        // Remove any lock icons
        button.innerHTML = button.innerHTML.replace('<i class="fas fa-lock"></i> ', '');
        button.classList.remove('disabled');
        button.disabled = false;
        
        // Restore original click behavior
        button.onclick = null;
    });
    
    // Show tabs container
    const tabsContainer = document.querySelector('.profile-tabs');
    if (tabsContainer) {
        tabsContainer.style.display = 'flex';
    }
}

// Helper function to restrict access to tabs
function restrictAccess(tabButtons, tabContents) {
    // If profile is private, disable all tabs except the main profile tab
    tabButtons.forEach(button => {
        const tabName = button.getAttribute('data-tab');
        
        // Skip the main profile tab (usually 'about' or 'profile')
        if (tabName !== 'profile') {
            // Add a lock icon and disabled class
            button.innerHTML = `<i class="fas fa-lock"></i> ${button.textContent}`;
            button.classList.add('disabled');
            button.disabled = true;
            
            // Add click handler to show privacy message
            button.onclick = (e) => {
                e.preventDefault();
                alert('This content is private');
                return false;
            };
        }
    });
    
    // Add privacy message to all content tabs except profile
    tabContents.forEach(content => {
        const tabId = content.id;
        
        if (!tabId.includes('profile')) {
            content.innerHTML = `
                <div class="private-content">
                    <i class="fas fa-lock"></i>
                    <h3>Private Content</h3>
                    <p>This user has set their content to private.</p>
                </div>
            `;
        }
    });
    
    // Hide tabs if profile is private
    const tabsContainer = document.querySelector('.profile-tabs');
    if (tabsContainer) {
        tabsContainer.style.display = 'none';
    }
    
    // Show privacy message in content area
    const contentContainer = document.querySelector('.profile-content');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="private-profile-message">
                <i class="fas fa-lock"></i>
                <h2>This profile is private</h2>
                <p>The user has chosen to keep their content private.</p>
            </div>
        `;
    }
}

async function checkIsFriend(userId) {
    try {
        // Get current user ID from token
        const currentUserId = await getCurrentUserId();
        
        console.log('FRIENDSHIP CHECK:');
        console.log('Current user ID:', currentUserId);
        console.log('Visited profile user ID:', userId);
        
        if (!currentUserId || !userId) {
            console.error('Missing user IDs for friendship check');
            return false;
        }
        
        // Try the direct friendship check endpoint first
        try {
            const response = await fetch(`http://localhost:3000/api/friends/check/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to check friendship status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Direct friendship check result:', data);
            
            return data.areFriends;
        } catch (error) {
            console.error('Error with direct friendship check:', error);
            
            // Fallback to the status endpoint
            try {
                const statusResponse = await fetch(`http://localhost:3000/api/friends/status/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!statusResponse.ok) {
                    throw new Error('Failed to check friendship status with fallback method');
                }
                
                const statusData = await statusResponse.json();
                console.log('Fallback friendship status check result:', statusData);
                
                // Check if status is 'accepted' or 'friends'
                return statusData.status === 'accepted' || statusData.status === 'friends';
            } catch (fallbackError) {
                console.error('Error with fallback friendship check:', fallbackError);
                
                // Last resort - try a manual check by username
                try {
                    const username = document.getElementById('profileUsername')?.textContent;
                    if (username) {
                        const manualResponse = await fetch(`http://localhost:3000/api/friends/check-by-username/${encodeURIComponent(username)}`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (manualResponse.ok) {
                            const manualData = await manualResponse.json();
                            console.log('Manual username friendship check result:', manualData);
                            return manualData.areFriends;
                        }
                    }
                } catch (manualError) {
                    console.error('Error with manual friendship check:', manualError);
                }
                
                return false;
            }
        }
    } catch (error) {
        console.error('Error checking if users are friends:', error);
        return false;
    }
}

// Helper function to get current user ID from token
async function getCurrentUserId() {
    try {
        // Try to decode the token locally first
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }
        
        // Try to extract user ID from token payload
        try {
            // Split the token and get the payload part
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid token format');
            }
            
            // Decode the payload
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Decoded token payload:', payload);
            
            // Check if payload has user ID
            if (payload && payload.id) {
                console.log('Found user ID in token:', payload.id);
                return payload.id;
            }
        } catch (decodeError) {
            console.log('Could not decode token locally:', decodeError);
            // Continue to server-side verification if local decoding fails
        }
        
        // If local decoding fails, try server endpoint
        const response = await fetch('http://localhost:3000/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch current user data');
        }
        
        const userData = await response.json();
        console.log('User data from /api/users/me:', userData);
        return userData._id;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        
        // Last resort - try to get user ID from localStorage if it was stored there
        const userId = localStorage.getItem('userId');
        if (userId) {
            console.log('Using user ID from localStorage:', userId);
            return userId;
        }
        
        return null;
    }
}

// Update the updateProfileUI function to include friendship status check
function updateProfileUI(userData) {
    if (profileUsername) profileUsername.textContent = userData.username;
    if (profileBio) profileBio.textContent = userData.bio || 'No bio available';
    
    if (profilePicture) {
        if (userData.profilePicture) {
            // Update to use the full URL to the profile picture
            profilePicture.src = userData.profilePicture ? 
                `http://localhost:3000${userData.profilePicture}` : 
                '/public/default-avatar.png';
        } else {
            profilePicture.src = '/public/default-avatar.png';
        }
    }
    
    // Check if profile is private
    const isPublic = userData.isProfilePublic !== undefined ? Boolean(userData.isProfilePublic) : true;
    console.log('Profile privacy status in updateProfileUI:', isPublic, 'Raw value:', userData.isProfilePublic);
    
    // Store user ID for later use
    const profileContainer = document.querySelector('.profile-page-container');
    if (profileContainer && userData._id) {
        profileContainer.dataset.userId = userData._id;
        console.log('Stored visited profile user ID in DOM:', userData._id);
    } else {
        console.warn('Could not store user ID - Container or ID missing:', {
            container: !!profileContainer,
            userId: userData._id
        });
    }
    
    // If user has an ID, check if they're friends with the current user
    if (userData._id) {
        console.log('About to check friendship status with user ID:', userData._id);
        checkIsFriend(userData._id).then(isFriend => {
            console.log('Are users friends?', isFriend);
            
            // Add a friendship badge to the profile if they are friends
            const profileHeader = document.querySelector('.profile-header');
            const friendshipBadge = document.querySelector('.friendship-badge') || document.createElement('div');
            friendshipBadge.className = 'friendship-badge';
            
            if (isFriend) {
                friendshipBadge.innerHTML = '<i class="fas fa-user-friends"></i> Friends';
                friendshipBadge.style.display = 'block';
                
                // If the badge doesn't exist yet, add it to the profile header
                if (!document.querySelector('.friendship-badge') && profileHeader) {
                    profileHeader.appendChild(friendshipBadge);
                }
                
                // If the profile is private but they're friends, allow access to content
                if (!isPublic) {
                    console.log('Profile is private but users are friends, allowing access');
                    applyPrivacyRestrictions(true); // Treat as public for friends
                }
            } else {
                // If they're not friends, remove the badge if it exists
                if (document.querySelector('.friendship-badge')) {
                    friendshipBadge.remove();
                }
                
                // Apply privacy restrictions based on profile status
                applyPrivacyRestrictions(isPublic);
            }
        });
    } else {
        // If no user ID, just apply privacy restrictions
        console.warn('No user ID available, cannot check friendship status');
        applyPrivacyRestrictions(isPublic);
    }
    
    // Check friendship status and update UI accordingly
    if (userData._id && friendActionBtn) {
        checkFriendshipStatus(userData._id);
    }
}
    
            // Function to load user stats
    async function loadUserStats(username) {
        try {
            // Since we don't have a proper stats endpoint, let's count posts manually
            const postsResponse = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            let postsCount = 0;
            if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                postsCount = postsData.length;
                console.log(`Found ${postsCount} posts for user ${username}`);
            }
            
            // Create a stats object with the data we have
            const stats = {
                posts: postsCount,
                friends: 0, // We don't have a way to count friends easily
                stories: 0  // We don't have a way to count stories easily
            };
            
            console.log('User stats:', stats); // Debug log
            
            // Update stats in UI if elements exist
            if (document.getElementById('postsCount')) document.getElementById('postsCount').textContent = stats.posts || 0;
            if (document.getElementById('friendsCount')) document.getElementById('friendsCount').textContent = stats.friends || 0;
            if (document.getElementById('storiesCount')) document.getElementById('storiesCount').textContent = stats.stories || 0;
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Set default values if stats can't be loaded
            if (document.getElementById('postsCount')) document.getElementById('postsCount').textContent = '0';
            if (document.getElementById('friendsCount')) document.getElementById('friendsCount').textContent = '0';
            if (document.getElementById('storiesCount')) document.getElementById('storiesCount').textContent = '0';
        }
    }

    // Function to show error message
    function showError(message) {
        console.error('Error:', message);
        
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create a non-intrusive error banner at the top
        const errorBanner = document.createElement('div');
        errorBanner.className = 'error-message';
        errorBanner.style.cssText = 'background-color: #f8d7da; color: #721c24; padding: 10px; margin-bottom: 15px; border-radius: 4px; text-align: center; position: relative;';
        
        errorBanner.innerHTML = `
            <span style="font-weight: bold;">Error:</span> ${message}
            <span class="close-error" style="position: absolute; right: 10px; top: 10px; cursor: pointer; font-weight: bold;">&times;</span>
            <a href="/pages/dashboard/dashboard.html" style="margin-left: 15px; color: #721c24; text-decoration: underline;">Return to Dashboard</a>
        `;
        
        // Insert at the top of the page
        const mainContent = document.querySelector('main') || document.body;
        mainContent.insertBefore(errorBanner, mainContent.firstChild);
        
        // Add close button functionality
        errorBanner.querySelector('.close-error').addEventListener('click', () => {
            errorBanner.remove();
        });
    }
    
    // Function to check friendship status
async function checkFriendshipStatus(targetUserId) {
    try {
        const response = await fetch(`http://localhost:3000/api/friends/status/${targetUserId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch friendship status');
        }
        
        const { status } = await response.json();
        console.log('Friendship status from API:', status);
        
        // Update friend action button based on status
        if (friendActionBtn) {
            switch(status) {
                case 'none':
                    friendActionBtn.textContent = 'Add Friend';
                    friendActionBtn.className = 'action-btn add-friend';
                    friendActionBtn.onclick = () => sendFriendRequest(targetUserId);
                    break;
                case 'pending_sent':
                    friendActionBtn.textContent = 'Cancel Request';
                    friendActionBtn.className = 'action-btn cancel-request';
                    friendActionBtn.onclick = () => cancelFriendRequest(targetUserId);
                    break;
                case 'pending_received':
                    friendActionBtn.textContent = 'Accept Request';
                    friendActionBtn.className = 'action-btn accept-request';
                    friendActionBtn.onclick = () => acceptFriendRequest(targetUserId);
                    break;
                case 'friends':
                case 'accepted': // Add this case to handle 'accepted' status
                    friendActionBtn.textContent = 'Unfriend';
                    friendActionBtn.className = 'action-btn unfriend';
                    friendActionBtn.onclick = () => unfriend(targetUserId);
                    break;
                default:
                    friendActionBtn.style.display = 'none';
            }
            
            // Show the button after status is determined
            friendActionBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking friendship status:', error);
        if (friendActionBtn) {
            friendActionBtn.style.display = 'none';
        }
    }
}
    
    // Friend action functions
    async function sendFriendRequest(targetUserId) {
        try {
            const response = await fetch('http://localhost:3000/api/friends/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: targetUserId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to send friend request');
            }
            
            // Update UI
            checkFriendshipStatus(targetUserId);
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert('Failed to send friend request. Please try again.');
        }
    }
    
    async function cancelFriendRequest(targetUserId) {
        try {
            const response = await fetch(`http://localhost:3000/api/friends/cancel/${targetUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to cancel friend request');
            }
            
            // Update UI
            checkFriendshipStatus(targetUserId);
        } catch (error) {
            console.error('Error canceling friend request:', error);
            alert('Failed to cancel friend request. Please try again.');
        }
    }
    
    async function acceptFriendRequest(targetUserId) {
        try {
            const response = await fetch(`http://localhost:3000/api/friends/accept/${targetUserId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to accept friend request');
            }
            
            // Update UI
            checkFriendshipStatus(targetUserId);
            // Refresh friends count
            loadUserStats(targetUsername);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            alert('Failed to accept friend request. Please try again.');
        }
    }
    
    async function unfriend(targetUserId) {
        try {
            const response = await fetch(`http://localhost:3000/api/friends/unfriend/${targetUserId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to unfriend user');
            }
            
            // Update UI
            checkFriendshipStatus(targetUserId);
            // Refresh friends count
            loadUserStats(targetUsername);
        } catch (error) {
            console.error('Error unfriending user:', error);
            alert('Failed to unfriend user. Please try again.');
        }
    }
    
// Fix the privacy check in loadUserPosts
async function loadUserPosts(username) {
    const userPostsFeed = document.getElementById('userPostsFeed');
    userPostsFeed.innerHTML = '<div class="loading">Loading posts...</div>';
    
    // Check if profile is private - FIXED: Use the correct container and string comparison
    const profileContainer = document.querySelector('.profile-page-container');
    const isPublic = profileContainer ? profileContainer.dataset.isPublic === 'true' : true;
    
    try {
        // Using the correct endpoint format from your postRoutes.js
        // The route is '/posts?username=X' not '/posts/user/X'
        const response = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
        }
        
        const posts = await response.json();
        console.log(`Loaded ${posts.length} posts for user ${username}:`, posts);
        
        if (posts.length === 0) {
            userPostsFeed.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>${username} hasn't shared any posts yet.</p>
                </div>
            `;
            return;
        }
        
        // Render posts
        userPostsFeed.innerHTML = '';
        posts.forEach(post => {
            const postElement = createPostElement(post);
            userPostsFeed.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        userPostsFeed.innerHTML = `
            <div class="empty-state">
                <h3>Error loading posts</h3>
                <p>We couldn't load the posts. Please try again later.</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}
    
    // Function to load user stories
async function loadUserStories(username) {
    const userStoriesFeed = document.getElementById('userStoriesFeed');
    userStoriesFeed.innerHTML = '<div class="loading">Loading stories...</div>';
    
    // Check if profile is private
    const profileContainer = document.querySelector('.profile-container');
    
    try {
        const response = await fetch(`http://localhost:3000/api/stories/user/${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }
        
        const stories = await response.json();
        
        if (stories.length === 0) {
            userStoriesFeed.innerHTML = `
                <div class="empty-state">
                    <h3>No stories yet</h3>
                    <p>${username} hasn't shared any stories yet.</p>
                </div>
            `;
            return;
        }
        
        // Render stories
        userStoriesFeed.innerHTML = '';
        stories.forEach(story => {
            const storyElement = createStoryElement(story);
            userStoriesFeed.appendChild(storyElement);
        });
    } catch (error) {
        console.error('Error loading stories:', error);
        userStoriesFeed.innerHTML = `
            <div class="empty-state">
                <h3>Error loading stories</h3>
                <p>We couldn't load the stories. Please try again later.</p>
            </div>
        `;
    }
}
    
    // Function to load user friends
    async function loadUserFriends(username) {
        const userFriendsFeed = document.getElementById('userFriendsFeed');
        userFriendsFeed.innerHTML = '<div class="loading">Loading friends...</div>';
        
        try {
            const response = await fetch(`http://localhost:3000/api/friends/list/${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch friends');
            }
            
            const friends = await response.json();
            
            if (friends.length === 0) {
                userFriendsFeed.innerHTML = `
                    <div class="empty-state">
                        <h3>No friends yet</h3>
                        <p>${username} hasn't added any friends yet.</p>
                    </div>
                `;
                return;
            }
            
            // Render friends
            userFriendsFeed.innerHTML = '<div class="friends-grid"></div>';
            const friendsGrid = userFriendsFeed.querySelector('.friends-grid');
            
            friends.forEach(friend => {
                const friendElement = document.createElement('div');
                friendElement.className = 'friend-card';
                friendElement.innerHTML = `
                    <img src="${friend.profilePicture ? `/uploads/${friend.profilePicture}` : '/public/no-profile.png'}" alt="${friend.username}" class="friend-avatar">
                    <h3 class="friend-name">${friend.username}</h3>
                    <p class="friend-bio">${friend.bio || 'No bio available'}</p>
                    <a href="/pages/other-profile/other-profile.html?username=${encodeURIComponent(friend.username)}" class="view-profile-btn">View Profile</a>
                `;
                friendsGrid.appendChild(friendElement);
            });
        } catch (error) {
            console.error('Error loading friends:', error);
            userFriendsFeed.innerHTML = `
                <div class="empty-state">
                    <h3>Error loading friends</h3>
                    <p>We couldn't load the friends list. Please try again later.</p>
                </div>
            `;
        }
    }
    
    // Helper function to create a post element
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        
        // Format timestamp
        const timestamp = formatTimestamp(post.createdAt);
        
        // Create media HTML if post has media
        let mediaContent = '';
        if (post.media && post.media.length > 0) {
            mediaContent = `
                <div class="post-media">
                    ${post.media.map(file => {
                        const fileExtension = file.split('.').pop().toLowerCase();
                        if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                            return `
                                <video controls>
                                    <source src="/uploads/${file}" type="video/${fileExtension}">
                                    Your browser does not support the video tag.
                                </video>`;
                        } else {
                            return `<img src="/uploads/${file}" alt="Post Image">`;
                        }
                    }).join('')}
                </div>
            `;
        }
        
        // Get current username from localStorage
        const currentUsername = localStorage.getItem('username');
        
        // Check if current user has liked the post
        const userLiked = (post.likes || []).some(like => like.username === currentUsername);
        
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.userProfilePicture || '/public/no-profile.png'}" alt="User Profile">
                <span class="username">${post.username}</span>
                <span class="timestamp">• ${timestamp}</span>
                ${post.originalPostId ? `• Reposted from original post` : ''}
            </div>
            <div class="post-content">
                <p>${post.text}</p>
                ${mediaContent}
            </div>
            <div class="post-footer">
                <button class="like-button ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                    <i class="fa fa-heart"></i> ${post.likes?.length || 0}
                </button>
                <button class="comment-button" data-id="${post._id}">
                    <i class="fa fa-comment"></i> ${post.comments?.length || 0}
                </button>
            </div>
            <div class="comment-section" id="comment-section-${post._id}">
                ${(post.comments || []).map(comment => `
                    <div class="comment" data-comment-id="${comment._id}">
                        <span class="comment-username">${comment.username}</span>: 
                        <span class="comment-text">${comment.text}</span>
                        ${comment.username === currentUsername ? `
                            <button class="delete-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">
                                <i class="fa fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('') || '<div>No comments yet</div>'}
                <input type="text" class="comment-input" placeholder="Add a comment..." data-id="${post._id}">
            </div>
        `;
        
        // Add event listeners
        const likeButton = postElement.querySelector('.like-button');
        if (likeButton) {
            likeButton.addEventListener('click', () => {
                toggleLike(post._id, likeButton);
            });
        }
        
        const commentInput = postElement.querySelector('.comment-input');
        if (commentInput) {
            commentInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    addComment(post._id, commentInput);
                }
            });
        }
        
        const deleteCommentButtons = postElement.querySelectorAll('.delete-comment-button');
        deleteCommentButtons.forEach(button => {
            button.addEventListener('click', () => {
                const commentId = button.getAttribute('data-comment-id');
                if (confirm('Are you sure you want to delete this comment?')) {
                    deleteComment(post._id, commentId);
                }
            });
        });
        
        return postElement;
    }
    
    // Helper function to create a story element
    function createStoryElement(story) {
        const storyElement = document.createElement('div');
        storyElement.className = 'story-card';
        
        // Format timestamp
        const timestamp = formatTimestamp(story.createdAt);
        
        // Create media HTML
        let mediaHtml = '';
        if (story.media && story.media.length > 0) {
            const mediaFile = story.media[0]; // Use first media file
            const fileExtension = mediaFile.split('.').pop().toLowerCase();
            
            if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                mediaHtml = `
                    <div class="story-media">
                        <video>
                            <source src="/uploads/${mediaFile}" type="video/${fileExtension}">
                            Your browser does not support the video tag.
                        </video>
                        <div class="play-indicator">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                `;
            } else {
                mediaHtml = `
                    <div class="story-media">
                        <img src="/uploads/${mediaFile}" alt="Story Image">
                    </div>
                `;
            }
        }
        
        storyElement.innerHTML = `
            <div class="story-header">
                <h3>${story.title}</h3>
                <span class="story-timestamp">${timestamp}</span>
            </div>
            ${mediaHtml}
            <p class="story-description">${story.description}</p>
            <div class="story-footer">
                <button class="view-story-btn" data-id="${story._id}">View Story</button>
            </div>
        `;
        
        // Add event listeners
        const viewButton = storyElement.querySelector('.view-story-btn');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                // Implement story viewer functionality
                viewStory(story);
            });
        }
        
        return storyElement;
    }
    
    // Function to view a story
    function viewStory(story) {
        // Create a modal for viewing the story
        const modal = document.createElement('div');
        modal.className = 'story-modal';
        
        let mediaContent = '';
        if (story.media && story.media.length > 0) {
            const mediaFile = story.media[0];
            const fileExtension = mediaFile.split('.').pop().toLowerCase();
            
            if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                mediaContent = `
                    <video controls autoplay>
                        <source src="/uploads/${mediaFile}" type="video/${fileExtension}">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else {
                mediaContent = `<img src="/uploads/${mediaFile}" alt="Story Image">`;
            }
        }
        
        modal.innerHTML = `
            <div class="story-modal-content">
                <span class="close-modal">&times;</span>
                <h2>${story.title}</h2>
                <div class="story-media-container">
                    ${mediaContent}
                </div>
                <p>${story.description}</p>
                <div class="story-info">
                    <span>Posted by ${story.username}</span>
                    <span>${formatTimestamp(story.createdAt)}</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking the close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    // Function to toggle like on a post
    async function toggleLike(postId, likeButton) {
        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to toggle like');
            }
            
            // Update UI optimistically
            const likesCountElement = likeButton.querySelector('i').nextSibling;
            const currentLikes = parseInt(likesCountElement.textContent.trim());
            
            if (likeButton.classList.contains('liked')) {
                likeButton.classList.remove('liked');
                likesCountElement.textContent = ` ${currentLikes - 1}`;
            } else {
                likeButton.classList.add('liked');
                likesCountElement.textContent = ` ${currentLikes + 1}`;
            }
            
        } catch (error) {
            console.error('Error toggling like:', error);
            alert('Failed to like/unlike post. Please try again.');
        }
    }
    
    // Function to add a comment to a post
    async function addComment(postId, commentInput) {
        const commentText = commentInput.value.trim();
        if (!commentText) return;
        
        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: commentText })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add comment');
            }
            
            // Reload posts to show new comment
            loadUserPosts(targetUsername);
            
            // Clear input
            commentInput.value = '';
            
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }
    
    // Function to delete a comment
    async function deleteComment(postId, commentId) {
        try {
            const response = await fetch(`http://localhost:3000/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete comment');
            }
            
            // Reload posts to reflect the deleted comment
            loadUserPosts(targetUsername);
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. Please try again.');
        }
    }
    
    // Helper function to format timestamp
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return `${diffInSeconds}s ago`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        } else if (diffInSeconds < 604800) {
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    // Function to show error message
    function showError(message) {
        const container = document.querySelector('.profile-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <a href="/pages/dashboard/dashboard.html" class="btn">Return to Dashboard</a>
                </div>
            `;
        } else {
            alert(message);
        }
    }
});