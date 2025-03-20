document.addEventListener("DOMContentLoaded", function () {
    // Create the HTML structure dynamically
    const postInputContainer = document.createElement("div");
    postInputContainer.classList.add("post-input");

    // Add stylesheet dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pages/dashboard/components/styles/post-create.css";
    document.head.appendChild(link);

    // Retrieve the username from localStorage
    const storedUsername = localStorage.getItem("username") || "User";

    postInputContainer.innerHTML = `
    <div>
        <!-- Small Post Input Box -->
        <div id="smallPostInput" class="post-create-container">
            <div class="user-profile">
                <img src="../../../no-profile.png" alt="User Profile">
                <span class="username">${storedUsername}</span>
            </div>
            <input type="text" class="post-input" placeholder="What's on your mind?">

            <!-- Post Options -->
            <div class="post-options">
                <div class="post-option"><img src="../../../live.png" alt="Live video"> Live video</div>
                <div class="post-option"><img src="../../../photos.png" alt="Photo/video"> Photo/video</div>
                <div class="post-option"><img src="../../../feeling.png" alt="Feeling/activity"> Feeling/activity</div>
            </div>
        </div>

        <!-- Post Modal -->
        <div id="postModal" class="post-modal">
            <div class="post-modal-content">
                <span class="close-post-modal">&times;</span>
                <h2>Create post</h2>
                <div class="user-profile">
                    <img src="../../../no-profile.png" alt="User Profile">
                    <span class="username">${storedUsername}</span>
                </div>
                <textarea id="postContent" placeholder="What's on your mind, ${storedUsername}?" class="post-modal-textarea"></textarea>

                <!-- Post Options -->
                <div class="post-modal-options">
                    <div class="post-modal-option"><img src="../../../live.png" alt="Live video"> Live video</div>
                    <div class="post-modal-option" id="photoVideoOption">
                        <img src="../../../photos.png" alt="Photo/video"> Photo/video
                    </div>
                    <input type="file" id="fileInput" multiple style="display: none;">
                    <div class="post-modal-option"><img src="../../../feeling.png" alt="Feeling/activity"> Feeling/activity</div>
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
    
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to post.");
            return;
        }
    
        try {
            const response = await fetch("/create-post", {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert("✅ Post created successfully!");
                displayPost(data.post);
                
                // Clear input fields and close modal
                document.getElementById("postContent").value = ""; // Clear text input
                fileInput.value = ""; // Clear file input
                document.getElementById("mediaPreviewContainer").innerHTML = ""; // Clear media preview
                postModal.style.display = "none"; // Hide modal
            } else {
                alert("❌ Failed to create post: " + data.error);
            }
        } catch (error) {
            console.error("🚨 Error creating post:", error);
            alert("Something went wrong. Please try again.");
        }
    });
    
    
    
    document.querySelector("#postForm").addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const formData = new FormData(event.target);
        const response = await fetch("http://localhost:3000/create-post", {
            method: "POST",
            body: formData
        });
    
        if (response.ok) {
            const newPost = await response.json();
            displayPost(newPost.post); // Display the new post dynamically
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

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.querySelector("#fileInput");
    const mediaPreviewContainer = document.querySelector("#mediaPreviewContainer");
    const postButton = document.querySelector("#postButton");
    const photoVideoOption = document.querySelector("#photoVideoOption");

    // Open file input when clicking the "Photo/Video" option
    photoVideoOption.addEventListener("click", () => fileInput.click());

    // Handle file selection and preview
    fileInput.addEventListener("change", () => {
        mediaPreviewContainer.innerHTML = ""; // Clear previous previews

        Array.from(fileInput.files).forEach(file => {
            const reader = new FileReader();
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
                    mediaElement.controls = true; // Add controls for play/pause
                }

                mediaPreviewContainer.appendChild(mediaElement);
            };
            reader.readAsDataURL(file);
        });
    });

    // **Clear media preview when clicking post**
    postButton.addEventListener("click", () => {
        mediaPreviewContainer.innerHTML = ""; // Remove uploaded media previews
        fileInput.value = ""; // Reset file input to allow re-uploading
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const smallPostInput = document.getElementById("smallPostInput");
    const postModal = document.getElementById("postModal");
    const closeModal = document.querySelector(".close-post-modal");
    const postButton = document.getElementById("postButton");
    const postContent = document.getElementById("postContent");
    const fileInput = document.getElementById("fileInput");
    const mediaPreviewContainer = document.getElementById("mediaPreviewContainer");

    function clearModal() {
        postContent.value = "";  // Clear text area
        fileInput.value = "";  // Reset file input
        mediaPreviewContainer.innerHTML = "";  // Clear media preview
        postModal.style.display = "none";  // Hide modal
    }

    if (smallPostInput && postModal && closeModal) {
        // Open modal on click
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
});


