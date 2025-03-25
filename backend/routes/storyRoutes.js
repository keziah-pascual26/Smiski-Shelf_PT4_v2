const express = require('express');
const router = express.Router();
const storiesController = require('../controllers/storiesController');
const authenticateToken = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const Story = require('../models/storyModel');

// Remove duplicate route - this is causing conflicts
// router.get('/stories/all', authenticateToken, async (req, res) => {
//     try {
//         // Find all non-expired stories
//         const stories = await Story.find({
//             expiresAt: { $gt: new Date() } // Only get stories that haven't expired
//         }).sort({ createdAt: -1 });
//         
//         res.json(stories);
//     } catch (error) {
//         console.error('Error fetching stories:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// Use controller for all routes
router.get('/stories/all', authenticateToken, storiesController.getAllStories);
router.get('/stories/mystories', authenticateToken, storiesController.getUserStories);
router.post('/stories', authenticateToken, upload.single('media'), storiesController.createStory);
router.delete('/stories/:storyId', authenticateToken, storiesController.deleteStory);

// Fix comment routes to be consistent
router.post('/stories/:storyId/comment', authenticateToken, async (req, res) => {
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
router.get('/stories/:storyId/comments', authenticateToken, async (req, res) => {
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