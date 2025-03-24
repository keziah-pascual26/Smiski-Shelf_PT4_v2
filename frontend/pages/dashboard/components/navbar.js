document.addEventListener("DOMContentLoaded", function () {
    // Dynamically add the CSS file
    const head = document.head;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pages/dashboard/components/styles/navbar.css"; // Ensure this path is correct
    head.appendChild(link);

    // Create a div element to hold the navbar
    const navbarContainer = document.createElement("div");
    navbarContainer.innerHTML = `
        <nav class="navbar">
            <div class="logosearch">
                <img src="/public/logo.png" class="dashboard-logo" alt="Logo">
                <div class="search-bar-container">
                    <input type="text" placeholder="Search" class="search-bar">
                    <i class="fas fa-search icon search-icon"></i>
                </div>
            </div>
            <div class="main-nav">
                <i class="fas fa-home icon" id="dashboard"></i>
                <i class="fas fa-video icon"></i>
                <i class="fas fa-smile icon"></i>
            </div>
            <div class="profile-container">
                <div class="profile-pic" id="profile-pic"></div>
                <div class="dropdown-menu" id="dropdown-menu">
                    <div class="dropdown-item" id="user-name">👤 Username</div>
                    <div class="dropdown-item" id="settings-btn">⚙️ Settings</div>
                    <div class="dropdown-item logout" id="logout-btn">🚪 Logout</div>
                </div>
            </div>
        </nav>
    `;

    // Append navbar to the body
    document.body.prepend(navbarContainer);

    // Add interactivity for the dropdown
    const profilePic = document.getElementById("profile-pic");
    const dropdownMenu = document.getElementById("dropdown-menu");
    const logoutBtn = document.getElementById("logout-btn");
    const userName = document.getElementById("user-name");
    const settingsBtn = document.getElementById("settings-btn"); 

    // 🔹 Get username from localStorage (set during login)
    const username = localStorage.getItem("username");
    if (username) {
        userName.textContent = `👤 ${username}`; // ✅ Update username dynamically
    } else {
        userName.textContent = "👤 User";
    }

    // Toggle Dropdown
    profilePic.addEventListener("click", () => {
        dropdownMenu.classList.toggle("open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (!profilePic.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove("open");
        }
    });

    dashboard.addEventListener("click", () => {
        window.location.href = "/pages/dashboard/dashboard.html";
    });


    // Add Settings navigation
    settingsBtn.addEventListener("click", () => {
        window.location.href = "/pages/settings/settings.html";
    });

    userName.addEventListener("click", () => {
        window.location.href = "/pages/profile/profile.html";
    });


    // Handle Logout
    logoutBtn.addEventListener("click", () => {
        alert("Logging out...");
    
        // Clear local storage (username and token)
        localStorage.removeItem("username");
        localStorage.removeItem("token");
    
        // Optionally, make an API call to the server to invalidate the token/session (if necessary)
        fetch("http://localhost:3000/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(err => {
            console.error("Logout Error:", err);
        });
        
        // Redirect to the login page
        window.location.href = "/login"; // Correct the URL to match the backend route
    });
});