const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
require('dotenv').config(); // Make sure this is at the top

// Add console.log to debug environment variables
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Make sure the strategy options are properly set
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let existingUser = await User.findOne({ googleId: profile.id });
                
                if (!existingUser) {
                    existingUser = await User.findOne({ email: profile.emails[0].value });
                    if (existingUser) {
                        existingUser.googleId = profile.id;
                        await existingUser.save();
                    }
                }
                
                if (existingUser) {
                    return done(null, existingUser);
                }

                const newUser = await new User({
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                }).save();

                done(null, newUser);
            } catch (error) {
                console.error('Google Auth Error:', error);
                done(error, null);
            }
        }
    )
);