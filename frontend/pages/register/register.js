document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("register-form");
    const message = document.getElementById("message");
    const goToLoginBtn = document.getElementById("go-to-login");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (!username || !email || !password || !confirmPassword) {
            message.textContent = "All fields are required!";
            message.style.color = "red";
            return;
        }

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match!";
            message.style.color = "red";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            message.textContent = data.message;
            message.style.color = response.ok ? "green" : "red";

            if (response.ok) {
                setTimeout(() => {
                    // Updated path to match server configuration
                    window.location.href = "/pages/login/login.html";
                }, 2000);
            }

        } catch (error) {
            message.textContent = "Error registering!";
            message.style.color = "red";
            console.error("Error:", error);
        }
    });

    goToLoginBtn.addEventListener("click", function () {
        // Updated path to match server configuration
        window.location.href = "/pages/login/login.html";
    });
});