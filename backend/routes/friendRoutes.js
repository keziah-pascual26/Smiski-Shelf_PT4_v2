const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Friend = require('../models/friendModel');
const authenticateToken = require('../middleware/authMiddleware');

// Get user's friends
router.get('/friends', authenticateToken, async (req, res) => {
    try {
        // Find friends where the current user is either the requester or recipient
        // and the status is 'accepted'
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

// Check if current user is friends with another user
router.get('/isfriend/:userId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;
        
        // Check if there's a friendship record where both users are involved
        // and the status is 'accepted'
        const friendship = await Friend.findOne({
            $or: [
                { requesterId: currentUserId, recipientId: targetUserId, status: 'accepted' },
                { requesterId: targetUserId, recipientId: currentUserId, status: 'accepted' }
            ]
        });
        
        // Return true if friendship exists, false otherwise
        res.json({ 
            isFriend: !!friendship,
            friendshipId: friendship ? friendship._id : null
        });
    } catch (error) {
        console.error('Error checking friendship status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get friend requests (pending requests sent to the user)
router.get('/friends/requests', authenticateToken, async (req, res) => {
    try {
        // Find pending friend requests where the current user is the recipient
        const requests = await Friend.find({
            recipientId: req.user.id,
            status: 'pending'
        });
        
        // Get requester details
        const requesterIds = requests.map(request => request.requesterId);
        
        const requesters = await User.find({ _id: { $in: requesterIds } })
            .select('username profilePicture');
        
        // Format the response to include request IDs
        const formattedRequests = requests.map(request => {
            const requester = requesters.find(user => 
                user._id.toString() === request.requesterId.toString()
            );
            
            return {
                requestId: request._id,
                user: requester
            };
        });
        
        res.json(formattedRequests);
    } catch (error) {
        console.error('Error fetching friend requests:', error);
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
                existingRequest.requesterUsername = req.user.username;
                existingRequest.recipientUsername = recipient.username;
                existingRequest.updatedAt = Date.now();
                await existingRequest.save();
                return res.status(200).json({ message: 'Friend request sent successfully' });
            }
        }
        
        // Create new friend request
        const friendRequest = new Friend({
            requesterId: req.user.id,
            recipientId: userId,
            requesterUsername: req.user.username,
            recipientUsername: recipient.username,
            status: 'pending'
        });
        
        await friendRequest.save();
        
        res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get friend status for multiple users
router.get('/friends/status', authenticateToken, async (req, res) => {
    try {
        // Find all friendships involving the current user
        const friendships = await Friend.find({
            $or: [
                { requesterId: req.user.id },
                { recipientId: req.user.id }
            ]
        });
        
        // Create a map of user IDs to friendship status
        const statusMap = {};
        
        friendships.forEach(friendship => {
            const otherUserId = friendship.requesterId.toString() === req.user.id.toString() 
                ? friendship.recipientId.toString() 
                : friendship.requesterId.toString();
            
            statusMap[otherUserId] = friendship.status;
        });
        
        res.json(statusMap);
    } catch (error) {
        console.error('Error fetching friend status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel friend request
router.delete('/friends/cancel/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find and delete the pending friend request
        const result = await Friend.findOneAndDelete({
            requesterId: req.user.id,
            recipientId: userId,
            status: 'pending'
        });
        
        if (!result) {
            return res.status(404).json({ message: 'Friend request not found' });
        }
        
        res.status(200).json({ message: 'Friend request canceled successfully' });
    } catch (error) {
        console.error('Error canceling friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept friend request
router.put('/friends/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
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
        friendRequest.updatedAt = Date.now();
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
        friendRequest.updatedAt = Date.now();
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
        
        // Find and remove the friendship
        const result = await Friend.findOneAndDelete({
            $or: [
                { requesterId: req.user.id, recipientId: friendId, status: 'accepted' },
                { requesterId: friendId, recipientId: req.user.id, status: 'accepted' }
            ]
        });
        
        if (!result) {
            return res.status(404).json({ message: 'Friendship not found' });
        }
        
        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get suggested users (users who are not friends)
router.get('/users/suggestions', authenticateToken, async (req, res) => {
    try {
        // Find all friendships involving the current user
        const friendships = await Friend.find({
            $or: [
                { requesterId: req.user.id },
                { recipientId: req.user.id }
            ]
        });
        
        // Extract IDs of users who are already friends or have pending requests
        const connectedUserIds = friendships.map(friendship => 
            friendship.requesterId.toString() === req.user.id.toString() 
                ? friendship.recipientId.toString() 
                : friendship.requesterId.toString()
        );
        
        // Add current user's ID to exclude from suggestions
        connectedUserIds.push(req.user.id.toString());
        
        // Find users who are not connected to the current user
        const suggestedUsers = await User.find({
            _id: { $nin: connectedUserIds }
        })
        .select('username bio profilePicture')
        .limit(10);
        
        res.json(suggestedUsers);
    } catch (error) {
        console.error('Error fetching suggested users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unfriend a user by username
router.delete('/friends/unfriend-by-username/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user.id;
        
        // First, find the user by username
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find and remove the friendship record (check both directions)
        const result = await Friend.deleteOne({
            $or: [
                { requesterId: currentUserId, recipientId: user._id, status: 'accepted' },
                { requesterId: user._id, recipientId: currentUserId, status: 'accepted' }
            ]
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Friendship not found' });
        }
        
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error in unfriend by username:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept friend request
router.put('/friends/accept/:requestId', authenticateToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the friend request
        const friendRequest = await Friend.findById(requestId);
        
        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }
        
        // Check if the current user is the recipient of the request
        if (friendRequest.recipientId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized to accept this request' });
        }
        
        // Update the friend request status to 'accepted'
        friendRequest.status = 'accepted';
        await friendRequest.save();
        
        // Update both users' friends arrays
        await User.findByIdAndUpdate(
            friendRequest.requesterId,
            { $addToSet: { friends: friendRequest.recipientId } }
        );
        
        await User.findByIdAndUpdate(
            friendRequest.recipientId,
            { $addToSet: { friends: friendRequest.requesterId } }
        );
        
        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unfriend a user
router.delete('/friends/unfriend-by-username/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Find the user to unfriend
        const userToUnfriend = await User.findOne({ username });
        
        if (!userToUnfriend) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Find the friendship record
        const friendship = await Friend.findOne({
            $or: [
                { requesterId: req.user.id, recipientId: userToUnfriend._id, status: 'accepted' },
                { requesterId: userToUnfriend._id, recipientId: req.user.id, status: 'accepted' }
            ]
        });
        
        if (!friendship) {
            return res.status(404).json({ message: 'Friendship not found' });
        }
        
        // Remove from both users' friends arrays
        await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { friends: userToUnfriend._id } }
        );
        
        await User.findByIdAndUpdate(
            userToUnfriend._id,
            { $pull: { friends: req.user.id } }
        );
        
        // Delete the friendship record
        await Friend.findByIdAndDelete(friendship._id);
        
        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Error unfriending user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get friendship status between current user and another user
router.get('/friends/status/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Find friendship record
        const friendship = await Friend.findOne({
            $or: [
                { requesterId: req.user.id, recipientId: userId },
                { requesterId: userId, recipientId: req.user.id }
            ]
        });
        
        if (!friendship) {
            return res.json({ status: 'none' });
        }
        
        // Check if users are in each other's friends arrays for double verification
        const currentUser = await User.findById(req.user.id);
        const otherUser = await User.findById(userId);
        
        const inFriendsArray = currentUser.friends.includes(userId) && 
                              otherUser.friends.includes(req.user.id);
        
        // If they're in each other's friends arrays but friendship status isn't 'accepted',
        // update the friendship status
        if (inFriendsArray && friendship.status !== 'accepted') {
            friendship.status = 'accepted';
            await friendship.save();
        }
        
        res.json({ 
            status: friendship.status,
            requesterId: friendship.requesterId,
            recipientId: friendship.recipientId
        });
    } catch (error) {
        console.error('Error checking friendship status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this new endpoint to check if two users are friends directly by IDs
router.get('/friends/check/:targetUserId', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.targetUserId;
        
        console.log(`Checking friendship between ${currentUserId} and ${targetUserId}`);
        console.log('Current user ID type:', typeof currentUserId);
        console.log('Target user ID type:', typeof targetUserId);
        
        // Find friendship record where both users are involved and status is accepted
        const friendship = await Friend.findOne({
            $or: [
                { 
                    requesterId: currentUserId.toString(), 
                    recipientId: targetUserId.toString(), 
                    status: 'accepted' 
                },
                { 
                    requesterId: targetUserId.toString(), 
                    recipientId: currentUserId.toString(), 
                    status: 'accepted' 
                }
            ]
        });
        
        // If not found with string comparison, try with ObjectId comparison
        if (!friendship) {
            console.log('Trying with direct ObjectId comparison');
            const friendshipWithObjectId = await Friend.findOne({
                $or: [
                    { requesterId: currentUserId, recipientId: targetUserId, status: 'accepted' },
                    { requesterId: targetUserId, recipientId: currentUserId, status: 'accepted' }
                ]
            });
            
            if (friendshipWithObjectId) {
                console.log('Found friendship with ObjectId comparison:', friendshipWithObjectId._id);
                return res.json({
                    areFriends: true,
                    friendship: friendshipWithObjectId
                });
            }
        }
        
        // If still not found, try with a more flexible query
        if (!friendship) {
            console.log('Trying with more flexible query');
            // Get all friendships for current user
            const allFriendships = await Friend.find({
                $or: [
                    { requesterId: currentUserId, status: 'accepted' },
                    { recipientId: currentUserId, status: 'accepted' }
                ]
            });
            
            console.log(`Found ${allFriendships.length} friendships for current user`);
            
            // Check if any of them involve the target user
            const matchingFriendship = allFriendships.find(f => 
                (f.requesterId.toString() === targetUserId.toString() || 
                 f.recipientId.toString() === targetUserId.toString())
            );
            
            if (matchingFriendship) {
                console.log('Found friendship with flexible query:', matchingFriendship._id);
                return res.json({
                    areFriends: true,
                    friendship: matchingFriendship
                });
            }
        }
        
        // Return true if friendship exists, false otherwise
        const areFriends = !!friendship;
        console.log(`Friendship check result: ${areFriends}`, friendship ? friendship._id : 'No record found');
        
        res.json({ 
            areFriends,
            friendship: friendship || null
        });
    } catch (error) {
        console.error('Error checking friendship:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check friendship by username
router.get('/friends/check-by-username/:username', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { username } = req.params;
        
        // Find the target user by username
        const targetUser = await User.findOne({ username });
        
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found', areFriends: false });
        }
        
        const targetUserId = targetUser._id;
        
        console.log(`Checking friendship between ${currentUserId} and ${targetUserId} (${username})`);
        
        // Find friendship record where both users are involved and status is accepted
        const friendship = await Friend.findOne({
            $or: [
                { requesterId: currentUserId, recipientId: targetUserId, status: 'accepted' },
                { requesterId: targetUserId, recipientId: currentUserId, status: 'accepted' }
            ]
        });
        
        // Return true if friendship exists, false otherwise
        const areFriends = !!friendship;
        console.log(`Username-based friendship check result: ${areFriends}`, friendship ? friendship._id : 'No record found');
        
        res.json({ 
            areFriends,
            friendship: friendship || null
        });
    } catch (error) {
        console.error('Error checking friendship by username:', error);
        res.status(500).json({ message: 'Server error', areFriends: false });
    }
});

module.exports = router;