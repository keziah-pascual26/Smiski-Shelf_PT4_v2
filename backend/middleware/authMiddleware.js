const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Import the User model

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if the Authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('❌ Missing or invalid Authorization header');
            return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
        }

        // Extract the token from the Authorization header
        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user to the request object
        const user = await User.findById(decoded.id);
        if (!user) {
            console.error('❌ User not found');
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        req.user = user; // Attach the user object to the request
        next();
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authenticateToken;

module.exports = authenticateToken;

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check if the Authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('❌ Missing or invalid Authorization header');
            return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
        }

        // Extract the token from the Authorization header
        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user to the request object
        const user = await User.findById(decoded.id);
        if (!user) {
            console.error('❌ User not found');
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }

        req.user = user; // Attach the user object to the request
        next();
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = authMiddleware;