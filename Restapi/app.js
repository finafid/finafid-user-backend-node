require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const routs = require("./routes");
const cors = require("cors");
const passport = require("passport");
const upload = require("../Restapi/utils/fileUpload");
const connectDb = require("./config/dbconfig");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
async function startServer() {
  try {
    await connectDb();
  } catch (error) {
    console.error("Error starting server:", error);
  }
}
// Set view engine to EJS
app.set("view engine", "ejs");

// Set views directory
app.set("views", path.join(__dirname, "views"));
// Call the startServer function
startServer();
app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Finafid",
  });
});
// const corsOptions = {
//   origin: "http://localhost:3000",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: "Content-Type, Authorization",
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));

// app.options("*", (req, res) => {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
//   );
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.sendStatus(204);
// });

app.use(
  session({
    secret: "process.env.YOUR_GOOGLE_CLIENT_ID",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", routs);

app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running in port ${port}`);
});
