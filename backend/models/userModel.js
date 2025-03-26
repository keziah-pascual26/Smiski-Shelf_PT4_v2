const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String }, // Add the name field with an empty string as the default
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() {
        return !this.googleId; // Password is required only if no googleId
    }},
    bio: { type: String, default: '' },
    googleId: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }, // Add status field
    lastLogin: { type: Date, default: Date.now }, // Add lastLogin field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);