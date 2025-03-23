// Get token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// Debug token to console
console.log("Token from URL:", token);

// Set token in the hidden input field
document.getElementById("reset-token").value = token;

document.getElementById("new-pass-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const newPassword = document.getElementById("new-password").value;
    const token = document.getElementById("reset-token").value;

    if (!token) {
        alert("Missing reset token. Please use the link from your email.");
        return;
    }

    // Validate password
    if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }

    try {
        // Show loading indicator
        const button = this.querySelector('button');
        const originalText = button.textContent;
        button.textContent = "Processing...";
        button.disabled = true;

        console.log("Sending request with token:", token);

        const response = await fetch("http://localhost:3000/reset-password/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });

        // Reset button
        button.textContent = originalText;
        button.disabled = false;

        const data = await response.json();
        
        if (response.ok) {
            alert("Password updated successfully! You can now log in.");
            window.location.href = "/pages/login/login.html"; // Redirect to login page
        } else {
            // More specific error message
            if (data.message.includes("Invalid or expired token")) {
                alert("Your password reset link has expired or is invalid. Please request a new password reset link.");
            } else {
                alert(data.message || "An error occurred. Please try again.");
            }
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
        
        // Reset button if there was an error
        const button = this.querySelector('button');
        button.textContent = "Update Password";
        button.disabled = false;
    }
});

// Add console log to verify script is loading
console.log("Password reset script loaded successfully");