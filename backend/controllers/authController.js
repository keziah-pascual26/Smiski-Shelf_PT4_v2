const bcrypt = require('bcrypt');
const User = require('../models/userModel');

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("🚨 Registration Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

/// Login user
exports.login = async (req, res) => {
    try {
        const { email, password, token } = req.body;
        
        // Find user by email with explicit field selection
        const user = await User.findOne({ email }).select('+status');
        
        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // More detailed logging
        console.log("User found:", {
            email: user.email,
            username: user.username,
            status: user.status,
            hasStatus: user.status !== undefined,
            statusType: typeof user.status,
            fullUser: JSON.stringify(user)
        });
        
        // Explicit check with triple equals and string comparison
        if (user.status === 'suspended') {
            console.log("User is suspended, blocking login");
            return res.status(403).json({ 
                message: 'Your account has been suspended. Please contact support for assistance.',
                suspended: true
            });
        } else {
            console.log("User status check passed:", user.status);
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Handle 2FA if enabled
        if (user.twoFactorEnabled) {
            // If no token provided, prompt for 2FA
            if (!token) {
                return res.status(200).json({ 
                    require2FA: true,
                    message: 'Two-factor authentication required'
                });
            }
            
            // Verify 2FA token
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token
            });
            
            if (!verified) {
                return res.status(400).json({ message: 'Invalid verification code' });
            }
        }
        
        // Update last login time
        user.lastLogin = Date.now();
        await user.save();
        
        // Create JWT token
        const jwt = require('jsonwebtoken');
        const payload = {
            id: user._id,
            username: user.username || user.email
        };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'smiski_shelf_secure_jwt_secret_key_2024',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                
                // Explicitly include suspended flag based on status
                const suspended = user.status === 'suspended';
                
                res.json({
                    token,
                    username: user.username || user.email.split('@')[0],
                    email: user.email,
                    message: 'Login successful',
                    status: user.status,
                    suspended: suspended
                });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


