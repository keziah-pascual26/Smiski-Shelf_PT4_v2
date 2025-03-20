export function initializeMediaPreview(mediaInputId, previewContainerId, imagePreviewId, videoPreviewId, videoSourceId) {
    const mediaInput = document.getElementById(mediaInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const imagePreview = document.getElementById(imagePreviewId);
    const videoPreview = document.getElementById(videoPreviewId);
    const videoSource = document.getElementById(videoSourceId);

    if (mediaInput) {
        mediaInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const fileType = file.type;

            // Reset previews
            imagePreview.style.display = 'none';
            videoPreview.style.display = 'none';

            if (fileType.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    imagePreview.src = reader.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else if (fileType.startsWith('video/')) {
                videoSource.src = URL.createObjectURL(file);
                videoPreview.load();
                videoPreview.style.display = 'block';
            }

            previewContainer.style.display = 'block';
        });
    }
}