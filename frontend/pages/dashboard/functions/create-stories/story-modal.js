import { initializeMediaPreview } from './media-preview.js';
import { loadStories } from '../../dashboard.js';

// Add overlay HTML and CSS setup
const overlayHTML = `<div id="overlay" class="overlay"></div>`;
document.body.insertAdjacentHTML('beforeend', overlayHTML);

const storyModalCSS = document.createElement('link');
storyModalCSS.rel = 'stylesheet';
storyModalCSS.href = '/pages/dashboard/functions/create-stories/story-modal.css';
document.head.appendChild(storyModalCSS);

let uploadedFileType = null;
let cropper = null;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;
let currentScale = 1.0;
// Update the modal HTML where the rotate button is defined
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
                        <button type="button" id="rotateButton">Rotate</button>
                        <button id="cropImage">Enable Cropping</button>
                        <div class="image-resize-controls">
                            <span>Resize:</span>
                                <button id="minimizeButton" type="button">-</button>
                                <button id="maximizeButton" type="button">+</button>
                                <div id="resizeControls" style="display: none;">
                                    <button type="button" id="doneResizing" class="crop-btn done">Done</button>
                                    <button type="button" id="cancelResizing" class="crop-btn cancel">Cancel</button>
                                </div>
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

// Update handleMediaUpload to reset rotation when new image is loaded
function handleMediaUpload(event) {
    const file = event.target.files[0];
    const imageEditor = document.getElementById('imageEditor');
    const videoEditor = document.getElementById('videoEditor');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const videoSource = document.getElementById('videoSource');
    const previewContainer = document.getElementById('previewContainer');
    const cropButton = document.getElementById('cropImage');
    const editorSection = document.getElementById('editorSection');
    const editButton = document.querySelector('.edit-button');

    // Reset all editors and controls
    imageEditor.style.display = 'none';
    videoEditor.style.display = 'none';
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';
    editorSection.style.display = 'none';
    cropButton.style.display = 'none';
    editButton.textContent = 'Edit';

    currentRotation = 0;
    // Reset scale and transform
    currentScale = 1;
    if (imagePreview) {
        imagePreview.style.transform = 'scale(1)';
    }

    // Reset cropper if it exists
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    // Remove any existing crop controls
    const existingControls = document.getElementById('cropControls');
    if (existingControls) {
        existingControls.remove();
    }

    if (file) {
        const fileType = file.type;
        uploadedFileType = fileType;

        if (fileType.startsWith('image/')) {
            // Reset cropper and button state for new image upload
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            
            editButton.style.display = 'block';
            imageEditor.style.display = 'none';
            videoEditor.style.display = 'none';
        
            const reader = new FileReader();
            reader.onload = function () {
                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';
                videoPreview.style.display = 'none';
                
                // Reset cropper and button state
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
                cropButton.textContent = 'Enable Cropping';
                cropButton.onclick = toggleCropping;
            };
            reader.readAsDataURL(file);
        } else if (fileType.startsWith('video/')) {
            editButton.style.display = 'block';
            imageEditor.style.display = 'none';
            videoEditor.style.display = 'none';
        
            const reader = new FileReader();
            reader.onload = function () {
                videoSource.src = reader.result;
                videoPreview.style.display = 'block';
                imagePreview.style.display = 'none';
                videoPreview.load();
            };
            reader.readAsDataURL(file);
        }

    }

    // Show the preview container once the media is selected
    previewContainer.style.display = 'block';
}

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

// Remove duplicate DOMContentLoaded event listeners and combine them into one
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
    const mediaInput = document.getElementById('mediaInput');
    const rotateButton = document.getElementById('rotateButton');
    const editButton = document.querySelector('.edit-button');

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

    if (mediaInput) {
        mediaInput.addEventListener('change', handleMediaUpload);
    }

    if (rotateButton) {
        rotateButton.addEventListener('click', rotateImage);
    }

<<<<<<< HEAD
    // Add edit button listener
    if (editButton) {
        editButton.addEventListener('click', () => {
            const editorSection = document.getElementById('editorSection');
            const imageEditor = document.getElementById('imageEditor');
            const videoEditor = document.getElementById('videoEditor');
            const cropButton = document.getElementById('cropImage');
    
            if (uploadedFileType && uploadedFileType.startsWith('image/')) {
                // Toggle image editor
                editorSection.style.display = editorSection.style.display === 'none' ? 'block' : 'none';
                imageEditor.style.display = editorSection.style.display;
                videoEditor.style.display = 'none';
                cropButton.style.display = editorSection.style.display === 'block' ? 'block' : 'none';
            } else if (uploadedFileType && uploadedFileType.startsWith('video/')) {
                // Toggle video editor
                editorSection.style.display = editorSection.style.display === 'none' ? 'block' : 'none';
                videoEditor.style.display = editorSection.style.display;
                imageEditor.style.display = 'none';
            }
    
            editButton.textContent = editorSection.style.display === 'block' ? 'Hide Edit Options' : 'Edit';
        });
    }
=======
    // Add resize button listeners
    const minimizeBtn = document.getElementById('minimizeButton');
    const maximizeBtn = document.getElementById('maximizeButton');
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            minimizeImage();
        });
    }
    
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            maximizeImage();
        });
    }

    // Add resize control button listeners
    const resizeControls = document.getElementById('resizeControls');
    if (resizeControls) {
        const doneResizingBtn = document.getElementById('doneResizing');
        const cancelResizingBtn = document.getElementById('cancelResizing');
        
        if (doneResizingBtn) {
            doneResizingBtn.addEventListener('click', () => {
                resizeControls.style.display = 'none';
            });
        }
        
        if (cancelResizingBtn) {
            cancelResizingBtn.addEventListener('click', () => {
                currentScale = 1.0;
                const imagePreview = document.getElementById('imagePreview');
                applyScale(imagePreview);
                resizeControls.style.display = 'none';
            });
        }
    }
>>>>>>> parent of c93471a (removed resize)
});




async function addStories() {
    // Declare all variables at the start of the function
    const mediaInput = document.getElementById('mediaInput');
    const storyTitleInput = document.getElementById('storyTitle');
    const storyDescriptionInput = document.getElementById('storyDescription');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const previewContainer = document.getElementById('previewContainer');
    const editorSection = document.getElementById('editorSection');
    const editButton = document.querySelector('.edit-button');
    const charCount = document.getElementById('charCount');
    
    const files = mediaInput.files;
    const storyTitle = storyTitleInput.value.trim();
    const storyDescription = storyDescriptionInput.value.trim();

    // Validation checks
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

        // Handle media upload with transformations
        if (uploadedFileType.startsWith('image/')) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imagePreview.src;
            });
        
            // Use the current preview dimensions
            canvas.width = img.width;
            canvas.height = img.height;
        
            // Simply draw the image as it appears in preview
            ctx.drawImage(img, 0, 0);
        
            const finalImageBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            formData.append('media', finalImageBlob, 'edited-image.jpg');
        }
    


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
        
        // Reset form values
        mediaInput.value = '';
        storyTitleInput.value = '';
        storyDescriptionInput.value = '';
        
        // Reset media previews
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        videoPreview.src = '';
        videoPreview.style.display = 'none';
        previewContainer.style.display = 'none';

        // Reset editor section
        editorSection.style.display = 'none';
        editButton.textContent = 'Edit';
        editButton.style.display = 'none';

        // Reset cropper if it exists
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }

        // Reset rotation and scale
        currentRotation = 0;
        currentScale = 1;

        // Reset character count
        charCount.textContent = '100 characters remaining';

        // Close modal
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

// Add this variable at the top with other global variables
let currentRotation = 0;

// Update the rotateImage function
function rotateImage() {
    const imagePreview = document.getElementById('imagePreview');
    currentRotation = (currentRotation + 90) % 360;
    
    if (cropper) {
        cropper.rotate(90);
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.src = imagePreview.src;
        
        img.onload = function() {
            // Set canvas dimensions based on rotation
            if (currentRotation === 90 || currentRotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }
            
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate((currentRotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width/2, -img.height/2);
            ctx.restore();
            
            imagePreview.src = canvas.toDataURL();
        };
    }
}



function initializeCropper() {
    const imagePreview = document.getElementById('imagePreview');
    const cropButton = document.getElementById('cropImage');
    const previewContainer = document.getElementById('previewContainer');
    
    if (cropper) {
        cropper.destroy();
    }

    // Remove existing crop controls if they exist
    const existingControls = document.getElementById('cropControls');
    if (existingControls) {
        existingControls.remove();
    }

    // Create new crop controls
    const cropControls = document.createElement('div');
    cropControls.id = 'cropControls';
    cropControls.innerHTML = `
        <button type="button" id="doneCropping" class="crop-btn done">Done</button>
        <button type="button" id="cancelCropping" class="crop-btn cancel">Cancel</button>
    `;
    
    // Insert controls after the preview container
    previewContainer.insertAdjacentElement('afterend', cropControls);

    // Add event listeners
    document.getElementById('doneCropping').addEventListener('click', () => {
        const croppedCanvas = cropper.getCroppedCanvas();
        imagePreview.src = croppedCanvas.toDataURL();
        toggleCropping();
    });

    document.getElementById('cancelCropping').addEventListener('click', () => {
        toggleCropping();
    });

    // Initialize cropper
    cropper = new Cropper(imagePreview, {
        aspectRatio: 9 / 16,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        initialRotation: currentRotation,
        // Add this to maintain scale
        scale: currentScale
    });

    cropButton.textContent = 'Disable Cropping';
}

// Add this function to handle crop button clicks
function toggleCropping() {
    const imagePreview = document.getElementById('imagePreview');
    const cropButton = document.getElementById('cropImage');
    const cropPreview = document.getElementById('cropPreview');
    const cropControls = document.getElementById('cropControls');

    if (cropper) {
        cropper.destroy();
        cropper = null;
        cropButton.textContent = 'Enable Cropping';
        if (cropPreview) {
            cropPreview.remove();
        }
        if (cropControls) {
            cropControls.remove();
        }
    } else {
        initializeCropper();
    }
}

// Update maximize and minimize functions
function maximizeImage() {
    const imagePreview = document.getElementById('imagePreview');
    if (currentScale < MAX_SCALE) {
        currentScale += SCALE_STEP;
        applyScale(imagePreview);
    }
}

function minimizeImage() {
    const imagePreview = document.getElementById('imagePreview');
    if (currentScale > MIN_SCALE) {
        currentScale -= SCALE_STEP;
        applyScale(imagePreview);
    }
}

function applyScale(imageElement) {
    if (!imageElement) return;
    
    // Apply scale transform while preserving any existing rotation
    const rotationTransform = `rotate(${currentRotation}deg)`;
    const scaleTransform = `scale(${currentScale})`;
    imageElement.style.transform = `${rotationTransform} ${scaleTransform}`;
    
    // Show resize controls
    const resizeControls = document.getElementById('resizeControls');
    if (resizeControls) {
        resizeControls.style.display = 'flex';
    }
}

<<<<<<< HEAD
=======

function showResizeControls() {
    const resizeControls = document.getElementById('resizeControls');
    if (resizeControls) {
        resizeControls.style.display = 'flex';
        resizeControls.innerHTML = `
            <button type="button" id="doneResizing" class="crop-btn done">Done</button>
            <button type="button" id="cancelResizing" class="crop-btn cancel">Cancel</button>
        `;
        
        // Add event listeners
        document.getElementById('doneResizing').onclick = () => {
            hideResizeControls();
            // Keep the current scale
        };
        
        document.getElementById('cancelResizing').onclick = () => {
            currentScale = 1.0;
            const imagePreview = document.getElementById('imagePreview');
            applyScale(imagePreview);
            hideResizeControls();
        };
    }
}

function hideResizeControls() {
    const resizeControls = document.getElementById('resizeControls');
    if (resizeControls) {
        resizeControls.style.display = 'none';
    }
}



>>>>>>> parent of c93471a (removed resize)
document.body.insertAdjacentHTML('beforeend', storyModalHTML);

export { addStories, handleMediaUpload };
