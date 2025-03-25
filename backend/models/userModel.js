const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Add the name field with an empty string as the default
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() {
        return !this.googleId; // Password is required only if no googleId
    }},
    bio: { type: String, default: '' },
    googleId: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    // Add 2FA fields
    twoFactorSecret: { type: String, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    // Add profile privacy setting
    isProfilePublic: { type: Boolean, default: true }
});

module.exports = mongoose.model("User", userSchema);