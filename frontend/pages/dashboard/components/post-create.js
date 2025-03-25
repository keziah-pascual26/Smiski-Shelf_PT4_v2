document.addEventListener("DOMContentLoaded", async function () {
    const API_URL = 'http://localhost:3000'; // Replace with your actual API URL

    // Fetch the latest username from the server
    const token = localStorage.getItem("token");
    let storedUsername = "User"; // Default username

    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const userData = await response.json();
                storedUsername = userData.username || "User";

                // Update localStorage with the latest username
                localStorage.setItem("username", storedUsername);
            } else {
                console.error("Failed to fetch user profile:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    } else {
        console.error("No token found. User might not be logged in.");
    }

    // Create the HTML structure dynamically
    const postInputContainer = document.createElement("div");
    postInputContainer.classList.add("post-input");

    // Add stylesheet dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pages/dashboard/components/styles/post-create.css";
    document.head.appendChild(link);

    postInputContainer.innerHTML = `
    <div>
        <!-- Small Post Input Box -->
        <div id="smallPostInput" class="post-create-container">
            <div class="user-profile">
                <img src="/public/no-profile.png" alt="User Profile">
                <span class="username">${storedUsername}</span>
            </div>
            <input type="text" class="post-input" placeholder="What's on your mind?">

            <!-- Post Options -->
            <div class="post-options">
                <div class="post-option"><img src="/public/live.png" alt="Live video"> Live video</div>
                <div class="post-option"><img src="/public/photos.png" alt="Photo/video"> Photo/video</div>
                <div class="post-option"><img src="/public/feeling.png" alt="Feeling/activity"> Feeling/activity</div>
            </div>
        </div>

        <!-- Post Modal -->
        <div id="postModal" class="post-modal">
            <div class="post-modal-content">
                <span class="close-post-modal">&times;</span>
                <h2>Create post</h2>
                <div class="user-profile">
                    <img src="/public/no-profile.png" alt="User Profile">
                    <span class="username">${storedUsername}</span>
                </div>
                <textarea id="postContent" placeholder="What's on your mind, ${storedUsername}?" class="post-modal-textarea"></textarea>

                <!-- Post Options -->
                <div class="post-modal-options">
                    <div class="post-modal-option"><img src="/public/live.png" alt="Live video"> Live video</div>
                    <div class="post-modal-option" id="photoVideoOption">
                        <img src="/public/photos.png" alt="Photo/video"> Photo/video
                    </div>
                    <input type="file" id="fileInput" multiple style="display: none;">
                    <div class="post-modal-option"><img src="/public/feeling.png" alt="Feeling/activity"> Feeling/activity</div>
                </div>
                
                <!-- Media Preview Box -->
                <div id="mediaPreviewContainer" class="media-preview-container"></div>

                <button id="postButton" class="post-modal-button">Post</button>
            </div>
        </div>
    </div>`;

    const container = document.querySelector("#postContainer"); 
    if (container) {
        container.appendChild(postInputContainer);
    } else {
        console.error("Container #postContainer not found!");
    }

    // Modal functionality
    const smallPostInput = document.getElementById("smallPostInput");
    const postModal = document.getElementById("postModal");
    const closeModal = document.querySelector(".close-post-modal");
    const postButton = document.getElementById("postButton");

    if (smallPostInput && postModal && closeModal) {
        // Open modal on click
        smallPostInput.addEventListener("click", function () {
            postModal.style.display = "flex";
        });

        // Close modal on click
        closeModal.addEventListener("click", function () {
            postModal.style.display = "none";
        });

        // Close modal if clicked outside of content
        window.addEventListener("click", function (event) {
            if (event.target === postModal) {
                postModal.style.display = "none";
            }
        });
    }

    // Handle post submission
    postButton.addEventListener("click", async function () {
        const text = document.getElementById("postContent").value.trim();
        const fileInput = document.getElementById("fileInput");
        const files = fileInput.files;

        if (!text && files.length === 0) {
            alert("Post content or a file is required.");
            return;
        }

        const formData = new FormData();
        formData.append("text", text);
        for (let i = 0; i < files.length; i++) {
            formData.append("media", files[i]);
        }

        if (!token) {
            alert("You must be logged in to post.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/create-post`, {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            alert("✅ Post created successfully!");
            displayPost(data.post);
            
            // Clear input fields and close modal
            document.getElementById("postContent").value = "";
            fileInput.value = "";
            document.getElementById("mediaPreviewContainer").innerHTML = "";
            postModal.style.display = "none";

        } catch (error) {
            console.error("🚨 Error creating post:", error);
            alert("Something went wrong. Please try again.");
        }
    });

    function displayPost(post) {
        const postFeed = document.querySelector("#postFeed");
        if (!postFeed) return;

        const postElement = document.createElement("div");
        postElement.classList.add("post");

        let mediaContent = "";
        if (post.media && post.media.length > 0) {
            mediaContent = `
                <div class="post-media">
                    ${post.media
                        .map(file => {
                            const fileExtension = file.split(".").pop().toLowerCase();
                            if (["mp4", "webm", "ogg"].includes(fileExtension)) {
                                return `<video controls><source src="/uploads/${file}" type="video/${fileExtension}"></video>`;
                            } else {
                                return `<img src="/uploads/${file}" alt="Post Image">`;
                            }
                        })
                        .join("")}
                </div>
            `;
        }

        postElement.innerHTML = `
            <div class="post-header">
                <img src="../../../no-profile.png" alt="User Profile">
                <span class="username">${post.username}</span>
            </div>
            <p>${post.text}</p>
            ${mediaContent}
            <div class="post-footer">
                <span class="like"><i class="fa fa-heart"></i> ${post.likes || 0}</span>
                <span class="comment"><i class="fa fa-comment"></i> ${post.comments || 0}</span>
                <span class="retweet"><i class="fa fa-retweet"></i> ${post.retweets || 0}</span>
            </div>
        `;

        postFeed.prepend(postElement);
    }

    console.log("✅ post-create.js loaded!");
});