// Global variables for pagination
let currentPage = 1;
let usersPerPage = 10;
let allUsers = [];

let postsCurrentPage = 1;
let postsPerPage = 10;
let allPosts = [];

// Global variables for reports pagination
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

    // Add refresh functionality for stats
    document.getElementById("refresh-stats-btn")?.addEventListener("click", fetchDashboardStats);
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
        initializeReports();
        
        // Set up refresh buttons
        document.getElementById("refresh-users-btn")?.addEventListener("click", fetchUsers);
        document.getElementById("refresh-posts-btn")?.addEventListener("click", fetchPosts);
        document.getElementById("refresh-reports-btn")?.addEventListener("click", fetchReports);
        
        // Set up search functionality
        document.getElementById("user-search")?.addEventListener("input", filterUsers);
        document.getElementById("post-search")?.addEventListener("input", filterPosts);
        document.getElementById("report-search")?.addEventListener("input", filterReports);
        
        // Set up filters
        document.getElementById("user-filter")?.addEventListener("change", filterPosts);
        document.getElementById("report-type-filter")?.addEventListener("change", filterReports);
        document.getElementById("report-status-filter")?.addEventListener("change", filterReports);

        // Initialize reports
        await fetchReports().catch(err => {
            console.error('Reports initialization error:', err);
            document.getElementById("reports-table-body").innerHTML = `
                <tr><td colspan="8">Failed to initialize reports section</td></tr>
            `;
        });

    } catch (error) {
        console.error("Error initializing dashboard:", error);
    }
}

// Fetch dashboard statistics
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
            
            // Display user count
            document.getElementById("total-users").textContent = stats.userCount || 0;
            
            // Calculate and display total posts
            const postsResponse = await fetch("http://localhost:3000/api/admin/posts?limit=1000", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (postsResponse.ok) {
                const postsData = await postsResponse.json();
                document.getElementById("total-posts").textContent = postsData.totalPosts || 0;
            }
            
            // Get all users to calculate active users based on status field
            const usersResponse = await fetch("http://localhost:3000/api/admin/users?limit=1000", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                // Count users with 'active' status
                const activeUsers = usersData.users.filter(user => 
                    user.status === 'active' || !user.status // Count as active if status is 'active' or undefined
                );
                
                document.getElementById("active-users").textContent = activeUsers.length;
            } else {
                document.getElementById("active-users").textContent = "Error";
            }
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

// Add event listener for stats refresh button
document.getElementById("refresh-stats-btn").addEventListener("click", fetchDashboardStats);



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

async function fetchReports() {
    try {
        const token = localStorage.getItem("adminToken");
        
        if (!token) {
            window.location.href = "../login/login.html";
            return;
        }

        const response = await fetch("http://localhost:3000/api/admin/reports/list", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "../login/login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || (!Array.isArray(data) && !Array.isArray(data.reports))) {
            throw new Error('Invalid data format received from server');
        }
        
        // Handle both array and object with reports property
        const reportsArray = Array.isArray(data) ? data : data.reports;
        
        allReports = reportsArray;
        renderReports(reportsArray);
        updateReportsPagination();

    } catch (error) {
        console.error("Error fetching reports:", error);
        document.getElementById("reports-table-body").innerHTML = `
            <tr><td colspan="8" class="error-message">
                Error loading reports: ${error.message}
            </td></tr>
        `;
    }
}

// Function to render reports
function renderReports(reports) {
    const tableBody = document.getElementById("reports-table-body");
    
    if (!reports || reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No reports found</td></tr>';
        return;
    }

    const start = (reportsCurrentPage - 1) * reportsPerPage;
    const end = start + reportsPerPage;
    const paginatedReports = reports.slice(start, end);

    tableBody.innerHTML = paginatedReports.map(report => `
        <tr>
            <td>${report._id}</td>
            <td>${report.reportType}</td>
            <td>${getReportedItemText(report)}</td>
            <td>${report.reporter?.username || 'Unknown'}</td>
            <td>${report.reason}</td>
            <td>${new Date(report.createdAt).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${report.status.toLowerCase()}">
                    ${report.status}
                </span>
            </td>
            <td class="actions">
                <button onclick="updateReportStatus('${report._id}', 'resolved')" 
                        class="action-btn resolve-btn" 
                        ${report.status === 'resolved' ? 'disabled' : ''}>
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="updateReportStatus('${report._id}', 'dismissed')" 
                        class="action-btn dismiss-btn"
                        ${report.status === 'dismissed' ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Helper function to get reported item text
function getReportedItemText(report) {
    if (report.reportType === 'post') {
        return `Post: ${report.targetId}`;
    }
    return `User: ${report.targetId}`;
}

// Function to update report status
async function updateReportStatus(reportId, newStatus) {
    try {
        const token = localStorage.getItem("adminToken");
        const response = await fetch(`http://localhost:3000/api/admin/reports/${reportId}/status`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error("Failed to update report status");
        }

        await fetchReports();

    } catch (error) {
        console.error("Error updating report status:", error);
        alert("Failed to update report status");
    }
}

// Function to filter reports
function filterReports() {
    const searchTerm = document.getElementById("report-search").value.toLowerCase();
    const typeFilter = document.getElementById("report-type-filter").value;
    const statusFilter = document.getElementById("report-status-filter").value;

    const filteredReports = allReports.filter(report => {
        const matchesSearch = 
            report._id.toLowerCase().includes(searchTerm) ||
            report.reason.toLowerCase().includes(searchTerm) ||
            report.reporter?.username.toLowerCase().includes(searchTerm);

        const matchesType = typeFilter === 'all' || report.reportType === typeFilter;
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    renderReports(filteredReports);
}

// Function to update reports pagination
function updateReportsPagination() {
    const totalPages = Math.ceil(allReports.length / reportsPerPage);
    document.getElementById("reports-page-info").textContent = `Page ${reportsCurrentPage} of ${totalPages}`;
    document.getElementById("reports-prev-page").disabled = reportsCurrentPage <= 1;
    document.getElementById("reports-next-page").disabled = reportsCurrentPage >= totalPages;
}

// Add these event listeners to your initialization function
function initializeReports() {
    document.getElementById("refresh-reports-btn").addEventListener("click", fetchReports);
    document.getElementById("report-search").addEventListener("input", filterReports);
    document.getElementById("report-type-filter").addEventListener("change", filterReports);
    document.getElementById("report-status-filter").addEventListener("change", filterReports);
    
    document.getElementById("reports-prev-page").addEventListener("click", () => {
        if (reportsCurrentPage > 1) {
            reportsCurrentPage--;
            renderReports(allReports);
            updateReportsPagination();
        }
    });

    document.getElementById("reports-next-page").addEventListener("click", () => {
        const totalPages = Math.ceil(allReports.length / reportsPerPage);
        if (reportsCurrentPage < totalPages) {
            reportsCurrentPage++;
            renderReports(allReports);
            updateReportsPagination();
        }
    });
}

function updateReportsPagination(totalPages) {
    const pageInfo = document.getElementById("reports-page-info");
    const prevBtn = document.getElementById("reports-prev-page");
    const nextBtn = document.getElementById("reports-next-page");

    if (pageInfo) pageInfo.textContent = `Page ${reportsCurrentPage} of ${totalPages}`;
    
    if (prevBtn) prevBtn.disabled = reportsCurrentPage === 1;
    if (nextBtn) nextBtn.disabled = reportsCurrentPage === totalPages;

    // Update pagination buttons
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (reportsCurrentPage > 1) {
                reportsCurrentPage--;
                fetchReports();
            }
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (reportsCurrentPage < totalPages) {
                reportsCurrentPage++;
                fetchReports();
            }
        };
    }
}
