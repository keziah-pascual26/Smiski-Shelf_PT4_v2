const express = require('express');
const router = express.Router();
const Story = require('../models/storyModel');
const upload = require('../config/multer');
const authenticateToken = require('../middleware/authMiddleware');

// Get all active stories
router.get('/stories/all', authenticateToken, async (req, res) => {
    try {
        // Find all non-expired stories
        const stories = await Story.find({
            expiresAt: { $gt: new Date() } // Only get stories that haven't expired
        }).sort({ createdAt: -1 });
        
        res.json(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new story with media upload
router.post('/stories', authenticateToken, upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Media file is required' });
        }

        const { title, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Create new story
        const story = new Story({
            userId: req.user.id,
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


module.exports = router;