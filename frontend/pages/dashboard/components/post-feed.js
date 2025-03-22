document.addEventListener("DOMContentLoaded", async () => {
    const postFeed = document.querySelector("#postFeed"); // Ensure this exists
    if (!postFeed) {
        console.error("❌ #postFeed container not found!");
        return;
    }

    // Get logged-in username from localStorage
    const loggedInUsername = localStorage.getItem("username"); // Ensure it's stored during login
    if (!loggedInUsername) {
        console.error("❌ No logged-in user found!");
        return;
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

    async function retrievePosts() {
        const postFeed = document.querySelector("#postFeed");
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                postFeed.innerHTML = '<div class="error-message">Please log in to view posts.</div>';
                return;
            }

            console.log("🔄 Fetching posts with token:", token);
            const response = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(loggedInUsername)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
            });

            // Log full response for debugging
            console.log("Response:", {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check content type
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server didn't return JSON");
            }

            const data = await response.json();
            console.log("📦 Received posts:", data);

            if (!Array.isArray(data)) {
                console.error("Invalid data format:", data);
                throw new Error("Server returned invalid data format");
            }

            if (data.length === 0) {
                postFeed.innerHTML = '<div class="no-posts">No posts yet. Be the first to post!</div>';
                return;
            }

            renderPosts(data);

        } catch (error) {
            console.error("🚨 Error fetching posts:", error);
            postFeed.innerHTML = `
                <div class="error-message">
                    Failed to load posts. Please try again later.<br>
                    <small>${error.message}</small>
                </div>`;
        }
    }

    // Initial load
    await retrievePosts();

    // Refresh posts every 30 seconds
    setInterval(retrievePosts, 30000);

    function renderPosts(posts) {
        const postFeed = document.querySelector("#postFeed");
        if (!postFeed) return;
    
        postFeed.innerHTML = ""; // Clear previous posts
    
        posts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("post");
    
            const formattedTimestamp = formatTimestamp(post.createdAt);
    
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
    
            // Check if the logged-in user has liked the post
            const userLiked = (post.likes || []).some(like => like.username === loggedInUsername);
    
            const likesList = (post.likes || []).map(like => `<span>${like.username}</span>`).join(", ");
            const commentsList = (post.comments || []).map(comment => `
                <div class="comment">
                    <span class="comment-username">${comment.username}</span>: ${comment.text}
                </div>
            `).join("");
    
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="../../../no-profile.png" alt="User Profile">
                    <span class="username">${post.username}</span>
                    <span class="timestamp">• ${formattedTimestamp}</span>
                </div>
                <p>${post.text}</p>
                ${mediaContent}
                <div class="post-footer">
                    <button class="like-button ${userLiked ? 'liked' : ''}" data-id="${post._id}">
                        <i class="fa fa-heart"></i> ${post.likes?.length || 0}
                    </button>
                    <button class="comment-button" data-id="${post._id}">
                        <i class="fa fa-comment"></i> ${post.comments?.length || 0}
                    </button>
                    <div class="likes-list">Liked by: ${likesList || "No likes yet"}</div>
                </div>
                <div class="comment-section" id="comment-section-${post._id}">
                    ${commentsList || "<div>No comments yet</div>"}
                    <input type="text" class="comment-input" placeholder="Add a comment..." data-id="${post._id}">
                </div>
            `;
    
            postFeed.appendChild(postElement);
        });
    
        // Add event listeners for like and comment buttons
        document.querySelectorAll(".like-button").forEach(button => {
            button.addEventListener("click", () => {
                const postId = button.getAttribute("data-id");
                likePost(postId);
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
    }

    /**
     * Formats timestamp to "X minutes ago" or "MM/DD/YYYY"
     */
    function formatTimestamp(createdAt) {
        if (!createdAt) return "Just now"; // Fallback for missing timestamps

        const postDate = new Date(createdAt); // Parse timestamp
        const now = new Date();

        // Ensure valid date
        if (isNaN(postDate.getTime())) {
            console.error("Invalid timestamp:", createdAt);
            return "Just now";
        }

        const timeDiff = Math.floor((now - postDate) / 1000); // Difference in seconds

        if (timeDiff < 60) {
            return `${timeDiff} seconds ago`;
        } else if (timeDiff < 3600) {
            return `${Math.floor(timeDiff / 60)} minutes ago`;
        } else if (timeDiff < 86400) {
            return `${Math.floor(timeDiff / 3600)} hours ago`;
        } else {
            // Convert UTC timestamp to local time for better readability
            return postDate.toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
            });
        }
    }

    retrievePosts();
});