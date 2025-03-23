const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    media: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema);