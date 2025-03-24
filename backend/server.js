const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const reactionRoutes = require('./routes/reactionRoutes');

// Add speakeasy and qrcode
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
require('./config/passportSetup');
require('dotenv').config();

const router = express.Router();

const { Types: { ObjectId } } = require('mongoose');




// Import Models & Auth
const User = require('./models/userModel');
const Story = require('./models/storyModel');
const Post = require('./models/postModel'); // ✅ Import Post Model
const Friend = require('./models/friendModel'); // Add Friend model
const Message = require('./models/messageModel'); // Add Message model
const Reaction = require('./models/storyreactModel'); // ✅ Import Reaction Model
const { registerUser, loginUser } = require('./auth/auth');
const authenticateToken = require('./middleware/authMiddleware');

const postRoutes = require('./routes/postRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const port = 3000;

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email provider (e.g., Outlook, SMTP)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware
app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup - make sure to have this before routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add test routes for debugging
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

app.get('/api/direct-test', (req, res) => {
  res.json({ message: 'Direct API test is working' });
});

// Use routes
app.use('/', authRoutes);
app.use('/api', require('./routes/storyRoutes'));
app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/friendRoutes')); // Add friend routes
app.use('/api', require('./routes/messageRoutes')); // Add message routes

app.use('/', reactionRoutes);
app.use('/', storyRoutes);


// Import and use routes - IMPORTANT: Only use one method for post routes
require('./routes/postRoutes')(app);
// Remove this duplicate route registration
// app.use('/api', postRoutes);

// Root route handler - serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login/login.html'));
});

// Specific route for the new password page - ADD THIS BEFORE THE CATCH-ALL
app.get('/new-password/new-pass.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/new-password/new-pass.html'));
});

// Add this route to serve the new-pass.js file
app.get('/new-password/new-pass.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/new-password/new-pass.js'));
});

// Add this route to serve the CSS file if needed
app.get('/new-password/new-pass.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/new-password/new-pass.css'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smiskiDB')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("🚨 MongoDB Connection Error:", err));


    
// Reset Password Route
app.post("/reset-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        console.log("Reset request for email:", email); // Debugging

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a secure token
        const token = crypto.randomBytes(32).toString("hex");

        // Store the token and expiry time in the database
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        // Send email with reset link
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `<p>Click <a href="http://localhost:3000/new-password/new-pass.html?token=${token}">here</a> to reset your password.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ message: "Error sending email" });
            }
            console.log("Email sent:", info.response);
            res.json({ message: "Reset link sent successfully" });
        });

    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Handle password update
// Handle password update
app.post("/reset-password/new", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }
        
        console.log("Received token:", token);
        
        const user = await User.findOne({ 
            resetToken: token, 
            resetTokenExpiry: { $gt: Date.now() } 
        });

        if (!user) {
            console.log("Invalid token or token expired");
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        console.log("Password updated successfully for user:", user.email);
        res.json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error in reset-password/new:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash the new password before saving
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: "Password reset successful!" });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Catch-all route for SPA navigation - MOVED TO THE END so it doesn't intercept API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login/login.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});

