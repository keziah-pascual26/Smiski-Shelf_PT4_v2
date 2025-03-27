document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    // Clear previous error messages if they exist
    const errorElement = document.querySelector(".error-message") || document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = "";
    
    // Show loading state if there's a login button
    const loginButton = document.querySelector("button[type='submit']");
    const originalButtonText = loginButton ? loginButton.textContent : "";
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }
    
    // Check if admin credentials
    if (email === "admin@gmail.com" && password === "admin") {
        try {
            // Make an actual API call to authenticate admin
            const response = await fetch("http://localhost:3000/api/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Store the real JWT token from the backend
                localStorage.setItem("adminToken", data.token);
                localStorage.setItem("isAdmin", "true");
                
                // Redirect to admin dashboard
                window.location.href = "/pages/admin/admin-dashboard.html";
                return;
            }
        } catch (error) {
            console.error("Admin login error:", error);
        }
    }
    
    // Get token from 2FA field if it exists
    const twoFactorToken = document.getElementById("twoFactorToken") ? 
        document.getElementById("twoFactorToken").value : null;

        try {
            // Updated to use the correct API endpoint
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, token: twoFactorToken }),
            });
    
            const data = await response.json();
            console.log("Login response status:", response.status);
            console.log("Login response data:", data);
            console.log("Is suspended?", data.suspended);
            console.log("Status code is 403?", response.status === 403);
    
            // Check if 2FA is required
            if (data.require2FA) {
                // Show 2FA input field
                showTwoFactorInput(email, password);
                return;
            }
    
            // Enhanced check for suspended account
            if (data.suspended === true) {
                console.log("Account is suspended, showing error message");
                // Create a visible error message for suspended accounts
                const loginForm = document.getElementById("login-form");
                const suspendedMessage = document.createElement("div");
                suspendedMessage.className = "suspended-account-error";
                suspendedMessage.innerHTML = `
                    <p>${data.message || "Your account has been suspended."}</p>
                    <p>If you believe this is an error, please contact our support team at 
                    <a href="mailto:support@smiskishelf.com">support@smiskishelf.com</a>.</p>
                `;
                
                // Remove any existing error messages
                const existingError = loginForm.querySelector(".suspended-account-error");
                if (existingError) {
                    loginForm.removeChild(existingError);
                }
                
                // Add the new error message at the top of the form
                loginForm.insertBefore(suspendedMessage, loginForm.firstChild);
                return; // Stop execution here
            }
    
            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                alert(data.message);
                window.location.href = "/pages/dashboard/dashboard.html";
            } else {
                // Display regular error message
                alert(data.message || "Login failed. Please try again."); 
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            // Reset button state
            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = originalButtonText;
            }
        }
});

// Function to show 2FA input form
function showTwoFactorInput(email, password) {
    // Save the login form and create a new form for 2FA
    const loginForm = document.getElementById("login-form");
    const loginContainer = loginForm.parentElement;
    
    // Hide the login form
    loginForm.style.display = "none";
    
    // Create and append 2FA form
    const twoFactorForm = document.createElement("div");
    twoFactorForm.id = "twoFactorForm";
    twoFactorForm.innerHTML = `
        <h2>Two-Factor Authentication</h2>
        <p>Enter the verification code from your authenticator app</p>
        <div class="input-group">
            <label for="twoFactorToken">
                <span class="icon">🔐</span>
                <input type="text" id="twoFactorToken" placeholder="6-digit code" required>
            </label>
        </div>
        <button type="button" id="verify2FA" class="login-btn">Verify</button>
        <button type="button" id="cancel2FA" class="cancel-btn">Cancel</button>
    `;
    
    loginContainer.appendChild(twoFactorForm);
    
    // Add event listener for 2FA verification
    document.getElementById("verify2FA").addEventListener("click", async function() {
        const token = document.getElementById("twoFactorToken").value;
        
        if (!token || token.length !== 6) {
            alert("Please enter a valid 6-digit code");
            return;
        }
        
        try {
            // Updated to use the correct API endpoint
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, token }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                alert("Login successful!");
                window.location.href = "/pages/dashboard/dashboard.html";
            } else {
                // Check if account is suspended
                if (response.status === 403 && data.suspended) {
                    // Remove 2FA form
                    document.getElementById("twoFactorForm").remove();
                    loginForm.style.display = "block";
                    
                    // Display suspended account message
                    const errorElement = document.createElement("div");
                    errorElement.className = "error-message suspended-account-error";
                    errorElement.innerHTML = `
                        <p>${data.message}</p>
                        <p>If you believe this is an error, please contact our support team at 
                        <a href="mailto:support@smiskishelf.com">support@smiskishelf.com</a>.</p>
                    `;
                    loginForm.prepend(errorElement);
                } else {
                    alert(data.message || "Invalid verification code");
                }
            }
        } catch (error) {
            console.error("2FA Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
    
    // Add event listener for cancel button
    document.getElementById("cancel2FA").addEventListener("click", function() {
        // Remove 2FA form and show login form again
        document.getElementById("twoFactorForm").remove();
        loginForm.style.display = "block";
    });
}

// Check if already logged in as admin
document.addEventListener("DOMContentLoaded", function() {
    const adminToken = localStorage.getItem("adminToken");
    const isAdmin = localStorage.getItem("isAdmin");
    
    if (adminToken && isAdmin === "true") {
        window.location.href = "/pages/admin/admin-dashboard.html";
    }
});
