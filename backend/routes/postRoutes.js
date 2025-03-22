const upload = require('../config/multer');
const Post = require('../models/postModel');
const authenticateToken = require('../middleware/authMiddleware');

module.exports = (app) => {
    // ✅ Create a Post
    app.post('/create-post', authenticateToken, upload.array('media', 5), async (req, res) => {
        console.log("🔐 Authenticated user:", req.user);

        if (!req.user) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { text } = req.body;
        const username = req.user.username;
        const mediaFilenames = req.files ? req.files.map(file => file.filename) : [];

        if (!text && mediaFilenames.length === 0) {
            return res.status(400).json({ error: "Post must contain text or media." });
        }

        try {
            const newPost = new Post({ username, text, media: mediaFilenames });
            await newPost.save();

            console.log("✅ Post created successfully:", newPost);
            res.status(201).json({ message: "Post created successfully", post: newPost });
        } catch (error) {
            console.error("🚨 Error saving post:", error);
            res.status(500).json({ error: "Failed to create post" });
        }
    });

    // ✅ Get All Posts
    app.get('/posts', authenticateToken, async (req, res) => {
        try {
            const { username } = req.query;

            if (!username) {
                return res.status(400).json({ error: "Username is required" });
            }

            const posts = await Post.find({ username }).sort({ createdAt: -1 }).lean();

            console.log(`✅ Found ${posts.length} posts for user: ${username}`);
            res.status(200).json(posts);
        } catch (error) {
            console.error("🚨 Error fetching posts:", error);
            res.status(500).json({
                error: "Failed to fetch posts",
                details: error.message
            });
        }
    });

    // ✅ Like a Post
    // Toggle like on a post
    app.post('/posts/:id/like', authenticateToken, async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ error: "Post not found" });

            // Check if the user already liked the post
            const likeIndex = post.likes.findIndex(like => like.username === req.user.username);

            if (likeIndex !== -1) {
                // User already liked the post, so remove the like
                post.likes.splice(likeIndex, 1);
                await post.save();
                console.log(`✅ Like removed from post ${req.params.id} by ${req.user.username}`);
                return res.status(200).json({ message: "Like removed", likes: post.likes });
            }

            // User has not liked the post, so add the like
            post.likes.push({ username: req.user.username });
            await post.save();
            console.log(`✅ Post ${req.params.id} liked by ${req.user.username}`);
            res.status(200).json({ message: "Post liked successfully", likes: post.likes });
        } catch (error) {
            console.error("🚨 Error toggling like on post:", error);
            res.status(500).json({ error: "Failed to toggle like on post" });
        }
    });

    // ✅ Comment on a Post
    app.post('/posts/:id/comment', authenticateToken, async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: "Comment text is required" });
            }

            const post = await Post.findById(req.params.id);
            if (!post) return res.status(404).json({ error: "Post not found" });

            const comment = { username: req.user.username, text };
            post.comments.push(comment);
            await post.save();

            console.log(`✅ Comment added to post ${req.params.id} by ${req.user.username}`);
            res.status(200).json({ message: "Comment added successfully", comments: post.comments });
        } catch (error) {
            console.error("🚨 Error commenting on post:", error);
            res.status(500).json({ error: "Failed to add comment" });
        }
    });
};