// app.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const port = process.env.PORT;
const routes = require("./routes");
const cors = require("cors");
const passport = require("passport");
const upload = require("../Restapi/utils/fileUpload");
const connectDb = require("./config/dbconfig");
const helmet = require("helmet");
const path = require("path");
const session = require("express-session");
const { initializeSocket } = require("./socket"); // Import Socket.io initializer

async function startServer() {
  try {
    await connectDb();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); // Exit process if DB connection fails
  }
}

// Set up HTTP server
const server = http.createServer(app);
startServer();
// Initialize Socket.io
initializeSocket(server); // Initialize the socket here

// Middleware setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable if necessary for inline scripts/styles
  })
);
app.use(cors());

app.use("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Finafid",
  });
});

app.use(
  session({
    secret: "process.env.YOUR_GOOGLE_CLIENT_ID", // Update here
    resave: false,
    saveUninitialized: true,
  })
);
app.set("trust proxy", 1);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong!" });
});

// Start the server with socket support
server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
