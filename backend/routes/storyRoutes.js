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

// Get current user's stories
router.get('/stories/mystories', authenticateToken, async (req, res) => {
    try {
        // Find all stories created by the current user
        const stories = await Story.find({
            userId: req.user.id
        }).sort({ createdAt: -1 });
        
        res.json(stories);
    } catch (error) {
        console.error('Error fetching user stories:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this DELETE endpoint for stories
router.delete('/stories/:storyId', authenticateToken, async (req, res) => {
    try {
        const { storyId } = req.params;
        
        // Find the story
        const story = await Story.findById(storyId);
        
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        
        // Check if the user is the owner of the story
        if (story.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this story' });
        }
        
        // Delete the story
        await Story.findByIdAndDelete(storyId);
        
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: error.message });
    }
});

// Make sure to add this before the module.exports line

module.exports = router;