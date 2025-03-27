const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');

// Create Report model schema if it doesn't exist
const reportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        enum: ['post', 'user'],
        required: true
    },
    reportedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: function() {
            return this.reportType === 'post';
        }
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.reportType === 'user';
        }
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    details: String,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
});

// Create the model if it doesn't exist
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

// Route to report a post
router.post('/post', auth, async (req, res) => {
    try {
        const { postId, reason, details } = req.body;
        
        if (!postId || !reason) {
            return res.status(400).json({ error: 'Post ID and reason are required' });
        }

        // Check if user has already reported this post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingReport = post.reports.find(
            report => report.reporter.toString() === req.user.id
        );

        if (existingReport) {
            return res.status(400).json({ 
                error: 'You have already reported this post'
            });
        }

        // Add the report to the post
        const newReport = {
            reporter: req.user.id,
            reason,
            details: details || '',
            status: 'pending',
            createdAt: new Date()
        };

        post.reports.push(newReport);
        await post.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Report submitted successfully'
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// Route to report a user
router.post('/user', auth, async (req, res) => {
    try {
        const { userId, reason, details } = req.body;
        
        if (!userId || !reason) {
            return res.status(400).json({ error: 'User ID and reason are required' });
        }
        
        // Create a new report
        const report = new Report({
            reportType: 'user',
            reportedUser: userId,
            reporter: req.user.id,
            reason,
            details: details || '',
            status: 'pending',
            createdAt: new Date()
        });
        
        await report.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Report submitted successfully',
            reportId: report._id
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

module.exports = router;