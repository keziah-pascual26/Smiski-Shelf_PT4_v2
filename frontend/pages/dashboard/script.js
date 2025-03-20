/*
// Get the button, modal, and overlay elements
const createStoryButton = document.getElementById('createStoryButton');
const createStoryModal = document.getElementById('createStoryModal');
const overlay = document.getElementById('overlay');
const storiesContainer = document.getElementById('storiesContainer');
const storyViewer = document.getElementById('storyViewer');
const storyViewerContent = document.getElementById('storyViewerContent');
const storyViewerTitle = document.getElementById('storyViewerTitle');
const progressBar = document.getElementById('progressBar');

let storyQueue = [];
let currentStoryIndex = 0;
let progressTimeout;
let uploadedFileType = null; // Variable to store the file type
let rotationAngle = 0;
let currentStoryData = null;
let resizeFactor = 1;  // A factor to control resizing


// Function to handle media upload
function handleMediaUpload(event) {
    const file = event.target.files[0];
    const imageEditor = document.getElementById('imageEditor');
    const videoEditor = document.getElementById('videoEditor');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const videoSource = document.getElementById('videoSource');
    const previewContainer = document.getElementById('previewContainer');
    const cropButton = document.getElementById('cropImage');

    // Hide both editors initially
    imageEditor.style.display = 'none';
    videoEditor.style.display = 'none';

    // Hide preview initially
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';

    // Hide editor section initially
    document.getElementById('editorSection').style.display = 'none';
    cropButton.style.display = 'in-line block'; // Hide crop button initially

    if (file) {
        const fileType = file.type;

        // Show the appropriate editor and preview based on file type
        if (fileType.startsWith('image/')) {
            imageEditor.style.display = 'block';
            const reader = new FileReader();
            reader.onload = function () {
                // Set the image preview source
                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';

                 
                // Destroy previous Cropper instance (if exists)
                if (cropper) {
                    cropper.destroy();
                }
                // Disable cropping initially (cropper is not initialized yet)
                cropButton.style.display = 'block'; 

            };
            reader.readAsDataURL(file);
        } else if (fileType.startsWith('video/')) {
            videoEditor.style.display = 'block';
            const reader = new FileReader();
            reader.onload = function () {
                videoSource.src = reader.result;
                videoPreview.style.display = 'block';
                videoPreview.load();
            };
            reader.readAsDataURL(file);
        }
    }

    // Show the preview container once the media is selected
    previewContainer.style.display = 'block';
}



function editStory() {
    const editorSection = document.getElementById('editorSection');
    const editButton = document.querySelector('.edit-button'); 
    const imageEditor = document.getElementById('imageEditor');
    const videoEditor = document.getElementById('videoEditor');
    const mediaInput = document.getElementById('mediaInput'); // Input field for file upload

    // Get the uploaded file (if any)
    const file = mediaInput.files[0];

    // Toggle the editor section
    if (editorSection.style.display === 'block') {
        // Hide everything
        resetEditButton(); // Reset button when hiding editor
    } else {
        // Show editor section
        editorSection.style.display = 'block';
        editButton.textContent = 'Hide Edit Options'; // Update button text

        // Check the file type to show the appropriate editor
        if (file) {
            const fileType = file.type;

            // If the uploaded file is a video, show the video editor
            if (fileType.includes('video')) {
                console.log("Displaying Video Editor");
                videoEditor.style.display = 'block';
                imageEditor.style.display = 'none';
            } 
            // If the uploaded file is an image, show the image editor
            else if (fileType.includes('image')) {
                console.log("Displaying Image Editor");
                imageEditor.style.display = 'block';
                videoEditor.style.display = 'none';
            }
        }
    }
}

// Function to reset the edit button when modal is closed or story is posted
function resetEditButton() {
    const editorSection = document.getElementById('editorSection');
    const editButton = document.querySelector('.edit-button'); 
    const imageEditor = document.getElementById('imageEditor');
    const videoEditor = document.getElementById('videoEditor');

    editorSection.style.display = 'none';
    imageEditor.style.display = 'none';
    videoEditor.style.display = 'none';
    editButton.textContent = 'Edit'; // Reset button text
}




// Placeholder functions for image/video actions (to be implemented later)
function rotateImage() {
    const imagePreview = document.getElementById('imagePreview');
    
    if (!imagePreview) return;

    // Increment rotation angle
    rotationAngle += 90;
    if (rotationAngle >= 360) rotationAngle = 0;  // Reset at full rotation

    // Apply the rotation to the image preview
    imagePreview.style.transform = `rotate(${rotationAngle}deg) scale(${resizeFactor})`;
    imagePreview.style.transition = 'transform 0.5s';  

    // Ensure the global data is updated correctly
    if (currentStoryData) {
        currentStoryData.rotationAngle = rotationAngle;
    }
}


// Function to show the image or video preview
function showPreview(file) {
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const videoSource = document.getElementById('videoSource');

    // Reset previews
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';

    // Ensure preview container follows 9:16 ratio
    previewContainer.style.display = 'block'; 
    previewContainer.style.width = '300px'; // Adjust as needed
    previewContainer.style.height = (300 * 16) / 9 + 'px'; // Maintain 9:16 ratio

    if (file.type.startsWith('image')) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
    } else if (file.type.startsWith('video')) {
        videoSource.src = URL.createObjectURL(file);
        videoPreview.load();
        videoPreview.style.display = 'block';
    }
}



// Max and min resize limits
const MAX_RESIZE = 2; // 200% size
const MIN_RESIZE = 0.5; // 50% size

// Resize function to resize the image
function resizeImage() {
    console.log('Resize image');
    
    const img = document.getElementById('imagePreview');
    
    if (img && img.style.display !== 'none') {
        // Ensure resizeFactor is within the limit
        resizeFactor = Math.min(Math.max(resizeFactor + 0.1, MIN_RESIZE), MAX_RESIZE);
        
        // Apply scale transformation to the image
        img.style.transition = 'transform 0.3s';  // Smooth transition
        img.style.transform = `scale(${resizeFactor})`;
    } else {
        console.log('No image found or image is hidden.');
    }
}

// Minimize Image (Reduce size)
function minimizeImage() {
    const img = document.getElementById('imagePreview');
    
    if (img && img.style.display !== 'none') {
        // Decrease resizeFactor and apply scaling transformation
        resizeFactor = Math.max(resizeFactor - 0.1, MIN_RESIZE);
        img.style.transition = 'transform 0.3s';  // Smooth transition
        img.style.transform = `scale(${resizeFactor})`;
    }
}

// Maximize Image (Increase size)
function maximizeImage() {
    const img = document.getElementById('imagePreview');
    
    if (img && img.style.display !== 'none') {
        // Increase resizeFactor and apply scaling transformation
        resizeFactor = Math.min(resizeFactor + 0.1, MAX_RESIZE);
        img.style.transition = 'transform 0.3s';  // Smooth transition
        img.style.transform = `scale(${resizeFactor})`;
    }
}

let originalVideoUrl = null; // Store the original video URL

// Hide "Undo Trim" button initially
document.getElementById("undoTrimButton").style.display = "none";

async function trimAndRecordVideo() {
    return new Promise(async (resolve, reject) => {
        console.log("Trimming function started...");

        const videoElement = document.getElementById('videoPreview');
        const videoSource = document.getElementById('videoSource');
        const fileInput = document.getElementById("mediaInput");
        const startTimeInput = document.getElementById('startTimeInput');
        const endTimeInput = document.getElementById('endTimeInput');
        const undoTrimButton = document.getElementById("undoTrimButton"); // Get Undo Trim button

        const startTime = parseInt(startTimeInput.value) || 0;
        const endTime = parseInt(endTimeInput.value) || 0;

        console.log(`Start time: ${startTime}, End time: ${endTime}`);

        if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
            console.error("Invalid start or end time.");
            reject('Invalid start or end time.');
            return;
        }

        if (endTime - startTime > 15) {
            console.error("Trim duration cannot exceed 15 seconds.");
            reject('Trim duration cannot exceed 15 seconds.');
            return;
        }

        try {
            console.log("Initializing FFmpeg...");
            const { createFFmpeg } = FFmpeg;
            const ffmpeg = createFFmpeg({ log: true });
            await ffmpeg.load();
            console.log("FFmpeg loaded successfully.");

            let videoData;
            if (fileInput.files.length > 0) {
                console.log("Video file selected from input.");
                const file = fileInput.files[0];
                originalVideoUrl = URL.createObjectURL(file); // Store original video URL
                videoData = new Uint8Array(await file.arrayBuffer());
            } else if (videoElement.src.startsWith("blob:")) {
                console.error("Cannot fetch blob URLs. Please upload a video file.");
                reject("Cannot fetch blob URLs. Please upload a video file.");
                return;
            } else if (videoElement.src) {
                console.log("Fetching video from source URL...");
                const response = await fetch(videoElement.src);
                videoData = new Uint8Array(await response.arrayBuffer());
            } else {
                console.error("No video source found.");
                reject("No video source found.");
                return;
            }

            console.log("Writing video file to FFmpeg filesystem...");
            ffmpeg.FS('writeFile', 'input.mp4', videoData);

            console.log(`Running FFmpeg command: Trimming video from ${startTime} to ${endTime} seconds...`);
            await ffmpeg.run('-i', 'input.mp4', '-ss', startTime.toString(), '-to', endTime.toString(), '-c', 'copy', 'output.mp4');

            console.log("Reading trimmed video file...");
            const data = ffmpeg.FS('readFile', 'output.mp4');

            console.log("Creating Blob URL for trimmed video...");
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const trimmedVideoUrl = URL.createObjectURL(blob);

            console.log("Trimmed video successfully created! Updating preview...");

            // Update the preview with the trimmed video
            videoSource.src = trimmedVideoUrl;
            videoPreview.load();
            videoPreview.style.display = 'block';

            // Show the "Undo Trim" button
            undoTrimButton.style.display = "block";

            resolve(trimmedVideoUrl);
        } catch (error) {
            console.error("Error trimming video:", error.message);
            reject(`Error trimming video: ${error.message}`);
        }
    });
}

// Function to undo the trim and restore the original video
function undoTrimAndRecordVideo() {
    const videoSource = document.getElementById('videoSource');
    const videoPreview = document.getElementById('videoPreview');
    const undoTrimButton = document.getElementById("undoTrimButton");

    if (originalVideoUrl) {
        console.log("Restoring original video...");
        videoSource.src = originalVideoUrl;
        videoPreview.load();
        videoPreview.style.display = 'block';

        // Hide the "Undo Trim" button after restoring
        undoTrimButton.style.display = "none";
    } else {
        console.error("No original video found to restore.");
        alert("No original video found to restore.");
    }
}






// Open Create Story Modal
function openCreateStoryModal() {
    // Show the modal and overlay
    document.getElementById('createStoryModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    
    // Reset the form inputs when opening the modal
    resetModalInputs();
}

// Function to reset modal inputs when opening the modal
function resetModalInputs() {
    document.getElementById('storyTitle').value = '';  
    document.getElementById('mediaInput').value = '';  
    document.getElementById('audioInput').value = '';  

    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('imageEditor').style.display = 'none';
    document.getElementById('videoEditor').style.display = 'none';
    document.getElementById('editorSection').style.display = 'none';
    document.getElementById('rotateImage').style.display = 'none';

    // Reset the rotation of the preview image
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.transform = 'rotate(0deg) scale(1)'; // Reset rotation and scale
    }

    // **RESET rotation and scaling globally**
    rotationAngle = 0;
    resizeFactor = 1;
}

document.addEventListener('DOMContentLoaded', function() {
    // Add click event listener to the "Create Story" button
    document.getElementById('createStoryButtonPlus').addEventListener('click', openCreateStoryModal);
});



// Function to reset modal inputs
function resettingModalInputs() {
    document.getElementById('storyTitle').value = '';
    document.getElementById('storyDescription').value = ''; // Reset the storyDescription field
    document.getElementById('mediaInput').value = '';
    document.getElementById('startTimeInput').value = '';
    document.getElementById('endTimeInput').value = '';
    document.getElementById('cropImage').style.display = 'none';
    document.getElementById('editorSection').style.display = 'none';
}

// Close Create Story Modal
function closeCreateStoryModal() {
    resizeFactor = 1;  // Reset to the default size factor
    createStoryModal.style.display = 'none';
    overlay.style.display = 'none'; // Hide the overlay

    resettingModalInputs(); // Reset the form inputs when closing the modal
    resetEditButton(); // Reset the edit button when closing the modal
}


// Event Listener for opening modal
createStoryButton.addEventListener('click', openCreateStoryModal);

// Close modal when overlay is clicked
overlay.addEventListener('click', closeCreateStoryModal);

// Handle the reaction button click event
document.querySelectorAll('.reaction').forEach(button => {
    button.addEventListener('click', function(event) {
        const reactionType = event.target.getAttribute('data-reaction');
        const storyIndex = currentStoryIndex; // Get current story index

        // If this is the first time reactions are added for this story, initialize them
        if (!reactionCounts[storyIndex]) {
            reactionCounts[storyIndex] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
        }

        // Increment the count for the reaction type
        reactionCounts[storyIndex][reactionType]++;

        // Update the UI with the new counts
        updateReactionCounts(storyIndex);
    });
});

// Function to handle the image preview


async function addStories() {
    console.log('Post story');

    const mediaInput = document.getElementById('mediaInput');
    const storyTitleInput = document.getElementById('storyTitle');
    const storyDescriptionInput = document.getElementById('storyDescription'); // New input for description
    const files = Array.from(mediaInput.files);
    const storyTitle = storyTitleInput.value.trim();
    const storyDescription = storyDescriptionInput.value.trim();

    // Log the title and description for debugging
    console.log('Story Title:', storyTitle);
    console.log('Story Description:', storyDescription);

    // Validate title and description
    if (!storyTitle || !storyDescription) {
        alert('Please enter both a title and a description for your story.');
        return;
    }

    if (files.length === 0) {
        alert('Please select at least one image or video.');
        return;
    }

    const formData = new FormData();
    formData.append("title", storyTitle);
    formData.append("description", storyDescription);
    files.forEach(file => formData.append("media", file));

    try {
        const response = await fetch('http://localhost:3000/upload-story', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to upload story");
        }

        const result = await response.json();
        console.log("Story uploaded successfully:", result);
        alert("Story uploaded successfully!");

        // Optionally refresh the page or update the UI
    } catch (error) {
        console.error("Error uploading story:", error);
        alert("Error uploading story. Please try again.");
    }

    // Ensure cropper is initialized before use
    if (isCroppingEnabled && !cropper) {
        console.log("Re-initializing cropper");
        enableCropping();  // Call to reinitialize cropper
    }

    // Create preview content
    let previewContainer = document.getElementById('storyPreviewContainer');
    previewContainer.innerHTML = '';  // Clear previous content

    let trimmedVideoUrl = null;  // Variable to hold the trimmed video URL

    files.forEach((file) => {
        let previewElement = null;
        let fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

        if (fileType === 'image') {
            previewElement = document.createElement('img');
            previewElement.src = URL.createObjectURL(file); // Initially set to the original file
            previewElement.style.maxWidth = '100%';

                        // If cropping is enabled and we have cropped image data, use that for preview
                        if (croppedImageData) {
                            previewElement.src = croppedImageData;  // Use cropped image for preview
                            console.log("Displaying cropped image in preview");
                        } else {
                            previewElement.src = URL.createObjectURL(file);  // Use original image if no cropping
                        }
            
                        // Apply rotation and resize for preview
                        previewElement.style.transform = `rotate(${rotationAngle}deg) scale(${resizeFactor})`;

                        // If cropping is enabled and we have cropped image data, use that for preview
                        if (croppedImageData) {
                            previewElement.src = croppedImageData;  // Use cropped image for preview
                            console.log("Displaying cropped image in preview");
                        } else {
                            previewElement.src = URL.createObjectURL(file);  // Use original image if no cropping
                        }
            
                        // Apply rotation and resize for preview
                        previewElement.style.transform = `rotate(${rotationAngle}deg) scale(${resizeFactor})`;
        }
        else if (fileType === 'video') {
            previewElement = document.createElement('video');
            previewElement.src = URL.createObjectURL(file); // Set to original video
            previewElement.style.maxWidth = '100%';
            previewElement.controls = true;  // Show controls in preview
    
            // Check if the video needs to be trimmed
            const shouldTrimVideo = document.getElementById('trimVideoCheckbox').checked;
            if (shouldTrimVideo) {
                // Call trimAndRecordVideo function and get the trimmed video URL
                trimAndRecordVideo(0, 15, file).then(trimmedUrl => {
                    trimmedVideoUrl = trimmedUrl;  // Store the trimmed video URL
                    previewElement.src = trimmedVideoUrl;  // Update preview to show trimmed video
                }).catch(error => {
                    console.error('Error trimming video:', error);
                });
            } else {
                // Validate video duration and trim if necessary
                trimmedPreview(file).then(trimmedUrl => {
                    previewElement.src = trimmedUrl;  // Update preview to show trimmed video
                }).catch(error => {
                    console.error('Error trimming video:', error);
                });
            }
        }

        // Append the previewElement if it's valid
        if (previewElement) {
            previewContainer.appendChild(previewElement);
        } else {
            console.warn('Unsupported file type, no preview element created.');
        }
    });

    // Set title and description in the preview modal
    document.getElementById('previewStoryTitle').textContent = storyTitle || "Untitled Story";
    document.getElementById('previewStoryDescription').textContent = storyDescription || "No description provided";

    // Show the confirmation modal
    const confirmationModal = document.getElementById('confirmationModal');
    console.log('Displaying Preview Modal');
    confirmationModal.style.display = 'flex';  // Ensure it displays no matter what

    document.body.classList.add('modal-open'); // Add class to prevent scrolling
    // Show the overlay and confirmation modal
    document.getElementById('overlay').style.display = 'block';



    // Handle "Confirm" button click
    document.getElementById('confirmBtn').onclick = () => {
        // Proceed with uploading the story
        console.log('Confirming the story upload');
        processFilesForUpload(storyTitle, storyDescription, files, trimmedVideoUrl); // Pass the trimmed video URL if available
        closeConfirmationModal();
    };

    // Handle "Cancel" button click
    document.getElementById('cancelBtn').onclick = () => {
        console.log('Cancelling the story upload');
        closeConfirmationModal();
    };
}

async function trimmedPreview(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const videoElement = document.createElement('video');
            videoElement.src = URL.createObjectURL(file);
            videoElement.style.display = 'none';
            document.body.appendChild(videoElement);

            videoElement.onloadedmetadata = async () => {
                if (videoElement.duration > 15) {
                    try {
                        const trimmedUrl = await trimAndRecordVideoPreview(0, 15, file);
                        resolve(trimmedUrl);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve(videoElement.src);
                }
                document.body.removeChild(videoElement);
            };
        } catch (error) {
            reject(error);
        }
    });
}

async function trimAndRecordVideoPreview(startTime, endTime, file) {
    return new Promise(async (resolve, reject) => {
        console.log("Trimming function started...");

        // Validate start and end times
        if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
            console.error("Invalid start or end time.");
            reject('Invalid start or end time.');
            return;
        }

        if (endTime - startTime > 15) {
            console.error("Trim duration cannot exceed 15 seconds.");
            reject('Trim duration cannot exceed 15 seconds.');
            return;
        }

        try {
            console.log("Initializing FFmpeg...");
            const { createFFmpeg } = FFmpeg;
            const ffmpeg = createFFmpeg({ log: true });
            await ffmpeg.load();
            console.log("FFmpeg loaded successfully.");

            const videoData = new Uint8Array(await file.arrayBuffer());

            console.log("Writing video file to FFmpeg filesystem...");
            ffmpeg.FS('writeFile', 'input.mp4', videoData);

            console.log(`Running FFmpeg command: Trimming video from ${startTime} to ${endTime} seconds...`);
            await ffmpeg.run('-i', 'input.mp4', '-ss', startTime.toString(), '-to', endTime.toString(), '-c', 'copy', 'output.mp4');

            console.log("Reading trimmed video file...");
            const data = ffmpeg.FS('readFile', 'output.mp4');

            console.log("Creating Blob URL for trimmed video...");
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const trimmedVideoUrl = URL.createObjectURL(blob);

            console.log("Trimmed video successfully created!");

            resolve(trimmedVideoUrl);
        } catch (error) {
            console.error("Error trimming video:", error.message);
            reject(`Error trimming video: ${error.message}`);
        }
    });
}

// Function to close the confirmation modal
function closeConfirmationModal() {
    const confirmationModal = document.getElementById('confirmationModal');
    confirmationModal.style.display = 'none';  // Close the modal
        document.body.classList.remove('modal-open'); // Remove class to allow scrolling
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('confirmationModal').style.display = 'none';
    
}   


async function processFilesForUpload(storyTitle, storyDescription, files, trimmedVideoUrl) {
    files.forEach(async (file, index) => {
        const storyElement = document.createElement('div');
        storyElement.classList.add('story');
        storyElement.setAttribute('data-index', storyQueue.length);

        let url = trimmedVideoUrl || URL.createObjectURL(file);  // Use trimmed video URL if available
        let fileType = file.type.startsWith('image/') ? 'image' : 'video';

        // Handle video trimming if necessary
        if (fileType === 'video' && !trimmedVideoUrl) {
            try {
                const shouldTrimVideo = document.getElementById('trimVideoCheckbox').checked;

                if (shouldTrimVideo) {
                    url = await trimAndRecordVideo(); // Wait for trimmed video if not already available
                }
            } catch (error) {
                alert('Error trimming video: ' + error);
                return;
            }
        }

        // Prepare story data
        let storyData = {
            src: url,
            type: fileType,
            title: storyTitle,
            description: storyDescription,
            rotation: rotationAngle,
            resizeFactor: resizeFactor,
            audio: audioUrl,
            isMuted: isMuted
        };

        // If an image is being cropped, use the cropped image data
        if (fileType === 'image' && croppedImageData) {
            console.log("Cropping image...");
            storyData.src = croppedImageData;
            croppedImageData = null;
            console.log("Cropped image added to story");
        }

        // Append the image or video to the story element
        if (fileType === 'image') {
            const img = document.createElement('img');
            img.src = storyData.src; // Use the cropped or original image
            img.style.transform = `rotate(${rotationAngle}deg) scale(${resizeFactor})`; 
            storyElement.appendChild(img);
        } else if (fileType === 'video') {
            const video = document.createElement('video');
            video.src = storyData.src;
            video.controls = false;
            video.muted = isMuted;  // Apply the current mute state
            storyElement.appendChild(video);
        } else {
            alert('Unsupported file type.');
            return;
        }

        // Attach audio if available
        if (audioUrl) {
            const audio = document.createElement('audio');
            audio.src = audioUrl;
            audio.controls = false;
            audio.loop = true;
            audio.pause(); // Ensure the audio is not playing automatically
            storyElement.appendChild(audio);

            storyData.audioElement = audio;
        }

        // Add story details to queue
        storyQueue.push(storyData);
        reactionCounts[storyQueue.length - 1] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };

        // Attach click event to view the story
        storyElement.addEventListener('click', () => {
            currentStoryIndex = storyQueue.findIndex(item => item.src === storyData.src);
            showStory(currentStoryIndex);
        });

        storiesContainer.appendChild(storyElement);
    });

    // **RESET rotation and resize after posting**
    rotationAngle = 0;
    resizeFactor = 1;

    // Reset preview image transformation
    const previewImage = document.getElementById('imagePreview');
    if (previewImage) {
        previewImage.style.transform = 'rotate(0deg) scale(1)';
    }

    // Reset form inputs
    const storyTitleInput = document.getElementById('storyTitle');
    const storyDescriptionInput = document.getElementById('storyDescription');
    const mediaInput = document.getElementById('mediaInput');
    
    storyTitleInput.value = '';
    storyDescriptionInput.value = '';  // Reset description input
    mediaInput.value = '';

    createStoryIndicators();
    closeCreateStoryModal();

    // **Reset the audio attached and reset the audio URL**
    audioUrl = null;  
    const audioPreview = document.querySelector('audio');
    if (audioPreview) {
        audioPreview.pause();
        audioPreview.currentTime = 0;
        audioPreview.remove();
    }

    // Clear the audio input field
    const audioInput = document.getElementById('audioInput');
    if (audioInput) {
        audioInput.value = ''; 
    }
    resetEditButton(); // Reset the edit button after posting
}












// Show Story in Viewer


// Reaction Button Click Handler
document.getElementById('storyViewerContent').addEventListener('click', function(event) {
    // Check if the clicked element is a reaction button
    if (event.target.classList.contains('reaction')) {
        const reactionType = event.target.getAttribute('data-reaction');
        
        // Find the story index dynamically from the story viewer
        const storyIndex = currentStoryIndex; // Directly use the currentStoryIndex

        if (!reactionCounts[storyIndex]) {
            // Initialize reaction counts if they don't exist yet
            reactionCounts[storyIndex] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
        }

        // Increment the corresponding reaction count for the current story
        reactionCounts[storyIndex][reactionType]++;

        // Update the displayed reaction counts for the current story
        updateReactionCounts(storyIndex);
    }
});

// Function to update the reaction counts in the UI
function updateReactionCounts(storyIndex) {
    const counts = reactionCounts[storyIndex];

    // Update the reaction counts for the current story
    document.getElementById('likeCount').textContent = counts.like;
    document.getElementById('loveCount').textContent = counts.love;
    document.getElementById('hahaCount').textContent = counts.haha;
    document.getElementById('sadCount').textContent = counts.sad;
    document.getElementById('angryCount').textContent = counts.angry;
}

let isStoryViewed = false; // Flag to check if a story is being viewed

// Initialize reaction counts
let reactionCounts = {}; // Global object to store reaction counts for each story

let currentAudio = null;  // Global variable to track the currently playing audio
let currentVideo = null;  // Global variable to track the currently playing video

function showStory(index) {
    if (index < 0 || index >= storyQueue.length) {
        closeStoryViewer();
        return;
    }

    const story = storyQueue[index];
    storyViewerContent.innerHTML = ''; // Clear previous story content
    storyViewerTitle.textContent = story.title;

    // Create or find the description display
    let descriptionDisplay = document.getElementById('storyDescriptionDisplay');
    if (!descriptionDisplay) {
        descriptionDisplay = document.createElement('div');
        descriptionDisplay.id = 'storyDescriptionDisplay';
        descriptionDisplay.style.marginTop = '10px';
        descriptionDisplay.style.fontStyle = 'italic';
        descriptionDisplay.style.color = '#555';
        storyViewerContent.appendChild(descriptionDisplay);
    }

    // Show or hide description based on availability
    if (story.description) {
        descriptionDisplay.innerHTML = `<p><strong>Caption:</strong> ${story.description}</p>`;
        descriptionDisplay.style.display = 'block';
    } else {
        descriptionDisplay.style.display = 'none';
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.classList.add('close-button');
    closeButton.addEventListener('click', () => {
        stopAudioPlayback();
        closeStoryViewer();
    });
    storyViewerContent.appendChild(closeButton);

    const storyContainer = document.createElement('div');
    storyContainer.classList.add('story-container');

    stopAudioPlayback();

    // Handle image story
    if (story.type === 'image') {
        const img = document.createElement('img');
        img.src = story.src;
        img.style.transform = `rotate(${story.rotation}deg) scale(${story.resizeFactor})`;
        storyContainer.appendChild(img);

        if (story.audioElement) {
            currentAudio = story.audioElement;
            currentAudio.play().catch(error => console.error('Audio playback failed:', error));

            setTimeout(() => {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            }, 5000);
        }

        updateProgressBar(5000, () => showStory(index + 1));

    } else if (story.type === 'video') {
        const video = document.createElement('video');
        video.src = story.src;
        video.autoplay = true;
        video.muted = isMuted;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = 'auto';
        storyContainer.appendChild(video);
    
        // Ensure metadata is loaded to get the correct duration
        video.onloadedmetadata = () => {
            let videoDuration = Math.min(video.duration * 1000, 15000); // Limit to 15s max
    
            // Start and sync audio with the video
            if (story.audioElement) {
                currentAudio = story.audioElement;
                currentAudio.currentTime = 0; // Ensure it starts from the beginning
                currentAudio.play().catch(error => console.error('Audio playback failed:', error));
    
                // Stop audio exactly when the video ends
                setTimeout(() => {
                    if (currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                    }
                }, videoDuration);
            }
    
            // Update progress bar and handle transition to next story
            updateProgressBar(videoDuration, () => {
                stopAudioPlayback();
                video.pause();
                video.currentTime = 0;
                showStory(index + 1);
            });
    
            // Ensure the video and audio stop if they are still playing when the duration ends
            setTimeout(() => {
                if (!video.paused) {
                    stopAudioPlayback();
                    video.pause();
                    video.currentTime = 0;
                    showStory(index + 1);
                }
            }, videoDuration);
        };
    
        currentVideo = video;
    }

    storyViewerContent.appendChild(storyContainer);

    if (!reactionCounts[index]) {
        reactionCounts[index] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
    }

    toggleReactions(true);
    updateReactionCounts(index);
    isStoryViewed = true;
    createStoryIndicators();
    currentStoryIndex = index;
    updateActiveIndicator();
    storyViewer.classList.add('active');

    document.getElementById('previousButton').style.display = index > 0 ? 'block' : 'none';
    document.getElementById('nextButton').style.display = index < storyQueue.length - 1 ? 'block' : 'none';

    // Create comment section container
    const commentSection = document.createElement('div');
    commentSection.classList.add('comment-section');
    commentSection.style.display = 'none'; // Hide the comment section initially

    // Create the comment input field
    const commentInput = document.createElement('input');
    commentInput.type = 'text';
    commentInput.placeholder = 'Write a comment...';
    commentInput.classList.add('comment-input');

    // Create the comment button
    const commentButton = document.createElement('button');
    commentButton.textContent = 'Post';
    commentButton.classList.add('comment-button');

    // Create a div to display comments
    const commentsList = document.createElement('div');
    commentsList.classList.add('comments-list');

    // Store comments per story
    if (!story.comments) {
        story.comments = [];
    }

    // Display existing comments
    function displayComments() {
        commentsList.innerHTML = '';
        story.comments.forEach(comment => {
            const commentItem = document.createElement('p');
            commentItem.textContent = comment;
            commentItem.classList.add('comment-item');
            commentsList.appendChild(commentItem);
        });
    }

    displayComments();

    // Add event listener to post a comment
    commentButton.addEventListener('click', () => {
        const commentText = commentInput.value.trim();
        if (commentText !== '') {
            story.comments.push(commentText);
            commentInput.value = ''; // Clear input field
            displayComments();
        }
    });

    // Append comment input, button, and list to comment section
    commentSection.appendChild(commentsList);
    commentSection.appendChild(commentInput);
    commentSection.appendChild(commentButton);

    // Add the comment section to the story viewer
    storyViewerContent.appendChild(commentSection);

    // Style the comment section beside reactions
    commentSection.style.position = 'absolute';
    commentSection.style.right = '20px';
    commentSection.style.top = '120px';
    commentSection.style.width = '250px';
    commentSection.style.padding = '10px';
    commentSection.style.border = '1px solid #ccc';
    commentSection.style.background = '#fff';
    commentSection.style.borderRadius = '10px';
    commentSection.style.boxShadow = '0px 0px 5px rgba(0,0,0,0.2)';

    commentsList.style.maxHeight = '200px';
    commentsList.style.overflowY = 'auto';

    commentInput.style.width = 'calc(100% - 20px)';
    commentInput.style.marginBottom = '5px';
    commentInput.style.padding = '5px'; // Add padding to the input box for better spacing

    commentButton.style.width = '100%';
    commentButton.style.cursor = 'pointer';
    commentButton.style.padding = '5px'; // Add padding to the button for better spacing

    // Change the button background color and text color
    commentButton.style.backgroundColor = '#4CAF50'; // Green background color
    commentButton.style.color = 'white'; // White text color
    commentButton.style.border = 'none'; // Remove default border
    commentButton.style.borderRadius = '5px'; // Round the corners
    commentButton.style.fontSize = '16px'; // Set a font size for the text

    // Function to stop any playing audio or video when the story viewer is closed or changed
    function stopAudioPlayback() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        if (currentVideo) {
            currentVideo.pause();
            currentVideo.currentTime = 0;
        }
    }

    // Create the toggle button for showing/hiding the comment section
    const toggleCommentsButton = document.createElement('button');
    toggleCommentsButton.classList.add('toggle-comments-button');
    toggleCommentsButton.innerHTML = '<img src="comment.png" alt="Toggle Comments" style="width: 24px; height: 24px;">';

    // Add event listener to toggle comment visibility
    toggleCommentsButton.addEventListener('click', () => {
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    });

    // Position the button
    toggleCommentsButton.style.position = 'absolute';
    toggleCommentsButton.style.right = '20px';
    toggleCommentsButton.style.top = '60px';
    toggleCommentsButton.style.background = 'none';
    toggleCommentsButton.style.border = 'none';
    toggleCommentsButton.style.cursor = 'pointer';

    // Append the toggle button to the story viewer
    storyViewerContent.appendChild(toggleCommentsButton);
}













// Close Story Viewer
function closeStoryViewer() {
    clearTimeout(progressTimeout);
    storyViewer.classList.remove('active');
    storyViewerContent.innerHTML = '';
    // Disable reactions when no story is being viewed
    toggleReactions(false);
    isStoryViewed = false;
}

let progressPaused = false;
let remainingTime = 0;
let progressStartTime = 0;


function updateProgressBar(duration, callback) {
    if (!progressBar) return;

    clearTimeout(progressTimeout);
    progressBar.style.width = '0%';
    progressBar.style.transition = 'none';

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

function pauseProgressBar() {
    if (!progressBar || progressPaused) return;

    const elapsedTime = Date.now() - progressStartTime;
    remainingTime -= elapsedTime;

    progressBar.style.transition = 'none';
    const currentPercentage = (elapsedTime / (elapsedTime + remainingTime)) * 100;
    progressBar.style.width = `${currentPercentage}%`;

    progressPaused = true;
    clearTimeout(progressTimeout);
}

function resumeProgressBar() {
    if (!progressBar || !progressPaused) return;

    progressBar.style.transition = `width ${remainingTime}ms linear`;
    progressBar.style.width = '100%';

    progressStartTime = Date.now();
    progressTimeout = setTimeout(() => {
        progressPaused = false;
        showStory(currentStoryIndex + 1);
    }, remainingTime);

    progressPaused = false;
}

// Story number indicators
let stories = [];

// This function will create story indicators based on the number of stories
function createStoryIndicators() {
    const indicatorsContainer = document.getElementById('story-indicators');
    indicatorsContainer.innerHTML = '';

    storyQueue.forEach((story, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('story-indicator');
        indicator.classList.add(index === 0 ? 'active' : 'inactive');
        indicatorsContainer.appendChild(indicator);
    });
}

// This function will be called to update the active indicator as the story changes
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

document.getElementById('previousButton').addEventListener('click', () => {
    showStory(currentStoryIndex - 1);
});

document.getElementById('nextButton').addEventListener('click', () => {
    showStory(currentStoryIndex + 1);
});

// Toggle visibility of the reaction buttons
function toggleReactions(visible) {
    const reactionsPanel = document.getElementById('reactionPanel');
    reactionsPanel.style.display = visible ? 'block' : 'none';
}

// Show/Hide Reaction Counts when "More" is clicked
document.getElementById('moreReactionsButton').addEventListener('click', function() {
    const reactionCountsDiv = document.getElementById('reactionCounts');
    
    // Toggle visibility of reaction counts
    if (reactionCountsDiv.style.display === 'none') {
        reactionCountsDiv.style.display = 'block'; // Show counts
        this.textContent = 'Less'; // Change button text to "Less"
    } else {
        reactionCountsDiv.style.display = 'none'; // Hide counts
        this.textContent = 'More'; // Change button text to "More"
    }
});

// Reaction Button Click Handler (Updated)
document.getElementById('storyViewerContent').addEventListener('click', function(event) {
    // Check if the clicked element is a reaction button
    if (event.target.classList.contains('reaction')) {
        const reactionType = event.target.getAttribute('data-reaction');
        const storyElement = event.target.closest('.story');
        const storyIndex = parseInt(storyElement.getAttribute('data-index'), 10); // Ensure correct index is used

        // Increment the corresponding reaction count for the current story
        if (!reactionCounts[storyIndex]) {
            // If reaction data doesn't exist yet, initialize it
            reactionCounts[storyIndex] = { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };
        }
        reactionCounts[storyIndex][reactionType]++;

        // Update the displayed reaction counts
        updateReactionCounts(storyIndex);
    }
});

// Update the displayed reaction counts for the current story
function updateReactionCounts(storyIndex) {
    const counts = reactionCounts[storyIndex] || { like: 0, love: 0, haha: 0, sad: 0, angry: 0 };

    // Update the HTML elements for each reaction type
    document.getElementById('likeCount').textContent = counts.like;
    document.getElementById('loveCount').textContent = counts.love;
    document.getElementById('hahaCount').textContent = counts.haha;
    document.getElementById('sadCount').textContent = counts.sad;
    document.getElementById('angryCount').textContent = counts.angry;
}


document.getElementById('audioInput').addEventListener('change', handleAudioUpload);

function handleAudioUpload(event) {
    const audioInput = event.target;
    const audioPreview = document.getElementById('audioPreview');

    // Check if a file is selected
    if (audioInput.files && audioInput.files[0]) {
        const file = audioInput.files[0];

        // Check if the file is an audio file (optional additional validation)
        if (file.type.startsWith('audio/')) {
            // Create a URL for the selected file
            const audioUrl = URL.createObjectURL(file);

            // Set the audio source to the file URL
            audioPreview.src = audioUrl;
            
            // Show the audio player
            audioPreview.style.display = 'block';
        } else {
            alert('Please upload a valid audio file (mp3, wav, etc.).');
        }
    } else {
        // Hide the audio player if no file is selected
        audioPreview.style.display = 'none';
    }
}

document.getElementById('audioInput').addEventListener('change', handleAudioUpload);

let audioUrl = null;

function handleAudioUpload(event) {
    const audioInput = event.target;
    const audioPreview = document.getElementById('audioPreview');

    // Check if a file is selected
    if (audioInput.files && audioInput.files[0]) {
        const file = audioInput.files[0];

        // Check if the file is an audio file
        if (file.type.startsWith('audio/')) {
            // Create a URL for the selected file
            audioUrl = URL.createObjectURL(file);

            // Set the audio source to the file URL
            audioPreview.src = audioUrl;

            // Show the audio player
            audioPreview.style.display = 'block';
        } else {
            alert('Please upload a valid audio file (mp3, wav, etc.).');
        }
    } else {
        // Hide the audio player if no file is selected
        audioPreview.style.display = 'none';
    }
}

// Global variable to track mute state
let isMuted = false;

function toggleMute() {
    const muteButton = document.getElementById('muteButton');

    // Toggle the mute state globally
    isMuted = !isMuted;

    // Update the preview video (if exists)
    const previewVideo = document.getElementById('videoPreview');
    if (previewVideo) {
        previewVideo.muted = isMuted;
    }

    // Update all videos inside stories
    document.querySelectorAll('video').forEach(video => {
        video.muted = isMuted;
    });

    // Update button text based on mute state
    muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
}

document.addEventListener('keydown', function(event) {
    if (!isStoryViewed) return;  // Prevent actions if story is not viewed

    switch(event.key) {
        // Handle Right Arrow key - Show next story
        case 'ArrowRight':
            if (currentStoryIndex < storyQueue.length - 1) showStory(currentStoryIndex + 1);
            break;
        
        // Handle Left Arrow key - Show previous story
        case 'ArrowLeft':
            if (currentStoryIndex > 0) showStory(currentStoryIndex - 1);
            break;
        
        // Handle Spacebar - Play/Pause video
        case ' ':
            case 'Spacebar':
            event.preventDefault();
            const video = document.querySelector('#storyViewerContent video');

            if (video) {
                if (video.paused) {
                    video.play();
                    resumeProgressBar();
                } else {
                    video.pause();
                    pauseProgressBar();
                }
            } else {
                // If it's an image, just toggle the progress bar
                if (progressPaused) {
                    resumeProgressBar();
                } else {
                    pauseProgressBar();
                }
            }
            break;
        
        // Handle Enter key - View the current story
        case 'Enter':
            showStory(currentStoryIndex);
            break;

        // Handle Home key - Jump to the first story
        case 'Home':
            showStory(0);
            break;

        // Handle End key - Jump to the last story
        case 'End':
            showStory(storyQueue.length - 1);
            break;

        // Handle PageDown key - Show the next 5 stories
        case 'PageDown':
            showStory(currentStoryIndex + 5);
            break;

        // Handle PageUp key - Show the previous 5 stories
        case 'PageUp':
            showStory(currentStoryIndex - 5);
            break;

        // Handle F1 key - Show help message
        case 'F1':
            alert('Help: Use arrow keys to navigate, Enter to view a story.');
            break;

        // Handle M key - Mute/Unmute video
        case 'm':
            case 'M':
                const videoMute = document.querySelector('#storyViewerContent video');
                if (videoMute) {
                    // Toggle mute
                    videoMute.muted = !videoMute.muted;
                }
                break;

        // Handle Escape key (ESC) - Close story viewer
        case 'Escape':
            closeStoryViewer();
            break;
    }
});

function updateCharCount() {
        let textArea = document.getElementById("storyDescription");
        let charCount = document.getElementById("charCount");
        let remaining = 100 - textArea.value.length;
        charCount.textContent = remaining + " characters remaining";
    }

/*
// Function to save the story with the description
function saveStory() {
    const title = document.getElementById('storyTitle').value.trim();

    if (!title) {
        alert('Please fill in the title!');
        return;
    }

    console.log('Title:', title);

    const story = {
        title: title,
        media: []
    };

    alert('Story saved successfully!');
    closeCreateStoryModal();
}

*/


/*
document.addEventListener('DOMContentLoaded', function() {
    const title = document.getElementById('storyTitle').value.trim();
    console.log('Title:', title);  // Check the value when the DOM is ready
});

let isCroppingEnabled = false;  // Tracks whether cropping is enabled or not
let cropper = null; // Declare the cropper variable globally

// Function to enable cropping and initialize the Cropper.js instance
function enableCropping() {
    const imagePreview = document.getElementById('imagePreview');
    const cropButton = document.getElementById('cropImage');

    // Check if the image preview exists and isn't already cropped
    if (imagePreview && !cropper) {
        // Wait for the image to load if it's not already loaded
        if (imagePreview.complete) {
            // Image is already loaded, initialize cropper immediately
            initializeCropper(imagePreview);
        } else {
            // Image is still loading, wait for it to load first
            imagePreview.onload = () => {
                initializeCropper(imagePreview);
            };
        }
    }

    // Toggle crop button text based on cropping state
    cropButton.textContent = isCroppingEnabled ? 'Enable Cropping' : 'Done Cropping';
    isCroppingEnabled = !isCroppingEnabled;  // Toggle the cropping state
}

// Function to initialize the cropper
function initializeCropper(imagePreview) {
    if (cropper) {
        // Destroy the previous cropper instance before initializing a new one
        cropper.destroy();
    }

    // Initialize the new cropper for the new image
    cropper = new Cropper(imagePreview, {
        aspectRatio: NaN, // Allow free cropping (no fixed aspect ratio)
        viewMode: 2, // Limits cropping area
        autoCropArea: 0.8, // Starts with 80% of image area
        movable: true, // Allows image movement
        zoomable: true, // Allows zooming in and out
        rotatable: true, // Allows image rotation
        scalable: true // Allows scaling of the image
    });


    // Log the initialization process to the console
    console.log("Cropper Initialized");

    // Ensure crop button is visible and not hidden
    document.getElementById('cropImage').style.display = 'inline-block'; // Make sure it's visible
}


let croppedImageData = null;  // Global variable to hold the cropped image data

function finalizeCropping() {
    console.log("finalizeCropping()");

    const imagePreview = document.getElementById('imagePreview');
    const cropButton = document.getElementById('cropImage');

    if (isCroppingEnabled && cropper) {
        // Get cropped image and update the preview
        const canvas = cropper.getCroppedCanvas();
        if (canvas) {
            croppedImageData = canvas.toDataURL();  // Store cropped image in the global variable
            imagePreview.src = croppedImageData;  // Update the preview image with the cropped version
            cropper.destroy();  // Destroy cropper after cropping
            cropper = null;  // Reset cropper instance
        }
    }

    // Change the button text and disable cropping functionality
    cropButton.textContent = 'Enable Cropping';  // Set text back to "Enable Cropping"
    isCroppingEnabled = false;  // Disable cropping
}


// Attach event listener to the "Crop Image" button
document.getElementById('cropImage').addEventListener('click', () => {
    if (isCroppingEnabled) {
        finalizeCropping();  // Finalize cropping and reset state when "Done Cropping" is clicked
    } else {
        enableCropping();  // Enable cropping and show cropper
        
    }
});

// Function to reset cropping state when a new story/image is uploaded
function resetCroppingState() {
    console.log("resetCroppingState()")
    // Reset the button text to "Enable Cropping"
    document.getElementById('cropImage').textContent = 'Enable Cropping';
    isCroppingEnabled = false; // Ensure cropping is disabled initially
    if (cropper) {
        cropper.destroy();  // Destroy the cropper instance if it's active
        cropper = null;  // Reset cropper instance
    }
}

// Post Template (Dynamically Added)
function submitPost() {
    const caption = document.getElementById('postCaption').value;
    const mediaInput = document.getElementById('postImage');
    const mediaFile = mediaInput.files[0];

    if (!caption && !mediaFile) {
        alert("Please add a caption or a media file!");
        return;
    }

    const postContainer = document.createElement('div');
    postContainer.classList.add('user-post');

    if (mediaFile) {
        const mediaType = mediaFile.type.split('/')[0]; // "image" or "video"
        if (mediaType === 'image') {
            const image = document.createElement('img');
            image.src = URL.createObjectURL(mediaFile);
            image.classList.add('post-media');
            postContainer.appendChild(image);
        } else if (mediaType === 'video') {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(mediaFile);
            video.classList.add('post-media');
            video.controls = true;
            postContainer.appendChild(video);
        } else {
            alert("Unsupported file format. Please upload an image or video.");
            return;
        }
    }

    if (caption) {
        const captionElement = document.createElement('p');
        captionElement.textContent = caption;
        postContainer.appendChild(captionElement);
    }

    // Reactions - Fixed Event Listeners!
    const reactions = document.createElement('div');
    reactions.classList.add('post-reactions');
    reactions.innerHTML = `
        <button class="reaction-btn" data-type="like">👍</button>
        <button class="reaction-btn" data-type="love">❤️</button>
        <button class="reaction-btn" data-type="haha">😂</button>
        <button class="reaction-btn" data-type="sad">😢</button>
        <button class="reaction-btn" data-type="angry">😡</button>
        <button class="share-btn">📤 Share</button>
    `;
    postContainer.appendChild(reactions);

    // Comments Section
    const commentSection = document.createElement('div');
    commentSection.classList.add('post-comments');
    commentSection.innerHTML = `
        <input type="text" placeholder="Write a comment..." class="comment-input">
        <button class="comment-btn">Comment</button>
        <div class="comment-list"></div>
    `;
    postContainer.appendChild(commentSection);

    document.getElementById('userPosts').prepend(postContainer);
    document.getElementById('postCaption').value = '';
    mediaInput.value = '';

    // Add event listeners to the new post
    postContainer.querySelectorAll('.reaction-btn').forEach(button => {
        button.addEventListener('click', () => react(button));
    });

    postContainer.querySelector('.share-btn').addEventListener('click', () => sharePost());
    postContainer.querySelector('.comment-btn').addEventListener('click', function () {
        addComment(this);
    });
}

// Reactions function (now works!)
function react(button) {
    const reactionType = button.getAttribute('data-type');
    alert(`You reacted with ${reactionType}!`);
}

// Add a comment
function addComment(button) {
    const input = button.previousElementSibling;
    if (!input.value) return;

    const comment = document.createElement('p');
    comment.textContent = input.value;
    button.nextElementSibling.appendChild(comment);
    input.value = '';
}

// Share function
function sharePost() {
    alert("Post shared!");
}


function startChat(userName) {
    document.getElementById('chatUserName').innerText = userName;
    document.getElementById('chatPanel').style.display = 'block';
}

function closeChat() {
    document.getElementById('chatPanel').style.display = 'none';
}

function sendMessage() {
    const message = document.getElementById('chatInput').value;
    if (message.trim() !== '') {
        const chatBox = document.getElementById('chatMessages');
        const newMessage = document.createElement('div');
        newMessage.textContent = message;
        chatBox.appendChild(newMessage);
        document.getElementById('chatInput').value = '';
    }
}
    */