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

module.exports = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }
        
        // Extract token from Bearer format
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwtSecret);
        
        // Add user from payload to request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        
        res.status(401).json({ error: 'Token is not valid' });
    }
};

module.exports = authMiddleware;