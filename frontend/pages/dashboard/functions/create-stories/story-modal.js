import { initializeMediaPreview } from './media-preview.js';
import { loadStories } from '../../dashboard.js';

// Add overlay HTML and CSS setup
const overlayHTML = `<div id="overlay" class="overlay"></div>`;
document.body.insertAdjacentHTML('beforeend', overlayHTML);

const storyModalCSS = document.createElement('link');
storyModalCSS.rel = 'stylesheet';
storyModalCSS.href = '/pages/dashboard/functions/create-stories/story-modal.css';
document.head.appendChild(storyModalCSS);



const storyModalHTML = `
    <!-- Create Story Modal -->
    <div id="createStoryModal" class="create-story-modal">
        <div id="modal-content" class="modal-content">
            <button class="close-modal-button" id="closeModalButton">✖</button>
            <h2>Create Your Smiski Story</h2>
            <div class="input-section">
                <input type="text" id="storyTitle" placeholder="Enter story title">
                <div class="story-input-container">
                    <textarea id="storyDescription" placeholder="Enter story description (Max: 100 characters)" 
                        maxlength="100" oninput="updateCharCount()"></textarea>
                    <p id="charCount" class="char-counter">100 characters remaining</p>
                </div>
                <div class="file-upload">
                    <label for="mediaInput">Choose files</label>
                    <input type="file" id="mediaInput" accept="image/*, video/*" multiple>
                </div>
                <div class="audio-upload">
                    <label for="audioInput">Add background music or voiceover</label>
                    <input type="file" id="audioInput" accept="audio/*">
                </div>
                <audio id="audioPreview" controls style="display:none;">
                    Your browser does not support the audio element.
                </audio>
            </div>
            <div class="preview-section">
                <div id="previewContainer" style="display: none;">
                    <img id="imagePreview" src="" alt="Image Preview" style="display: none;">
                    <video id="videoPreview" controls style="display: none;">
                        <source id="videoSource" src="" type="video/mp4">
                    </video>
                </div>
            </div>
            <div class="button-section">
                <button class="edit-button" id="editStoryButton">Edit</button>
                <button class="post-button" id="postStoryButton">Post Story</button>
            </div>
            <div id="editorSection" style="display: none;">
                <div id="imageEditor" style="display: none;">
                    <h3>Edit Image</h3>
                    <div>
                        <button onclick="rotateImage()">Rotate</button>
                        <button id="cropImage">Enable Cropping</button>
                        <div class="image-resize-controls">
                            <span>Resize:</span>
                            <button id="minimizeButton" onclick="minimizeImage()">-</button>
                            <button id="maximizeButton" onclick="maximizeImage()">+</button>
                        </div>
                    </div>
                    <div id="cropper-container"></div>
                </div>
                <div id="videoEditor" style="display: none;">
                    <h3>Edit Video</h3>
                    <div>
                        <button id="muteButton" onclick="toggleMute()">Mute</button>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="trimVideoCheckbox" style="width: 16px; height: 16px; cursor: pointer;">
                            <label for="trimVideoCheckbox" style="margin: 0; font-size: 14px;">Confirm Trim Video</label>
                        </div>
                        <div class="video-editor-buttons">
                            <button onclick="trimAndRecordVideo()">Preview Trim Video</button>
                            <button id="undoTrimButton" onclick="undoTrimAndRecordVideo()">Undo Trim</button>
                        </div>
                    </div>
                    <div class="video-time-controls">
                        <label for="startTimeInput">Start Time (s):</label>
                        <input type="number" id="startTimeInput" min="0" placeholder="Start">
                        <label for="endTimeInput">End Time (s):</label>
                        <input type="number" id="endTimeInput" min="0" placeholder="End">
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

export function openStoryModal() {
    const modal = document.getElementById('createStoryModal');
    const overlay = document.getElementById('overlay');

    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        console.error('Modal or overlay element not found.');
    }
}

export function closeModalButton() {
    const modal = document.getElementById('createStoryModal');
    const overlay = document.getElementById('overlay');

    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    } else {
        console.error('Modal or overlay element not found.');
    }
}

function updateCharCount() {
    const textArea = document.getElementById("storyDescription");
    const charCount = document.getElementById("charCount");

    if (textArea && charCount) {
        const remaining = 100 - textArea.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    } else {
        console.error('Text area or character count element not found.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Insert modal and overlay HTML
    document.body.insertAdjacentHTML('beforeend', storyModalHTML);
    
    // Initialize text area listener
    const textArea = document.getElementById("storyDescription");
    if (textArea) {
        textArea.addEventListener('input', updateCharCount);
    }

    // Initialize media preview
    initializeMediaPreview('mediaInput', 'previewContainer', 'imagePreview', 'videoPreview', 'videoSource');

    // Initialize modal buttons
    const postButton = document.getElementById('postStoryButton');
    const closeButton = document.getElementById('closeModalButton');
    const createButton = document.getElementById('createStoryButton');
    const overlay = document.getElementById('overlay');

    if (postButton) {
        postButton.addEventListener('click', addStories);
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeModalButton);
    }

    if (createButton) {
        createButton.addEventListener('click', openStoryModal);
    }

    if (overlay) {
        overlay.addEventListener('click', closeModalButton);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeMediaPreview('mediaInput', 'previewContainer', 'imagePreview', 'videoPreview', 'videoSource');
});

document.addEventListener('DOMContentLoaded', () => {
    // Existing listeners
    const textArea = document.getElementById("storyDescription");
    if (textArea) {
        textArea.addEventListener('input', updateCharCount);
    }

    // Initialize media preview
    initializeMediaPreview('mediaInput', 'previewContainer', 'imagePreview', 'videoPreview', 'videoSource');

    // Add story post button listener
    const postButton = document.getElementById('postStoryButton');
    if (postButton) {
        postButton.addEventListener('click', addStories);
    }
});

async function addStories() {
    const mediaInput = document.getElementById('mediaInput');
    const storyTitleInput = document.getElementById('storyTitle');
    const storyDescriptionInput = document.getElementById('storyDescription');
    
    const files = mediaInput.files;
    const storyTitle = storyTitleInput.value.trim();
    const storyDescription = storyDescriptionInput.value.trim();

    if (!storyTitle || !storyDescription) {
        alert('Please enter both a title and description for your story.');
        return;
    }

    if (files.length === 0) {
        alert('Please select an image or video for your story.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to post a story.');
            return;
        }

        const formData = new FormData();
        formData.append('title', storyTitle);
        formData.append('description', storyDescription);
        formData.append('media', files[0]); // Changed from 'image' to 'media'

        const response = await fetch('http://localhost:3000/api/stories', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to post story');
        }

        const result = await response.json();
        console.log('✅ Story posted successfully:', result);
        
        // Clear form and close modal
        storyTitleInput.value = '';
        storyDescriptionInput.value = '';
        mediaInput.value = '';
        closeModalButton();

        // Refresh stories list
        await loadStories();

    } catch (error) {
        console.error('🚨 Error posting story:', error);
        alert('Failed to post story. Please try again.');
    }
}

// Add this after your existing imports
async function fetchStories() {
    try {
        const response = await fetch('http://localhost:3000/api/stories/mystories', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }

        const stories = await response.json();
        return stories;
    } catch (error) {
        console.error('Error fetching stories:', error);
        return [];
    }
}




document.body.insertAdjacentHTML('beforeend', storyModalHTML);

export { addStories };
