document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login/login.html';
        return;
    }
    
    // Elements
    const profileUsername = document.getElementById('profileUsername');
    const profileBio = document.getElementById('profileBio');
    const profilePicture = document.getElementById('profilePicture');
    const postsCount = document.getElementById('postsCount');
    const friendsCount = document.getElementById('friendsCount');
    const storiesCount = document.getElementById('storiesCount');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfilePictureBtn = document.getElementById('editProfilePictureBtn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const privacyToggle = document.getElementById('privacyToggle');
    const privacyStatus = document.getElementById('privacyStatus');
    
    // Load user profile data
    loadUserProfile();
    
    // Load initial content (posts tab is active by default)
    loadUserPosts();
    
    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-content`).classList.add('active');
            
            // Load content based on selected tab
            if (tabName === 'posts') {
                loadUserPosts();
            } else if (tabName === 'stories') {
                loadUserStories();
            } else if (tabName === 'liked') {
                loadLikedPosts();
            }
        });
    });
    
    // Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = '/pages/userprofile/userprofile.html#profile';
        });
    }
    
    // Edit profile picture button
    if (editProfilePictureBtn) {
        editProfilePictureBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    uploadProfilePicture(file);
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            document.body.removeChild(fileInput);
        });
    }
    
    async function loadUserProfile() {
        try {
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            
            const userData = await response.json();
            
            // Update profile information
            if (profileUsername) profileUsername.textContent = userData.username;
            if (profileBio) profileBio.textContent = userData.bio || 'No bio yet...';
            
            // Update profile picture
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
            
            // Set privacy toggle state based on user data
            if (privacyToggle && privacyStatus) {
                privacyToggle.checked = !userData.isProfilePublic; // Toggle is ON when profile is private
                updatePrivacyStatusText(userData.isProfilePublic);
            }
    
            // Get the username from the profile data
            const username = userData.username;
            
            // Fetch and update posts count
            await updatePostsCount(username);
            
            // Fetch and update friends count
            await updateFriendsCount();
            
            // Update stories count with recent stories count
            await updateRecentStoriesCount();
            
            return userData;
        } catch (error) {
            console.error('Error loading profile:', error);
            showError('Failed to load profile. Please try again later.');
        }
    }
    
    // Function to retrieve profile picture for comments and posts
    async function retrieveProfilePicture(username) {
        try {
            // Check if it's the current user
            const currentUsername = localStorage.getItem('username');
            if (username === currentUsername) {
                // Use the profile picture already loaded for the current user
                const currentUserPic = document.getElementById('profilePicture');
                if (currentUserPic && currentUserPic.src && !currentUserPic.src.includes('no-profile.png')) {
                    return currentUserPic.src;
                }
            }
            
            // Fetch the user's profile data to get their profile picture
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
            
            // Return the profile picture URL or default image
            if (userData.profilePicture) {
                return `http://localhost:3000${userData.profilePicture}`;
            } else {
                return '/public/no-profile.png';
            }
        } catch (error) {
            console.error(`Error retrieving profile picture for ${username}:`, error);
            return '/public/no-profile.png'; // Default image on error
        }
    }

// Add these new functions for privacy toggle
function updatePrivacyStatusText(isPublic) {
    privacyStatus.textContent = isPublic ? 'Public' : 'Private';
    privacyStatus.style.color = isPublic ? '#729c2f' : '#e74c3c';
}

async function updatePrivacySetting(isPublic) {
    try {
        const response = await fetch('http://localhost:3000/api/user/privacy', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isPublic })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update privacy setting');
        }
        
        const result = await response.json();
        console.log('Privacy setting updated:', result);
        
        // Update the UI
        updatePrivacyStatusText(isPublic);
        
    } catch (error) {
        console.error('Error updating privacy setting:', error);
        alert('Failed to update privacy setting. Please try again.');
        
        // Revert toggle state on error
        privacyToggle.checked = !isPublic;
    }
}

// Add this to your event listeners section
if (privacyToggle) {
    privacyToggle.addEventListener('change', function() {
        const isPublic = !this.checked; // Toggle is ON when profile is private
        updatePrivacySetting(isPublic);
    });
}

// Add a new function to fetch and update friends count
async function updateFriendsCount() {
    try {
        const response = await fetch('http://localhost:3000/api/friends', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }
        
        const friendsData = await response.json();
        
        // Update the friends count in the UI
        const count = friendsData.length;
        friendsCount.textContent = count;
        
        console.log(`✅ Updated friends count: ${count}`);
        return count;
    } catch (error) {
        console.error('Error fetching friends count:', error);
        friendsCount.textContent = '0';
        return 0;
    }
}

// Add a new function to fetch and update posts count
async function updatePostsCount(username) {
    try {
        const response = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        
        const posts = await response.json();
        
        // Update the posts count in the UI
        const count = posts.length;
        postsCount.textContent = count;
        
        console.log(`✅ Updated posts count: ${count}`);
        return count;
    } catch (error) {
        console.error('Error fetching posts count:', error);
        postsCount.textContent = '0';
        return 0;
    }
}

// Function to fetch and update recent stories count
async function updateRecentStoriesCount() {
    try {
        const response = await fetch('http://localhost:3000/stories/mystories', {
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
        
        // Calculate stories posted in the last 24 hours
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const recentStories = stories.filter(story => {
            const storyDate = new Date(story.createdAt);
            return storyDate >= twentyFourHoursAgo;
        });
        
        // Update the stories count in the UI to show only recent stories count
        if (storiesCount) {
            storiesCount.textContent = `${recentStories.length}`;
        }
        
        console.log(`✅ Updated stories count: ${stories.length} total, ${recentStories.length} recent`);
        return recentStories.length;
    } catch (error) {
        console.error('Error fetching recent stories count:', error);
        if (storiesCount) storiesCount.textContent = '0';
        return 0;
    }
}
    
    // Function to load user stats
    async function loadUserStats() {
        try {
            const response = await fetch('http://localhost:3000/api/user/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const stats = await response.json();
                postsCount.textContent = stats.posts || 0;
                friendsCount.textContent = stats.friends || 0;
                storiesCount.textContent = stats.stories || 0;
            } else {
                // Use placeholder values if API fails
                postsCount.textContent = '0';
                friendsCount.textContent = '0';
                storiesCount.textContent = '0';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    // Function to load user's posts
    async function loadUserPosts() {
        const userPostsFeed = document.getElementById('userPostsFeed');
        userPostsFeed.innerHTML = '<div class="loading">Loading your posts...</div>';
        
        try {
            const response = await fetch('http://localhost:3000/posts?username=' + encodeURIComponent(localStorage.getItem('username')), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            
            const posts = await response.json();
            
            if (posts.length === 0) {
                userPostsFeed.innerHTML = `
                    <div class="empty-state">
                        <h3>No posts yet</h3>
                        <p>Share your Smiski collection with the community!</p>
                        <a href="/pages/dashboard/dashboard.html" class="empty-state-action">Create a Post</a>
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
                    <p>We couldn't load your posts. Please try again later.</p>
                </div>
            `;
        }
    }
    
        // Function to load user's stories
        async function loadUserStories() {
            const userStoriesFeed = document.getElementById('userStoriesFeed');
            userStoriesFeed.innerHTML = '<div class="loading">Loading your stories...</div>';
            
            try {
                // Updated endpoint to match the backend route
                const response = await fetch('http://localhost:3000/stories/mystories', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error(`Failed to fetch stories: ${response.status} ${response.statusText}`);
                }
                
                let stories = await response.json();
                console.log('All stories loaded:', stories.length);
                
                // Filter stories to only show those posted within the last 24 hours
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
                
                stories = stories.filter(story => {
                    const storyDate = new Date(story.createdAt);
                    return storyDate >= twentyFourHoursAgo;
                });
                
                console.log('Stories within last 24 hours:', stories.length);
                        
                if (stories.length === 0) {
                    userStoriesFeed.innerHTML = `
                        <div class="empty-state">
                            <h3>No recent stories</h3>
                            <p>You don't have any stories from the last 24 hours.</p>
                            <a href="/pages/dashboard/dashboard.html" class="empty-state-action">Create a Story</a>
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
                        <p>We couldn't load your stories. Please try again later.</p>
                        <p class="error-details">${error.message}</p>
                    </div>
                `;
            }
        }
        
// Function to load liked posts
async function loadLikedPosts() {
    const userLikedFeed = document.getElementById('userLikedFeed');
    userLikedFeed.innerHTML = '<div class="loading">Loading liked posts...</div>';
    
    try {
        console.log('Fetching liked posts...');
        const response = await fetch('http://localhost:3000/posts/liked', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`Failed to fetch liked posts: ${response.status} ${response.statusText}`);
        }
        
        const likedPosts = await response.json();
        console.log('Liked posts received:', likedPosts.length);
        
        // Verify each post has the current user in its likes array
        const currentUsername = localStorage.getItem('username');
        const filteredLikedPosts = likedPosts.filter(post => 
            post.likes && post.likes.some(like => like.username === currentUsername)
        );
        
        // Sort posts by the most recently liked first using the createdAt timestamp in the like object
        filteredLikedPosts.sort((a, b) => {
            const aLike = a.likes.find(like => like.username === currentUsername);
            const bLike = b.likes.find(like => like.username === currentUsername);
            
            // If both likes have timestamps, compare them
            if (aLike && aLike.createdAt && bLike && bLike.createdAt) {
                return new Date(bLike.createdAt) - new Date(aLike.createdAt);
            }
            
            // If only one has a timestamp, prioritize the one with timestamp
            if (aLike && aLike.createdAt) return -1;
            if (bLike && bLike.createdAt) return 1;
            
            // If neither has a timestamp, fall back to post creation date
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        console.log('Filtered and sorted liked posts:', filteredLikedPosts.length);
        console.log('First few posts after sorting:', filteredLikedPosts.slice(0, 3).map(post => {
            const like = post.likes.find(like => like.username === currentUsername);
            return {
                postId: post._id,
                postCreatedAt: post.createdAt,
                likeCreatedAt: like?.createdAt,
                username: post.username,
                text: post.text.substring(0, 30) + '...'
            };
        }));
        
        if (filteredLikedPosts.length === 0) {
            userLikedFeed.innerHTML = `
                <div class="empty-state">
                    <h3>No liked posts yet</h3>
                    <p>Like posts to see them appear here!</p>
                    <a href="/pages/dashboard/dashboard.html" class="empty-state-action">Browse Posts</a>
                </div>
            `;
            return;
        }
        
        // Render liked posts
        userLikedFeed.innerHTML = '';
        filteredLikedPosts.forEach(post => {
            const postElement = createPostElement(post, true); // Pass true to indicate this is the liked tab
            userLikedFeed.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading liked posts:', error);
        userLikedFeed.innerHTML = `
            <div class="empty-state">
                <h3>Error loading liked posts</h3>
                <p>We couldn't load your liked posts. Please try again later.</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}
    
// Helper function to create a post element
function createPostElement(post, isLikedTab = false) {
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
    
    // Only show edit and delete buttons if it's the user's own post and not in the liked tab
    const showEditDelete = post.username === currentUsername && !isLikedTab;
    
    // Use a placeholder for profile picture initially
    postElement.innerHTML = `
        <div class="post-header">
            <img src="/public/no-profile.png" alt="User Profile" class="post-user-avatar" data-username="${post.username}">
            <div class="post-header-info">
                <span class="username">${post.username}</span>
                <span class="timestamp">• ${timestamp}</span>
                ${post.originalPostId ? `• Reposted from original post` : ''}
            </div>
            ${showEditDelete ? `
                <div class="post-actions">
                    <button class="post-action-btn edit-post-btn" data-post-id="${post._id}">
                        
                    </button>
                    <button class="post-action-btn delete-post-btn" data-post-id="${post._id}">
                        
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="post-content" id="post-content-${post._id}">
            <p>${post.text}</p>
            ${mediaContent}
        </div>
        <div class="post-edit-form" id="post-edit-form-${post._id}" style="display: none;">
            <textarea id="edit-text-${post._id}" class="edit-post-textarea">${post.text}</textarea>
            
            ${post.media && post.media.length > 0 ? `
                <div class="current-media-preview">
                    <p>Current media:</p>
                    <div class="media-preview-container">
                        ${post.media.map(file => {
                            const fileExtension = file.split('.').pop().toLowerCase();
                            if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
                                return `<div class="media-preview-item">
                                    <video controls>
                                        <source src="/uploads/${file}" type="video/${fileExtension}">
                                        Your browser does not support the video tag.
                                    </video>
                                </div>`;
                            } else {
                                return `<div class="media-preview-item">
                                    <img src="/uploads/${file}" alt="Post Image">
                                </div>`;
                            }
                        }).join('')}
                    </div>
                    <p class="media-note">Uploading new media will replace the current media</p>
                </div>
            ` : ''}
            
            <div class="media-upload-container">
                <label for="edit-media-${post._id}">Upload new media (optional):</label>
                <input type="file" id="edit-media-${post._id}" class="edit-media-input" multiple accept="image/*,video/*">
            </div>
            
            <div class="edit-actions">
                <button class="save-edit-button" data-id="${post._id}">Save</button>
                <button class="cancel-edit-button" data-id="${post._id}">Cancel</button>
            </div>
        </div>
        <div class="post-stats">
            <div class="stat-item">
                <i class="fas fa-heart"></i> ${post.likes?.length || 0} likes
            </div>
            <div class="stat-item">
                <i class="fas fa-comment"></i> ${post.comments?.length || 0} comments
            </div>
        </div>
        <div class="post-actions-bar">
            <button class="post-action-button like-button ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                <i class="fas fa-heart"></i> Like
            </button>
            <button class="post-action-button comment-button" data-id="${post._id}">
                <i class="fas fa-comment"></i> Comment
            </button>
            ${showEditDelete ? `
                <button class="post-action-button edit-button" data-id="${post._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="post-action-button delete-button" data-id="${post._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            ` : ''}
        </div>
        <div class="comment-section" id="comment-section-${post._id}">
            ${(post.comments || []).map(comment => `
                <div class="comment" data-comment-id="${comment._id}">
                    <img src="/public/no-profile.png" alt="${comment.username}" class="comment-avatar">
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-username">${comment.username}</span>
                            <span class="comment-timestamp">${formatTimestamp(comment.createdAt)}</span>
                        </div>
                        <div class="comment-text">${comment.text}</div>
                        ${comment.username === currentUsername ? `
                            <button class="delete-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('') || '<div class="no-comments">No comments yet</div>'}
            <div class="comment-form">
                <img src="/public/no-profile.png" alt="Your Avatar" class="comment-avatar">
                <input type="text" class="comment-input" placeholder="Write a comment..." data-id="${post._id}">
                <button class="comment-submit" data-id="${post._id}">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add CSS for the post styling
    const style = document.createElement('style');
    style.textContent = `
        /* Post Styling */
        .post {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 16px;
            padding: 16px;
            transition: box-shadow 0.3s ease;
            border: 1px solid #e0e0e0;
            width: 100%; /* Changed from 70% to 100% to reduce white space */
            max-width: 700px; /* Added max-width for larger screens */
            margin-left: auto;
            margin-right: auto;
        }
        
        .post:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        /* Post Header */
        .post-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            position: relative;
        }
        
        .post-header img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 12px;
        }
        
        .post-header-info {
            display: flex;
            flex-direction: column;
        }
        
        .username {
            font-weight: 600;
            color: #333;
            margin-right: 6px;
        }
        
        .timestamp {
            font-size: 12px;
            color: #65676b;
        }
        
        .post-actions {
            position: absolute;
            right: 0;
            top: 0;
            display: flex;
            gap: 8px;
        }
        
        .post-action-btn {
            background: none;
            border: none;
            color: #65676b;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        
        .post-action-btn:hover {
            background-color: #f0f2f5;
            color: #1877f2;
        }
        
        /* Post Content */
        .post-content {
            margin-bottom: 12px;
            font-size: 15px;
            line-height: 1.5;
            color: #1c1e21;
            
            word-break: break-word;
        }
        
        .post-content p {
            margin: 0 0 12px 0;
        }
        
                /* Post Media */
        .post-media {
            margin-bottom: 12px;
            border-radius: 8px;
            overflow: hidden;
            background-color: #000; /* Black background */
            text-align: center;
            padding: 10px;
            max-width: 97%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .post-media img {
            max-width: 90%;
            max-height: 500px; /* Added max-height to prevent overly tall images */
            width: auto; /* Changed from fixed width to auto */
            height: auto;
            object-fit: contain; /* This ensures the entire image is visible */
            display: block;
            margin: 0 auto;
            border-radius: 4px;
        }

        .post-media video {
            max-width: 90%;
            max-height: 500px; /* Added max-height for consistency */
            width: auto; /* Changed from fixed width to auto */
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            background-color: transparent;
            border-radius: 4px;
        }

        
        
        /* Post Stats */
        .post-stats {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-top: 1px solid #e4e6eb;
            border-bottom: 1px solid #e4e6eb;
            margin-bottom: 8px;
            font-size: 14px;
            color: #65676b;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        /* Post Actions Bar */
        .post-actions-bar {
            display: flex;
            justify-content: space-around;
            margin-bottom: 12px;
        }
        
        .post-action-button {
            background: none;
            border: none;
            padding: 8px 0;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 600;
            color: #65676b;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        
        .post-action-button:hover {
            background-color: #f0f2f5;
        }
        
        .post-action-button.liked {
            color: #1877f2;
        }
        
        .post-action-button.liked i {
            color: #1877f2;
        }
        
        /* Comment Section */
        .comment-section {
            margin-top: 8px;
            border-top: 1px solid #e4e6eb;
            padding-top: 8px;
        }
        
        .comment {
            display: flex;
            margin-bottom: 8px;
            align-items: flex-start;
        }
        
        .comment-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin-right: 8px;
            object-fit: cover;
        }
        
        .comment-content {
            background-color: #f0f2f5;
            border-radius: 18px;
            padding: 8px 12px;
            flex: 1;
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
            color: #050505;
        }
        
        .comment-timestamp {
            font-size: 11px;
            color: #65676b;
        }
        
        .comment-text {
            font-size: 13px;
            line-height: 1.3;
            color: #050505;
        }
        
        .delete-comment-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: #65676b;
            cursor: pointer;
            padding: 2px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .comment:hover .delete-comment-button {
            opacity: 1;
        }
        
        .no-comments {
            color: #65676b;
            font-size: 13px;
            text-align: center;
            padding: 8px 0;
        }
        
        .comment-form {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }
        
        .comment-input {
            flex: 1;
            border: none;
            background-color: #f0f2f5;
            border-radius: 20px;
            padding: 8px 12px;
            font-size: 13px;
        }
        
        .comment-input:focus {
            outline: none;
        }
        
        .comment-submit {
            background: none;
            border: none;
            color: #1877f2;
            cursor: pointer;
            padding: 4px 8px;
        }
        
        .comment-submit:disabled {
            color: #bcc0c4;
            cursor: not-allowed;
        }
        
        /* Post Edit Form */
        .post-edit-form {
            padding: 12px;
            background-color: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 12px;
            border: 1px solid #e4e6eb;
        }
        
        .edit-post-textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            margin-bottom: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            resize: vertical;
            font-family: inherit;
            font-size: 15px;
        }
        
        .edit-post-textarea:focus {
            outline: none;
            border-color: #1877f2;
        }
        
        .media-upload-container {
            margin: 12px 0;
        }
        
        .media-upload-container label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #050505;
        }
        
        .edit-media-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background-color: #f0f2f5;
        }
        
        .edit-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 12px;
        }
        
        .save-edit-button, .cancel-edit-button {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .save-edit-button {
            background-color: #1877f2;
            color: white;
            border: none;
        }
        
        .save-edit-button:hover {
            background-color: #166fe5;
        }
        
        .cancel-edit-button {
            background-color: #e4e6eb;
            color: #050505;
            border: none;
        }
        
        .cancel-edit-button:hover {
            background-color: #d8dadf;
        }
        
        .current-media-preview {
            margin: 12px 0;
            padding: 12px;
            background-color: #f0f2f5;
            border-radius: 8px;
        }
        
        .current-media-preview p {
            margin: 0 0 8px 0;
            font-weight: 500;
        }
        
        .media-preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 10px 0;
        }
        
        .media-preview-item {
            width: 120px;
            height: 120px;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid #ddd;
            background-color: white;
        }
        
        .media-preview-item img, .media-preview-item video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .media-note {
            font-size: 12px;
            color: #65676b;
            margin-top: 8px;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners
    const likeButton = postElement.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', () => {
            toggleLike(post._id, likeButton);
        });
    }
    
    const commentButton = postElement.querySelector('.comment-button');
    if (commentButton) {
        commentButton.addEventListener('click', () => {
            const commentSection = postElement.querySelector(`#comment-section-${post._id}`);
            commentSection.classList.toggle('expanded');
            const commentInput = commentSection.querySelector('.comment-input');
            if (commentInput) {
                commentInput.focus();
            }
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
    
    // Edit button functionality
    const editButton = postElement.querySelector('.edit-button');
    if (editButton) {
        editButton.addEventListener('click', () => {
            toggleEditMode(post._id);
        });
    }
    
    // Save edit button functionality
    const saveEditButton = postElement.querySelector('.save-edit-button');
    if (saveEditButton) {
        saveEditButton.addEventListener('click', () => {
            savePostEdit(post._id);
        });
    }
    
    // Cancel edit button functionality
    const cancelEditButton = postElement.querySelector('.cancel-edit-button');
    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', () => {
            toggleEditMode(post._id, false);
        });
    }
    
    const deleteButton = postElement.querySelector('.delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(post._id);
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
    
    // After the post is created, fetch and update the profile picture
    const userAvatar = postElement.querySelector('.post-user-avatar');
    if (userAvatar) {
        const username = userAvatar.getAttribute('data-username');
        retrieveProfilePicture(username).then(profilePicUrl => {
            userAvatar.src = profilePicUrl;
        }).catch(error => {
            console.error(`Failed to load profile picture for ${username}:`, error);
            // Keep the default image if there's an error
        });
    }
    
    // Also update profile pictures for comments
    const commentAvatars = postElement.querySelectorAll('.comment-avatar');
    commentAvatars.forEach(avatar => {
        const commentUsername = avatar.getAttribute('alt');
        if (commentUsername && commentUsername !== 'Your Avatar') {
            retrieveProfilePicture(commentUsername).then(profilePicUrl => {
                avatar.src = profilePicUrl;
            }).catch(error => {
                console.error(`Failed to load comment profile picture for ${commentUsername}:`, error);
            });
        } else if (commentUsername === 'Your Avatar') {
            // For the current user's comment input avatar
            retrieveProfilePicture(currentUsername).then(profilePicUrl => {
                avatar.src = profilePicUrl;
            }).catch(error => {
                console.error(`Failed to load your profile picture:`, error);
            });
        }
    });
    
    return postElement;
}

// Function to retrieve profile picture for comments and posts
async function retrieveProfilePicture(username) {
    try {
        // Check if it's the current user
        const currentUsername = localStorage.getItem('username');
        if (username === currentUsername) {
            // Use the profile picture already loaded for the current user
            const currentUserPic = document.getElementById('profilePicture');
            if (currentUserPic && currentUserPic.src && !currentUserPic.src.includes('no-profile.png')) {
                return currentUserPic.src;
            }
        }
        
        // Fetch the user's profile data to get their profile picture
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
        
        // Return the profile picture URL or default image
        if (userData.profilePicture) {
            return `http://localhost:3000${userData.profilePicture}`;
        } else {
            return '/public/no-profile.png';
        }
    } catch (error) {
        console.error(`Error retrieving profile picture for ${username}:`, error);
        return '/public/no-profile.png'; // Default image on error
    }
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
        <div class="story-content">
            ${mediaHtml}
            <div class="story-overlay"></div>
            <div class="story-info">
                <div class="story-header">
                    <h3>${story.title}</h3>
                    <span class="story-timestamp">${timestamp}</span>
                </div>
                <p class="story-description">${story.description}</p>
            </div>
        </div>
        <div class="story-footer">
            <button class="view-story-btn" data-id="${story._id}">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="delete-story-btn" data-id="${story._id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // Add CSS for the story styling
    const style = document.createElement('style');
    style.textContent = `
        /* Modern Story Card Styling with 9:16 ratio */
        .story-card {
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            margin-bottom: 20px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            width: 280px; /* Fixed width */
            margin-left: auto;
            margin-right: auto;
        }
        
        .story-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .story-content {
            position: relative;
            width: 100%;
            /* 9:16 aspect ratio (height = width * 16/9) */
            padding-top: 177.78%; /* 16/9 = 1.778 */
            overflow: hidden;
        }
        
        .story-media {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .story-media img, .story-media video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .story-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 100%);
            z-index: 1;
        }
        
        .story-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px;
            color: white;
            z-index: 2;
        }
        
        .story-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .story-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .story-timestamp {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .story-description {
            margin: 0;
            font-size: 14px;
            line-height: 1.4;
            opacity: 0.9;
            max-height: 60px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        
        .story-footer {
            display: flex;
            justify-content: space-between;
            padding: 12px 16px;
            background-color: #fff;
        }
        
        .view-story-btn, .delete-story-btn {
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .view-story-btn {
            background-color: #4a76a8;
            color: white;
            flex-grow: 1;
            justify-content: center;
            margin-right: 10px;
        }
        
        .view-story-btn:hover {
            background-color: #3d6293;
        }
        
        .delete-story-btn {
            background-color: #f0f2f5;
            color: #65676b;
            width: 40px;
            height: 40px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .delete-story-btn:hover {
            background-color: #e4e6eb;
            color: #e41e3f;
        }
        
        .play-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background-color: rgba(0, 0, 0, 0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3;
        }
        
        .play-indicator i {
            color: white;
            font-size: 24px;
            margin-left: 4px; /* Slight offset for play icon */
        }
        
        /* Story grid layout */
        #userStoriesFeed {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            padding: 20px 0;
        }
        
        /* Empty state styling */
        #userStoriesFeed .empty-state {
            background-color: #f9f9f9;
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            margin-top: 20px;
            grid-column: 1 / -1; /* Span all columns */
        }
        
        #userStoriesFeed .empty-state h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 20px;
        }
        
        #userStoriesFeed .empty-state p {
            color: #65676b;
            margin-bottom: 20px;
        }
        
        #userStoriesFeed .empty-state-action {
            display: inline-block;
            background-color: #4a76a8;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        #userStoriesFeed .empty-state-action:hover {
            background-color: #3d6293;
        }
    `;
    document.head.appendChild(style);
    
    // Add event listeners
    const viewButton = storyElement.querySelector('.view-story-btn');
    if (viewButton) {
        viewButton.addEventListener('click', () => {
            openStoryViewer(story);
        });
    }
    
    const deleteButton = storyElement.querySelector('.delete-story-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this story?')) {
                deleteStory(story._id);
            }
        });
    }
    
    return storyElement;
}

// Function to open a story viewer modal
function openStoryViewer(story) {
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'story-viewer-modal';
    
    // Determine content type
    let contentHtml = '';
    if (story.media && story.media.length > 0) {
        const mediaFile = story.media[0];
        const fileExtension = mediaFile.split('.').pop().toLowerCase();
        
        if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
            contentHtml = `
                <video autoplay controls>
                    <source src="/uploads/${mediaFile}" type="video/${fileExtension}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            contentHtml = `<img src="/uploads/${mediaFile}" alt="${story.title}">`;
        }
    }
    
    // Create modal content with 9:16 ratio
    modal.innerHTML = `
        <div class="story-viewer-content">
            <div class="story-viewer-header">
                <h2>${story.title}</h2>
                <button class="close-story-btn">&times;</button>
            </div>
            <div class="story-viewer-media-container">
                <div class="story-viewer-media">
                    ${contentHtml}
                </div>
            </div>
            <div class="story-viewer-details">
                <p class="story-viewer-description">${story.description}</p>
                <p class="story-viewer-timestamp">Posted ${formatTimestamp(story.createdAt)}</p>
            </div>
        </div>
    `;
    
    // Add modal styles with fixed 9:16 ratio
    const style = document.createElement('style');
    style.textContent = `
        .story-viewer-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .story-viewer-modal.active {
            opacity: 1;
        }
        
        .story-viewer-content {
            background-color: #fff;
            border-radius: 12px;
            max-width: 90%;
            width: 420px; /* Fixed width for the modal */
            max-height: 95vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        
        .story-viewer-modal.active .story-viewer-content {
            transform: translateY(0);
        }
        
        .story-viewer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .story-viewer-header h2 {
            margin: 0;
            font-size: 20px;
            color: #333;
        }
        
        .close-story-btn {
            background: none;
            border: none;
            font-size: 28px;
            color: #65676b;
            cursor: pointer;
            padding: 0 8px;
        }
        
        .story-viewer-media-container {
            width: 100%;
            /* 9:16 aspect ratio */
            padding-top: 177.78%; /* 16/9 = 1.778 */
            position: relative;
            background-color: #000;
            overflow: hidden;
        }
        
        .story-viewer-media {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .story-viewer-media img, .story-viewer-media video {
            width: 100%;
            height: 100%;
            object-fit: contain; /* Changed from 'cover' to 'contain' to show full image */
            background-color: #000; /* Black background to fill empty space */
        }
        
        .story-viewer-details {
            padding: 20px;
            background-color: #fff;
        }
        
        .story-viewer-description {
            margin: 0 0 12px 0;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
        }
        
        .story-viewer-timestamp {
            margin: 0;
            font-size: 14px;
            color: #65676b;
        }
        
        /* Media queries for responsive design */
        @media (max-height: 800px) {
            .story-viewer-content {
                width: 360px;
            }
        }
        
        @media (max-width: 480px) {
            .story-viewer-content {
                width: 100%;
                max-width: 100%;
                height: 100%;
                max-height: 100%;
                border-radius: 0;
            }
            
            .story-viewer-media-container {
                height: calc(100% - 120px); /* Adjust for header and details */
                padding-top: 0;
            }
            
            .story-viewer-media {
                position: relative;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Add animation timing
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Set auto-close timer (15 seconds)
    const autoCloseTimer = setTimeout(() => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }, 15000);
    
    // Close button functionality
    const closeBtn = modal.querySelector('.close-story-btn');
    closeBtn.addEventListener('click', () => {
        // Clear the auto-close timer when manually closed
        clearTimeout(autoCloseTimer);
        
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    });
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Clear the auto-close timer when manually closed
            clearTimeout(autoCloseTimer);
            
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    });
    
    // For video content, reset the timer when the video ends
    const videoElement = modal.querySelector('video');
    if (videoElement) {
        videoElement.addEventListener('ended', () => {
            // Clear existing timer
            clearTimeout(autoCloseTimer);
            
            // Close the modal
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });
    }
}
    
    // Function to toggle like on a post
    async function toggleLike(postId, likeButton) {
        try {
            // Find the post stats container to get the current likes count
            const postElement = likeButton.closest('.post');
            const likesCountElement = postElement.querySelector('.stat-item:first-child');
            const likesText = likesCountElement.textContent.trim();
            const currentLikes = parseInt(likesText.match(/\d+/) || [0])[0];
            
            // Update UI immediately
            if (likeButton.classList.contains('liked')) {
                likeButton.classList.remove('liked');
                likeButton.querySelector('i').style.color = '#65676b';
                likesCountElement.innerHTML = `<i class="fas fa-heart"></i> ${Math.max(0, currentLikes - 1)} likes`;
            } else {
                likeButton.classList.add('liked');
                likeButton.querySelector('i').style.color = '#1877f2';
                likesCountElement.innerHTML = `<i class="fas fa-heart"></i> ${currentLikes + 1} likes`;
            }
            
            // Send request to server
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
            
            // Get the actual likes count from the response
            const result = await response.json();
            const serverLikesCount = result.likes?.length || 0;
            
            // Update the UI with the correct count from server
            likesCountElement.innerHTML = `<i class="fas fa-heart"></i> ${serverLikesCount} likes`;
            
        } catch (error) {
            console.error('Error toggling like:', error);
            alert('Failed to like/unlike post. Please try again.');
            
            // Reload posts to ensure UI is in sync with server
            loadUserPosts();
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
            loadUserPosts();
            
            // Clear input
            commentInput.value = '';
            
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    }
    
    // Function to delete a post
    async function deletePost(postId) {
        try {
            // Get token inside the function to ensure it's available
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('You need to be logged in to delete posts');
                return;
            }
            
            console.log('Attempting to delete post:', postId); // Debug log
            
            // Changed endpoint to match the backend route structure
            const response = await fetch(`http://localhost:3000/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Delete response status:', response.status); // Debug log
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Failed to delete post: ${response.status} ${response.statusText}`);
            }
            
            // Reload posts to reflect changes
            loadUserPosts();
            
            // Also update user stats
            loadUserStats();
            
            // Show success message
            alert('Post deleted successfully');
            
        } catch (error) {
            console.error('Error deleting post:', error);
            alert(`Failed to delete post: ${error.message}`);
        }
    }

// Function to toggle edit mode for a post
function toggleEditMode(postId, showEditForm = true) {
    const contentElement = document.getElementById(`post-content-${postId}`);
    const editFormElement = document.getElementById(`post-edit-form-${postId}`);
    
    // Check if elements exist before trying to modify them
    if (!contentElement || !editFormElement) {
        console.error(`Could not find post elements for post ID: ${postId}`);
        return;
    }
    
    if (showEditForm) {
        contentElement.style.display = 'none';
        editFormElement.style.display = 'block';
    } else {
        contentElement.style.display = 'block';
        editFormElement.style.display = 'none';
    }
}

// Function to save post edits
async function savePostEdit(postId) {
    const editTextarea = document.getElementById(`edit-text-${postId}`);
    const mediaInput = document.getElementById(`edit-media-${postId}`);
    const newText = editTextarea.value.trim();
    
    // Check if we have either text or media files
    if (!newText && (!mediaInput.files || mediaInput.files.length === 0)) {
        alert('Post content cannot be empty. Please add text or media.');
        return;
    }
    
    // Confirmation dialog
    if (!confirm('Are you sure you want to save these changes?')) {
        return;
    }
    
    console.log('Saving post edit:', { postId, text: newText, mediaFiles: mediaInput.files });
    
    try {
        const token = localStorage.getItem('token');
        
        // Use FormData to handle both text and files
        const formData = new FormData();
        formData.append('text', newText);
        
        // Add media files if selected
        if (mediaInput.files && mediaInput.files.length > 0) {
            for (let i = 0; i < mediaInput.files.length; i++) {
                formData.append('media', mediaInput.files[i]);
            }
        }
        
        const response = await fetch(`http://localhost:3000/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type when using FormData
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to update post');
        }
        
        console.log('Post updated successfully');
        
        // Reload posts to reflect changes
        loadUserPosts();
        
        // Hide edit form
        toggleEditMode(postId, false);
        
        // Show success message
        alert('Post updated successfully');
        
    } catch (error) {
        console.error('Error updating post:', error);
        alert(`Failed to update post: ${error.message}`);
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
            
            // Reload posts to reflect changes
            loadUserPosts();
            
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment. Please try again.');
        }
    }
    
// Function to delete a story
async function deleteStory(storyId) {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('You need to be logged in to delete stories');
            return;
        }
        
        console.log('Attempting to delete story:', storyId); // Debug log
        
        // Updated URL to match your backend route structure
        // Looking at your other API calls, you're using /stories/ not /api/stories/
        const response = await fetch(`http://localhost:3000/stories/${storyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response status:', response.status); // Debug log
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`Failed to delete story: ${response.status} ${response.statusText}`);
        }
        
        // Reload stories to reflect changes
        loadUserStories();
        
        // Also update user stats
        loadUserStats();
        
        // Show success message
        alert('Story deleted successfully');
        
    } catch (error) {
        console.error('Error deleting story:', error);
        alert(`Failed to delete story: ${error.message}`);
    }
}
    
    // Function to upload a profile picture
    async function uploadProfilePicture(file) {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        try {
            const response = await fetch('http://localhost:3000/api/user/profile/picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload profile picture');
            }
            
            const data = await response.json();
            
            // Update profile picture in UI
            profilePicture.src = data.profilePicture;
            
            alert('Profile picture updated successfully!');
            
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture. Please try again.');
        }
    }
    
    // Helper function to format timestamp
    function formatTimestamp(timestamp) {
        if (!timestamp) return 'Just now';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return `${diffSec} seconds ago`;
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }
});
