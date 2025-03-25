const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    },
    reactionType: {
        type: String,
        enum: ['like', 'love', 'haha', 'sad', 'angry'],
        required: true
    },
    count: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Add compound index for efficient querying
reactionSchema.index({ storyId: 1, reactionType: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);