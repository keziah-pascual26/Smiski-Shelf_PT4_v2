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
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            profilePicture: user.profilePicture || null,
            twoFactorEnabled: user.twoFactorEnabled || false,
            isProfilePublic: user.isProfilePublic
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
router.put('/user/profile', authenticateToken, async (req, res) => {
    try {
        const { username, bio } = req.body;
        
        // Check if username is being changed and is already taken
        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }
        
        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { 
                username: username || undefined,
                bio: bio || undefined
            },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                bio: updatedUser.bio || ''
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile privacy setting
router.post('/user/privacy', authenticateToken, async (req, res) => {
    try {
        const { isPublic } = req.body;
        
        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: 'Invalid privacy setting' });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.isProfilePublic = isPublic;
        await user.save();
        
        res.json({ 
            message: 'Privacy setting updated successfully',
            isProfilePublic: user.isProfilePublic
        });
    } catch (error) {
        console.error('Error updating privacy setting:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
