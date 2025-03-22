const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
require('dotenv').config();

console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET);

passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize by user ID
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user); // Ensure the full user object is returned
    } catch (error) {
        done(error, null);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log('Google Profile:', profile); // Debug the profile object

                let existingUser = await User.findOne({ googleId: profile.id });

                if (!existingUser) {
                    existingUser = await User.findOne({ email: profile.emails[0].value });
                    if (existingUser) {
                        existingUser.googleId = profile.id;
                        await existingUser.save();
                    }
                }

                if (existingUser) {
                    console.log('Existing User:', existingUser); // Debug existing user
                    return done(null, existingUser);
                }

                const newUser = await new User({
                    username: profile.displayName, // Use displayName as username
                    email: profile.emails[0].value,
                    googleId: profile.id
                }).save();

                console.log('New User Created:', newUser); // Debug new user
                done(null, newUser);
            } catch (error) {
                console.error('Google Auth Error:', error);
                done(error, null);
            }
        }
    )
);