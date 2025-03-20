document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Unauthorized! Please log in first.");
        window.location.href = "/login.html"; // Redirect to login
        return;
    }

    fetch("http://localhost:3000/dashboard", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Invalid token") {
            alert("Session expired. Please log in again.");
            localStorage.removeItem("token"); // Clear invalid token
            window.location.href = "/login.html";
        } else {
            console.log("Dashboard Loaded:", data);

            // Store username in localStorage
            if (data.username) {
                localStorage.setItem("username", data.username);
                updateUsernameUI(data.username); // Ensure UI updates with correct username
            }
        }
    })
    .catch(error => console.error("Error:", error));
});

// Function to update the username in the navbar
function updateUsernameUI(username) {
    document.querySelectorAll(".username").forEach(el => el.textContent = username);
    document.querySelectorAll(".greeting").forEach(el => el.textContent = `Welcome, ${username}!`);
    document.querySelectorAll("#user-name").forEach(el => el.textContent = `👤 ${username}`);
}

// Ensure username is updated from localStorage on page load
window.addEventListener("load", () => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
        updateUsernameUI(storedUsername);
    }
});
