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

export function saveEditedImage() {
    const image = document.getElementById('imagePreview');
    if (image && image.style.display !== 'none') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match the image
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        // Apply the rotation
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate((rotationAngle * Math.PI) / 180);
        context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

        // Convert the canvas to a Blob
        canvas.toBlob((blob) => {
            if (blob) {
                const formData = new FormData();
                formData.append('editedImage', blob, 'edited-image.png');

                fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.filePath) {
                            console.log('Image saved successfully at:', data.filePath);
                        } else {
                            console.error('Failed to save the image.');
                        }
                    })
                    .catch((error) => {
                        console.error('Error uploading the image:', error);
                    });
            }
        }, 'image/png');
    } else {
        console.error('Image element not found or not visible');
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

