import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

let currentStoryIndex = 0;
let progressTimeout;
let currentVideo = null;


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

        // Display stories with user's stories last
        [...otherStories,...userStories].forEach(story => {  // Changed order here
            const storyElement = document.createElement('div');
            storyElement.classList.add('story');

                    // Create media preview
                    if (story.media && story.media.length > 0) {
                    const mediaPreview = document.createElement('div');
                    mediaPreview.classList.add('story-preview');
                    
                    // Get file extension to determine media type
                    const fileExtension = story.media[0].split('.').pop().toLowerCase();
                    
                    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                        // For images, use background image
                        mediaPreview.style.backgroundImage = `url(http://localhost:3000/uploads/${story.media[0]})`;
                    } else if (['mp4', 'webm'].includes(fileExtension)) {
                        // For videos, create a video element
                        const video = document.createElement('video');
                        video.src = `http://localhost:3000/uploads/${story.media[0]}`;
                        video.muted = true;
                        video.playsInline = true;
                        video.style.width = '100%';
                        video.style.height = '100%';
                        video.style.objectFit = 'cover';
                        
                        mediaPreview.appendChild(video);
                    }
                    
                    storyElement.appendChild(mediaPreview);
                }

            // Add story info
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
                viewStory(story, [...otherStories,...userStories]); // Pass the full array of stories
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

function viewStory(story, storyArray) {
    const viewer = document.querySelector('.story-viewer');
    const container = viewer.querySelector('.story-container');
    const progressBar = viewer.querySelector('.progress');
    
    // Clear previous content and reset progress
    container.innerHTML = '';
    if (progressBar) progressBar.style.width = '0%';
    clearTimeout(progressTimeout);
    
    // Find current story index
    currentStoryIndex = storyArray.findIndex(s => s._id === story._id);
    
    // Create media element based on file type
    if (story.media && story.media.length > 0) {
        const fileExtension = story.media[0].split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            const img = document.createElement('img');
            img.src = `http://localhost:3000/uploads/${story.media[0]}`;
            container.appendChild(img);
            
            // Start 5-second timer for images
            startProgress(5000, () => {
                if (currentStoryIndex < storyArray.length - 1) {
                    viewStory(storyArray[currentStoryIndex + 1], storyArray);
                } else {
                    viewer.classList.remove('active');
                }
            });
            
        } else if (['mp4', 'webm'].includes(fileExtension)) {
            const video = document.createElement('video');
            video.src = `http://localhost:3000/uploads/${story.media[0]}`;
            video.controls = true;
            video.autoplay = true;
            
            // Limit video duration to 15 seconds
            video.onloadedmetadata = () => {
                const duration = Math.min(video.duration * 1000, 15000);
                startProgress(duration, () => {
                    if (currentStoryIndex < storyArray.length - 1) {
                        viewStory(storyArray[currentStoryIndex + 1], storyArray);
                    } else {
                        viewer.classList.remove('active');
                    }
                });
            };
            
            currentVideo = video;
            container.appendChild(video);
        }
    }

    // Add navigation buttons
    const previousButton = viewer.querySelector('#previousButton');
    const nextButton = viewer.querySelector('#nextButton');

    // Show/hide next button
    if (nextButton) {
        nextButton.style.display = currentStoryIndex > 0 ? 'flex' : 'none';
        nextButton.onclick = () => {
            clearTimeout(progressTimeout);
            if (currentVideo) currentVideo.pause();
            if (currentStoryIndex > 0) {
                viewStory(storyArray[currentStoryIndex - 1], storyArray);
            }
        };
    }

    // Show/hide previous button
    if (previousButton) {
        previousButton.style.display = currentStoryIndex < storyArray.length - 1 ? 'flex' : 'none';
        previousButton.onclick = () => {
            clearTimeout(progressTimeout);
            if (currentVideo) currentVideo.pause();
            if (currentStoryIndex < storyArray.length - 1) {
                viewStory(storyArray[currentStoryIndex + 1], storyArray);
            }
        };
    }

    // Add close button
    if (!viewer.querySelector('.close-button')) {
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => {
            clearTimeout(progressTimeout);
            if (currentVideo) currentVideo.pause();
            viewer.classList.remove('active');
        };
        viewer.appendChild(closeButton);
    }

    // Show the viewer
    viewer.classList.add('active');
}

function startProgress(duration, callback) {
    const progressBar = document.querySelector('.progress');
    if (!progressBar) return;

    clearTimeout(progressTimeout);
    progressBar.style.width = '0%';
    progressBar.style.transition = 'none';

    // Force a reflow
    progressBar.offsetHeight;

    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = '100%';

    progressTimeout = setTimeout(callback, duration);  
}

    