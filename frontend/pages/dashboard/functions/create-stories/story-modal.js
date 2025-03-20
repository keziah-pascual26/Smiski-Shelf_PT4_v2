import { initializeMediaPreview } from './media-preview.js';

// Create a link element for the CSS file
const storyModalCSS = document.createElement('link');
storyModalCSS.rel = 'stylesheet';
storyModalCSS.href = '/pages/dashboard/functions/create-stories/story-modal.css'; // Ensure the correct path to your CSS file
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
                <button class="edit-button" onclick="editStory()">Edit</button>
                <button class="post-button" onclick="addStories();">Post Story</button>
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

// Attach the event listener to the `storyDescription` input field
document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById("storyDescription");
    if (textArea) {
        textArea.addEventListener('input', updateCharCount);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeMediaPreview('mediaInput', 'previewContainer', 'imagePreview', 'videoPreview', 'videoSource');
});



document.body.insertAdjacentHTML('beforeend', storyModalHTML);
