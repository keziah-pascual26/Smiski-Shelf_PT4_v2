const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');

// Admin login route - public
router.post('/login', adminController.adminLogin);  // This is causing the error

// Admin protected routes - all require admin authentication
router.get('/stats', adminController.isAdmin, adminController.getStats);
router.get('/users', adminController.isAdmin, adminController.getUsers);
router.get('/users/:id', adminController.isAdmin, adminController.getUserById);
router.put('/users/:id', adminController.isAdmin, adminController.updateUser);
router.delete('/users/:id', adminController.isAdmin, adminController.deleteUser);

// Post management routes
router.get('/posts', adminController.isAdmin, adminController.getPosts);
router.get('/posts/:id', adminController.isAdmin, adminController.getPostById);
router.put('/posts/:id', adminController.isAdmin, adminController.updatePost);
router.delete('/posts/:id', adminController.isAdmin, adminController.deletePost);

router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();

        // Get total posts
        const totalPosts = await Post.countDocuments();

        // Get active users (users who logged in within the last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            lastLoginAt: { $gte: twentyFourHoursAgo }
        });

        res.json({
            totalUsers,
            totalPosts,
            activeUsers
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics' });
    }
});

module.exports = router;