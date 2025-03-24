import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

let currentStoryIndex = 0;
let progressTimeout;
let currentVideo = null;

// Add these variables at the top of your file with other declarations
let progressStartTime = 0;
let remainingTime = 0;
let progressPaused = false;


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

         // Separate and sort user's stories by expiration time (newest first)
        const userStories = stories
            .filter(story => story.username === currentUsername)
            .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt)); // Changed sorting order
            
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

         // Function to create story element
        const createStoryElement = (story) => {
            const storyElement = document.createElement('div');
            storyElement.classList.add('story');

            if (story.media && story.media.length > 0) {
                const mediaPreview = document.createElement('div');
                mediaPreview.classList.add('story-preview');
                
                const fileExtension = story.media[0].split('.').pop().toLowerCase();
                
                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    mediaPreview.style.backgroundImage = `url(http://localhost:3000/uploads/${story.media[0]})`;
                } else if (['mp4', 'webm'].includes(fileExtension)) {
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

            const storyInfo = document.createElement('div');
            storyInfo.classList.add('story-info');
            const isCurrentUser = story.username === currentUsername;
            storyInfo.innerHTML = `
                <span class="story-title">${isCurrentUser ? 'Your Story' : story.title}</span>
                <span class="story-username">${isCurrentUser ? '' : `by ${story.username}`}</span>
                <span class="story-time">${getTimeRemaining(story.expiresAt)}</span>
            `;
            storyElement.appendChild(storyInfo);

            storyElement.addEventListener('click', () => {
                viewStory(story, [...userStories, ...otherStories]);
            });

            return storyElement;
        };

        // Display user stories first (newest next to create button)
        userStories.forEach(story => {
            const storyElement = createStoryElement(story);
            createStoryButton.after(storyElement);
        });

        // Display other stories after user stories
        otherStories.forEach(story => {
            const storyElement = createStoryElement(story);
            storiesContainer.appendChild(storyElement);
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
    const progressBar = viewer.querySelector('.progress'); // Changed from #progressBar
    
      // Clear previous content and reset progress
    container.innerHTML = '';
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        progressBar.offsetHeight; // Force reflow
    }
    clearTimeout(progressTimeout);
    
    // Find current story index and check if it's the last story by expiration time
    currentStoryIndex = storyArray.findIndex(s => s._id === story._id);
    const isLastStory = currentStoryIndex === storyArray.length - 1;
    const isLastByExpiration = story.expiresAt === Math.min(...storyArray.map(s => new Date(s.expiresAt).getTime()));

    // Update media handling with new exit condition
    if (story.media && story.media.length > 0) {
        const fileExtension = story.media[0].split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            const img = document.createElement('img');
            img.src = `http://localhost:3000/uploads/${story.media[0]}`;
            container.appendChild(img);
            
            startProgress(5000, () => {
                if (!isLastStory && !isLastByExpiration) {
                    viewStory(storyArray[currentStoryIndex + 1], storyArray);
                } else {
                    // Exit if this is the last story or the story with least time
                    viewer.classList.remove('active');
                    clearTimeout(progressTimeout);
                }
            });
            
        } else if (['mp4', 'webm'].includes(fileExtension)) {
            const video = document.createElement('video');
            video.src = `http://localhost:3000/uploads/${story.media[0]}`;
            video.controls = true;
            video.autoplay = true;
            container.appendChild(video);
            
            video.onloadedmetadata = () => {
                const duration = Math.min(video.duration * 1000, 15000);
                startProgress(duration, () => {
                    if (!isLastStory && !isLastByExpiration) {
                        viewStory(storyArray[currentStoryIndex + 1], storyArray);
                    } else {
                        // Exit if this is the last story or the story with least time
                        viewer.classList.remove('active');
                        if (currentVideo) {
                            currentVideo.pause();
                            currentVideo = null;
                        }
                        clearTimeout(progressTimeout);
                    }
                });
            };
            
            currentVideo = video;
        }
    }

    const previousButton = viewer.querySelector('#previousButton');
    const nextButton = viewer.querySelector('#nextButton');

   // Update navigation buttons with new conditions
    if (previousButton) {
        previousButton.style.display = !isLastStory && !isLastByExpiration ? 'flex' : 'none';
        previousButton.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(progressTimeout);
            if (currentVideo) {
                currentVideo.pause();
                currentVideo = null;
            }
            if (!isLastStory && !isLastByExpiration) {
                viewStory(storyArray[currentStoryIndex + 1], storyArray);
            }
        };
    }

    if (nextButton) {
        nextButton.style.display = currentStoryIndex > 0 ? 'flex' : 'none';
        nextButton.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(progressTimeout);
            if (currentVideo) {
                currentVideo.pause();
                currentVideo = null;
            }
            if (currentStoryIndex > 0) {
                viewStory(storyArray[currentStoryIndex - 1], storyArray);
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
    const progressBar = document.querySelector('.progress'); // Changed from #progressBar
    if (!progressBar) return;

    clearTimeout(progressTimeout);
    progressBar.style.width = '0%';
    progressBar.style.transition = 'none';
    progressBar.offsetHeight; // Force reflow

    // Start progress
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}ms linear`;
        progressBar.style.width = '100%';
    }, 50);

    progressStartTime = Date.now();
    remainingTime = duration;
    progressPaused = false;

    progressTimeout = setTimeout(() => {
        progressPaused = false;
        callback();
    }, duration);
}

function pauseProgress() {
    const progressBar = document.querySelector('.progress');
    if (!progressBar || progressPaused) return;

    const elapsedTime = Date.now() - progressStartTime;
    remainingTime -= elapsedTime;

    progressBar.style.transition = 'none';
    const currentWidth = (elapsedTime / (elapsedTime + remainingTime)) * 100;
    progressBar.style.width = `${currentWidth}%`;

    progressPaused = true;
    clearTimeout(progressTimeout);
}

function resumeProgress(callback) {
    const progressBar = document.querySelector('.progress');
    if (!progressBar || !progressPaused) return;

    progressBar.style.transition = `width ${remainingTime}ms linear`;
    progressBar.style.width = '100%';

    progressStartTime = Date.now();
    progressTimeout = setTimeout(() => {
        progressPaused = false;
        callback();
    }, remainingTime);

    progressPaused = false;
}

    