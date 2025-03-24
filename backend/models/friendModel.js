const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requesterUsername: {
        type: String,
        required: true
    },
    recipientUsername: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index to ensure uniqueness of friendship pairs
friendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);
module.exports = Friend;