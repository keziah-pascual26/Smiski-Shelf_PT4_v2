const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Message = require('../models/messageModel');
const authenticateToken = require('../middleware/authMiddleware');

// Get messages between current user and another user
router.get('/messages/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if Message model exists, if not return dummy data
        if (!Message) {
            return res.status(200).json([
                { id: 1, sender: 'other', text: 'Hi there! How are you?', timestamp: new Date(Date.now() - 2 * 60 * 60000) },
                { id: 2, sender: 'self', text: 'I\'m good, thanks! How about you?', timestamp: new Date(Date.now() - 1.5 * 60 * 60000) },
                { id: 3, sender: 'other', text: 'Doing well! Have you seen the new Smiski collection?', timestamp: new Date(Date.now() - 1 * 60 * 60000) }
            ]);
        }
        
        // Fetch messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, recipientId: userId },
                { senderId: userId, recipientId: req.user.id }
            ]
        }).sort({ createdAt: 1 });
        
        // Format the messages for the client
        const formattedMessages = messages.map(message => ({
            id: message._id,
            sender: message.senderId.toString() === req.user.id.toString() ? 'self' : 'other',
            text: message.text,
            timestamp: message.createdAt
        }));
        
        // Mark messages as read
        await Message.updateMany(
            { senderId: userId, recipientId: req.user.id, read: false },
            { $set: { read: true } }
        );
        
        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message
router.post('/messages/send', authenticateToken, async (req, res) => {
    try {
        // Accept both the original parameters and the new frontend parameters
        const { recipientId, recipientUsername, text, to, message } = req.body;
        
        // Use the new parameters if provided, otherwise use the original ones
        const finalRecipientUsername = to || recipientUsername;
        const finalText = message || text;
        
        if ((!recipientId && !finalRecipientUsername) || !finalText) {
            return res.status(400).json({ message: 'Recipient ID or username and message text are required' });
        }
        
        let recipientUser;
        
        // Find recipient by ID or username
        if (recipientId) {
            recipientUser = await User.findById(recipientId);
        } else if (finalRecipientUsername) {
            recipientUser = await User.findOne({ username: finalRecipientUsername });
        }
        
        if (!recipientUser) {
            return res.status(404).json({ message: 'Recipient not found' });
        }
        
        // Check if Message model exists, if not return success for demo purposes
        if (!Message) {
            return res.status(200).json({ message: 'Message sent successfully' });
        }
        
        // Create and save the message
        const newMessage = new Message({
            senderId: req.user.id,
            recipientId: recipientUser._id,
            text: finalText
        });
        
        await newMessage.save();
        
        res.status(200).json({ 
            message: 'Message sent successfully',
            messageId: newMessage._id 
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages between current user and another user by username
router.get('/messages/by-username/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Find the recipient user by username
        const recipientUser = await User.findOne({ username });
        
        if (!recipientUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if Message model exists, if not return dummy data
        if (!Message) {
            return res.status(200).json([
                { id: 1, sender: 'other', text: 'Hi there! How are you?', timestamp: new Date(Date.now() - 2 * 60 * 60000) },
                { id: 2, sender: 'self', text: 'I\'m good, thanks! How about you?', timestamp: new Date(Date.now() - 1.5 * 60 * 60000) },
                { id: 3, sender: 'other', text: 'Doing well! Have you seen the new Smiski collection?', timestamp: new Date(Date.now() - 1 * 60 * 60000) }
            ]);
        }
        
        // Fetch messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, recipientId: recipientUser._id },
                { senderId: recipientUser._id, recipientId: req.user.id }
            ]
        }).sort({ createdAt: 1 });
        
        // Format the messages for the client
        const formattedMessages = messages.map(message => ({
            id: message._id,
            sender: message.senderId.toString() === req.user.id.toString() ? 'self' : 'other',
            text: message.text,
            timestamp: message.createdAt
        }));
        
        // Mark messages as read
        await Message.updateMany(
            { senderId: recipientUser._id, recipientId: req.user.id, read: false },
            { $set: { read: true } }
        );
        
        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching messages by username:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread message count
router.get('/messages/unread/count', authenticateToken, async (req, res) => {
    try {
        // Check if Message model exists, if not return dummy data
        if (!Message) {
            return res.status(200).json({ count: 0 });
        }
        
        // Count unread messages
        const count = await Message.countDocuments({
            recipientId: req.user.id,
            read: false
        });
        
        res.json({ count });
    } catch (error) {
        console.error('Error counting unread messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all unread messages with sender details
router.get('/messages/unread', authenticateToken, async (req, res) => {
    try {
        // Check if Message model exists, if not return dummy data
        if (!Message) {
            return res.status(200).json([]);
        }
        
        // Find all unread messages
        const unreadMessages = await Message.find({
            recipientId: req.user.id,
            read: false
        }).sort({ createdAt: -1 });
        
        // Get unique sender IDs
        const senderIds = [...new Set(unreadMessages.map(msg => msg.senderId.toString()))];
        
        // Get sender details
        const senders = await User.find({
            _id: { $in: senderIds }
        }, 'username');
        
        // Create a map of sender IDs to usernames
        const senderMap = {};
        senders.forEach(sender => {
            senderMap[sender._id.toString()] = sender.username;
        });
        
        // Format the messages with sender details
        const formattedMessages = unreadMessages.map(message => ({
            id: message._id,
            senderId: message.senderId.toString(),
            senderName: senderMap[message.senderId.toString()] || 'Unknown User',
            text: message.text,
            timestamp: message.createdAt
        }));
        
        res.json(formattedMessages);
    } catch (error) {
        console.error('Error fetching unread messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark messages from a specific user as read
router.post('/messages/mark-read/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        
        // Find the sender by username
        const sender = await User.findOne({ username });
        
        if (!sender) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if Message model exists, if not return success for demo purposes
        if (!Message) {
            return res.status(200).json({ message: 'Messages marked as read' });
        }
        
        // Mark all messages from this sender as read
        const result = await Message.updateMany(
            { senderId: sender._id, recipientId: req.user.id, read: false },
            { $set: { read: true } }
        );
        
        res.status(200).json({ 
            message: 'Messages marked as read',
            count: result.nModified || 0
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a message
router.delete('/messages/:messageId', authenticateToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Check if Message model exists, if not return success for demo purposes
        if (!Message) {
            return res.status(200).json({ message: 'Message deleted successfully' });
        }
        
        // Find the message
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        // Ensure the current user is either the sender or the recipient
        if (message.senderId.toString() !== req.user.id.toString() && 
            message.recipientId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this message' });
        }
        
        // Delete the message
        await message.remove();
        
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
