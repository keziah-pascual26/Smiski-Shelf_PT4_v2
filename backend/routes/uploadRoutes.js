const express = require('express');
const upload = require('../config/multer');
const Story = require('../models/storyModel'); // Updated to use storyModel.js
const router = express.Router();

router.post('/upload', upload.fields([
    { name: 'editedImage', maxCount: 1 },
    { name: 'videoFile', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 },
]), async (req, res) => {
    try {
        const { title, description, username } = req.body; // Include username from the request body

        const newStory = new Story({
            title,
            description,
            username, // Save the username
            imagePath: req.files.editedImage ? `/uploads/${req.files.editedImage[0].filename}` : null,
            videoPath: req.files.videoFile ? `/uploads/${req.files.videoFile[0].filename}` : null,
            audioPath: req.files.audioFile ? `/uploads/${req.files.audioFile[0].filename}` : null,
        });

        await newStory.save();

        res.status(201).json({ message: 'Story saved successfully', story: newStory });
    } catch (error) {
        console.error('Error saving story:', error);
        res.status(500).json({ message: 'Failed to save story' });
    }
});

module.exports = router;