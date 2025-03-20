const upload = require('../config/multer');
const Story = require('../models/storyModel');

module.exports = (app) => {
    // ✅ Handle story upload
    app.post('/upload-story', upload.array('media', 5), async (req, res) => {
        try {
            console.log("🔄 Received request to upload story");
            console.log("📦 Request body:", req.body);
            console.log("📸 Uploaded files:", req.files);

            if (!req.body.title || !req.body.description || !req.files || req.files.length === 0) {
                console.error("❌ Missing required fields");
                return res.status(400).json({ error: "Missing required fields" });
            }

            const { title, description } = req.body;
            const mediaFilenames = req.files.map(file => file.filename);

            const newStory = new Story({ title, description, media: mediaFilenames });
            await newStory.save();

            console.log("✅ Story uploaded successfully:", newStory);
            res.status(201).json({ message: "Story uploaded successfully", story: newStory });
        } catch (error) {
            console.error("🚨 Server error while uploading story:", error);
            res.status(500).json({ error: "Failed to upload story", details: error.message });
        }
    });
};
