const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: function() {
            return !this.mediaUrl; // Text is required only if there's no media
        }
    },
    mediaUrl: {
        type: String,
        required: function() {
            return !this.text; // Media is required only if there's no text
        }
    },
    mediaType: {
        type: String,
        enum: ['image', 'video', null],
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient message retrieval
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, read: 1 });

// Use this pattern to prevent duplicate model compilation:
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema)