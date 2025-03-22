const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    imagePath: {
        type: String,
        required: false, // Optional if no image is uploaded
    },
    videoPath: {
        type: String,
        required: false, // Optional if no video is uploaded
    },
    audioPath: {
        type: String,
        required: false, // Optional if no audio is uploaded
    },
    username: {
        type: String,
        required: true, // Ensure the username is always provided
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Story', storySchema);