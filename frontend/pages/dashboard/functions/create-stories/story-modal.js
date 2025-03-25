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

let originalVideo = null;
let trimmedVideo = null;


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
                                    <button id="previewTrimButton">Preview Trim Video</button>
                                    <button id="undoTrimButton" style="display: none;">Undo Trim</button>
                                </div>
                            </div>
                            <div class="video-time-controls">
                                <label for="startTimeInput">Start Time (s):</label>
                                <input type="number" id="startTimeInput" min="0" step="0.1" placeholder="Start">
                                <label for="endTimeInput">End Time (s):</label>
                                <input type="number" id="endTimeInput" min="0" step="0.1" placeholder="End">
                            </div>
                        </div>
            </div>
        </div>
    </div>
`;

function handleMediaUpload(event) {
    const files = event.target.files;
    const imageEditor = document.getElementById('imageEditor');
    const videoEditor = document.getElementById('videoEditor');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const videoSource = document.getElementById('videoSource');
    const previewContainer = document.getElementById('previewContainer');
    const cropButton = document.getElementById('cropImage');
    const editorSection = document.getElementById('editorSection');
    const editButton = document.querySelector('.edit-button');

    // Store the file type for later use
    if (files.length > 0) {
        uploadedFileType = files[0].type;
    }

    // Reset all editors and controls
    imageEditor.style.display = 'none';
    videoEditor.style.display = 'none';
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';
    editorSection.style.display = 'none';
    cropButton.style.display = 'none';
    editButton.textContent = 'Edit';

    // Always show the edit button when media is uploaded
    editButton.style.display = 'block';

    currentRotation = 0;

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

    if (files.length === 0) return;

    // Get the first file for preview (we'll still upload all files)
    const file = files[0];
    const fileType = file.type;

    // Show appropriate editor based on file type
    if (fileType.startsWith('image/')) {
        // Image handling remains the same
        const reader = new FileReader();
        reader.onload = function() {
            imagePreview.src = reader.result;
            imagePreview.style.display = 'block';
            
            // Reset cropper and button state
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropButton.textContent = 'Enable Cropping';
            
            // Set up edit button for images
            editButton.onclick = () => {
                editorSection.style.display = editorSection.style.display === 'none' ? 'block' : 'none';
                imageEditor.style.display = 'block';
                videoEditor.style.display = 'none';
                cropButton.style.display = 'block';
                if (editorSection.style.display === 'block') {
                    editButton.textContent = 'Hide Edit Options';
                } else {
                    editButton.textContent = 'Edit';
                }
            };
        };
        reader.readAsDataURL(file);
    } else if (fileType.startsWith('video/')) {
        // Clean up previous video resources
        if (videoPreview.src) {
            URL.revokeObjectURL(videoPreview.src);
        }
        
        // Reset video elements
        videoPreview.pause();
        videoPreview.removeAttribute('src');
        videoSource.removeAttribute('src');
        videoPreview.load();
        
        // Reset trim-related elements
        const trimVideoCheckbox = document.getElementById('trimVideoCheckbox');
        const undoTrimButton = document.getElementById('undoTrimButton');
        const startTimeInput = document.getElementById('startTimeInput');
        const endTimeInput = document.getElementById('endTimeInput');
        
        if (trimVideoCheckbox) trimVideoCheckbox.checked = false;
        if (undoTrimButton) undoTrimButton.style.display = 'none';
        if (startTimeInput) startTimeInput.value = '';
        if (endTimeInput) endTimeInput.value = '';
        
        // Reset original video reference
        originalVideo = null;
        
        // Create a blob URL for the video
        const videoURL = URL.createObjectURL(file);
        
        // Set the source and load the video
        videoSource.src = videoURL;
        videoPreview.load(); // Important: load the video after changing source
        videoPreview.style.display = 'block';
        
        // Set up edit button for videos immediately (don't wait for metadata)
        editButton.style.display = 'block';
        editButton.onclick = () => {
            editorSection.style.display = editorSection.style.display === 'none' ? 'block' : 'none';
            videoEditor.style.display = 'block';
            imageEditor.style.display = 'none';
            if (editorSection.style.display === 'block') {
                editButton.textContent = 'Hide Edit Options';
            } else {
                editButton.textContent = 'Edit';
            }
        };
        
        // Set up video metadata loading
        videoPreview.onloadedmetadata = function() {
            // Set max value for end time input
            const endTimeInput = document.getElementById('endTimeInput');
            const maxDuration = Math.min(videoPreview.duration, 15);
            
            if (endTimeInput) {
                endTimeInput.value = maxDuration;
            }
            
            // Show warning if video is longer than 15 seconds
            if (videoPreview.duration > 15) {
                const warningDiv = document.createElement('div');
                warningDiv.id = 'videoLengthWarning';
                warningDiv.style.color = '#ff4d4d';
                warningDiv.style.marginTop = '5px';
                warningDiv.style.fontSize = '14px';
                warningDiv.textContent = 'Video exceeds 15 seconds. Only the first 15 seconds will be used.';
                
                // Remove existing warning if any
                const existingWarning = document.getElementById('videoLengthWarning');
                if (existingWarning) {
                    existingWarning.remove();
                }
                
                previewContainer.appendChild(warningDiv);
            }
            
            // Set up progress bar update on timeupdate
            setupVideoProgressBar(videoPreview);
        };
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

    // Add this new event listener
    const mediaInput = document.getElementById('mediaInput');
    if (mediaInput) {
        mediaInput.addEventListener('change', handleMediaUpload);
    }

    // Add rotate button listener
    const rotateButton = document.getElementById('rotateButton');
    if (rotateButton) {
        rotateButton.addEventListener('click', rotateImage);
    }

     // Add crop button listener
     const cropButton = document.getElementById('cropImage');
     if (cropButton) {
         cropButton.addEventListener('click', toggleCropping);
     }
 
     // Add video trim preview button listener
     const previewTrimButton = document.getElementById('previewTrimButton');
     if (previewTrimButton) {
         previewTrimButton.addEventListener('click', trimAndRecordVideo);
     }

        // Add video time input listeners
        const startTimeInput = document.getElementById('startTimeInput');
        const endTimeInput = document.getElementById('endTimeInput');
        const videoPreview = document.getElementById('videoPreview');

        if (videoPreview) {
            videoPreview.addEventListener('loadedmetadata', () => {
                if (endTimeInput) {
                    endTimeInput.max = videoPreview.duration;
                    endTimeInput.value = Math.min(videoPreview.duration, 15);
                }
                if (startTimeInput) {
                    startTimeInput.max = videoPreview.duration - 1;
                }
            });
        }

        // Add undo trim button listener
        const undoTrimButton = document.getElementById('undoTrimButton');
        if (undoTrimButton) {
            undoTrimButton.addEventListener('click', undoTrimAndRecordVideo);
        }

        // Add CSS for trim indicator
        const style = document.createElement('style');
    style.textContent = `
        .trim-indicator {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);

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
                
                // Show loading state
                const postButton = document.getElementById('postStoryButton');
                const originalButtonText = postButton.textContent;
                postButton.textContent = 'Uploading...';
                postButton.disabled = true;
        
                const formData = new FormData();
                formData.append('title', storyTitle);
                formData.append('description', storyDescription);
        
                // Handle media upload with transformations
                if (files[0].type.startsWith('image/')) {
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
                } else if (files[0].type.startsWith('video/')) {
                    // For videos, check if trimming is needed
                    const trimVideoCheckbox = document.getElementById('trimVideoCheckbox');
                    const videoFile = files[0];
                    
                    // Log video details for debugging
                    console.log('Video details:', {
                        name: videoFile.name,
                        type: videoFile.type,
                        size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
                        duration: videoPreview.duration
                    });
                    
                    // Check if video exceeds 15 seconds
                    if (videoPreview.duration > 15) {
                        // If user hasn't explicitly set trim points, set them automatically
                        if (!trimVideoCheckbox || !trimVideoCheckbox.checked) {
                            const startTime = 0;
                            const endTime = 15;
                            
                            // Add warning about automatic trimming
                            console.log('Video exceeds 15 seconds. Automatically trimming to first 15 seconds.');
                            
                            // Set trim parameters
                            formData.append('media', videoFile);
                            formData.append('isTrimmed', 'true');
                            formData.append('trimStart', startTime.toString());
                            formData.append('trimEnd', endTime.toString());
                            formData.append('videoDuration', videoPreview.duration.toString());
                            formData.append('videoFormat', videoFile.type.split('/')[1] || 'mp4');
                            formData.append('trimDuration', '15');
                            formData.append('videoCodec', 'h264');
                            formData.append('requiresProcessing', 'true');
                            
                            console.log('Auto trim details:', {
                                start: startTime,
                                end: endTime,
                                duration: videoPreview.duration,
                                trimDuration: endTime - startTime,
                                format: videoFile.type.split('/')[1] || 'mp4'
                            });
                        } else {
                            // User has set custom trim points
                            const startTime = parseFloat(document.getElementById('startTimeInput').value) || 0;
                            const endTime = parseFloat(document.getElementById('endTimeInput').value) || 15;
                            
                            if (endTime - startTime > 15) {
                                alert('Final video duration cannot exceed 15 seconds. Please adjust your trim points.');
                                postButton.textContent = originalButtonText;
                                postButton.disabled = false;
                                return;
                            }
                            
                            // Enhanced trim information with more details
                            formData.append('media', videoFile);
                            formData.append('isTrimmed', 'true');
                            formData.append('trimStart', startTime.toString());
                            formData.append('trimEnd', endTime.toString());
                            formData.append('videoDuration', videoPreview.duration.toString());
                            formData.append('videoFormat', videoFile.type.split('/')[1] || 'mp4');
                            formData.append('trimDuration', (endTime - startTime).toString());
                            formData.append('videoCodec', 'h264');
                            formData.append('requiresProcessing', 'true');
        
                            console.log('Trim details:', {
                                start: startTime,
                                end: endTime,
                                duration: videoPreview.duration,
                                trimDuration: endTime - startTime,
                                format: videoFile.type.split('/')[1] || 'mp4'
                            });
                        }
                    } else {
                        // Video is already under 15 seconds
                        if (trimVideoCheckbox && trimVideoCheckbox.checked) {
                            // User wants to trim anyway
                            const startTime = parseFloat(document.getElementById('startTimeInput').value) || 0;
                            const endTime = parseFloat(document.getElementById('endTimeInput').value) || videoPreview.duration;
                            
                            formData.append('media', videoFile);
                            formData.append('isTrimmed', 'true');
                            formData.append('trimStart', startTime.toString());
                            formData.append('trimEnd', endTime.toString());
                            formData.append('videoDuration', videoPreview.duration.toString());
                            formData.append('videoFormat', videoFile.type.split('/')[1] || 'mp4');
                            formData.append('trimDuration', (endTime - startTime).toString());
                            formData.append('videoCodec', 'h264');
                            formData.append('requiresProcessing', 'true');
                        } else {
                            // No trimming needed, video is already short enough
                            formData.append('media', videoFile);
                            formData.append('isTrimmed', 'false');
                            formData.append('videoDuration', videoPreview.duration.toString());
                        }
                    }
                }
        
                // Add audio if selected
                const audioInput = document.getElementById('audioInput');
                if (audioInput && audioInput.files.length > 0) {
                    formData.append('audio', audioInput.files[0]);
                }
                    
                // For debugging
                console.log('FormData contents:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }
                    
                const response = await fetch('http://localhost:3000/api/stories', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Don't set Content-Type header when using FormData
                    },
                    body: formData
                });
            
                // Reset button state
                postButton.textContent = originalButtonText;
                postButton.disabled = false;
        
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    
                    try {
                        // Try to parse as JSON if possible
                        const errorData = JSON.parse(errorText);
                        console.error('Server error details:', errorData);
                        
                        // More specific error message based on the error
                        if (errorData.error === 'Video trimming failed') {
                            alert('Video trimming failed. This could be due to an unsupported video format or codec. Try using a different video or upload without trimming.');
                        } else {
                            throw new Error(errorData.error || 'Failed to post story');
                        }
                    } catch (e) {
                        // If not JSON, show the raw error
                        console.error('Raw server error:', errorText);
                        alert('Failed to post story. Please try again.');
                    }
                    return;
                }
        
                const result = await response.json();
                console.log('✅ Story posted successfully:', result);
                
                // Reset form values
                mediaInput.value = '';
                storyTitleInput.value = '';
                storyDescriptionInput.value = '';
                
                // Reset audio input if it exists
                if (audioInput) {
                    audioInput.value = '';
                    const audioPreview = document.getElementById('audioPreview');
                    if (audioPreview) {
                        audioPreview.src = '';
                        audioPreview.style.display = 'none';
                    }
                }
                
                // Reset media previews
                imagePreview.src = '';
                imagePreview.style.display = 'none';
                videoPreview.src = '';
                videoPreview.style.display = 'none';
                previewContainer.style.display = 'none';
        
                // Reset editor section
                editorSection.style.display = 'none';
                editButton.textContent = 'Edit';
                editButton.style.display = 'none'; // This line hides the edit button
        
                // Reset cropper if it exists
                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }
        
                // Reset rotation and scale
                currentRotation = 0;
        
                // Reset character count
                charCount.textContent = '100 characters remaining';
        
                // Reset video trim elements
                const undoTrimButton = document.getElementById('undoTrimButton');
                if (undoTrimButton) {
                    undoTrimButton.style.display = 'none';
                }
                const trimVideoCheckbox = document.getElementById('trimVideoCheckbox');
                if (trimVideoCheckbox) {
                    trimVideoCheckbox.checked = false;
                }
        
                // Reset trim indicator
                const trimIndicator = document.getElementById('trimIndicator');
                if (trimIndicator) {
                    trimIndicator.remove();
                }
                
                // Reset original video reference
                originalVideo = null;
                
                // Close modal
                closeModalButton();
        
                // Refresh stories list
                await loadStories();
        
            } catch (error) {
                console.error('🚨 Error posting story:', error);
                alert('Failed to post story. Please try again.');
                
                // Reset button state in case of error
                const postButton = document.getElementById('postStoryButton');
                if (postButton) {
                    postButton.textContent = 'Post Story';
                    postButton.disabled = false;
                }
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

// Add this function to handle image rotation
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

function toggleMute() {
    const videoPreview = document.getElementById('videoPreview');
    videoPreview.muted = !videoPreview.muted;
    document.getElementById('muteButton').textContent = videoPreview.muted ? 'Unmute' : 'Mute';
}

function trimAndRecordVideo() {
    const videoPreview = document.getElementById('videoPreview');
    const startTime = parseFloat(document.getElementById('startTimeInput').value) || 0;
    const endTime = parseFloat(document.getElementById('endTimeInput').value);
    
    if (!endTime || endTime <= startTime) {
        alert('Please set valid start and end times');
        return;
    }

    if (endTime - startTime > 15) {
        alert('Maximum video duration is 15 seconds. Please adjust your trim points.');
        return;
    }

    if (!originalVideo) {
        originalVideo = videoPreview.src;
    }

    // Set video to start time and play until end time
    videoPreview.currentTime = startTime;
    videoPreview.play();

    const trimDuration = (endTime - startTime) * 1000; // Convert to milliseconds
    
    // Update max time display for the trimmed video
    const maxTime = document.getElementById('maxTime');
    const trimmedDuration = endTime - startTime;
    const minutes = Math.floor(trimmedDuration / 60);
    const seconds = Math.floor(trimmedDuration % 60);
    maxTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Show trim preview
    setTimeout(() => {
        videoPreview.pause();
        document.getElementById('undoTrimButton').style.display = 'block';
        document.getElementById('trimVideoCheckbox').checked = true;
        
        // Add a visual indicator that the video has been trimmed
        const previewContainer = document.getElementById('previewContainer');
        const trimIndicator = document.createElement('div');
        trimIndicator.id = 'trimIndicator';
        trimIndicator.className = 'trim-indicator';
        trimIndicator.innerHTML = `<span>Trimmed: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s</span>`;
        
        // Remove existing indicator if any
        const existingIndicator = document.getElementById('trimIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        previewContainer.appendChild(trimIndicator);
    }, trimDuration);
}

function undoTrimAndRecordVideo() {
    if (originalVideo) {
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.src = originalVideo;
        document.getElementById('startTimeInput').value = '';
        document.getElementById('endTimeInput').value = '';
        document.getElementById('undoTrimButton').style.display = 'none';
        document.getElementById('trimVideoCheckbox').checked = false;
        
        // Reset max time display
        const maxTime = document.getElementById('maxTime');
        const maxDuration = Math.min(videoPreview.duration, 15);
        const minutes = Math.floor(maxDuration / 60);
        const seconds = Math.floor(maxDuration % 60);
        maxTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Remove trim indicator
        const trimIndicator = document.getElementById('trimIndicator');
        if (trimIndicator) {
            trimIndicator.remove();
        }
    }
}

// Add this function to handle the progress bar
function setupVideoProgressBar(videoElement) {
    const progressBar = document.getElementById('videoProgress');
    const currentTimeDisplay = document.getElementById('currentTime');
    
    // Update progress bar as video plays
    videoElement.addEventListener('timeupdate', function() {
        // Calculate percentage based on 15 seconds max
        const maxDuration = Math.min(videoElement.duration, 15);
        const percentage = (videoElement.currentTime / maxDuration) * 100;
        
        // Update progress bar width
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        
        // Update current time display
        const minutes = Math.floor(videoElement.currentTime / 60);
        const seconds = Math.floor(videoElement.currentTime % 60);
        currentTimeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Stop video at 15 seconds if it's longer
        if (videoElement.currentTime >= 15 && videoElement.duration > 15) {
            videoElement.pause();
        }
    });
    
    // Reset progress when video ends
    videoElement.addEventListener('ended', function() {
        progressBar.style.width = '0%';
        currentTimeDisplay.textContent = '0:00';
    });
}

document.body.insertAdjacentHTML('beforeend', storyModalHTML);

export { addStories, handleMediaUpload };
