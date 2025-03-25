const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Reaction = require('../models/storyreactModel');
const authenticateToken = require('../middleware/authMiddleware');

// Post reaction
router.post('/api/reactions', authenticateToken, async (req, res) => {
    try {
        const { storyId, reactionType } = req.body;

        // Validate inputs
        if (!storyId || !reactionType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Find and update or create reaction
        const result = await Reaction.findOneAndUpdate(
            { 
                storyId: new mongoose.Types.ObjectId(storyId),
                reactionType 
            },
            { $inc: { count: 1 } },
            { 
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        // Get all reaction counts for this story
        const allReactions = await Reaction.find({ 
            storyId: new mongoose.Types.ObjectId(storyId) 
        });

        // Format the response
        const counts = {
            like: 0,
            love: 0,
            haha: 0,
            sad: 0,
            angry: 0
        };

        allReactions.forEach(reaction => {
            counts[reaction.reactionType] = reaction.count;
        });

        res.json(counts);

    } catch (error) {
        console.error('Reaction error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reactions for a story
router.get('/api/reactions/:storyId', authenticateToken, async (req, res) => {
    try {
        const { storyId } = req.params;
        
        const reactions = await Reaction.find({ 
            storyId: new mongoose.Types.ObjectId(storyId) 
        });

        const counts = {
            like: 0,
            love: 0,
            haha: 0,
            sad: 0,
            angry: 0
        };

        reactions.forEach(reaction => {
            counts[reaction.reactionType] = reaction.count;
        });

        res.json(counts);

    } catch (error) {
        console.error('Get reactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;