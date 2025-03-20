import { initializeMediaPreview } from './media-preview.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize media preview
    initializeMediaPreview('mediaUploadInput', 'previewContainer', 'imagePreview', 'videoPreview', 'videoSource');
});

export async function addStories() {
    try {
        // Get the input elements
        const titleInput = document.getElementById('storyTitle');
        const descriptionInput = document.getElementById('storyDescription');
        const mediaInput = document.getElementById('mediaUploadInput');
        const canvas = document.querySelector('canvas'); // Assuming the edited image is in a canvas

        // Validate inputs
        if (!titleInput || !descriptionInput || !mediaInput) {
            alert('One or more input elements are missing.');
            return;
        }

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const files = mediaInput.files;

        if (!title) {
            alert('Please enter a story title.');
            return;
        }

        if (!description) {
            alert('Please enter a story description.');
            return;
        }

        if (!files || files.length === 0) {
            alert('Please select at least one media file to upload.');
            return;
        }

        // Prepare the form data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('username', localStorage.getItem('username')); // Assuming username is stored in localStorage

        // Check if the canvas exists and has an edited image
        if (canvas) {
            // Convert the canvas content to a Blob
            await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        formData.append('media', blob, 'edited-image.png'); // Add the edited image to the form data
                    }
                    resolve();
                }, 'image/png');
            });
        } else {
            // If no canvas, upload the original files
            for (const file of files) {
                formData.append('media', file);
            }
        }

        // Upload the story to the backend
        const response = await fetch('http://localhost:3000/upload-story', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload story');
        }

        const result = await response.json();
        console.log('✅ Story uploaded successfully:', result);

        // Optionally, refresh the story viewer
        fetchStories();

        // Clear the inputs after successful upload
        titleInput.value = '';
        descriptionInput.value = '';
        mediaInput.value = '';
        alert('Story uploaded successfully!');
    } catch (error) {
        console.error('🚨 Error adding story:', error);
        alert('Failed to add story. Please try again.');
    }
}

// Attach addStories to the global window object
window.addStories = addStories;

async function fetchStories() {
    try {
        const response = await fetch('http://localhost:3000/stories');
        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }

        const stories = await response.json();
        const storyViewerContent = document.getElementById('storyViewerContent');
        storyViewerContent.innerHTML = ''; // Clear existing stories

        stories.forEach((story) => {
            const storyElement = document.createElement('div');
            storyElement.classList.add('story');

            if (story.media.endsWith('.mp4') || story.media.endsWith('.webm')) {
                storyElement.innerHTML = `
                    <video controls>
                        <source src="/uploads/${story.media}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
            } else {
                storyElement.innerHTML = `<img src="/uploads/${story.media}" alt="Story Image">`;
            }

            storyViewerContent.appendChild(storyElement);
        });
    } catch (error) {
        console.error('🚨 Error fetching stories:', error);
    }
}