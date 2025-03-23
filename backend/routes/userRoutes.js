const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const authenticateToken = require('../middleware/authMiddleware');

module.exports = (app) => {
    // ✅ Protected Dashboard Route
    app.get('/dashboard', authenticateToken, (req, res) => {
        res.json({ message: "Welcome to the dashboard!", user: req.user });
    });
};

router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username email bio');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
