import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true // Important: Trust the proxy to ensure the callback URL uses HTTPS
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // 2. Check if user exists by Email (linking accounts)
        // Google emails are verified, so we can trust them
        const email = profile.emails[0].value;
        user = await User.findOne({ email: email });

        if (user) {
          // Link the Google ID to the existing account
          user.googleId = profile.id;
          // If the user wasn't confirmed yet, Google confirms them
          if (!user.isConfirmed) user.isConfirmed = true;
          await user.save();
          return done(null, user);
        }

        // 3. Create new user
        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: email,
          isConfirmed: true, // Google users are always confirmed
          isAdmin: false
        });

        await newUser.save();
        done(null, newUser);

      } catch (err) {
        done(err, null);
      }
    }
  ));
} else {
  console.warn("⚠️ Google OAuth credentials not found. Google login will not work.");
}

export default passport;
