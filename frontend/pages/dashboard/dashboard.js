import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

// Attach event listeners and load stories when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

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

    // Load stories when page loads
    await loadStories();
});

// Handle OAuth callback
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username');

    if (token && username) {
        // Store token and username from Google OAuth
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        
        // Clean URL and reload stories
        window.history.replaceState({}, document.title, "/pages/dashboard/dashboard.html");
        await loadStories();
    }
});

export async function loadStories() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch('http://localhost:3000/api/stories/mystories', {
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

        stories.forEach(story => {
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
            storyInfo.innerHTML = `
                <span class="story-title">${story.title}</span>
                <span class="story-description">${story.description}</span>
            `;
            storyElement.appendChild(storyInfo);

            // Add click event to view story
            storyElement.addEventListener('click', () => {
                viewStory(story);
            });

            createStoryButton.parentNode.insertBefore(storyElement, createStoryButton.nextSibling);
        });

        // Reattach event listener to create button
        if (createStoryButton) {
            createStoryButton.addEventListener('click', openStoryModal);
        }

    } catch (error) {
        console.error('Error loading stories:', error);
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


