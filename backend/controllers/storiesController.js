const Story = require('../models/storyModel');
const { trimVideo } = require('../utils/videoProcessor');
const path = require('path');
const fs = require('fs-extra');

// Get all active stories
exports.getAllStories = async (req, res) => {
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
};

// Create a new story with media upload
exports.createStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Media file is required' });
        }

        const { title, description, isTrimmed } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        let mediaPath = req.file.path;
        let finalMediaPath = req.file.filename;

        // Handle video trimming if needed
        if (isTrimmed === 'true' && req.file.mimetype.startsWith('video/')) {
            try {
                const trimStart = parseFloat(req.body.trimStart) || 0;
                const trimEnd = parseFloat(req.body.trimEnd);
                
                if (!trimEnd || trimEnd <= trimStart) {
                    return res.status(400).json({ error: 'Invalid trim parameters' });
                }
                
                // Create a unique filename for the trimmed video
                const originalExt = path.extname(req.file.originalname);
                const trimmedFilename = `${path.basename(req.file.filename, path.extname(req.file.filename))}_trimmed${originalExt}`;
                const trimmedPath = path.join(path.dirname(req.file.path), trimmedFilename);
                
                // Trim the video
                await trimVideo(mediaPath, trimStart, trimEnd, trimmedPath);
                
                // Update the filename to use the trimmed version
                finalMediaPath = trimmedFilename;
                
                // Log success
                console.log(`Video trimmed successfully: ${finalMediaPath}`);
            } catch (trimError) {
                console.error('Video trimming failed:', trimError);
                return res.status(500).json({ error: 'Video trimming failed', details: trimError.message });
            }
        }

        // Create new story
        const story = new Story({
            userId: req.user.id,
            username: req.user.username,
            title,
            description,
            media: [finalMediaPath]
        });

        

        await story.save();
        res.status(201).json(story);
    } catch (error) {
        console.error('Error creating story:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get user's stories
exports.getUserStories = async (req, res) => {
    try {
        const stories = await Story.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (error) {
        console.error('Error fetching user stories:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a story
exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId);
        
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        
        if (story.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this story' });
        }
        
        await Story.findByIdAndDelete(req.params.storyId);
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add comment to a story
exports.addComment = async (req, res) => {
    try {
        const { comment } = req.body;
        
        if (!comment) {
            return res.status(400).json({ error: 'Comment text is required' });
        }
        
        const story = await Story.findById(req.params.storyId);
        
        if (!story) {
            return res.status(404).json({ error: 'Story not found' });
        }
        
        story.comments.push({
            userId: req.user.id,
            username: req.user.username,
            text: comment
        });
        
        await story.save();
        res.status(201).json(story.comments[story.comments.length - 1]);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: error.message });
    }
};