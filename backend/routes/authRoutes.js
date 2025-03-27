const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { registerUser } = require('../auth/auth');
const { generateSecret, verifyToken, enableTwoFactor, disableTwoFactor } = require('../utils/twoFactorUtils');
const authenticateToken = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// Modified login route to handle 2FA
router.post('/login', async (req, res) => {
    try {
        const { email, password, token } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email }).select('+status');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if account is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                message: 'Your account has been suspended. Please contact support for assistance.',
                suspended: true
            });
        }

        // Special case for admin login
        if (email === 'admin@gmail.com' && password === 'admin') {
            const token = jwt.sign(
                { id: user._id, email: user.email, isAdmin: true },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            
            // Update last login time
            user.lastLogin = new Date();
            await user.save();
            
            return res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isAdmin: true
                }
            });
        }

        // Check if 2FA is enabled for this user
        if (user.twoFactorEnabled) {
            // If token is not provided, tell client 2FA is required
            if (!token) {
                return res.status(200).json({ 
                    require2FA: true,
                    message: 'Two-factor authentication required' 
                });
            }
            
            // Verify the provided token against the secret
            const isValidToken = verifyToken(token, user.twoFactorSecret);
            
            if (!isValidToken) {
                return res.status(401).json({ message: 'Invalid verification code' });
            }
        }

        // User is authenticated, generate token
        const jwtToken = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user info and token
        res.json({
            message: 'Login successful',
            token: jwtToken,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', registerUser);

// 2FA Routes
// Setup 2FA - Generate and return QR code
router.post('/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.twoFactorEnabled) {
            return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
        }
        
        const { secret, qrCodeUrl } = await generateSecret(user.email);
        
        // Store the secret temporarily in session (or can be in a temporary field in DB)
        req.session.tempSecret = secret;
        
        res.json({ qrCodeUrl });
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify and enable 2FA
router.post('/2fa/verify', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!req.session || !req.session.tempSecret) {
            return res.status(400).json({ message: 'Two-factor setup process not initiated' });
        }
        
        // Verify token against the temporary secret
        const isValid = verifyToken(token, req.session.tempSecret);
        
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid verification code' });
        }
        
        // Enable 2FA for the user
        await enableTwoFactor(req.user.id, req.session.tempSecret);
        
        // Clear the temporary secret
        delete req.session.tempSecret;
        
        res.json({ message: 'Two-factor authentication enabled successfully' });
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Disable 2FA
router.post('/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.twoFactorEnabled) {
            return res.status(400).json({ message: 'Two-factor authentication is not enabled' });
        }
        
        // Disable 2FA for the user
        await disableTwoFactor(req.user.id);
        
        res.json({ message: 'Two-factor authentication disabled successfully' });
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Check 2FA Status
router.get('/2fa/status', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ twoFactorEnabled: user.twoFactorEnabled });
    } catch (error) {
        console.error('2FA status check error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

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