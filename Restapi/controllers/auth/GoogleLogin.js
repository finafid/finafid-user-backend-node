
app.get("/", (req, res) => {
  res.send('<a href="/auth/google">Login with Google</a>');
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect("/profile");
  }
);

app.get("/profile", (req, res) => {
  // req.user contains the authenticated user
  res.send(`Hello ${req.user.displayName}`);
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
