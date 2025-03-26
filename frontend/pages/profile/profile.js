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
            window.location.href = '/pages/settings/settings.html#profile';
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
    
// ... existing code ...

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
        profileUsername.textContent = userData.username;
        profileBio.textContent = userData.bio || 'No bio yet';
        
        // Update profile picture if available
        if (userData.profilePicture) {
            profilePicture.src = `/uploads/${userData.profilePicture}`;
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
        
        // Update stories count (if you have this functionality)
        // await updateStoriesCount(username);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Please try again.');
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
            const response = await fetch('http://localhost:3000/api/stories/mystories', {
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
                        <p>Share your Smiski moments in a story!</p>
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
    
    postElement.innerHTML = `
        <div class="post-header">
            <img src="/public/no-profile.png" alt="User Profile">
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
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .post-content p {
            margin: 0 0 12px 0;
        }
        
        /* Post Media */
        .post-media {
            margin-bottom: 12px;
            border-radius: 8px;
            overflow: hidden; /* Changed from visible to hidden */
            background-color: transparent;
            text-align: center;
            padding: 0;
            max-width: 100%; /* Ensure container doesn't exceed parent width */
        }

        .post-media img {
            width: 100%; /* Changed from auto to 100% */
            max-width: 100%;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            border-radius: 0; /* Remove border radius from image */
        }

        .post-media video {
            width: 100%; /* Changed from auto to 100% */
            max-width: 100%;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 0 auto;
            background-color: #000;
            border-radius: 0; /* Remove border radius from video */
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
                <button class="delete-story-btn" data-id="${story._id}">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        const viewButton = storyElement.querySelector('.view-story-btn');
        if (viewButton) {
            viewButton.addEventListener('click', () => {
                // Implement story viewer functionality
                alert('Story viewer will be implemented here!');
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
            const response = await fetch(`http://localhost:3000/api/stories/${storyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete story');
            }
            
            // Reload stories to reflect changes
            loadUserStories();
            
            // Also update user stats
            loadUserStats();
            
        } catch (error) {
            console.error('Error deleting story:', error);
            alert('Failed to delete story. Please try again.');
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
