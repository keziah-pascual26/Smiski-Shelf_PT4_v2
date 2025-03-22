let rotationAngle = 0;

export function initializeImagePreview(mediaInputId, previewContainerId, imagePreviewId, editButtonId) {
    const mediaInput = document.getElementById(mediaInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const imagePreview = document.getElementById(imagePreviewId);
    const editButton = document.getElementById(editButtonId);

    if (mediaInput) {
        mediaInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const fileType = file.type;

            // Reset preview
            imagePreview.style.display = 'none';
            editButton.style.display = 'none';

            if (fileType.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                    imagePreview.src = reader.result;
                    imagePreview.style.display = 'block';
                    editButton.style.display = 'block'; // Show the Edit button
                };
                reader.readAsDataURL(file);
            }

            previewContainer.style.display = 'block';
        });
    }
}

export function rotateImage() {
    const image = document.getElementById('imagePreview'); // Ensure this matches your image element's ID
    if (image && image.style.display !== 'none') {
        rotationAngle = (rotationAngle + 90) % 360; // Increment rotation by 90 degrees
        image.style.transform = `rotate(${rotationAngle}deg)`; // Apply rotation
    } else {
        console.error('Image element not found or not visible');
    }
}

