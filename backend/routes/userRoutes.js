const authenticateToken = require('../middleware/authMiddleware');

module.exports = (app) => {
    // ✅ Protected Dashboard Route
    app.get('/dashboard', authenticateToken, (req, res) => {
        res.json({ message: "Welcome to the dashboard!", user: req.user });
    });
};
