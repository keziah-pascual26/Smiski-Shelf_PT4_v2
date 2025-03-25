const mongoose = require("mongoose");
const User = require("../models/userModel"); // Adjusted relative path

async function updateUserRecords() {
    try {
        // Connect to the database
        await mongoose.connect("mongodb://127.0.0.1:27017/smiskiDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Connected to the database");

        // Update all users to set the `name` field to an empty string if it doesn't exist
        const result = await User.updateMany(
            { name: { $exists: false } }, // Match documents without the `name` field
            { $set: { name: "" } }       // Set the `name` field to an empty string
        );

        console.log(`Updated ${result.modifiedCount} user records`);
    } catch (error) {
        console.error("Error updating user records:", error);
    } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log("Disconnected from the database");
    }
}

updateUserRecords();