import { openStoryModal, closeModalButton } from '/pages/dashboard/functions/create-stories/story-modal.js';

let currentStoryIndex = 0;
let progressTimeout;
let currentVideo = null;

// Add these variables at the top of your file with other declarations
let progressStartTime = 0;
let remainingTime = 0;
let progressPaused = false;

let reactionCounts = {};


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
            
        const otherStories = stories
            .filter(story => story.username !== currentUsername)
            .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt)); // Changed to show newest first

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

        const isCurrentUser = story.username === localStorage.getItem('username');
        if (isCurrentUser) {
            storyElement.classList.add('user-story');
        }

        if (story.media && story.media.length > 0) {
            const mediaPreview = document.createElement('div');
            mediaPreview.classList.add('story-preview');
            
            const fileExtension = story.media[0].split('.').pop().toLowerCase();
            
                if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    // Image preview
                    const img = document.createElement('img');
                    img.src = `http://localhost:3000/uploads/${story.media[0]}`;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    mediaPreview.appendChild(img);
                } else if (['mp4', 'webm'].includes(fileExtension)) {
                    // Video preview
                    const video = document.createElement('video');
                    video.src = `http://localhost:3000/uploads/${story.media[0]}`;
                    video.muted = true;
                    video.playsInline = true;
                    video.loop = true;
                    video.style.width = '100%';
                    video.style.height = '100%';
                    video.style.objectFit = 'cover';
                    
                    // Add hover events for video preview
                    mediaPreview.addEventListener('mouseenter', () => {
                        video.play().catch(err => console.log('Preview autoplay prevented'));
                    });
                    
                    mediaPreview.addEventListener('mouseleave', () => {
                        video.pause();
                        video.currentTime = 0;
                    });
                    
                    mediaPreview.appendChild(video);
                }
                
                storyElement.appendChild(mediaPreview);
            }

            const storyInfo = document.createElement('div');
            storyInfo.classList.add('story-info');
            storyInfo.innerHTML = `
                <span class="story-title">${isCurrentUser ? 'Your Story' : story.title}</span>
                <span class="story-username">${isCurrentUser ? '' : `by ${story.username}`}</span>
                <span class="story-time">${getTimeRemaining(story.expiresAt)}</span>
            `;
            storyElement.appendChild(storyInfo);

            storyElement.addEventListener('click', () => {
               const isUserStory = userStories.some(s => s._id === story._id);
    
                    let orderedStories;
                    if (isUserStory) {
                        // For user stories, maintain original order
                        orderedStories = [...userStories];
                        currentStoryIndex = orderedStories.findIndex(s => s._id === story._id);
                    } else {
                        // For other users' stories
                        const clickedUsername = story.username;
                        orderedStories = otherStories.filter(s => s.username === clickedUsername);
                        currentStoryIndex = orderedStories.findIndex(s => s._id === story._id);
                    }
                    
                    // Start viewing from the clicked story without reordering
                    viewStory(story, orderedStories);
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
    const progressBar = viewer.querySelector('.progress');

    // Find current story index first
    currentStoryIndex = storyArray.findIndex(s => s._id === story._id);
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create indicators with correct index
    createStoryIndicators(storyArray);
    
    // Clear previous content and reset progress
    container.innerHTML = '';
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.transition = 'none';
        progressBar.offsetHeight;
    }
    clearTimeout(progressTimeout);

    // Create or update title element
    let titleElement = viewer.querySelector('.story-viewer-title');
    if (!titleElement) {
        titleElement = document.createElement('div');
        titleElement.className = 'story-viewer-title';
        viewer.appendChild(titleElement);
    }
    titleElement.textContent = story.title || 'Untitled Story';

    // Create or update description container
    let descriptionContainer = viewer.querySelector('.story-description-container');
    if (!descriptionContainer) {
        descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'story-description-container';
        viewer.appendChild(descriptionContainer);
    }
    descriptionContainer.innerHTML = `<p>${story.description || ''}</p>`;

    
    // Check if story has media
    if (story.media && story.media.length > 0) {
        const fileExtension = story.media[0].split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
            const img = document.createElement('img');
            img.src = `http://localhost:3000/uploads/${story.media[0]}`;
            container.appendChild(img);
            
            startProgress(5000, () => {
                if (currentStoryIndex < storyArray.length - 1) {
                    const nextStory = storyArray[currentStoryIndex + 1];
                    if (nextStory && nextStory.username === story.username) {
                        viewStory(nextStory, storyArray);
                    } else {
                        exitStoryViewer();
                    }
                } else {
                    exitStoryViewer();
                }
            });
            
        } else if (['mp4', 'webm'].includes(fileExtension)) {
            const video = document.createElement('video');
            video.src = `http://localhost:3000/uploads/${story.media[0]}`;
            video.controls = true;
            video.autoplay = true;
            container.appendChild(video);
            currentVideo = video;
            
            video.onloadedmetadata = () => {
                const duration = Math.min(video.duration * 1000, 15000);
                startProgress(duration, () => {
                    if (currentStoryIndex < storyArray.length - 1) {
                        const nextStory = storyArray[currentStoryIndex + 1];
                        if (nextStory && nextStory.username === story.username) {
                            viewStory(nextStory, storyArray);
                        } else {
                            exitStoryViewer();
                        }
                    } else {
                        exitStoryViewer();
                    }
                });
            };
        }
    }

    // Add navigation buttons
    // Add navigation buttons with updated logic
    const previousButton = viewer.querySelector('#previousButton');
    const nextButton = viewer.querySelector('#nextButton');

    if (previousButton) {
        // Show previous button if there's a previous story from same user
        const hasPrevious = currentStoryIndex > 0;
        previousButton.style.display = hasPrevious ? 'flex' : 'none';
        previousButton.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(progressTimeout);
            if (currentVideo) {
                currentVideo.pause();
                currentVideo = null;
            }
            if (hasPrevious) {
                viewStory(storyArray[currentStoryIndex - 1], storyArray);
            }
        };
    }

    if (nextButton) {
        // Show next button if there's a next story from same user
        const hasNext = currentStoryIndex < storyArray.length - 1;
        nextButton.style.display = hasNext ? 'flex' : 'none';
        nextButton.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(progressTimeout);
            if (currentVideo) {
                currentVideo.pause();
                currentVideo = null;
            }
            if (hasNext) {
                viewStory(storyArray[currentStoryIndex + 1], storyArray);
            } else {
                exitStoryViewer();
            }
        };
    }

    // Add close button if not already present
    if (!viewer.querySelector('.close-button')) {
        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '×';
        closeButton.onclick = () => exitStoryViewer();
        viewer.appendChild(closeButton);
    }

    viewer.classList.add('active');

    // Add reaction panel only for other users' stories
    let reactionPanel = viewer.querySelector('.reaction-panel');
    const currentUsername = localStorage.getItem('username');
    const isOwnStory = story.username === currentUsername;

    // Remove existing reaction panel if it exists
    if (reactionPanel) {
        reactionPanel.remove();
    }

    // Only create and add reaction panel for other users' stories
    if (!isOwnStory) {
        reactionPanel = document.createElement('div');
        reactionPanel.className = 'reaction-panel';
        reactionPanel.innerHTML = `
            <div class="reactions">
                <div class="reaction-button">
                    <button class="reaction" data-reaction="like">
                        <img src="/pages/dashboard/reactionIcons/like.png" alt="Like">
                    </button>
                    <span class="count" id="likeCount">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="love">
                        <img src="/pages/dashboard/reactionIcons/love.png" alt="Love">
                    </button>
                    <span class="count" id="loveCount">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="haha">
                        <img src="/pages/dashboard/reactionIcons/haha.png" alt="Haha">
                    </button>
                    <span class="count" id="hahaCount">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="sad">
                        <img src="/pages/dashboard/reactionIcons/sad.png" alt="Sad">
                    </button>
                    <span class="count" id="sadCount">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="angry">
                        <img src="/pages/dashboard/reactionIcons/angry.png" alt="Angry">
                    </button>
                    <span class="count" id="angryCount">0</span>
                </div>
            </div>
        `;
        viewer.appendChild(reactionPanel);

        // Initialize reaction counts for this story if not exists
        if (!reactionCounts[story._id]) {
            reactionCounts[story._id] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
        }

        // Add reaction click handlers
        reactionPanel.querySelectorAll('.reaction').forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const reactionType = this.getAttribute('data-reaction');
                reactionCounts[story._id][reactionType]++;
                updateReactionCounts(story._id);
            });
        });

        // Update reaction counts when viewing story
        updateReactionCounts(story._id);
    }
}

// Add helper function to handle story viewer exit
function exitStoryViewer() {
    const viewer = document.querySelector('.story-viewer');
    viewer.classList.remove('active');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo = null;
    }
    clearTimeout(progressTimeout);
}

// Update createStoryIndicators function
function createStoryIndicators(storyArray) {
    const currentUsername = localStorage.getItem('username');
    let indicatorsContainer = document.querySelector('.story-indicators');
    if (!indicatorsContainer) {
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.classList.add('story-indicators');
        document.querySelector('.story-viewer').prepend(indicatorsContainer);
    }
    
    indicatorsContainer.innerHTML = '';

    // Get the current story
    const currentStory = storyArray[currentStoryIndex];
    
    // Create indicators based on who's story is being viewed
    const indicatorsDiv = document.createElement('div');
    indicatorsDiv.classList.add(currentStory.username === currentUsername ? 'user-indicators' : 'other-indicators');
    
    // Create indicators matching UI order
    storyArray.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('story-indicator');
        indicator.classList.add(currentStory.username === currentUsername ? 'user-indicator' : 'other-indicator');
        // Set active state based on current index
        indicator.classList.add(index === currentStoryIndex ? 'active' : 'inactive');
        indicatorsDiv.appendChild(indicator);
    });
    
    indicatorsContainer.appendChild(indicatorsDiv);
}

    // Modify the click event listener in the createStoryElement function
    // Update the click event listener in createStoryElement
        storyElement.addEventListener('click', () => {
            const isUserStory = userStories.some(s => s._id === story._id);
    
            let orderedStories;
            if (isUserStory) {
                // For user stories, maintain original order
                orderedStories = [...userStories];
                currentStoryIndex = orderedStories.findIndex(s => s._id === story._id);
            } else {
                // For other users' stories, get stories for this user and maintain UI order
                const clickedUsername = story.username;
                orderedStories = otherStories
                    .filter(s => s.username === clickedUsername)
                    .sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt)); // Sort newest first
                currentStoryIndex = orderedStories.findIndex(s => s._id === story._id);
            }
            
            viewStory(story, orderedStories);
        });


function updateActiveIndicator() {
    const indicators = document.querySelectorAll('.story-indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentStoryIndex) {
            indicator.classList.remove('inactive');
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
            indicator.classList.add('inactive');
        }
    });
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

// Add these helper functions
function updateReactionCounts(storyId) {
    const counts = reactionCounts[storyId] || { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
    document.getElementById('likeCount').textContent = counts.like;
    document.getElementById('loveCount').textContent = counts.love;
    document.getElementById('hahaCount').textContent = counts.haha;
    document.getElementById('sadCount').textContent = counts.sad;
    document.getElementById('angryCount').textContent = counts.angry;
}
