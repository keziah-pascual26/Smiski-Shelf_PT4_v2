const upload = require('../config/multer');
const Post = require('../models/postModel');
const authenticateToken = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

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

    app.get('/feed', authenticateToken, async (req, res) => {
        try {
            // Fetch posts from all users, sorted by newest first
            const posts = await Post.find({}).sort({ createdAt: -1 }).limit(20).lean();
            
            console.log(`✅ Found ${posts.length} posts for feed`);
            res.status(200).json(posts);
        } catch (error) {
            console.error("🚨 Error fetching feed:", error);
            res.status(500).json({
                error: "Failed to fetch feed",
                details: error.message
            });
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

    // Get current user's posts
    app.get('/posts/user', authenticateToken, async (req, res) => {
        try {
            const posts = await Post.find({ userId: req.user._id })
                .sort({ createdAt: -1 });
                
            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get posts liked by any user (current or specific user)
    app.get('/posts/liked', authenticateToken, async (req, res) => {
        try {
            // Get username from query params, fallback to current user if not provided
            const targetUsername = req.query.username || req.user.username;
            
            console.log("🔍 Fetching liked posts for user:", targetUsername);
            
            const posts = await Post.find({ 
                'likes.username': targetUsername 
            }).sort({ createdAt: -1 });
            
            console.log(`✅ Found ${posts.length} liked posts for user: ${targetUsername}`);
            res.status(200).json(posts);
        } catch (error) {
            console.error("🚨 Error fetching liked posts:", error);
            res.status(500).json({
                error: "Failed to fetch liked posts",
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

            // User has not liked the post, so add the like with timestamp
            const now = new Date();
            post.likes.push({ 
                username: req.user.username,
                createdAt: now
            });
            
            // Ensure the post is modified and saved correctly
            post.markModified('likes');
            await post.save();
            
            console.log(`✅ Post ${req.params.id} liked by ${req.user.username} at ${now}`);
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

    app.put('/posts/:postId/comment/:commentId', authenticateToken, async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: "Comment text is required" });
            }
    
            const post = await Post.findById(req.params.postId);
            if (!post) return res.status(404).json({ error: "Post not found" });
    
            const comment = post.comments.id(req.params.commentId);
            if (!comment) return res.status(404).json({ error: "Comment not found" });
    
            // Ensure the logged-in user is the owner of the comment
            if (comment.username !== req.user.username) {
                return res.status(403).json({ error: "You are not authorized to edit this comment" });
            }
    
            comment.text = text; // Update the comment text
            await post.save();
    
            res.status(200).json({ message: "Comment updated successfully", comments: post.comments });
        } catch (error) {
            console.error("🚨 Error editing comment:", error);
            res.status(500).json({ error: "Failed to edit comment" });
        }
    });

    app.delete('/posts/:postId/comment/:commentId', authenticateToken, async (req, res) => {
        try {
            console.log("🔍 Deleting comment...");
            console.log("Post ID:", req.params.postId);
            console.log("Comment ID:", req.params.commentId);
            console.log("Authenticated user:", req.user.username);
    
            if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
                console.log("❌ Invalid Post ID");
                return res.status(400).json({ error: "Invalid Post ID" });
            }
    
            if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
                console.log("❌ Invalid Comment ID");
                return res.status(400).json({ error: "Invalid Comment ID" });
            }
    
            const post = await Post.findById(req.params.postId);
            if (!post) {
                console.log("❌ Post not found");
                return res.status(404).json({ error: "Post not found" });
            }
    
            const comment = post.comments.id(req.params.commentId);
            if (!comment) {
                console.log("❌ Comment not found");
                return res.status(404).json({ error: "Comment not found" });
            }
    
            // Ensure the logged-in user is the owner of the comment
            if (comment.username !== req.user.username) {
                console.log("❌ Unauthorized user");
                return res.status(403).json({ error: "You are not authorized to delete this comment" });
            }
    
            // Remove the comment using pull
            post.comments.pull({ _id: req.params.commentId });
            await post.save();
    
            console.log("✅ Comment deleted successfully");
            res.status(200).json({ message: "Comment deleted successfully", comments: post.comments });
        } catch (error) {
            console.error("🚨 Error deleting comment:", error.message, error.stack);
            res.status(500).json({ error: "Failed to delete comment" });
        }
    });

    app.post('/posts/:id/repost', authenticateToken, async (req, res) => {
        try {
            const originalPost = await Post.findById(req.params.id);
            if (!originalPost) {
                return res.status(404).json({ error: "Original post not found" });
            }
    
            const repost = new Post({
                username: req.user.username,
                text: `${originalPost.text}`,
                media: originalPost.media,
                originalPostId: originalPost._id, // Reference to the original post
            });
    
            await repost.save();
    
            console.log(`✅ Post ${req.params.id} reposted by ${req.user.username}`);
            res.status(201).json({ message: "Post reposted successfully", repost });
        } catch (error) {
            console.error("🚨 Error reposting post:", error);
            res.status(500).json({ error: "Failed to repost post" });
        }
    });

    // ✅ Delete a Post
    app.delete('/posts/:id', authenticateToken, async (req, res) => {
        try {
            console.log("🔍 Deleting post...");
            console.log("Post ID:", req.params.id);
            console.log("Authenticated user:", req.user.username);

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                console.log("❌ Invalid Post ID");
                return res.status(400).json({ error: "Invalid Post ID" });
            }

            const post = await Post.findById(req.params.id);
            
            if (!post) {
                console.log("❌ Post not found");
                return res.status(404).json({ error: "Post not found" });
            }

            // Ensure the logged-in user is the owner of the post
            if (post.username !== req.user.username) {
                console.log("❌ Unauthorized user");
                return res.status(403).json({ error: "You are not authorized to delete this post" });
            }

            await Post.findByIdAndDelete(req.params.id);
            
            console.log("✅ Post deleted successfully");
            res.status(200).json({ message: "Post deleted successfully" });
        } catch (error) {
            console.error("🚨 Error deleting post:", error.message, error.stack);
            res.status(500).json({ error: "Failed to delete post" });
        }
    });

    // ✅ Update a Post
    app.put('/posts/:id', authenticateToken, upload.array('media', 5), async (req, res) => {
        try {
            console.log("🔍 Updating post...");
            console.log("Post ID:", req.params.id);
            console.log("Authenticated user:", req.user.username);
            console.log("Update data:", req.body);
            console.log("Files:", req.files);

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                console.log("❌ Invalid Post ID");
                return res.status(400).json({ error: "Invalid Post ID" });
            }

            const { text } = req.body;
            const mediaFilenames = req.files ? req.files.map(file => file.filename) : [];
            
            // Allow updating either text or media or both
            if (!text && mediaFilenames.length === 0) {
                console.log("❌ Missing update data");
                return res.status(400).json({ error: "Post must contain text or media to update" });
            }

            const post = await Post.findById(req.params.id);
            
            if (!post) {
                console.log("❌ Post not found");
                return res.status(404).json({ error: "Post not found" });
            }

            // Ensure the logged-in user is the owner of the post
            if (post.username !== req.user.username) {
                console.log("❌ Unauthorized user");
                return res.status(403).json({ error: "You are not authorized to edit this post" });
            }

            // Update text if provided
            if (text) {
                post.text = text;
            }
            
            // Update media if provided
            if (mediaFilenames.length > 0) {
                post.media = mediaFilenames;
            }
            
            await post.save();
            
            console.log("✅ Post updated successfully");
            res.status(200).json({ 
                message: "Post updated successfully", 
                post 
            });
        } catch (error) {
            console.error("🚨 Error updating post:", error.message, error.stack);
            res.status(500).json({ error: "Failed to update post" });
        }
    });
};
