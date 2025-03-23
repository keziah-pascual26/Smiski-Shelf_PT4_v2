const express = require('express');
const router = express.Router();
const Story = require('../models/storyModel');
const upload = require('../config/multer');
const authenticateToken = require('../middleware/authMiddleware');

// Create a new story with image upload
router.post('/stories', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }

        const { title, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Create new story with user information from auth token
        const story = new Story({
            userId: req.user.id, // Changed from _id to id to match the token payload
            username: req.user.username,
            title,
            description,
            media: [req.file.filename]
        });

        await story.save();
        res.status(201).json(story);
    } catch (error) {
        console.error('Error creating story:', error);
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