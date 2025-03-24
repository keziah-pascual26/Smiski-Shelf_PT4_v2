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

// Change from '/api/stories/:storyId/comment' to '/stories/:storyId/comment'
// Update the route to match the frontend request
router.post('/api/stories/:storyId/comment', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        const { storyId } = req.params;
        
        if (!text) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        // Find the story by ID
        const story = await Story.findById(storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }

        // Create new comment
        const comment = {
            username: req.user.username,
            text: text,
            createdAt: new Date()
        };

        // Add comment to story's comments array
        story.comments.push(comment);
        await story.save();

        // Return the newly created comment
        res.status(201).json({
            message: 'Comment added successfully',
            comment: story.comments[story.comments.length - 1]
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get story comments
router.get('/api/stories/:storyId/comments', authenticateToken, async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId);
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        res.json(story.comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});


module.exports = router;