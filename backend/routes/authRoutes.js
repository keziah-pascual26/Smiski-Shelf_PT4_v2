const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../auth/auth'); // Add this import

// Local auth routes
router.post('/login', loginUser);
router.post('/register', registerUser);

// Google OAuth routes
router.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/pages/login/login.html',
        session: false 
    }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.redirect(`/pages/dashboard/dashboard.html?token=${token}&username=${req.user.username}`);
    }
);

module.exports = router;