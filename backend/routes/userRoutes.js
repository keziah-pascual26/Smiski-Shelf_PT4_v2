const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const authenticateToken = require('../middleware/authMiddleware');

// Get current user ID from token
router.get('/users/me', authenticateToken, async (req, res) => {
    try {
        // The authenticateToken middleware already verified the token
        // and attached the user ID to req.user
        
        // Just return the user ID
        res.json({ 
            _id: req.user.id,
            username: req.user.username
        });
    } catch (error) {
        console.error('Error fetching current user ID:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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

// Get user privacy setting by username
router.get('/privacy/:username', authenticateToken, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return only the privacy setting
        res.json({
            isProfilePublic: user.isProfilePublic === true
        });
    } catch (error) {
        console.error('Error fetching user privacy setting:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/user/profile', authenticateToken, async (req, res) => {
    try {
        const { name, username, email, bio, oldUsername } = req.body;
        const userId = req.user._id;

        // Check if username is being changed
        const isUsernameChanged = oldUsername && oldUsername !== username;

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, username, email, bio },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If username is changed, update all posts by this user
        if (isUsernameChanged) {
            // Import Post model at the top of the file
            const Post = require('../models/postModel');
            
            // Update username in all posts by this user
            await Post.updateMany(
                { userId: userId },
                { username: username }
            );
            
            // Also update username in likes and comments
            await Post.updateMany(
                { 'likes.username': oldUsername },
                { $set: { 'likes.$[elem].username': username } },
                { arrayFilters: [{ 'elem.username': oldUsername }] }
            );
            
            await Post.updateMany(
                { 'comments.username': oldUsername },
                { $set: { 'comments.$[elem].username': username } },
                { arrayFilters: [{ 'elem.username': oldUsername }] }
            );
            
            console.log(`Updated username from ${oldUsername} to ${username} in all posts, likes, and comments`);
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
                bio: updatedUser.bio
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile by username
router.get('/users/byUsername/:username', authenticateToken, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username: username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user data without sensitive information
        res.json({
            _id: user._id,
            name: user.name || '',
            username: user.username,
            bio: user.bio || '',
            profilePicture: user.profilePicture || null,
            isProfilePublic: user.isProfilePublic
        });
    } catch (error) {
        console.error('Error fetching user profile by username:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
