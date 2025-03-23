import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard script loaded - looking for story button');
    
    const createStoryButton = document.getElementById('createStoryButton');
    if (createStoryButton) {
        console.log('Story button found - attaching click handler');
        
        // Remove any existing event listeners to prevent duplicates
        const newButton = createStoryButton.cloneNode(true);
        createStoryButton.parentNode.replaceChild(newButton, createStoryButton);
        
        // Add click handler to the new button
        newButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('Story button clicked - opening modal');
            openStoryModal();
        });
    } else {
        console.error('Story button not found on page load');
    }
    
    // Handle click on add-story-icon as a fallback
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-story-icon')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Add story icon clicked - opening modal');
            openStoryModal();
        }
    });

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