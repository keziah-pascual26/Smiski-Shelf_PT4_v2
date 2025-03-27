// Global variables for pagination
let currentPage = 1;
let usersPerPage = 10;
let allUsers = [];

let postsCurrentPage = 1;
let postsPerPage = 10;
let allPosts = [];

let reportsCurrentPage = 1;
let reportsPerPage = 10;
let allReports = [];

// Add this at the beginning of your admin-dashboard.js file
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminToken = localStorage.getItem('adminToken');
    
    if (!isAdmin || !adminToken) {
        // Not admin, redirect to login page
        window.location.href = '/pages/login/login.html';
        return;
    }
    
    // Continue with admin dashboard initialization
    initializeDashboard();
});

// Update the logout functionality
document.getElementById("logout-btn").addEventListener("click", function() {
    // Add confirmation dialog
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("isAdmin");
        window.location.href = "/pages/login/login.html"; // Change this to your main login page
    }
});

// Navigation functionality
document.querySelectorAll(".admin-nav a").forEach(link => {
    link.addEventListener("click", function(e) {
        e.preventDefault();
        
        // Remove active class from all links and sections
        document.querySelectorAll(".admin-nav li").forEach(item => {
            item.classList.remove("active");
        });
        document.querySelectorAll(".admin-section").forEach(section => {
            section.classList.remove("active");
        });
        
        // Add active class to clicked link
        this.parentElement.classList.add("active");
        
        // Show corresponding section
        const targetId = this.getAttribute("href");
        document.querySelector(targetId).classList.add("active");
    });
});

// Dashboard initialization
// Update the initializeDashboard function to include reports section
async function initializeDashboard() {
    try {
        // Fetch dashboard stats
        await fetchDashboardStats();
        
        // Fetch users data
        await fetchUsers();
        
        // Populate user filter dropdown
        await populateUserFilter();
        
        // Fetch posts data
        await fetchPosts();
        
        // Set up dummy reports data for UI demonstration
        setupDummyReports();
        
        // Set up refresh buttons
        document.getElementById("refresh-users-btn").addEventListener("click", fetchUsers);
        document.getElementById("refresh-posts-btn").addEventListener("click", fetchPosts);
        document.getElementById("refresh-reports-btn").addEventListener("click", () => setupDummyReports());
        
        // Set up search functionality
        document.getElementById("user-search").addEventListener("input", filterUsers);
        document.getElementById("post-search").addEventListener("input", filterPosts);
        document.getElementById("report-search").addEventListener("input", filterReports);
        
        // Set up user filter for posts
        document.getElementById("user-filter").addEventListener("change", filterPosts);
        
        // Set up report filters
        document.getElementById("report-type-filter").addEventListener("change", filterReports);
        document.getElementById("report-status-filter").addEventListener("change", filterReports);
        
    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch("http://localhost:3000/api/admin/stats", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById("total-users").textContent = stats.userCount;
            document.getElementById("total-posts").textContent = stats.postCount;
            document.getElementById("active-users").textContent = stats.activeUserCount;
        } else {
            throw new Error("Failed to fetch dashboard stats");
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        document.getElementById("total-users").textContent = "Error";
        document.getElementById("total-posts").textContent = "Error";
        document.getElementById("active-users").textContent = "Error";
    }
}



// Fetch users data
async function fetchUsers() {
    try {
        const loadingRow = document.querySelector(".loading-row");
        if (loadingRow) {
            loadingRow.style.display = "table-row";
        }
        
        const token = localStorage.getItem("adminToken");
        
        // Check if token exists and is properly formatted
        if (!token) {
            console.error("No admin token found in localStorage");
            throw new Error("Authentication token missing");
        }
        
        // Log token length instead of the actual token for security
        console.log("Token length:", token.length);
        
        const response = await fetch(`http://localhost:3000/api/admin/users?page=${currentPage}&limit=${usersPerPage}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error:", response.status, errorData);
            throw new Error(`Failed to fetch users: ${response.status} ${errorData.message || ''}`);
        }
        
        const data = await response.json();
        allUsers = data.users;
        
        // Update pagination
        updatePagination(data.totalPages);
        
        // Display users
        displayUsers(allUsers);
        
        // Hide loading row
        if (loadingRow) {
            loadingRow.style.display = "none";
        }
        
    } catch (error) {
        console.error("Error fetching users:", error);
        const tableBody = document.getElementById("users-table-body");
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    Failed to load users data: ${error.message}
                </td>
            </tr>
        `;
        
        // Hide loading row on error
        const loadingRow = document.querySelector(".loading-row");
        if (loadingRow) {
            loadingRow.style.display = "none";
        }
    }
}

// Update pagination controls
function updatePagination(totalPages) {
    document.getElementById("page-info").textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Update button states
    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === totalPages;
    
    // Add event listeners if not already added
    const prevButton = document.getElementById("prev-page");
    const nextButton = document.getElementById("next-page");
    
    // Remove existing listeners to prevent duplicates
    const newPrevButton = prevButton.cloneNode(true);
    const newNextButton = nextButton.cloneNode(true);
    
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);
    
    // Add new listeners
    newPrevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            fetchUsers();
        }
    });
    
    newNextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchUsers();
        }
    });
}

// Display users
function displayUsers(users) {
    const tableBody = document.getElementById("users-table-body");
    tableBody.innerHTML = "";
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">No users found</td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        // Format date
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A";
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${user._id.substring(0, 8)}...</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${createdAt}</td>
            <td><span class="status-badge ${user.status || 'active'}">${user.status || 'Active'}</span></td>
            <td class="actions">
                <button class="view-btn" data-id="${user._id}"><i class="fas fa-eye"></i></button>
                <button class="edit-btn" data-id="${user._id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${user._id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.getAttribute("data-id");
            viewUser(userId);
        });
    });
    
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.getAttribute("data-id");
            editUser(userId);
        });
    });
    
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const userId = this.getAttribute("data-id");
            deleteUser(userId);
        });
    });
}

// Filter users based on search input
function filterUsers() {
    const searchTerm = document.getElementById("user-search").value.toLowerCase();
    
    if (searchTerm === "") {
        // Reset to original list
        displayUsers(allUsers);
        return;
    }
    
    const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );
    
    displayUsers(filteredUsers);
}

// View user details
async function viewUser(userId) {
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch user details");
        }
        
        const user = await response.json();
        
        // Create modal for user details
        const modal = document.createElement("div");
        modal.className = "admin-modal";
        modal.innerHTML = `
            <div class="admin-modal-content">
                <span class="admin-modal-close">&times;</span>
                <h2>User Details</h2>
                <div class="user-details">
                    <p><strong>ID:</strong> ${user._id}</p>
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Status:</strong> ${user.status || 'Active'}</p>
                    <p><strong>Created:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
                    <p><strong>Last Login:</strong> ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
                    <p><strong>Bio:</strong> ${user.bio || 'No bio provided'}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.querySelector(".admin-modal-close").addEventListener("click", () => {
            modal.remove();
        });
        
        // Close when clicking outside
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error("Error viewing user:", error);
        alert("Failed to load user details. Please try again.");
    }
}

// Edit user
async function editUser(userId) {
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch user details");
        }
        
        const user = await response.json();
        
        // Create modal for editing user
        const modal = document.createElement("div");
        modal.className = "admin-modal";
        modal.innerHTML = `
            <div class="admin-modal-content">
                <span class="admin-modal-close">&times;</span>
                <h2>Edit User</h2>
                <form id="edit-user-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status">
                            <option value="active" ${user.status === 'active' || !user.status ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                    <button type="submit" class="save-btn">Save Changes</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtn = modal.querySelector(".admin-modal-close");
        closeBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        
        // Close when clicking outside
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Handle form submission
        const form = modal.querySelector("#edit-user-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const updatedUser = {
                username: document.getElementById("username").value,
                email: document.getElementById("email").value,
                status: document.getElementById("status").value
            };
            
            try {
                const updateResponse = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedUser)
                });
                
                if (!updateResponse.ok) {
                    throw new Error("Failed to update user");
                }
                
                alert("User updated successfully");
                document.body.removeChild(modal);
                fetchUsers(); // Refresh the user list
                
            } catch (error) {
                console.error("Error updating user:", error);
                alert("Failed to update user. Please try again.");
            }
        });
        
    } catch (error) {
        console.error("Error editing user:", error);
        alert("Failed to load user details for editing. Please try again.");
    }
}

// Delete user
async function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        try {
            const token = localStorage.getItem("adminToken");
            
            const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to delete user: ${errorData.message || response.statusText}`);
            }
            
            alert("User deleted successfully");
            fetchUsers(); // Refresh the user list
            
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(`Failed to delete user: ${error.message}`);
        }
    }
}

// Add the fetchPosts function
async function fetchPosts() {
    try {
        const loadingRow = document.querySelector("#posts-table-body .loading-row");
        if (loadingRow) {
            loadingRow.style.display = "table-row";
        }
        
        const token = localStorage.getItem("adminToken");
        
        // Check if token exists and is properly formatted
        if (!token) {
            console.error("No admin token found in localStorage");
            throw new Error("Authentication token missing");
        }
        
        const response = await fetch(`http://localhost:3000/api/admin/posts?page=${postsCurrentPage}&limit=${postsPerPage}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error:", response.status, errorData);
            throw new Error(`Failed to fetch posts: ${response.status} ${errorData.message || ''}`);
        }
        
        const data = await response.json();
        allPosts = data.posts;
        
        // Update pagination
        updatePostsPagination(data.totalPages);
        
        // Render posts
        renderPosts(allPosts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        document.getElementById("posts-table-body").innerHTML = `
            <tr>
                <td colspan="7" class="error-message">
                    Failed to load posts: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Add the renderPosts function
function renderPosts(posts) {
    const tableBody = document.getElementById("posts-table-body");
    
    if (!posts || posts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">No posts found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = "";
    
    posts.forEach(post => {
        const row = document.createElement("tr");
        
        // Truncate text if it's too long
        const truncatedText = post.text && post.text.length > 50 
            ? post.text.substring(0, 50) + "..." 
            : post.text || "No text";
        
        // Format date
        const createdDate = new Date(post.createdAt).toLocaleString();
        
        row.innerHTML = `
            <td>${post._id}</td>
            <td>${post.username || 'Unknown'}</td>
            <td>${truncatedText}</td>
            <td>${createdDate}</td>
            <td>${post.likes ? post.likes.length : 0}</td>
            <td>${post.status || 'active'}</td>
            <td class="actions">
                <button class="view-btn" data-id="${post._id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="edit-btn" data-id="${post._id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${post._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll("#posts-table-body .view-btn").forEach(button => {
        button.addEventListener("click", () => viewPost(button.dataset.id));
    });
    
    document.querySelectorAll("#posts-table-body .edit-btn").forEach(button => {
        button.addEventListener("click", () => editPost(button.dataset.id));
    });
    
    document.querySelectorAll("#posts-table-body .delete-btn").forEach(button => {
        button.addEventListener("click", () => deletePost(button.dataset.id));
    });
}

// Add the updatePostsPagination function
function updatePostsPagination(totalPages) {
    document.getElementById("posts-page-info").textContent = `Page ${postsCurrentPage} of ${totalPages}`;
    
    // Update button states
    document.getElementById("posts-prev-page").disabled = postsCurrentPage === 1;
    document.getElementById("posts-next-page").disabled = postsCurrentPage === totalPages;
    
    // Add event listeners if not already added
    const prevButton = document.getElementById("posts-prev-page");
    const nextButton = document.getElementById("posts-next-page");
    
    // Remove existing listeners to prevent duplicates
    const newPrevButton = prevButton.cloneNode(true);
    const newNextButton = nextButton.cloneNode(true);
    
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);
    
    // Add new listeners
    newPrevButton.addEventListener("click", () => {
        if (postsCurrentPage > 1) {
            postsCurrentPage--;
            fetchPosts();
        }
    });
    
    newNextButton.addEventListener("click", () => {
        if (postsCurrentPage < totalPages) {
            postsCurrentPage++;
            fetchPosts();
        }
    });
}

// Add the filterPosts function
function filterPosts() {
    const searchTerm = document.getElementById("post-search").value.toLowerCase();
    
    if (!searchTerm) {
        renderPosts(allPosts);
        return;
    }
    
    const filteredPosts = allPosts.filter(post => {
        return (
            post._id.toLowerCase().includes(searchTerm) ||
            (post.user && post.user.username.toLowerCase().includes(searchTerm)) ||
            (post.text && post.text.toLowerCase().includes(searchTerm))
        );
    });
    
    renderPosts(filteredPosts);
}

// Update the viewPost function to better handle media
async function viewPost(postId) {
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch post details");
        }
        
        const post = await response.json();
        console.log("Post data:", post); // Debug: Log post data
        
        // Create modal for viewing post
        const modal = document.createElement("div");
        modal.className = "admin-modal";
        
        // Format date
        const createdDate = new Date(post.createdAt).toLocaleString();
        
        // Prepare media content if available
        let mediaContent = '';
        if (post.media && post.media.length > 0) {
            console.log("Media found:", post.media); // Debug: Log media array
            
            mediaContent = `
                <div class="post-media-container">
                    <h3>Media:</h3>
                    <div class="post-media">`;
            
            // Process each media item
            post.media.forEach((mediaItem, index) => {
                // Get the media URL (handle both string and object formats)
                const mediaUrl = typeof mediaItem === 'object' ? mediaItem.url || mediaItem.path : mediaItem;
                console.log(`Media ${index}:`, mediaUrl); // Debug: Log each media URL
                
                if (typeof mediaUrl === 'string') {
                    // Check if it's an image
                    if (mediaUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
                        mediaContent += `
                            <div class="media-item">
                                <div class="media-loading">Loading image...</div>
                                <img src="${mediaUrl}" alt="Post image" 
                                    onclick="window.open('${mediaUrl}', '_blank')"
                                    onload="this.previousElementSibling.style.display='none'"
                                    onerror="this.style.display='none'; this.previousElementSibling.innerHTML='Failed to load image'">
                            </div>`;
                    } 
                    // Check if it's a video
                    else if (mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
                        mediaContent += `
                            <div class="media-item">
                                <video controls>
                                    <source src="${mediaUrl}" type="video/${mediaUrl.split('.').pop().toLowerCase()}">
                                    Your browser does not support the video tag.
                                </video>
                            </div>`;
                    } 
                    // Default for other file types
                    else {
                        mediaContent += `
                            <div class="media-item">
                                <a href="${mediaUrl}" target="_blank" class="media-link">
                                    <i class="fas fa-file"></i> View Attachment
                                </a>
                            </div>`;
                    }
                } else {
                    mediaContent += `
                        <div class="media-item">
                            <span class="media-error">Invalid media format</span>
                        </div>`;
                }
            });
            
            mediaContent += `
                    </div>
                </div>`;
        } else {
            console.log("No media found in post"); // Debug: Log when no media is found
        }
        
        modal.innerHTML = `
            <div class="admin-modal-content">
                <span class="admin-modal-close">&times;</span>
                <h2>View Post</h2>
                <div class="post-details">
                    <p><strong>ID:</strong> ${post._id}</p>
                    <p><strong>User:</strong> ${post.username || 'Unknown'}</p>
                    <p><strong>Created:</strong> ${createdDate}</p>
                    <p><strong>Likes:</strong> ${post.likes ? post.likes.length : 0}</p>
                    <p><strong>Status:</strong> ${post.status || 'active'}</p>
                    <div class="post-content">
                        <h3>Content:</h3>
                        <p>${post.text || 'No text content'}</p>
                    </div>
                    ${mediaContent}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.querySelector(".admin-modal-close").addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        
        // Close when clicking outside the modal
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    } catch (error) {
        console.error("Error viewing post:", error);
        alert("Failed to load post details: " + error.message);
    }
}

// Add the editPost function
async function editPost(postId) {
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch post details");
        }
        
        const post = await response.json();
        
        // Create modal for editing post
        const modal = document.createElement("div");
        modal.className = "admin-modal";
        modal.innerHTML = `
            <div class="admin-modal-content">
                <span class="admin-modal-close">&times;</span>
                <h2>Edit Post</h2>
                <form id="edit-post-form">
                    <div class="form-group">
                        <label for="post-text">Content</label>
                        <textarea id="post-text" rows="5">${post.text || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="post-status">Status</label>
                        <select id="post-status">
                            <option value="active" ${post.status === 'active' || !post.status ? 'selected' : ''}>Active</option>
                            <option value="hidden" ${post.status === 'hidden' ? 'selected' : ''}>Hidden</option>
                            <option value="flagged" ${post.status === 'flagged' ? 'selected' : ''}>Flagged</option>
                        </select>
                    </div>
                    <button type="submit" class="save-btn">Save Changes</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.querySelector(".admin-modal-close").addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        
        // Close when clicking outside the modal
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Handle form submission
        document.getElementById("edit-post-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const text = document.getElementById("post-text").value;
            const status = document.getElementById("post-status").value;
            
            try {
                const updateResponse = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ text, status })
                });
                
                if (!updateResponse.ok) {
                    throw new Error("Failed to update post");
                }
                
                // Refresh posts list
                await fetchPosts();
                
                // Close modal
                document.body.removeChild(modal);
            } catch (error) {
                console.error("Error updating post:", error);
                alert("Failed to update post");
            }
        });
    } catch (error) {
        console.error("Error editing post:", error);
        alert("Failed to load post details");
    }
}

// Add the deletePost function
async function deletePost(postId) {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
        return;
    }
    
    try {
        const token = localStorage.getItem("adminToken");
        
        const response = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to delete post");
        }
        
        // Refresh posts list
        await fetchPosts();
    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
    }
}

// Add the filterPosts function
function filterPosts() {
    const searchTerm = document.getElementById("post-search").value.toLowerCase();
    const userFilter = document.getElementById("user-filter").value.toLowerCase();
    
    if (!searchTerm && !userFilter) {
        renderPosts(allPosts);
        return;
    }
    
    const filteredPosts = allPosts.filter(post => {
        const matchesSearch = !searchTerm || 
            post._id.toLowerCase().includes(searchTerm) ||
            (post.text && post.text.toLowerCase().includes(searchTerm));
            
        const matchesUser = !userFilter || 
            (post.username && post.username.toLowerCase().includes(userFilter));
            
        return matchesSearch && matchesUser;
    });
    
    renderPosts(filteredPosts);
}

// Add function to populate user filter dropdown
async function populateUserFilter() {
    try {
        const token = localStorage.getItem("adminToken");
        
        // Fetch all unique usernames from posts
        const response = await fetch("http://localhost:3000/api/admin/users?limit=100", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error("Failed to fetch users for filter");
        }
        
        const data = await response.json();
        const users = data.users;
        
        // Get the user filter dropdown
        const userFilter = document.getElementById("user-filter");
        
        // Clear existing options except the first one
        while (userFilter.options.length > 1) {
            userFilter.remove(1);
        }
        
        // Add users to dropdown
        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.username;
            option.textContent = user.username;
            userFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error("Error populating user filter:", error);
    }
}


// Add this function to set up dummy reports for UI demonstration
function setupDummyReports() {
    // Create dummy reports data
    allReports = [
        {
            _id: "rep123456789",
            reportType: "user",
            reportedUser: { _id: "user123", username: "john_doe", email: "john@example.com" },
            reporter: { _id: "user456", username: "jane_smith" },
            reason: "Inappropriate behavior",
            details: "This user has been sending harassing messages",
            status: "pending",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
            _id: "rep987654321",
            reportType: "post",
            reportedPost: { _id: "post123", text: "This is an inappropriate post content", username: "toxic_user" },
            reporter: { _id: "user789", username: "alex_jones" },
            reason: "Offensive content",
            details: "This post contains hate speech",
            status: "reviewed",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        },
        {
            _id: "rep456789123",
            reportType: "user",
            reportedUser: { _id: "user789", username: "spam_account", email: "spam@example.com" },
            reporter: { _id: "user123", username: "john_doe" },
            reason: "Spam account",
            details: "This account is posting spam links",
            status: "resolved",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        },
        {
            _id: "rep789123456",
            reportType: "post",
            reportedPost: { _id: "post456", text: "Check out this link to get free stuff", username: "spam_account" },
            reporter: { _id: "user456", username: "jane_smith" },
            reason: "Spam content",
            details: "This post contains suspicious links",
            status: "dismissed",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        }
    ];
    
    // Display reports
    displayReports(allReports);
    
    // Update pagination
    updateReportsPagination(1);
}

// Add this function to filter reports
function filterReports() {
    const searchTerm = document.getElementById("report-search").value.toLowerCase();
    const typeFilter = document.getElementById("report-type-filter").value;
    const statusFilter = document.getElementById("report-status-filter").value;
    
    let filteredReports = allReports;
    
    // Apply type filter
    if (typeFilter !== "all") {
        filteredReports = filteredReports.filter(report => report.reportType === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
        filteredReports = filteredReports.filter(report => report.status === statusFilter);
    }
    
    // Apply search term
    if (searchTerm) {
        filteredReports = filteredReports.filter(report => {
            return (
                report._id.toLowerCase().includes(searchTerm) ||
                (report.reportType === "user" && report.reportedUser && 
                 report.reportedUser.username.toLowerCase().includes(searchTerm)) ||
                (report.reportType === "post" && report.reportedPost && 
                 report.reportedPost.text.toLowerCase().includes(searchTerm)) ||
                (report.reporter && report.reporter.username.toLowerCase().includes(searchTerm)) ||
                report.reason.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    // Display filtered reports
    displayReports(filteredReports);
}

// Add this function to update reports pagination
function updateReportsPagination(totalPages) {
    document.getElementById("reports-page-info").textContent = `Page ${reportsCurrentPage} of ${totalPages}`;
    
    // Update button states
    document.getElementById("reports-prev-page").disabled = reportsCurrentPage === 1;
    document.getElementById("reports-next-page").disabled = reportsCurrentPage === totalPages;
    
    // Remove existing listeners to prevent duplicates
    const prevButton = document.getElementById("reports-prev-page");
    const nextButton = document.getElementById("reports-next-page");
    
    const newPrevButton = prevButton.cloneNode(true);
    const newNextButton = nextButton.cloneNode(true);
    
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);
    
    // Add new listeners
    newPrevButton.addEventListener("click", () => {
        if (reportsCurrentPage > 1) {
            reportsCurrentPage--;
            filterReports();
        }
    });
    
    newNextButton.addEventListener("click", () => {
        if (reportsCurrentPage < totalPages) {
            reportsCurrentPage++;
            filterReports();
        }
    });
}

// Add this function to display reports
function displayReports(reports) {
    const tableBody = document.getElementById("reports-table-body");
    tableBody.innerHTML = "";
    
    if (reports.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">
                    No reports found
                </td>
            </tr>
        `;
        return;
    }
    
    reports.forEach(report => {
        const row = document.createElement("tr");
        
        // Format date
        const reportDate = new Date(report.createdAt).toLocaleString();
        
        // Create status badge with appropriate color
        let statusBadgeClass = '';
        switch(report.status) {
            case 'pending':
                statusBadgeClass = 'status-pending';
                break;
            case 'reviewed':
                statusBadgeClass = 'status-reviewed';
                break;
            case 'resolved':
                statusBadgeClass = 'status-resolved';
                break;
            case 'dismissed':
                statusBadgeClass = 'status-dismissed';
                break;
        }
        
        // Determine reported item based on report type
        let reportedItem = 'N/A';
        if (report.reportType === 'user' && report.reportedUser) {
            reportedItem = report.reportedUser.username || 'Unknown User';
        } else if (report.reportType === 'post' && report.reportedPost) {
            reportedItem = report.reportedPost.text 
                ? (report.reportedPost.text.length > 30 
                    ? report.reportedPost.text.substring(0, 30) + '...' 
                    : report.reportedPost.text)
                : 'Post ID: ' + report.reportedPost._id;
        }
        
        row.innerHTML = `
            <td>${report._id.substring(0, 8)}...</td>
            <td>${report.reportType}</td>
            <td>${reportedItem}</td>
            <td>${report.reporter ? report.reporter.username : 'N/A'}</td>
            <td>${report.reason}</td>
            <td>${reportDate}</td>
            <td><span class="status-badge ${statusBadgeClass}">${report.status}</span></td>
            <td class="actions">
                <button class="view-btn" data-id="${report._id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="review-btn" data-id="${report._id}">
                    <i class="fas fa-gavel"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll("#reports-table-body .view-btn").forEach(button => {
        button.addEventListener("click", () => {
            viewReport(button.getAttribute("data-id"));
        });
    });
    
    document.querySelectorAll("#reports-table-body .review-btn").forEach(button => {
        button.addEventListener("click", () => {
            reviewReport(button.getAttribute("data-id"));
        });
    });
}

// Add this function to view a report
function viewReport(reportId) {
    // Find the report in our dummy data
    const report = allReports.find(r => r._id === reportId);
    
    if (!report) {
        alert("Report not found");
        return;
    }
    
    // Create modal for report details
    const modal = document.createElement("div");
    modal.className = "admin-modal";
    
    let reportedItemDetails = '';
    
    // Different display based on report type
    if (report.reportType === 'user' && report.reportedUser) {
        reportedItemDetails = `
            <div class="reported-item-details">
                <h3>Reported User Details</h3>
                <p><strong>Username:</strong> ${report.reportedUser.username}</p>
                <p><strong>Email:</strong> ${report.reportedUser.email}</p>
                <p><strong>User ID:</strong> ${report.reportedUser._id}</p>
                <p><strong>Status:</strong> Active</p>
            </div>
        `;
    } else if (report.reportType === 'post' && report.reportedPost) {
        reportedItemDetails = `
            <div class="reported-item-details">
                <h3>Reported Post Details</h3>
                <p><strong>Post ID:</strong> ${report.reportedPost._id}</p>
                <p><strong>Author:</strong> ${report.reportedPost.username || 'Unknown'}</p>
                <p><strong>Content:</strong> ${report.reportedPost.text || 'No text content'}</p>
                <p><strong>Created:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="admin-modal-content">
            <span class="admin-modal-close">&times;</span>
            <h2>Report Details</h2>
            <div class="report-details">
                <p><strong>Report ID:</strong> ${report._id}</p>
                <p><strong>Report Type:</strong> ${report.reportType}</p>
                <p><strong>Reporter:</strong> ${report.reporter ? report.reporter.username : 'N/A'}</p>
                <p><strong>Reason:</strong> ${report.reason}</p>
                <p><strong>Details:</strong> ${report.details || 'No details provided'}</p>
                <p><strong>Status:</strong> ${report.status}</p>
                <p><strong>Date Reported:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
                <p><strong>Admin Notes:</strong> No notes</p>
            </div>
            ${reportedItemDetails}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking the X
    const closeBtn = modal.querySelector(".admin-modal-close");
    closeBtn.addEventListener("click", () => {
        document.body.removeChild(modal);
    });
}

// Add this function to review a report
function reviewReport(reportId) {
    // Find the report in our dummy data
    const report = allReports.find(r => r._id === reportId);
    
    if (!report) {
        alert("Report not found");
        return;
    }
    
    // Create modal for reviewing report
    const modal = document.createElement("div");
    modal.className = "admin-modal";
    
    // Determine reported item details for display
    let reportedItemInfo = '';
    let actionOptions = '';
    
    if (report.reportType === 'user' && report.reportedUser) {
        reportedItemInfo = `
            <p><strong>Reported User:</strong> ${report.reportedUser.username}</p>
            <p><strong>User Email:</strong> ${report.reportedUser.email}</p>
        `;
        
        actionOptions = `
            <option value="none">No Action</option>
            <option value="warn">Warn User</option>
            <option value="suspend">Suspend User</option>
            <option value="ban">Ban User</option>
        `;
    } else if (report.reportType === 'post' && report.reportedPost) {
        reportedItemInfo = `
            <p><strong>Reported Post:</strong> ${report.reportedPost.text ? 
                (report.reportedPost.text.length > 100 ? 
                    report.reportedPost.text.substring(0, 100) + '...' : 
                    report.reportedPost.text) : 
                'No text content'}</p>
            <p><strong>Post Author:</strong> ${report.reportedPost.username || 'Unknown'}</p>
        `;
        
        actionOptions = `
            <option value="none">No Action</option>
            <option value="hide">Hide Post</option>
            <option value="delete">Delete Post</option>
        `;
    }
    
    modal.innerHTML = `
        <div class="admin-modal-content">
            <span class="admin-modal-close">&times;</span>
            <h2>Review Report</h2>
            <div class="report-details">
                <p><strong>Report Type:</strong> ${report.reportType}</p>
                ${reportedItemInfo}
                <p><strong>Reporter:</strong> ${report.reporter ? report.reporter.username : 'N/A'}</p>
                <p><strong>Reason:</strong> ${report.reason}</p>
                <p><strong>Details:</strong> ${report.details || 'No details provided'}</p>
            </div>
            <form id="review-report-form">
                <div class="form-group">
                    <label for="report-status">Update Status</label>
                    <select id="report-status" required>
                        <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="reviewed" ${report.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                        <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="dismissed" ${report.status === 'dismissed' ? 'selected' : ''}>Dismissed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="admin-notes">Admin Notes</label>
                    <textarea id="admin-notes" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label for="action-taken">Action to Take</label>
                    <select id="action-taken">
                        ${actionOptions}
                    </select>
                </div>
                <button type="submit" class="save-btn">Save Review</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking the X
    const closeBtn = modal.querySelector(".admin-modal-close");
    closeBtn.addEventListener("click", () => {
        document.body.removeChild(modal);
    });
    
    // Handle form submission
    const form = document.getElementById("review-report-form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const status = document.getElementById("report-status").value;
        const adminNotes = document.getElementById("admin-notes").value;
        const action = document.getElementById("action-taken").value;
        
        // Update the report in our dummy data
        report.status = status;
        
        alert("Report reviewed successfully (UI demonstration only)");
        document.body.removeChild(modal);
        
        // Refresh the reports display
        displayReports(allReports);
    });
}