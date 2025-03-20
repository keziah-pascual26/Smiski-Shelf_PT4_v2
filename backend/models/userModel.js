const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function() {
        return !this.googleId; // Password is required only if no googleId
    }},
    googleId: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
});

module.exports = mongoose.model("User", userSchema);