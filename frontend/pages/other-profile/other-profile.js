document.addEventListener('DOMContentLoaded', async function() {
    // Add post styles to the page
    const postStyles = document.createElement('style');
    postStyles.textContent = `
        /* Post Card Styles */
        .post-card {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            margin-left: auto;
            margin-right: auto;
            overflow: hidden;
            transition: box-shadow 0.3s ease;
            width: 100%;
            max-width: 700px;
        }
        
        .post-card:hover {
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
        
        /* Post Header */
        .post-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .post-user-info {
            display: flex;
            align-items: center;
        }
        
        .post-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 12px;
            border: 1px solid #eaeaea;
        }
        
        .post-user-details {
            display: flex;
            flex-direction: column;
        }
        
        .post-username {
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }
        
        .post-time {
            font-size: 12px;
            color: #777;
        }
        
        /* Post Actions Dropdown */
        .post-actions-dropdown {
            position: relative;
        }
        
        .post-menu-btn {
            background: none;
            border: none;
            color: #777;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: background-color 0.2s;
        }
        
        .post-menu-btn:hover {
            background-color: #f5f5f5;
        }
        
        .post-dropdown-content {
            display: none;
            position: absolute;
            right: 0;
            background-color: white;
            min-width: 120px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border-radius: 4px;
            z-index: 1;
            overflow: hidden;
        }
        
        .post-dropdown-content.show {
            display: block;
        }
        
        .dropdown-item {
            display: block;
            width: 100%;
            text-align: left;
            padding: 8px 12px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
            background-color: #f5f5f5;
        }
        
        .delete-post, .report-post {
            color: #e74c3c;
        }
        
        /* Post Content */
        .post-content {
            padding: 16px;
        }
        
        .post-text {
            margin: 0 0 12px;
            font-size: 14px;
            line-height: 1.5;
            color: #333;
            white-space: pre-wrap;
        }
        
        .post-media {
            margin-top: 12px;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .post-image {
            width: 100%;
            max-height: 500px;
            object-fit: contain;
            border-radius: 8px;
            cursor: pointer;
        }
        
        .post-media video {
            width: 100%;
            max-height: 500px;
            border-radius: 8px;
        }
        
        /* Post Stats */
        .post-stats {
            display: flex;
            justify-content: space-between;
            padding: 0 16px 8px;
            font-size: 13px;
            color: #777;
        }
        
        /* Post Actions */
        .post-actions {
            display: flex;
            border-top: 1px solid #f0f0f0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .post-action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            background: none;
            border: none;
            cursor: pointer;
            color: #555;
            font-size: 13px;
            transition: background-color 0.2s;
        }
        
        .post-action-btn:hover {
            background-color: #f5f5f5;
        }
        
        .post-action-btn i {
            margin-right: 6px;
            font-size: 16px;
        }
        
        .like-button.liked {
            color: #e74c3c;
        }
        
        .like-button.liked i {
            color: #e74c3c;
        }
        
        /* Comment Section */
        .comment-section {
            padding: 12px 16px;
            background-color: #f9f9f9;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .no-comments {
            text-align: center;
            color: #777;
            font-size: 13px;
            padding: 10px 0;
        }
        
        .comments-list {
            margin-bottom: 12px;
        }
        
        .comment {
            display: flex;
            margin-bottom: 12px;
            position: relative;
        }
        
        .comment-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 10px;
        }
        
        .comment-content {
            flex: 1;
            background-color: white;
            border-radius: 18px;
            padding: 8px 12px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            position: relative;
        }
        
        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .comment-username {
            font-weight: 600;
            font-size: 13px;
            color: #333;
        }
        
        .comment-time {
            font-size: 11px;
            color: #777;
        }
        
        .comment-text {
            margin: 0;
            font-size: 13px;
            line-height: 1.4;
            color: #333;
            word-break: break-word;
        }
        
        .comment-actions {
            position: absolute;
            right: 8px;
            bottom: 4px;
            display: none;
        }
        
        .comment:hover .comment-actions {
            display: block;
        }
        
        .delete-comment-button {
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
            transition: color 0.2s;
        }
        
        .delete-comment-button:hover {
            color: #e74c3c;
        }
        
        /* Comment Form */
        .comment-form {
            display: flex;
            align-items: center;
            margin-top: 12px;
        }
        
        .comment-input {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 8px 12px;
            font-size: 13px;
            margin: 0 8px;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .comment-input:focus {
            border-color: #3897f0;
        }
        
        .comment-submit {
            background: none;
            border: none;
            color: #3897f0;
            cursor: pointer;
            padding: 5px;
            font-size: 16px;
            transition: color 0.2s;
        }
        
        .comment-submit:hover {
            color: #1877f2;
        }
        
        /* Loading and Empty States */
        .loading, .empty-state {
            text-align: center;
            padding: 30px 20px;
            color: #777;
        }
        
        .empty-state h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .error-details {
            margin-top: 10px;
            font-size: 12px;
            color: #e74c3c;
        }
    `;
    document.head.appendChild(postStyles);

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
    
async function loadUserStories(username) {
    const userStoriesFeed = document.getElementById('userStoriesFeed');
    if (!userStoriesFeed) {
        console.error('Stories feed container not found');
        return;
    }
    
    userStoriesFeed.innerHTML = '<div class="loading">Loading stories...</div>';
    
    try {
        console.log(`Fetching stories for user: ${username}`);
        // Fix the URL to match the backend route structure
        // Remove the 'api/' prefix since your storyRoutes.js doesn't use it
        const url = `http://localhost:3000/stories/user/${encodeURIComponent(username)}`;
        console.log(`Request URL: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Log response details for debugging
        console.log('Stories response status:', response.status);
        console.log('Stories response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            let errorText = '';
            try {
                const errorData = await response.json();
                errorText = errorData.error || response.statusText;
            } catch (e) {
                const rawText = await response.text();
                console.log('Raw response text (first 100 chars):', rawText.substring(0, 100));
                errorText = `${response.statusText} - Not valid JSON`;
            }
            
            throw new Error(`Failed to fetch stories: ${response.status} ${errorText}`);
        }
        
        // Check content type to ensure we're getting JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const rawText = await response.text();
            console.log('Unexpected content type:', contentType);
            console.log('Raw response text (first 100 chars):', rawText.substring(0, 100));
            throw new Error(`Expected JSON but got ${contentType || 'unknown content type'}`);
        }
        
        const stories = await response.json();
        console.log(`Loaded ${stories.length} stories for user ${username}:`, stories);
        
        if (stories.length === 0) {
            userStoriesFeed.innerHTML = `
                <div class="empty-state">
                    <h3>No stories yet</h3>
                    <p>${username} hasn't posted any stories yet.</p>
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
                <p class="error-details">${error.message}</p>
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
    postElement.className = 'post-card';
    
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
                                <source src="http://localhost:3000/uploads/${file}" type="video/${fileExtension}">
                                Your browser does not support the video tag.
                            </video>`;
                    } else {
                        return `<img src="http://localhost:3000/uploads/${file}" alt="Post Image" class="post-image">`;
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
            <div class="post-user-info">
                <img src="${post.userProfilePicture ? `http://localhost:3000${post.userProfilePicture}` : '/public/no-profile.png'}" alt="${post.username}" class="post-avatar">
                <div class="post-user-details">
                    <span class="post-username">${post.username}</span>
                    <span class="post-time">${timestamp}</span>
                </div>
            </div>
            <div class="post-actions-dropdown">
                <button class="post-menu-btn"><i class="fas fa-ellipsis-h"></i></button>
                <div class="post-dropdown-content">
                    ${post.username === currentUsername ? 
                        `<button class="dropdown-item edit-post" data-id="${post._id}">Edit</button>
                         <button class="dropdown-item delete-post" data-id="${post._id}">Delete</button>` : 
                        `<button class="dropdown-item report-post" data-id="${post._id}">Report</button>`}
                </div>
            </div>
        </div>
        <div class="post-content">
            <p class="post-text">${post.text}</p>
            ${mediaContent}
        </div>
        <div class="post-stats">
            <span class="like-count">${post.likes?.length || 0} likes</span>
            <span class="comment-count">${post.comments?.length || 0} comments</span>
        </div>
        <div class="post-actions">
            <button class="post-action-btn like-button ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                <i class="fa${userLiked ? 's' : 'r'} fa-heart"></i> Like
            </button>
            <button class="post-action-btn comment-button" data-id="${post._id}">
                <i class="far fa-comment"></i> Comment
            </button>
            <button class="post-action-btn share-button" data-id="${post._id}">
                <i class="far fa-share-square"></i> Share
            </button>
        </div>
        <div class="comment-section" id="comment-section-${post._id}">
            ${(post.comments || []).length > 0 ? `
                <div class="comments-list">
                    ${(post.comments || []).map(comment => `
                        <div class="comment" data-comment-id="${comment._id}">
                            <img src="${comment.userProfilePicture ? `http://localhost:3000${comment.userProfilePicture}` : '/public/no-profile.png'}" alt="${comment.username}" class="comment-avatar">
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-username">${comment.username}</span>
                                    <span class="comment-time">${formatTimestamp(comment.createdAt)}</span>
                                </div>
                                <p class="comment-text">${comment.text}</p>
                                ${comment.username === currentUsername ? `
                                    <div class="comment-actions">
                                        <button class="delete-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="no-comments">No comments yet</div>'}
            <div class="comment-form">
                <img src="${localStorage.getItem('profilePicture') ? `http://localhost:3000${localStorage.getItem('profilePicture')}` : '/public/no-profile.png'}" alt="Your profile" class="comment-avatar">
                <input type="text" class="comment-input" placeholder="Write a comment..." data-id="${post._id}">
                <button class="comment-submit" data-id="${post._id}"><i class="fas fa-paper-plane"></i></button>
            </div>
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
    const commentSubmit = postElement.querySelector('.comment-submit');
    
    if (commentInput) {
        commentInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                addComment(post._id, commentInput);
            }
        });
    }
    
    if (commentSubmit) {
        commentSubmit.addEventListener('click', () => {
            addComment(post._id, commentInput);
        });
    }
    
    const commentButton = postElement.querySelector('.comment-button');
    if (commentButton) {
        commentButton.addEventListener('click', () => {
            const commentSection = postElement.querySelector('.comment-section');
            if (commentSection.style.display === 'none' || !commentSection.style.display) {
                commentSection.style.display = 'block';
                commentInput.focus();
            } else {
                commentSection.style.display = 'none';
            }
        });
    }
    
    const deleteCommentButtons = postElement.querySelectorAll('.delete-comment-button');
deleteCommentButtons.forEach(button => {
    button.addEventListener('click', () => {
        const commentId = button.getAttribute('data-comment-id');
        // Add validation to ensure commentId exists
        if (!commentId) {
            console.error('Comment ID is missing from delete button');
            alert('Cannot delete this comment. Missing identifier.');
            return;
        }
        
        if (confirm('Are you sure you want to delete this comment?')) {
            deleteComment(post._id, commentId);
        }
    });
});
    
    // Add dropdown menu functionality
    const menuBtn = postElement.querySelector('.post-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = postElement.querySelector('.post-dropdown-content');
            dropdown.classList.toggle('show');
        });
    }
    
    // Add event listeners for edit/delete post if it's the user's post
    const editPostBtn = postElement.querySelector('.edit-post');
    if (editPostBtn) {
        editPostBtn.addEventListener('click', () => {
            // Implement edit post functionality
            alert('Edit post functionality will be implemented soon');
        });
    }
    
    const deletePostBtn = postElement.querySelector('.delete-post');
    if (deletePostBtn) {
        deletePostBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this post?')) {
                // Implement delete post functionality
                alert('Delete post functionality will be implemented soon');
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.post-dropdown-content');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('show');
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
                        <source src="http://localhost:3000/uploads/${mediaFile}" type="video/${fileExtension}">
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
                    <img src="http://localhost:3000/uploads/${mediaFile}" alt="Story Image">
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
                    <source src="http://localhost:3000/uploads/${mediaFile}" type="video/${fileExtension}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            mediaContent = `<img src="http://localhost:3000/uploads/${mediaFile}" alt="Story Image">`;
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
        const likeIcon = likeButton.querySelector('i');
        const likesCountElement = likeButton.closest('.post-card').querySelector('.like-count');
        const currentLikesText = likesCountElement.textContent;
        const currentLikes = parseInt(currentLikesText.split(' ')[0]);
        
        if (likeButton.classList.contains('liked')) {
            likeButton.classList.remove('liked');
            likeIcon.classList.remove('fas');
            likeIcon.classList.add('far');
            likesCountElement.textContent = `${currentLikes - 1} likes`;
        } else {
            likeButton.classList.add('liked');
            likeIcon.classList.remove('far');
            likeIcon.classList.add('fas');
            likesCountElement.textContent = `${currentLikes + 1} likes`;
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
        
        const result = await response.json();
        
        // Update UI without reloading the entire post list
        const commentSection = commentInput.closest('.comment-section');
        const commentsList = commentSection.querySelector('.comments-list') || document.createElement('div');
        
        if (!commentSection.querySelector('.comments-list')) {
            commentsList.className = 'comments-list';
            // Remove "no comments" message if it exists
            const noComments = commentSection.querySelector('.no-comments');
            if (noComments) {
                noComments.remove();
            }
            commentSection.insertBefore(commentsList, commentSection.querySelector('.comment-form'));
        }
        
        // Create new comment element
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.dataset.commentId = result.commentId;
        
        const currentUsername = localStorage.getItem('username');
        const profilePicture = localStorage.getItem('profilePicture');
        
        newComment.innerHTML = `
            <img src="${profilePicture ? `http://localhost:3000${profilePicture}` : '/public/no-profile.png'}" alt="${currentUsername}" class="comment-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username">${currentUsername}</span>
                    <span class="comment-time">Just now</span>
                </div>
                <p class="comment-text">${commentText}</p>
                <div class="comment-actions">
                    <button class="delete-comment-button" data-id="${postId}" data-comment-id="${result.commentId}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add delete functionality to the new comment
        const deleteBtn = newComment.querySelector('.delete-comment-button');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this comment?')) {
                    deleteComment(postId, result.commentId);
                }
            });
        }
        
        // Add the new comment to the list
        commentsList.appendChild(newComment);
        
        // Update comment count
        const commentCountElement = commentInput.closest('.post-card').querySelector('.comment-count');
        const currentCount = parseInt(commentCountElement.textContent.split(' ')[0]);
        commentCountElement.textContent = `${currentCount + 1} comments`;
        
        // Clear input
        commentInput.value = '';
        
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment. Please try again.');
    }
}

// Function to delete a comment
async function deleteComment(postId, commentId) {
    // Add validation to prevent undefined commentId
    if (!commentId) {
        console.error('Cannot delete comment: Comment ID is undefined');
        alert('Unable to delete this comment. Missing comment identifier.');
        return;
    }
    
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
        
        // Update UI without reloading the entire post list
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            const commentSection = commentElement.closest('.comment-section');
            commentElement.remove();
            
            // Update comment count
            const postCard = commentSection.closest('.post-card');
            const commentCountElement = postCard.querySelector('.comment-count');
            const currentCount = parseInt(commentCountElement.textContent.split(' ')[0]);
            commentCountElement.textContent = `${currentCount - 1} comments`;
            
            // If no more comments, show "no comments" message
            const commentsList = commentSection.querySelector('.comments-list');
            if (commentsList && commentsList.children.length === 0) {
                commentsList.remove();
                const noComments = document.createElement('div');
                noComments.className = 'no-comments';
                noComments.textContent = 'No comments yet';
                commentSection.insertBefore(noComments, commentSection.querySelector('.comment-form'));
            }
        }
        
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