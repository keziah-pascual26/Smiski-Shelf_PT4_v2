// Get token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// Set token in the hidden input field
document.getElementById("reset-token").value = token;

document.getElementById("new-pass-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const newPassword = document.getElementById("new-password").value;
    const token = document.getElementById("reset-token").value;

    try {
        const response = await fetch("http://localhost:3000/api/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Password updated successfully! You can now log in.");
            window.location.href = "../login/login.html"; // Redirect to login page
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Try again.");
    }
});
