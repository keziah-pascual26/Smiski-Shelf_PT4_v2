const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

// Submit a new report
router.post('/post', auth, reportController.submitReport);

// Get all reports (admin only)
router.get('/all', auth, reportController.getReports);

// Update report status (admin only)
router.put('/:reportId/status', auth, reportController.updateReportStatus);

module.exports = router;