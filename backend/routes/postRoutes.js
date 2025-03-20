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
            console.log("📥 GET /posts request received");
            console.log("🔐 Auth token:", req.headers.authorization);
            console.log("👤 User:", req.user);

            const posts = await Post.find()
                .sort({ createdAt: -1 })
                .lean();

            console.log(`✅ Found ${posts.length} posts`);
            
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(posts);

        } catch (error) {
            console.error("🚨 Error fetching posts:", error);
            return res.status(500).json({
                error: "Failed to fetch posts",
                details: error.message
            });
        }
    });
};
