const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Friend = require('../models/friendModel'); // You'll need to create this model
const authenticateToken = require('../middleware/authMiddleware');

// Get user's friends
router.get('/friends', authenticateToken, async (req, res) => {
    try {
        // In a real app, you'd query the friends collection
        // This is just a placeholder that returns dummy data
        
        // Check if Friend model exists, if not return dummy data
        if (!Friend) {
            return res.status(200).json([
                { id: 101, username: 'smiski_fan1', online: true, lastActive: new Date() },
                { id: 102, username: 'collector123', online: false, lastActive: new Date(Date.now() - 30 * 60000) },
                { id: 103, username: 'glow_master', online: true, lastActive: new Date() }
            ]);
        }
        
        // Find friends
        const friends = await Friend.find({
            $or: [
                { requesterId: req.user.id, status: 'accepted' },
                { recipientId: req.user.id, status: 'accepted' }
            ]
        });
        
        // Get friend details
        const friendIds = friends.map(friend => 
            friend.requesterId.toString() === req.user.id.toString() 
                ? friend.recipientId 
                : friend.requesterId
        );
        
        const friendUsers = await User.find({ _id: { $in: friendIds } })
            .select('username profilePicture lastActive online');
        
        res.json(friendUsers);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send friend request
router.post('/friends/request', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        // Don't allow sending request to self
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
        }
        
        // Check if the recipient exists
        const recipient = await User.findById(userId);
        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if Friend model exists, if not return success for demo purposes
        if (!Friend) {
            return res.status(200).json({ message: 'Friend request sent successfully' });
        }
        
        // Check if a request already exists
        const existingRequest = await Friend.findOne({
            $or: [
                { requesterId: req.user.id, recipientId: userId },
                { requesterId: userId, recipientId: req.user.id }
            ]
        });
        
        if (existingRequest) {
            // If request already exists with status 'pending'
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ message: 'Friend request already pending' });
            }
            
            // If they are already friends
            if (existingRequest.status === 'accepted') {
                return res.status(400).json({ message: 'You are already friends with this user' });
            }
            
            // If request was previously declined, update it
            if (existingRequest.status === 'declined') {
                existingRequest.status = 'pending';
                existingRequest.requesterId = req.user.id;
                existingRequest.recipientId = userId;
                await existingRequest.save();
                return res.status(200).json({ message: 'Friend request sent successfully' });
            }
        }
        
        // Create new friend request
        const friendRequest = new Friend({
            requesterId: req.user.id,
            recipientId: userId,
            status: 'pending'
        });
        
        await friendRequest.save();
        
        res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept friend request
router.put('/friends/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Check if Friend model exists, if not return success for demo purposes
        if (!Friend) {
            return res.status(200).json({ message: 'Friend request accepted successfully' });
        }
        
        // Find the friend request
        const friendRequest = await Friend.findById(requestId);
        
        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }
        
        // Ensure the current user is the recipient
        if (friendRequest.recipientId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to accept this request' });
        }
        
        // Accept the request
        friendRequest.status = 'accepted';
        await friendRequest.save();
        
        res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Decline friend request
router.put('/friends/decline/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Check if Friend model exists, if not return success for demo purposes
        if (!Friend) {
            return res.status(200).json({ message: 'Friend request declined successfully' });
        }
        
        // Find the friend request
        const friendRequest = await Friend.findById(requestId);
        
        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }
        
        // Ensure the current user is the recipient
        if (friendRequest.recipientId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to decline this request' });
        }
        
        // Decline the request
        friendRequest.status = 'declined';
        await friendRequest.save();
        
        res.status(200).json({ message: 'Friend request declined successfully' });
    } catch (error) {
        console.error('Error declining friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove friend
router.delete('/friends/:friendId', authenticateToken, async (req, res) => {
    try {
        const { friendId } = req.params;
        
        // Check if Friend model exists, if not return success for demo purposes
        if (!Friend) {
            return res.status(200).json({ message: 'Friend removed successfully' });
        }
        
        // Find and remove the friendship
        await Friend.findOneAndDelete({
            $or: [
                { requesterId: req.user.id, recipientId: friendId, status: 'accepted' },
                { requesterId: friendId, recipientId: req.user.id, status: 'accepted' }
            ]
        });
        
        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
