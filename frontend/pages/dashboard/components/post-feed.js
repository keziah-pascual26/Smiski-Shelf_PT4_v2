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

    async function retrievePosts() {
        try {
            const response = await fetch("http://localhost:3000/posts");
            const postsData = await response.json();

            if (Array.isArray(postsData)) {
                // ✅ Only show posts belonging to the logged-in user
                const userPosts = postsData.filter(post => post.username === loggedInUsername);
                renderPosts(userPosts);
            }
        } catch (error) {
            console.error("🚨 Error fetching posts:", error);
        }
    }

    function renderPosts(posts) {
        const postFeed = document.querySelector("#postFeed");
        if (!postFeed) return;
    
        postFeed.innerHTML = ""; // Clear previous posts
    
        posts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("post");
    
            // Format timestamp
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
    
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="../../../no-profile.png" alt="User Profile">
                    <span class="username">${post.username}</span>
                    <span class="timestamp">• ${formatTimestamp(post.createdAt)}</span>
                </div>
                <p>${post.text}</p>
                ${mediaContent}
                <div class="post-footer">
                    <span class="like"><i class="fa fa-heart"></i> ${post.likes || 0}</span>
                    <span class="comment"><i class="fa fa-comment"></i> ${post.comments || 0}</span>
                    <span class="retweet"><i class="fa fa-retweet"></i> ${post.retweets || 0}</span>
                </div>
            `;
    
            postFeed.appendChild(postElement);
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
