const express = require('express');
const router = express.Router();
const Story = require('../models/storyModel');
const upload = require('../config/multer');
const authenticateToken = require('../middleware/authMiddleware');

// Get stories for logged in user only
router.get('/stories/mystories', authenticateToken, async (req, res) => {
    try {
        // Find stories only for the logged-in user using userId
        const stories = await Story.find({ 
            userId: req.user.id  // Filter by current user's ID
        }).sort({ createdAt: -1 });
        
        console.log(`Found ${stories.length} stories for user ${req.user.username}`);
        res.json(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: error.message });
    }
});

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


module.exports = router;