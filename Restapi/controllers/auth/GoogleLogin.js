const passport = require("../../config/passport");

// Route to start authentication
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Route to handle callback from Google
exports.googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/",
});

exports.authSuccess = (req, res) => {
  res.redirect("/profile");
};

// Route to check if user is logged in
exports.getProfile = (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello ${req.user.displayName}`);
  } else {
    res.redirect("/");
  }
};

// Route to logout
exports.logout = (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
};
