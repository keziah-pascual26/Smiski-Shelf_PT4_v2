document.addEventListener("DOMContentLoaded", async () => {
        // Add CSS styles to the document
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Post Feed Styles */
            #postFeed {
                max-width: 600px;
                margin: 0 auto;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .post {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px;
                padding: 16px;
                transition: box-shadow 0.3s ease;
            }
            
            .post:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            }
            
            .post-header {
                display: flex;
                align-items: flex-start;
                margin-bottom: 12px;
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
            
            .post-meta {
                display: flex;
                align-items: center;
            }
            
            .timestamp, .repost-info {
                color: #65676B;
                font-size: 0.85rem;
                margin-left: 4px;
            }
            
            .post-content {
                margin: 12px 0;
                font-size: 0.95rem;
                line-height: 1.4;
                color: #1c1e21;
                word-wrap: break-word;
            }
            
            .post-media {
                margin: 12px 0;
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .post-media img, .post-media video {
                max-width: 100%;
                max-height: 500px; /* Set maximum height */
                border-radius: 8px;
                display: block;
                object-fit: contain; /* Maintain aspect ratio */
                margin: 0 auto; /* Center the image */
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            /* Add specific styling for ID card images */
            .post-media img[alt="Post Image"] {
                width: auto;
                height: auto;
                max-height: 400px;
                border: 1px solid #e0e0e0;
            }
            
            .post-stats {
                display: flex;
                justify-content: right;
                gap: 20px;
                margin: 10px 0;
                color: #65676B;
                font-size: 0.85rem;
                text-align: center;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .post-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-top: 1px solid #E4E6EB;
                border-bottom: 1px solid #E4E6EB;
                margin: 10px 0;
            }
            
            .post-footer button {
                background: none;
                border: none;
                padding: 8px 12px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
                color: #65676B;
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 1;
                transition: background-color 0.2s;
            }
            
            .post-footer button:hover {
                background-color: #F2F3F5;
            }
            
            .post-footer button i {
                margin-right: 6px;
                font-size: 1.1rem;
            }
            
            .like-button.liked {
                color: #E41E3F;
            }
            
            .like-button.liked i {
                color: #E41E3F;
            }
            
            .likes-list {
                width: 100%;
                margin: 5px 0;
                font-size: 0.85rem;
                color: #65676B;
                display: none;
            }
            
            .comment-section {
                margin-top: 5px;
            }
            
            .comment {
                padding: 8px 0;
                margin-bottom: 8px;
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
            }
            
            .comment-username {
                font-weight: 600;
                margin-right: 6px;
                color: #333;
            }
            
            .comment-text {
                color: #1c1e21;
                flex: 1;
                word-break: break-word;
            }
            
            .edit-comment-button, .delete-comment-button {
                background: none;
                border: none;
                color: #65676B;
                cursor: pointer;
                font-size: 0.75rem;
                margin-left: 8px;
                padding: 2px 6px;
                border-radius: 4px;
            }
            
            .edit-comment-button:hover, .delete-comment-button:hover {
                background-color: #F2F3F5;
            }
            
            .no-comments {
                color: #65676B;
                font-size: 0.9rem;
                margin: 10px 0;
            }
            
            .comment-input-container {
                margin-top: 10px;
            }
            
            .comment-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #E4E6EB;
                border-radius: 20px;
                font-size: 0.9rem;
                outline: none;
                transition: border-color 0.2s;
            }
            
            .comment-input:focus {
                border-color: #1877F2;
            }
            
            .no-posts, .error-message {
                text-align: center;
                padding: 40px 20px;
                color: #65676B;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .error-message {
                color: #E41E3F;
            }
            
            /* Animation for new content */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .post {
                animation: fadeIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(styleElement);

        const postFeed = document.querySelector("#postFeed"); // Ensure this exists
        if (!postFeed) {
            console.error("❌ #postFeed container not found!");
            return;
        }
    
        // Get logged-in user info from localStorage
        const loggedInUsername = localStorage.getItem("username"); // Ensure it's stored during login
        const loggedInUserId = localStorage.getItem("userId"); // Get userId from localStorage
        
        if (!loggedInUsername || !loggedInUserId) {
            console.error("❌ No logged-in user found or missing userId!");
            return;
        }
        
        // Cache for profile pictures to avoid repeated API calls
        const profilePictureCache = new Map();
        
        // Function to retrieve user profile picture
        async function getUserProfilePicture(username) {
            try {
                // Check if we already have this profile picture in cache
                if (profilePictureCache.has(username)) {
                    return profilePictureCache.get(username);
                }
                
                const token = localStorage.getItem('token');
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
                const profilePicUrl = userData.profilePicture 
                    ? `http://localhost:3000${userData.profilePicture}` 
                    : '/public/no-profile.png';
                    
                // Store in cache
                profilePictureCache.set(username, profilePicUrl);
                
                return profilePicUrl;
            } catch (error) {
                console.error(`Error fetching profile picture for ${username}:`, error);
                return '/public/no-profile.png'; // Default image on error
            }
        }

    async function likePost(postId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to toggle like on post: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Like toggled on post ${postId}:`, data.message);
            await retrievePosts(); // Refresh posts
        } catch (error) {
            console.error("🚨 Error toggling like on post:", error);
        }
    }

    async function commentOnPost(postId, commentText) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: commentText })
            });

            if (!response.ok) {
                throw new Error(`Failed to comment on post: ${response.status}`);
            }

            console.log(`✅ Comment added to post ${postId}`);
            await retrievePosts(); // Refresh posts
        } catch (error) {
            console.error("🚨 Error commenting on post:", error);
        }
    }

    async function editComment(postId, commentId, newText) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/posts/${postId}/comment/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: newText })
            });

            if (!response.ok) {
                throw new Error(`Failed to edit comment: ${response.status}`);
            }

            console.log(`✅ Comment ${commentId} edited successfully`);
            await retrievePosts(); // Refresh posts
        } catch (error) {
            console.error("🚨 Error editing comment:", error);
        }
    }

    async function deleteComment(postId, commentId) {
        try {
            console.log("Deleting comment:", { postId, commentId }); // Debugging
    
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error(`Failed to delete comment: ${response.status}`);
            }
    
            console.log(`✅ Comment ${commentId} deleted successfully`);
            await retrievePosts(); // Refresh posts
        } catch (error) {
            console.error("🚨 Error deleting comment:", error);
        }
    }

    async function repostPost(postId) {
        try {
            const token = localStorage.getItem('token');
            
            // Debug logs to check values
            console.log("Attempting to repost post:", postId);
            console.log("Current user ID:", loggedInUserId);
            console.log("Current username:", loggedInUsername);
            
            // Get user ID from token if not available directly
            let userId = loggedInUserId;
            if (!userId) {
                // Try to extract from token
                try {
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
                    userId = tokenPayload.id || tokenPayload.userId;
                    console.log("Extracted user ID from token:", userId);
                } catch (e) {
                    console.error("Could not extract user ID from token");
                }
            }
    
            // Still no user ID? Show error
            if (!userId) {
                console.error("User ID not available");
                alert("Unable to repost: User ID not available");
                return;
            }
    
            // First check if this post was already reposted by this user
            const response = await fetch(`http://localhost:3000/posts/${postId}/repost`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    username: loggedInUsername
                })
            });
    
            // Handle non-JSON response (like HTML error page)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                
                if (!response.ok) {
                    if (data.error === "already_reposted") {
                        alert("You have already reposted this post!");
                        return;
                    }
                    throw new Error(data.message || 'Failed to repost');
                }
            } else {
                // Handle non-JSON response
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
            }
    
            console.log("✅ Post reposted successfully");
            alert("Post reposted successfully!"); // Using alert instead of toast
            await retrievePosts(); // Refresh posts to show the repost
        } catch (error) {
            console.error("🚨 Error reposting post:", error);
            alert("Failed to repost post: " + error.message); // Using alert instead of toast
        }
    }

    async function retrievePosts() {
        const postFeed = document.querySelector("#postFeed");
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                postFeed.innerHTML = '<div class="error-message">Please log in to view posts.</div>';
                return;
            }
    
            console.log("🔄 Fetching posts for feed...");
            
            // First, fetch the user's friends list
            const friendsResponse = await fetch('http://localhost:3000/api/friends', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });

            if (!friendsResponse.ok) {
                console.error("Failed to fetch friends list:", friendsResponse.status);
            }

            // Get friends userIds and usernames
            const friends = await friendsResponse.json();
            const friendUserIds = friends.map(friend => friend.userId || friend._id);
            const friendUsernames = friends.map(friend => friend.username);
            console.log("📋 Friends list (userIds):", friendUserIds);
            
            // Then fetch all posts
            const response = await fetch(`http://localhost:3000/feed`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const allPosts = await response.json();
            console.log("📦 Received all posts:", allPosts);

            if (!Array.isArray(allPosts)) {
                throw new Error("Server returned invalid data format");
            }

            // Filter posts to only show the user's own posts and their friends' posts
            // Prioritize userId for filtering to handle username changes
            const filteredPosts = allPosts.filter(post => {
                // Check if this is the current user's post
                const isCurrentUserPost = 
                    // Check by userId if available
                    (post.userId && loggedInUserId && post.userId === loggedInUserId) || 
                    // Fallback to username check
                    (post.username === loggedInUsername);
                
                // Check if this is a friend's post
                const isFriendPost = 
                    // Check by userId if available
                    (post.userId && friendUserIds.includes(post.userId)) ||
                    // Fallback to username check
                    (friendUsernames.includes(post.username));
                
                return isCurrentUserPost || isFriendPost;
            });

            console.log("🔍 Filtered posts for feed:", filteredPosts);

            if (filteredPosts.length === 0) {
                postFeed.innerHTML = `
                    <div class="no-posts">
                        <i class="fa fa-newspaper-o" style="font-size: 2rem; margin-bottom: 16px;"></i>
                        <p>No posts from you or your friends yet.</p>
                        <p>Add more friends or create a post!</p>
                    </div>`;
                return;
            }

            renderPosts(filteredPosts);

        } catch (error) {
            console.error("🚨 Error fetching posts:", error);
            postFeed.innerHTML = `
                <div class="error-message">
                    <i class="fa fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 16px;"></i>
                    <p>Failed to load posts. Please try again later.</p>
                    <small>${error.message}</small>
                </div>`;
        }
    }

    // Initial load
    await retrievePosts();

    // Refresh posts every 30 seconds
    setInterval(retrievePosts, 30000);

    async function renderPosts(posts) {
        const postFeed = document.querySelector("#postFeed");
        if (!postFeed) return;
    
        postFeed.innerHTML = ""; // Clear previous posts
    
        // Process posts in parallel for efficiency
        const postPromises = posts.map(async (post) => {
            const postElement = document.createElement("div");
            postElement.classList.add("post");
            postElement.dataset.userId = post.userId; // Add userId as data attribute
            postElement.dataset.postId = post._id;
    
            const formattedTimestamp = formatTimestamp(post.createdAt);
    
            // Use the post's username directly from the post object
            const postUsername = post.username; // This is the username of the post creator
            
            // Check if this is a repost
            const isRepost = !!post.originalPostId;
            
            // Get profile picture URL for this post's author
            const profilePicUrl = await getUserProfilePicture(postUsername);
    
            let mediaContent = "";
            if (post.media && post.media.length > 0) {
                mediaContent = `
                    <div class="post-media">
                        ${post.media.map(file => {
                            const fileExtension = file.split(".").pop().toLowerCase();
                            if (["mp4", "webm", "ogg"].includes(fileExtension)) {
                                return `
                                    <video controls>
                                        <source src="/uploads/${file}" type="video/${fileExtension}">
                                        Your browser does not support the video tag.
                                    </video>`;
                            } else {
                                return `<img src="/uploads/${file}" alt="Post Image">`;
                            }
                        }).join("")}
                    </div>
                `;
            }
    
            const userLiked = (post.likes || []).some(like => like.username === loggedInUsername);
            const likesCount = post.likes?.length || 0;
            const commentsCount = post.comments?.length || 0;
    
            // Format comments with better styling
            const commentsList = (post.comments || []).length > 0
                ? (post.comments || []).map(comment => `
                    <div class="comment" data-comment-id="${comment._id}">
                        <span class="comment-username">${comment.username}</span>
                        <span class="comment-text">${comment.text}</span>
                        ${comment.username === loggedInUsername ? `
                            <div class="comment-actions">
                                <button class="edit-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">Edit</button>
                                <button class="delete-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">Delete</button>
                            </div>
                        ` : ""}
                    </div>
                `).join("")
                : "<div class='no-comments'>No comments yet</div>";
    
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${profilePicUrl}" alt="User Profile">
                    <div class="post-header-info">
                        <span class="username">${postUsername}${isRepost ? ' <span class="repost-label" style="color: #65676b; font-style: italic; font-size: 0.85em; margin-left: 5px;">• Reposted</span>' : ''}</span>
                        <span class="timestamp">${formattedTimestamp}</span>
                    </div>
                </div>
                <p class="post-content">${post.text}</p>
                ${mediaContent}
                <div class="post-stats">
                    <div class="stat-item">
                        <i class="fa fa-heart"></i> ${likesCount} ${likesCount === 1 ? 'like' : 'likes'}
                    </div>
                    <div class="stat-item">
                        <i class="fa fa-comment"></i> ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}
                    </div>
                </div>
                <div class="post-footer">
                    <button class="like-button ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                        <i class="fa fa-heart"></i> Like
                    </button>
                    <button class="comment-button" data-id="${post._id}">
                        <i class="fa fa-comment"></i> Comment
                    </button>
                    <button class="repost-button" data-id="${post._id}">
                        <i class="fa fa-retweet"></i> Repost
                    </button>
                </div>
                <div class="comment-section" id="comment-section-${post._id}">
                    ${commentsList}
                    <div class="comment-input-container">
                        <input type="text" class="comment-input" placeholder="Write a comment..." data-id="${post._id}">
                    </div>
                </div>
            `;
    
            return postElement;
        });
    
        // Wait for all post elements to be created with their profile pictures
        const postElements = await Promise.all(postPromises);
        
        // Add all posts to the feed
        postElements.forEach(element => {
            postFeed.appendChild(element);
        });
    
        // Add event listeners
        // ... rest of the function remains the same
    

        // Add event listeners
        document.querySelectorAll(".like-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                likePost(postId);
            });
        });

        document.querySelectorAll(".comment-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                const commentSection = document.querySelector(`#comment-section-${postId}`);
                const commentInput = commentSection.querySelector(".comment-input");
                
                // Toggle comment section visibility
                commentSection.style.display = commentSection.style.display === "none" ? "block" : "block";
                
                // Focus on comment input
                if (commentSection.style.display === "block") {
                    commentInput.focus();
                }
            });
        });

        document.querySelectorAll(".comment-input").forEach(input => {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    const postId = input.getAttribute("data-id");
                    const commentText = input.value.trim();
                    if (commentText) {
                        commentOnPost(postId, commentText);
                        input.value = ""; // Clear input field
                    }
                }
            });
        });

        document.querySelectorAll(".edit-comment-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                const commentId = button.getAttribute("data-comment-id");
                const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"] .comment-text`);
                const currentText = commentElement.textContent;

                const newText = prompt("Edit your comment:", currentText);
                if (newText && newText.trim() !== "") {
                    editComment(postId, commentId, newText.trim());
                }
            });
        });

        document.querySelectorAll(".delete-comment-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                const commentId = button.getAttribute("data-comment-id");

                if (confirm("Are you sure you want to delete this comment?")) {
                    deleteComment(postId, commentId);
                }
            });
        });

        document.querySelectorAll(".repost-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
        
                if (confirm("Are you sure you want to repost this?")) {
                    repostPost(postId);
                }
            });
        });
    }

    function formatTimestamp(createdAt) {
        if (!createdAt) return "Just now";

        const postDate = new Date(createdAt);
        const now = new Date();

        if (isNaN(postDate.getTime())) {
            console.error("Invalid timestamp:", createdAt);
            return "Just now";
        }

        const timeDiff = Math.floor((now - postDate) / 1000);

        if (timeDiff < 60) {
            return `${timeDiff} seconds ago`;
        } else if (timeDiff < 3600) {
            return `${Math.floor(timeDiff / 60)} minutes ago`;
        } else if (timeDiff < 86400) {
            return `${Math.floor(timeDiff / 3600)} hours ago`;
        } else {
            return postDate.toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
            });
        }
    }
});