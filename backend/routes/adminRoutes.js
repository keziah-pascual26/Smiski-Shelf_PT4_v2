const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

module.exports = router;