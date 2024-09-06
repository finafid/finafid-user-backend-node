const passport = require('passport');
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.serializeUser((user , done) => {
    done(null , user);
})
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.google_clientId,
      clientSecret: process.env.google_clientSecret,
      callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);
