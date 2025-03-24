const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const authenticateToken = require('../middleware/authMiddleware');

// Get user profile
router.get('/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user data without sensitive information
        res.json({
            id: user._id,
            name: user.name || '',
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            profilePicture: user.profilePicture || null,
            twoFactorEnabled: user.twoFactorEnabled || false
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user statistics
router.get('/user/stats', authenticateToken, async (req, res) => {
    try {
        // In a real app, you'd query the database for actual stats
        // This is just a placeholder
        const stats = {
            posts: 0,  // Count from posts collection
            friends: 0, // Count from friends collection
            stories: 0  // Count from stories collection
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get suggested users
router.get('/users/suggestions', authenticateToken, async (req, res) => {
    try {
        // In a real app, you'd implement logic to find users the current user doesn't follow
        // This is just a placeholder returning random users
        
        // Find 5 random users that are not the current user
        const users = await User.find({ _id: { $ne: req.user.id } })
            .limit(5)
            .select('username bio profilePicture');
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching suggested users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (for testing purposes)
router.get('/users/all', authenticateToken, async (req, res) => {
    try {
        // Find all users except the current user
        const users = await User.find({ _id: { $ne: req.user.id } })
            .select('username bio profilePicture')
            .limit(10);
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
    try {
        // Ensure req.body is not undefined
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Request body is missing or empty" });
        }

        const { name, username, email, bio } = req.body;

        console.log("Received data:", { name, username, email, bio }); // Debug log
        console.log("User ID from authMiddleware:", req.user.id); // Debug log

        // Validate required fields
        if (!name || !username || !email || !bio) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Update user details
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { name, username, email, bio },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Updated user:", updatedUser); // Debug log
        res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error during user update:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;