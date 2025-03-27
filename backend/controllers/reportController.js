const Report = require('../models/reportModel');

exports.submitReport = async (req, res) => {
    try {
        const { reportType, targetId, reason } = req.body;

        // Validate required fields
        if (!reportType || !targetId || !reason) {
            return res.status(400).json({
                message: 'Missing required fields',
                details: {
                    reportType: !reportType ? 'Report type is required' : null,
                    targetId: !targetId ? 'Target ID is required' : null,
                    reason: !reason ? 'Reason is required' : null
                }
            });
        }

        // Validate report type
        if (!['post', 'user'].includes(reportType)) {
            return res.status(400).json({
                message: 'Invalid report type. Must be either "post" or "user"'
            });
        }

        const newReport = new Report({
            reportType,
            targetId,
            reason,
            reporter: {
                userId: req.user._id,
                username: req.user.username
            },
            status: 'pending'
        });

        const savedReport = await newReport.save();
        
        res.status(201).json({ 
            message: 'Report submitted successfully',
            report: savedReport
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ 
            message: 'Failed to submit report',
            error: error.message 
        });
    }
};

// ... rest of the controller code remains the same ...

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to fetch reports',
            error: error.message 
        });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;
        
        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        );
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ 
            message: 'Failed to update report status',
            error: error.message 
        });
    }
};