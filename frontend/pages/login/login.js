document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token); // ✅ Store token
            localStorage.setItem("username", data.username); // ✅ Store username
            alert(data.message);
            window.location.href = "/pages/dashboard/dashboard.html"; // Redirect to dashboard
        } else {
            alert(data.message); // Show error message
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Something went wrong. Please try again.");
    }
});
