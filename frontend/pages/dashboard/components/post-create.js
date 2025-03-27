document.addEventListener("DOMContentLoaded", function () {
    // Create the HTML structure dynamically
    const postInputContainer = document.createElement("div");
    postInputContainer.classList.add("post-input");
    const API_URL = 'http://localhost:3000'; // Add this at the top

// Add stylesheet dynamically
const style = document.createElement("style");
style.textContent = `
    /* Post Create Styles */
    .post-input {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1c1e21;
    }
    
    .post-create-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: white;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
    }

    /* User Profile Section */
    .user-profile {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 10px;
        margin-bottom: 15px;
    }

    .user-profile img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .username {
        font-weight: 600;
        color: #050505;
    }
    
    .post-input {
        width: 105%;
        min-height: 10px;
        padding: 10px;
        border: none;
        border-radius: 20px;
        background-color: #7EC146;
        font-size: 15px;
        color: #1c1e21;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        resize: none;
        outline: none;
        box-sizing: border-box;
    }

    input.post-input {
        width: 100%;
        padding: 8px 12px;
        border: none;
        border-radius: 20px;
        background-color: #f0f2f5;
        font-size: 15px;
        margin-bottom: 10px;
        cursor: pointer;
        resize: none; /* Prevent manual resizing */
        overflow: hidden; /* Hide scrollbars */
        transition: height 0.2s ease; /* Optional: Smooth height adjustment */
    }

    input.post-input:focus {
        outline: none;
    }

    .post-input::placeholder {
        color: #65676b;
    }
    
    .post-options {
        display: flex;
        justify-content: space-between;
        width: 100%;
        padding: 10px 0;
        border-top: 1px solid #e4e6eb;
    }

    .post-option {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: #65676b;
        font-weight: 500;
        font-size: 14px;
        transition: background-color 0.2s;
        flex: 1;
        justify-content: center;
        gap: 8px;
    }

    .post-option:hover {
        background-color: #f0f2f5;
    }

    .post-option img {
        width: 20px;
        height: 20px;
    }
        
        /* Post Modal Styles */
        .post-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .post-modal-content {
            background-color: #fff;
            border-radius: 8px;
            width: 500px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 2px 26px rgba(0, 0, 0, 0.3);
            animation: modalFadeIn 0.3s;
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .close-post-modal {
            position: absolute;
            top: 16px;
            right: 16px;
            font-size: 24px;
            color: #65676b;
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #e4e6eb;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        
        .close-post-modal:hover {
            background-color: #d8dadf;
        }
        
        .post-modal-content h2 {
            text-align: center;
            padding: 16px 0;
            margin: 0;
            border-bottom: 1px solid #e4e6eb;
            font-size: 20px;
            font-weight: 700;
        }
        
        .post-modal-content .user-profile {
            padding: 16px 16px 8px;
            margin-bottom: 0;
        }
        
        .post-modal-textarea {
            width: 100%;
            min-height: 100px;
            padding: 16px;
            border: none;
            resize: none;
            font-size: 16px;
            font-family: inherit;
            box-sizing: border-box;
        }
        
        .post-modal-textarea:focus {
            outline: none;
        }
        
        .post-modal-options {
            display: flex;
            justify-content: space-around;
            padding: 8px 16px;
            border-top: 1px solid #e4e6eb;
            border-bottom: 1px solid #e4e6eb;
        }
        
        .post-modal-option {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            color: #65676b;
            font-weight: 500;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .post-modal-option:hover {
            background-color: #f0f2f5;
        }
        
        .post-modal-option img {
            width: 20px;
            height: 20px;
            margin-right: 8px;
        }
        
        .post-modal-button {
            width: calc(100% - 32px);
            margin: 16px;
            padding: 8px 0;
            background-color: #1877f2;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .post-modal-button:hover {
            background-color: #166fe5;
        }
        
        .post-modal-button:disabled {
            background-color: #e4e6eb;
            color: #bcc0c4;
            cursor: not-allowed;
        }
        
        /* Media Preview Styles */
        .media-preview-container {
            padding: 0 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 16px;
        }
        
        .media-preview {
            max-width: 100%;
            max-height: 300px;
            border-radius: 8px;
            object-fit: cover;
        }
        
        .media-preview-wrapper {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            width: 100%;
            background-color: #f0f2f5;
        }
        
        .media-preview-wrapper img {
            width: 100%;
            display: block;
        }
        
        .media-preview-wrapper video {
            width: 100%;
            display: block;
        }
        
        .remove-media {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.2s;
        }
        
        .remove-media:hover {
            background-color: rgba(0, 0, 0, 0.8);
        }
        
        .media-upload-area {
            width: 100%;
            padding: 16px;
            background-color: #f0f2f5;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            margin-top: 16px;
        }
        
        .media-upload-area:hover {
            background-color: #e4e6eb;
        }
        
        .media-upload-text {
            font-size: 14px;
            color: #65676b;
            margin-top: 8px;
        }
        
        /* Audience selector */
        .audience-selector {
            display: inline-flex;
            align-items: center;
            background-color: #e4e6eb;
            border-radius: 6px;
            padding: 2px 8px;
            margin-left: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        }
        
        .audience-selector:hover {
            background-color: #d8dadf;
        }
        
        .audience-selector i {
            margin-right: 4px;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);

    // Retrieve the username from localStorage
    const storedUsername = localStorage.getItem("username") || "User";
    
    // Function to retrieve user profile picture
    async function retrieveUserProfilePicture() {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            
            const userData = await response.json();
            return userData.profilePicture ? `${API_URL}${userData.profilePicture}` : '/public/no-profile.png';
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            return '/public/no-profile.png';
        }
    }
    
    // Initial HTML with placeholder for profile picture
    postInputContainer.innerHTML = `
    <div>
        <!-- Small Post Input Box -->
        <div id="smallPostInput" class="post-create-container">
            <div class="user-profile">
                <img src="/public/no-profile.png" id="userProfilePic" alt="User Profile">
                <input type="text" class="post-input" placeholder="What's on your mind, ${storedUsername}?">
            </div>

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
                    <img src="/public/no-profile.png" id="modalUserProfilePic" alt="User Profile">
                    <div>
                        <span class="username">${storedUsername}</span>
                    </div>
                </div>
                <textarea id="postContent" placeholder="What's on your mind, ${storedUsername}?" class="post-modal-textarea"></textarea>
                
                <!-- Media Preview Box -->
                <div id="mediaPreviewContainer" class="media-preview-container"></div>
                
                <!-- Add to your post section -->
                <div class="post-modal-options">
                    <div class="post-modal-option" id="photoVideoOption">
                        <img src="/public/photos.png" alt="Photo/video"> Photo/video
                    </div>
                    <div class="post-modal-option">
                        <img src="/public/feeling.png" alt="Feeling/activity"> Feeling
                    </div>
                    <div class="post-modal-option">
                        <i class="fa fa-ellipsis-h" style="margin-right: 8px; font-size: 20px;"></i> More
                    </div>
                </div>
                
                <input type="file" id="fileInput" multiple style="display: none;">
                
                <button id="postButton" class="post-modal-button">Post</button>
            </div>
        </div>
    </div>`;

    const container = document.querySelector("#postContainer"); 
    if (container) {
        container.appendChild(postInputContainer);
        
        // Fetch and update profile picture
        retrieveUserProfilePicture().then(profilePicUrl => {
            const userProfilePic = document.getElementById('userProfilePic');
            const modalUserProfilePic = document.getElementById('modalUserProfilePic');
            
            if (userProfilePic) userProfilePic.src = profilePicUrl;
            if (modalUserProfilePic) modalUserProfilePic.src = profilePicUrl;
        });
    } else {
        console.error("Container #postContainer not found!");
    }

    // Modal functionality
    const smallPostInput = document.getElementById("smallPostInput");
    const postModal = document.getElementById("postModal");
    const closeModal = document.querySelector(".close-post-modal");
    const postButton = document.getElementById("postButton");
    const postContent = document.getElementById("postContent");
    const fileInput = document.getElementById("fileInput");
    const mediaPreviewContainer = document.getElementById("mediaPreviewContainer");
    const photoVideoOption = document.getElementById("photoVideoOption");

    function clearModal() {
        postContent.value = "";  // Clear text area
        fileInput.value = "";  // Reset file input
        mediaPreviewContainer.innerHTML = "";  // Clear media preview
        postModal.style.display = "none";  // Hide modal
    }

    if (smallPostInput && postModal && closeModal) {
        // Open modal on click (both the container and the input field)
        smallPostInput.addEventListener("click", function () {
            postModal.style.display = "flex";
        });

        // Close modal on click
        closeModal.addEventListener("click", function () {
            clearModal();
        });

        // Close modal if clicked outside of content
        window.addEventListener("click", function (event) {
            if (event.target === postModal) {
                clearModal();
            }
        });
    }

    // Open file input when clicking the "Photo/Video" option
    if (photoVideoOption && fileInput) {
        photoVideoOption.addEventListener("click", function() {
            fileInput.click();
        });
    }

    // Handle file selection and preview
    if (fileInput && mediaPreviewContainer) {
        fileInput.addEventListener("change", function() {
            mediaPreviewContainer.innerHTML = ""; // Clear previous previews
            
            Array.from(fileInput.files).forEach(file => {
                const reader = new FileReader();
                const previewWrapper = document.createElement("div");
                previewWrapper.classList.add("media-preview-wrapper");
                
                // Add remove button
                const removeButton = document.createElement("div");
                removeButton.classList.add("remove-media");
                removeButton.innerHTML = "×";
                removeButton.addEventListener("click", function() {
                    previewWrapper.remove();
                    // Note: This doesn't actually remove the file from the input
                });
                
                reader.onload = (e) => {
                    let mediaElement;
                    
                    if (file.type.startsWith("image/")) {
                        // Create an image preview
                        mediaElement = document.createElement("img");
                        mediaElement.src = e.target.result;
                        mediaElement.classList.add("media-preview");
                    } else if (file.type.startsWith("video/")) {
                        // Create a video preview
                        mediaElement = document.createElement("video");
                        mediaElement.src = e.target.result;
                        mediaElement.classList.add("media-preview");
                        mediaElement.controls = true;
                    }
                    
                    previewWrapper.appendChild(mediaElement);
                    previewWrapper.appendChild(removeButton);
                    mediaPreviewContainer.appendChild(previewWrapper);
                };
                
                reader.readAsDataURL(file);
            });
            
            // Enable/disable post button based on content
            updatePostButtonState();
        });
    }

    // Update post button state based on content
    function updatePostButtonState() {
        const hasText = postContent.value.trim().length > 0;
        const hasMedia = fileInput.files.length > 0;
        
        postButton.disabled = !(hasText || hasMedia);
    }

    // Add event listener to text area to update button state
    if (postContent) {
        postContent.addEventListener("input", updatePostButtonState);
    }

    // Handle post submission
    if (postButton) {
        postButton.addEventListener("click", async function () {
            const text = postContent.value.trim();
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

            const token = localStorage.getItem("token");
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

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Server didn't return JSON");
                }

                const data = await response.json();
                displayPost(data.post);
                
                // Clear input fields and close modal
                clearModal();

            } catch (error) {
                console.error("🚨 Error creating post:", error);
                alert("Something went wrong. Please try again.");
            }
        });
    }

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
                <img src="/public/no-profile.png" alt="User Profile">
                <div class="post-header-info">
                    <span class="username">${post.username}</span>
                    <span class="timestamp">Just now</span>
                </div>
            </div>
            <p class="post-content">${post.text}</p>
            ${mediaContent}
            <div class="post-stats">
                <div class="stat-item">
                    <i class="fa fa-heart"></i> ${post.likes || 0} likes
                </div>
                <div class="stat-item">
                    <i class="fa fa-comment"></i> ${post.comments || 0} comments
                </div>
            </div>
            <div class="post-footer">
                <button class="like-button">
                    <i class="fa fa-heart"></i> Like
                </button>
                <button class="comment-button">
                    <i class="fa fa-comment"></i> Comment
                </button>
                <button class="repost-button">
                    <i class="fa fa-retweet"></i> Repost
                </button>
            </div>
        `;

        postFeed.prepend(postElement);
    }
    
    console.log("✅ post-create.js loaded!");
});