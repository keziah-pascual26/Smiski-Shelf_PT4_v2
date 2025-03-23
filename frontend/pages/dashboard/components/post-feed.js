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
            
            // Get all posts to check if user already reposted this post
            const checkResponse = await fetch(`http://localhost:3000/posts?username=${encodeURIComponent(loggedInUsername)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!checkResponse.ok) {
                throw new Error(`Failed to check posts: ${checkResponse.status}`);
            }
            
            const posts = await checkResponse.json();
            
            // Check if user already reposted this post OR any post that has this post as its original
            const alreadyReposted = posts.some(post => {
                // Only check posts by the current user
                if (post.username !== loggedInUsername) {
                    return false;
                }
                
                // Check if this is a repost of the target post
                if (post.originalPostId && post.originalPostId.toString() === postId) {
                    return true;
                }
                
                // Also check if the target post is a repost and the current user has already reposted its original
                const targetPost = posts.find(p => p._id.toString() === postId);
                if (targetPost && targetPost.originalPostId) {
                    return post.originalPostId && post.originalPostId.toString() === targetPost.originalPostId.toString();
                }
                
                return false;
            });
            
            if (alreadyReposted) {
                alert("You have already reposted this content!");
                return;
            }
            
            // If not already reposted, proceed with repost
            const response = await fetch(`http://localhost:3000/posts/${postId}/repost`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        
            if (!response.ok) {
                throw new Error(`Failed to repost post: ${response.status}`);
            }
        
            const data = await response.json();
            console.log(`✅ Post ${postId} reposted successfully:`, data.message);
            await retrievePosts(); // Refresh posts
        } catch (error) {
            console.error("🚨 Error reposting post:", error);
            alert("Error reposting post: " + error.message);
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

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Received posts:", data);

            if (!Array.isArray(data)) {
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

            const userLiked = (post.likes || []).some(like => like.username === loggedInUsername);

            const likesList = (post.likes || []).map(like => `<span>${like.username}</span>`).join(", ");
            const commentsList = (post.comments || []).map(comment => `
                <div class="comment" data-comment-id="${comment._id}">
                    <span class="comment-username">${comment.username}</span>: 
                    <span class="comment-text">${comment.text}</span>
                    ${comment.username === loggedInUsername ? `
                        <button class="edit-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">Edit</button>
                        <button class="delete-comment-button" data-id="${post._id}" data-comment-id="${comment._id}">Delete</button>
                    ` : ""}
                </div>
            `).join("");

            const repostButton = `
                <button class="repost-button" data-id="${post._id}">
                    <i class="fa fa-retweet"></i> Repost
                </button>
            `;

            postElement.innerHTML = `
            <div class="post-header">
                <img src="/public/no-profile.png" alt="User Profile">
                <span class="username">${post.username}</span>
                <span class="timestamp">• ${formattedTimestamp}</span>
                <span class="repost-info">${post.originalPostId ? `• Reposted from original post` : ""}</span>
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
                ${repostButton}
                <div class="likes-list">Liked by: ${likesList || "No likes yet"}</div>
            </div>
            <div class="comment-section" id="comment-section-${post._id}">
                ${commentsList || "<div>No comments yet</div>"}
                <input type="text" class="comment-input" placeholder="Add a comment..." data-id="${post._id}">
            </div>
        `;

            postFeed.appendChild(postElement);
        });

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

    retrievePosts();
});