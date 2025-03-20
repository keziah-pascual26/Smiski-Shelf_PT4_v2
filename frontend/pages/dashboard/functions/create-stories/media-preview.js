export function initializeMediaPreview(mediaInputId, previewContainerId, imagePreviewId, videoPreviewId, videoSourceId) {
    const mediaInput = document.getElementById(mediaInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const imagePreview = document.getElementById(imagePreviewId);
    const videoPreview = document.getElementById(videoPreviewId);
    const videoSource = document.getElementById(videoSourceId);

    if (mediaInput) {
        mediaInput.addEventListener('change', async (event) => {
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

                // Show the editorSection and imageEditor
                const editorSection = document.getElementById("editorSection");
                const imageEditor = document.getElementById("imageEditor");

                if (editorSection && imageEditor) {
                    editorSection.style.display = "block";
                    imageEditor.style.display = "block";

                    // Attach rotate functionality to the button
                    const rotateButton = document.querySelector('button[onclick="rotateImage()"]');
                    if (rotateButton) {
                        rotateButton.onclick = async () => {
                            const { rotateImage } = await import('./edit-image.js');
                            rotateImage(file);
                        };
                    }
                } else {
                    console.error("Editor section or image editor not found in the DOM.");
                }

            } else if (fileType.startsWith('video/')) {
                videoSource.src = URL.createObjectURL(file);
                videoPreview.load();
                videoPreview.style.display = 'block';

                // Hide the editorSection for videos
                const editorSection = document.getElementById("editorSection");
                if (editorSection) {
                    editorSection.style.display = "none";
                }
            }

            previewContainer.style.display = 'block';
        });
    }
}