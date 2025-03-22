const express = require('express');
const router = express.Router();
const Story = require('../models/storyModel');
const upload = require('../config/multer');
const authenticateToken = require('../middleware/authMiddleware');

// Create a new story with image upload
router.post('/stories', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const story = new Story({
            userId: req.user._id,
            title,
            description,
            media: req.file ? [req.file.filename] : []
        });
        await story.save();
        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all stories for the logged-in user
router.get('/stories/mystories', authenticateToken, async (req, res) => {
    try {
        const stories = await Story.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;