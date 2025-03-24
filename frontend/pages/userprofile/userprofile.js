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
        document.getElementById('detail-name').textContent = user.username || 'N/A';
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