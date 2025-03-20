import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

document.addEventListener('DOMContentLoaded', () => {
    const createStoryButton = document.getElementById('createStoryButton');
    const closeModalButtonElement = document.getElementById('closeModalButton');
    const overlay = document.getElementById('overlay');

    // Open modal
    if (createStoryButton) {
        createStoryButton.addEventListener('click', () => {
            openStoryModal();
        });
    }

    // Close modal
    if (closeModalButtonElement) {
        closeModalButtonElement.addEventListener('click', () => {
            closeModalButton();
        });
    }

    // Close modal when clicking on the overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeModalButton();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Get token and username from URL if present (Google OAuth flow)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');

    if (token && username) {
        // Store token and username from Google OAuth
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        
        // Clean URL
            window.history.replaceState({}, document.title, "/pages/dashboard/dashboard.html");
        }
    });