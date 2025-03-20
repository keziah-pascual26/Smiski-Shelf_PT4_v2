let currentRotation = 0; // Track the current rotation state

export async function rotateImage(file, degrees = 90) {
    try {
        // Create an image element to load the file
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Update the current rotation state
            currentRotation = (currentRotation + degrees) % 360;

            // Set canvas dimensions based on rotation
            if (currentRotation === 90 || currentRotation === 270) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }

            // Translate and rotate the canvas
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((currentRotation * Math.PI) / 180);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            // Convert the canvas to a data URL
            const rotatedImageURL = canvas.toDataURL('image/png');

            // Update the image preview with the rotated image
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) {
                imagePreview.src = rotatedImageURL;
            }

            console.log(`✅ Image rotated to ${currentRotation} degrees!`);
        };

        img.onerror = () => {
            console.error('🚨 Error loading image for rotation.');
        };
    } catch (error) {
        console.error('🚨 Error rotating image:', error);
    }
}