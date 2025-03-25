const express = require('express');
const upload = require('../config/multer');
const path = require('path');
const router = express.Router();

router.post('/profile/picture', upload.single('profilePicture'), (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file); // Log file details
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ profilePicture: filePath });
});

module.exports = router;