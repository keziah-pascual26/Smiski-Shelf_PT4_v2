import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

// Single DOMContentLoaded event listener to handle both normal and OAuth login
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // First handle OAuth callback if present
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromURL = urlParams.get('token');
        const usernameFromURL = urlParams.get('username');

        if (tokenFromURL && usernameFromURL) {
            console.log('Processing OAuth callback...');
            localStorage.setItem('token', tokenFromURL);
            localStorage.setItem('username', usernameFromURL);
            // Clean URL
            window.history.replaceState({}, document.title, "/pages/dashboard/dashboard.html");
        }

        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No authentication token found, redirecting to login...');
            window.location.replace('/pages/login/login.html');
            return;
        }

        // Initialize UI elements
        const createStoryButton = document.getElementById('createStoryButton');
        const closeModalButtonElement = document.getElementById('closeModalButton');
        const overlay = document.getElementById('overlay');

        if (createStoryButton) {
            createStoryButton.addEventListener('click', openStoryModal);
        }

        if (closeModalButtonElement) {
            closeModalButtonElement.addEventListener('click', closeModalButton);
        }

        if (overlay) {
            overlay.addEventListener('click', closeModalButton);
        }

        // Load stories
        await loadStories();

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        localStorage.clear(); // Clear any invalid tokens
        window.location.replace('/pages/login/login.html');
    }
});

export async function loadStories() {
    try {
        const token = localStorage.getItem('token');
        const currentUsername = localStorage.getItem('username');
        
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch('http://localhost:3000/api/stories/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to fetch stories');
        }
        
        const stories = await response.json();
        const storiesContainer = document.getElementById('storiesContainer');
        
        if (!storiesContainer) {
            console.error('Stories container not found');
            return;
        }

        // Keep the create story button
        const createStoryButton = storiesContainer.querySelector('#createStoryButton');
        storiesContainer.innerHTML = '';
        storiesContainer.appendChild(createStoryButton);

        if (stories.length === 0) {
            const noStoriesMsg = document.createElement('div');
            noStoriesMsg.classList.add('no-stories-message');
            noStoriesMsg.textContent = 'No stories yet. Create your first story!';
            storiesContainer.appendChild(noStoriesMsg);
            return;
        }

        // Separate user's stories and other stories
        const userStories = stories.filter(story => story.username === currentUsername);
        const otherStories = stories.filter(story => story.username !== currentUsername);

        // Function to calculate time remaining
        const getTimeRemaining = (expiresAt) => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const diff = expiry - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m remaining`;
        };

        // Display stories with user's stories first
        [...otherStories, ...userStories].forEach(story => {
            const storyElement = document.createElement('div');
            storyElement.classList.add('story');
            
            if (story.media && story.media.length > 0) {
                const mediaPreview = document.createElement('div');
                mediaPreview.classList.add('story-preview');
                mediaPreview.style.backgroundImage = `url(http://localhost:3000/uploads/${story.media[0]})`;
                storyElement.appendChild(mediaPreview);
            }

            const storyInfo = document.createElement('div');
            storyInfo.classList.add('story-info');
            const isCurrentUser = story.username === currentUsername;
            storyInfo.innerHTML = `
                <span class="story-title">${isCurrentUser ? 'Your Story' : story.title}</span>
                <span class="story-username">${isCurrentUser ? '' : `by ${story.username}`}</span>
                <span class="story-time">${getTimeRemaining(story.expiresAt)}</span>
            `;
            storyElement.appendChild(storyInfo);

            // Add click event to view story
            storyElement.addEventListener('click', () => {
                viewStory(story);
            });

            createStoryButton.parentNode.insertBefore(storyElement, createStoryButton.nextSibling);
        });

    } catch (error) {
        console.error('Error loading stories:', error);
        const storiesContainer = document.getElementById('storiesContainer');
        if (storiesContainer) {
            storiesContainer.innerHTML = '<p class="error-message">Failed to load stories. Please try again later.</p>';
        }
    }
}

// Add the viewStory function
function viewStory(story) {
    const viewer = document.getElementById('storyViewer');
    const mediaContainer = viewer.querySelector('.story-media');
    const titleElement = viewer.querySelector('.story-title');
    const descriptionElement = viewer.querySelector('.story-description');

    // Clear previous content
    mediaContainer.innerHTML = '';

    // Create media element based on file type
    if (story.media && story.media.length > 0) {
        const mediaUrl = `http://localhost:3000/uploads/${story.media[0]}`;
        const fileExtension = story.media[0].split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            const img = document.createElement('img');
            img.src = mediaUrl;
            mediaContainer.appendChild(img);
        } else if (['mp4', 'webm'].includes(fileExtension)) {
            const video = document.createElement('video');
            video.src = mediaUrl;
            video.controls = true;
            mediaContainer.appendChild(video);
        }
    }

    // Set story details
    titleElement.textContent = story.title;
    descriptionElement.textContent = story.description;

    // Show the viewer
    viewer.style.display = 'flex';

    // Add close functionality
    const closeBtn = viewer.querySelector('.close-viewer');
    closeBtn.onclick = () => {
        viewer.style.display = 'none';
    };
}


