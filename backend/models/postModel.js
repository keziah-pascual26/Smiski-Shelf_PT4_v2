const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    media: { type: [String], default: [] },
    likes: [{ username: String }], // Array of users who liked the post
    comments: [{ username: String, text: String }], // Array of comments with username and text
    originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // Reference to the original post
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;