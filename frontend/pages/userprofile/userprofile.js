document.addEventListener("DOMContentLoaded", async () => {
    try {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        if (!token) {
            alert('Unauthorized! Please log in.');
            window.location.href = '/pages/login/login.html';
            return;
        }

        const response = await fetch('http://localhost:3000/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        const user = await response.json();

        // Update the DOM with user data
        document.getElementById('profile-name').textContent = user.username || 'N/A';
        document.getElementById('profile-email').textContent = user.email || 'N/A';
        document.getElementById('detail-name').textContent = user.name || 'N/A';
        document.getElementById('detail-username').textContent = user.username || 'N/A';
        document.getElementById('detail-email').textContent = user.email || 'N/A';
        document.getElementById('detail-bio').textContent = user.bio || 'N/A';
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
});

document.getElementById('back-button').addEventListener('click', () => {
    window.history.back(); // Navigate to the previous page
});

document.getElementById("editDetailsBtn").addEventListener("click", () => {
    // Enable editing for all detail fields
    const nameField = document.getElementById("detail-name");
    const usernameField = document.getElementById("detail-username");
    const emailField = document.getElementById("detail-email");
    const bioField = document.getElementById("detail-bio");

    nameField.contentEditable = "true";
    usernameField.contentEditable = "true";
    emailField.contentEditable = "true";
    bioField.contentEditable = "true";

    console.log("Edit mode enabled for fields.");

    // Show the save button and hide the edit button
    document.getElementById("editDetailsBtn").style.display = "none";
    document.getElementById("saveDetailsBtn").style.display = "inline-block";
});

document.getElementById("saveDetailsBtn").addEventListener("click", () => {
    console.log("Save Details button clicked."); // Debugging log

    // Disable editing for all detail fields
    const nameField = document.getElementById("detail-name");
    const usernameField = document.getElementById("detail-username");
    const emailField = document.getElementById("detail-email");
    const bioField = document.getElementById("detail-bio");

    nameField.contentEditable = "false";
    usernameField.contentEditable = "false";
    emailField.contentEditable = "false";
    bioField.contentEditable = "false";

    console.log("Edit mode disabled for fields.");

    // Sanitize input to prevent XSS
    const sanitizeInput = (input) => {
        const tempDiv = document.createElement("div");
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    };

    // Prepare the updated details
    const updatedDetails = {
        name: sanitizeInput(nameField.textContent.trim()),
        username: sanitizeInput(usernameField.textContent.trim()),
        email: sanitizeInput(emailField.textContent.trim()),
        bio: sanitizeInput(bioField.textContent.trim()),
    };

    console.log("Updated details being sent:", updatedDetails);

    // Send the updated details to the server
    fetch("http://localhost:3000/api/user/profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedDetails),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to save user details");
            }
            return response.json();
        })
        .then((data) => {
            console.log("User details updated successfully:", data);

            // Update the DOM with the new values
            document.getElementById("profile-name").textContent = updatedDetails.username;
            document.getElementById("profile-email").textContent = updatedDetails.email;
            document.getElementById("detail-name").textContent = updatedDetails.name;
            document.getElementById("detail-username").textContent = updatedDetails.username;
            document.getElementById("detail-email").textContent = updatedDetails.email;
            document.getElementById("detail-bio").textContent = updatedDetails.bio;

            // Hide the save button and show the edit button
            document.getElementById("saveDetailsBtn").style.display = "none";
            document.getElementById("editDetailsBtn").style.display = "inline-block";
        })
        .catch((error) => {
            console.error("Error saving user details:", error);
        });
});