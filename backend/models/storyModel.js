const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    media: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema);
