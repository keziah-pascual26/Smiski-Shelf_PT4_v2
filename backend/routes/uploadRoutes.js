const express = require('express');
const upload = require('../config/multer'); // Import multer configuration
const router = express.Router();

router.post('/upload', upload.single('editedImage'), (req, res) => {
    if (req.file) {
        res.status(200).json({ message: 'Image uploaded successfully', filePath: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ message: 'Failed to upload image' });
    }
});

module.exports = router;