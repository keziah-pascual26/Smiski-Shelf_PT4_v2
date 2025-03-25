const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const storySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    media: [String],
    comments: [commentSchema], // Add this line to include comments array
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

// Add a pre-save hook to set expiration
storySchema.pre('save', function(next) {
    if (!this.expiresAt) {
        // Set expiry to 24 hours from creation
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    next();
});

const StorySchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    isTrimmed: {
      type: Boolean,
      default: false
    },
    // Optional: store trim details if needed
    trimDetails: {
      start: Number,
      end: Number,
      duration: Number
    },
    // Other fields...
  }, { timestamps: true });
  
  // Stories expire after 24 hours
  StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Story', storySchema);