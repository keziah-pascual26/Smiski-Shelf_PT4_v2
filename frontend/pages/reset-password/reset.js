document.getElementById("resetForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;

    try {
        const response = await fetch("http://localhost:3000/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Check your email for the reset link!");
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Try again.");
    }
});
