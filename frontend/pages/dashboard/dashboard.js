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

    /// Add reaction panel for all stories
    let reactionPanel = viewer.querySelector('.reaction-panel');
    const currentUsername = localStorage.getItem('username');
    const isOwnStory = story.username === currentUsername;

    // Remove existing reaction panel if it exists
    if (reactionPanel) {
        reactionPanel.remove();
    }

        // Create reaction panel for all stories
    reactionPanel = document.createElement('div');
    reactionPanel.className = 'reaction-panel';

     if (isOwnStory) {
        // For user's own stories - show only reaction counts
        reactionPanel.innerHTML = `
            <div class="reactions own-story-reactions">
                <h3>Reactions from others</h3>
                <div class="reaction-counts-grid">
                    <div class="reaction-stat">
                        <img src="/pages/dashboard/reactionIcons/like.png" alt="Like">
                        <span class="count" id="likeCount-${story._id}">0</span>
                    </div>
                    <div class="reaction-stat">
                        <img src="/pages/dashboard/reactionIcons/love.png" alt="Love">
                        <span class="count" id="loveCount-${story._id}">0</span>
                    </div>
                    <div class="reaction-stat">
                        <img src="/pages/dashboard/reactionIcons/haha.png" alt="Haha">
                        <span class="count" id="hahaCount-${story._id}">0</span>
                    </div>
                    <div class="reaction-stat">
                        <img src="/pages/dashboard/reactionIcons/sad.png" alt="Sad">
                        <span class="count" id="sadCount-${story._id}">0</span>
                    </div>
                    <div class="reaction-stat">
                        <img src="/pages/dashboard/reactionIcons/angry.png" alt="Angry">
                        <span class="count" id="angryCount-${story._id}">0</span>
                    </div>
                </div>
            </div>`;
    } else {
        // For other users' stories - show interactive reaction buttons
        reactionPanel.innerHTML = `
            <div class="reactions other-story-reactions">
                <div class="reaction-button">
                    <button class="reaction" data-reaction="like" data-story-id="${story._id}">
                        <img src="/pages/dashboard/reactionIcons/like.png" alt="Like">
                    </button>
                    <span class="count" id="likeCount-${story._id}">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="love" data-story-id="${story._id}">
                        <img src="/pages/dashboard/reactionIcons/love.png" alt="Love">
                    </button>
                    <span class="count" id="loveCount-${story._id}">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="haha" data-story-id="${story._id}">
                        <img src="/pages/dashboard/reactionIcons/haha.png" alt="Haha">
                    </button>
                    <span class="count" id="hahaCount-${story._id}">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="sad" data-story-id="${story._id}">
                        <img src="/pages/dashboard/reactionIcons/sad.png" alt="Sad">
                    </button>
                    <span class="count" id="sadCount-${story._id}">0</span>
                </div>
                <div class="reaction-button">
                    <button class="reaction" data-reaction="angry" data-story-id="${story._id}">
                        <img src="/pages/dashboard/reactionIcons/angry.png" alt="Angry">
                    </button>
                    <span class="count" id="angryCount-${story._id}">0</span>
                </div>
            </div>`;
    }
    
    viewer.appendChild(reactionPanel);

    // Always fetch initial reaction counts
    fetchReactionCounts(story._id);


    // Add click handlers only for non-own stories
    if (!isOwnStory) {
        reactionPanel.querySelectorAll('.reaction').forEach(button => {
            button.onclick = async (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                const reactionType = button.getAttribute('data-reaction');
                const storyId = story._id;
                
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('http://localhost:3000/api/reactions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            storyId,
                            reactionType,
                            username: localStorage.getItem('username')
                        })
                    });

                    if (response.ok) {
                        const updatedCounts = await response.json();
                        
                        // Update the reaction counts in the UI
                        Object.entries(updatedCounts).forEach(([type, count]) => {
                            const countElement = document.getElementById(`${type}Count-${storyId}`);
                            if (countElement) {
                                countElement.textContent = count;
                            }
                        });

                        // Add visual feedback for the clicked reaction
                        button.classList.add('reacted');
                        setTimeout(() => button.classList.remove('reacted'), 500);
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to add reaction:', errorData.message);
                    }
                } catch (error) {
                    console.error('Error adding reaction:', error);
                }
            };
        });

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

// Update the fetchReactionCounts function
async function fetchReactionCounts(storyId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/reactions/${storyId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const counts = await response.json();
            console.log('Fetched counts for story:', storyId, counts); // Debug log
            
            // Update UI with counts
            Object.entries(counts).forEach(([type, count]) => {
                const countElement = document.getElementById(`${type}Count-${storyId}`);
                if (countElement) {
                    countElement.textContent = count || '0';
                }
            });
        } else {
            console.error('Failed to fetch reaction counts:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching reactions:', error);
    }
}


// Update the reaction click handler in viewStory function
reactionPanel.querySelectorAll('.reaction').forEach(button => {
    button.addEventListener('click', async function(event) {
        event.stopPropagation();
        const reactionType = this.getAttribute('data-reaction');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/reactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    storyId: story._id,
                    reactionType
                })
            });

            if (response.ok) {
                const updatedCounts = await response.json();
                updateReactionCounts(story._id, updatedCounts);
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    });
});

// Update the updateReactionCounts function
function updateReactionCounts(storyId, counts = null) {
    const reactionCounts = counts || {
        like: 0, love: 0, haha: 0, sad: 0, angry: 0
    };

    console.log('Updating counts for story:', storyId, reactionCounts); // Debug log

    Object.entries(reactionCounts).forEach(([type, count]) => {
        const countElement = document.getElementById(`${type}Count-${storyId}`);
        if (countElement) {
            countElement.textContent = count;
        } else {
            console.warn(`Count element not found for ${type} reaction on story ${storyId}`);
        }
    });
}
