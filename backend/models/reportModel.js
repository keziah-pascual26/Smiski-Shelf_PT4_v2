const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportType: { 
        type: String, 
        enum: ['post', 'user'], 
        required: true 
    },
    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        refPath: 'reportType'
    },
    reason: { 
        type: String, 
        required: true 
    },
    reporter: {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        username: { 
            type: String, 
            required: true 
        }
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;