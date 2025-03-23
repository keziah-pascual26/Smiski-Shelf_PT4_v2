document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    // Get token from 2FA field if it exists
    const twoFactorToken = document.getElementById("twoFactorToken") ? 
        document.getElementById("twoFactorToken").value : null;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, token: twoFactorToken }),
        });

        const data = await response.json();

        // Check if 2FA is required
        if (data.require2FA) {
            // Show 2FA input field
            showTwoFactorInput(email, password);
            return;
        }

        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);
            window.location.href = "/pages/dashboard/dashboard.html"; // Redirect to dashboard
        } else {
            alert(data.message); // Show error message
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Something went wrong. Please try again.");
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
        <form id="twoFactorAuthForm">
            <div class="form-group">
                <input type="text" id="twoFactorToken" placeholder="Verification Code" required>
            </div>
            <button type="submit" class="login-button">Verify</button>
            <button type="button" id="backToLogin" class="back-button">Back</button>
        </form>
    `;
    
    loginContainer.appendChild(twoFactorForm);
    
    // Add event listener for 2FA form submission
    document.getElementById("twoFactorAuthForm").addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const token = document.getElementById("twoFactorToken").value;
        
        try {
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
                window.location.href = "/pages/dashboard/dashboard.html"; // Redirect to dashboard
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });
    
    // Back button to return to login form
    document.getElementById("backToLogin").addEventListener("click", function() {
        // Remove 2FA form and show login form again
        document.getElementById("twoFactorForm").remove();
        loginForm.style.display = "block";
    });
}
