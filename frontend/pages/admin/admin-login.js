document.getElementById("admin-login-form").addEventListener("submit", async function(event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");
    
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
        } else {
            // Show error message
            const errorData = await response.json();
            errorMessage.textContent = errorData.message || "Invalid admin credentials";
            errorMessage.style.display = "block";
        }
    } catch (error) {
        console.error("Login error:", error);
        errorMessage.textContent = "An error occurred. Please try again.";
        errorMessage.style.display = "block";
    }
});