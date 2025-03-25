const express = require('express');
const upload = require('../config/multer');
const User = require('../models/userModel'); // Import the User model
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/profile/picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
    if (!req.file) {
        console.error('❌ No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = `/uploads/${req.file.filename}`;

        // Update the user's profile picture in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePicture: filePath },
            { new: true }
        );

        if (!updatedUser) {
            console.error('❌ User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('✅ File uploaded and user updated:', updatedUser);
        res.json({ profilePicture: filePath });
    } catch (error) {
        console.error('❌ Error updating user profile picture:', error.message);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
});

module.exports = router;