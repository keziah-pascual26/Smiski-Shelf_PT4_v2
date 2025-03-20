const upload = require('../config/multer');
const Story = require('../models/storyModel');

module.exports = (app) => {
    app.post('/upload-story', upload.array('media', 5), async (req, res) => {
        try {
            const { title, description, username } = req.body;
            const mediaFiles = req.files;

            if (!title || !description || !username || !mediaFiles || mediaFiles.length === 0) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Save the story to the database
            const newStory = new Story({
                username,
                title,
                description,
                media: mediaFiles.map((file) => file.filename), // Save filenames of uploaded media
                createdAt: new Date(),
            });

            await newStory.save();
            res.status(201).json({ message: 'Story uploaded successfully', story: newStory });
        } catch (error) {
            console.error('🚨 Error uploading story:', error);
            res.status(500).json({ error: 'Failed to upload story' });
        }
    });

    // ✅ Fetch all stories
    app.get('/stories', async (req, res) => {
        try {
            const stories = await Story.find().sort({ createdAt: -1 }); // Fetch stories in descending order
            console.log("✅ Stories fetched successfully:", stories);
            res.status(200).json(stories);
        } catch (error) {
            console.error("🚨 Server error while fetching stories:", error);
            res.status(500).json({ error: "Failed to fetch stories", details: error.message });
        }
    });
};