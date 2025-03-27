const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    media: { type: [String], default: [] },
    likes: [{ 
        username: String,
        createdAt: { type: Date, default: Date.now }
    }],
    comments: [{ username: String, text: String }],
    originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;