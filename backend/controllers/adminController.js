const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Assuming you have a User model
const Post = require('../models/postModel'); //
require('dotenv').config();

// Add the missing adminLogin function
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Check if the credentials match admin credentials
        // For simplicity, we're using hardcoded admin credentials
        // In a production environment, you should use a more secure approach
        if (email === 'admin@gmail.com' && password === 'admin') {
            // Create JWT token for admin
            const token = jwt.sign(
                { 
                    id: 'admin',
                    email: email,
                    isAdmin: true 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return res.status(200).json({
                message: 'Admin login successful',
                token,
                username: 'Admin'
            });
        }
        
        // If credentials don't match
        return res.status(401).json({ message: 'Invalid admin credentials' });
        
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Admin middleware to verify admin token
exports.isAdmin = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        
        // Add debugging to see what token is being received
        console.log('Token received:', token);
        
        // Check if token is the hardcoded value
        if (token === 'admin-session-token') {
            return res.status(401).json({ message: 'Invalid token format. Please log in again.' });
        }
        
        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check if user is admin
            if (!decoded.isAdmin) {
                return res.status(403).json({ message: 'Not authorized as admin' });
            }
            
            // Set admin user in request
            req.user = decoded;
            next();
        } catch (jwtError) {
            console.error('Admin auth error:', jwtError);
            return res.status(401).json({ message: 'Token is not valid' });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get admin dashboard stats
exports.getStats = async (req, res) => {
    try {
        // Get counts from different collections
        const userCount = await User.countDocuments();
        
        // You can add more stats as needed
        const stats = {
            userCount,
            // Add other stats here
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all users with pagination
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const users = await User.find()
            .select('username email createdAt lastLogin status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);
        
        res.json({
            users,
            currentPage: page,
            totalPages,
            totalUsers
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { username, email, status } = req.body;
        
        // Find user and update
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { username, email, status },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all posts with pagination
exports.getPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        console.log('Admin fetching posts with pagination:', { page, limit, skip });
        
        // Get posts without trying to populate user field since username is a string
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);
        
        console.log(`Found ${posts.length} posts out of ${totalPosts} total`);
        
        res.json({
            posts,
            currentPage: page,
            totalPages,
            totalPosts
        });
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get post by ID
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
            
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.json(post);
    } catch (error) {
        console.error('Error getting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update post
exports.updatePost = async (req, res) => {
    try {
        const { text, status } = req.body;
        
        // Find post and update
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { text, status },
            { new: true }
        );
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Server error' });
    }
};