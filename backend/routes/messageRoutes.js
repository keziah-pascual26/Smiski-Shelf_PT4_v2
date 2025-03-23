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
        const { recipient, text } = req.body;
        
        if (!recipient || !text) {
            return res.status(400).json({ message: 'Recipient ID and message text are required' });
        }
        
        // Check if the recipient exists
        const recipientUser = await User.findById(recipient);
        if (!recipientUser) {
            return res.status(404).json({ message: 'Recipient not found' });
        }
        
        // Check if Message model exists, if not return success for demo purposes
        if (!Message) {
            return res.status(200).json({ message: 'Message sent successfully' });
        }
        
        // Create and save the message
        const message = new Message({
            senderId: req.user.id,
            recipientId: recipient,
            text: text
        });
        
        await message.save();
        
        res.status(200).json({ 
            message: 'Message sent successfully',
            messageId: message._id 
        });
    } catch (error) {
        console.error('Error sending message:', error);
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
