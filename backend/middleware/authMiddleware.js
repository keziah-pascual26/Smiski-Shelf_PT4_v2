const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Import the User model

const authenticateToken = async (req, res, next) => {
    // Check if user is already authenticated via Passport
    if (req.user) {
        console.log("✅ User authenticated via Passport:", req.user);
        return next(); // Skip JWT verification if Passport has authenticated the user
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.log("❌ Invalid token:", err.message);
            return res.status(403).json({ error: "Invalid token" });
        }

        console.log("✅ Decoded user from JWT:", decoded);

        // Check if username is missing and fetch it from the database
        if (!decoded.username) {
            try {
                const user = await User.findById(decoded.id);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                req.user = { id: user._id, email: user.email, username: user.username }; // Attach full user object
            } catch (error) {
                console.error("❌ Error fetching user from database:", error.message);
                return res.status(500).json({ error: "Internal server error" });
            }
        } else {
            req.user = decoded; // Attach the decoded token payload
        }

        next();
    });
};

module.exports = authenticateToken;