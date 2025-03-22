export function initializeVideoPreview(mediaInputId, previewContainerId, videoPreviewId, videoSourceId, editButtonId) {
    const mediaInput = document.getElementById(mediaInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const videoPreview = document.getElementById(videoPreviewId);
    const videoSource = document.getElementById(videoSourceId);
    const editButton = document.getElementById(editButtonId);

    if (mediaInput) {
        mediaInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const fileType = file.type;

            // Reset video preview and hide the edit button
            videoPreview.style.display = 'none';
            if (editButton) {
                editButton.style.display = 'none';
            }

            if (fileType.startsWith('video/')) {
                videoSource.src = URL.createObjectURL(file);
                videoPreview.load();
                videoPreview.style.display = 'block';

                // Show the edit button for video
                if (editButton) {
                    editButton.style.display = 'block';
                }
            }

            previewContainer.style.display = 'block';
        });
    }
}