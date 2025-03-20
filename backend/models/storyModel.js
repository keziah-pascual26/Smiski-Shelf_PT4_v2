const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    username: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    media: [{ type: String, required: true }], // Array of media filenames
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Story', storySchema);