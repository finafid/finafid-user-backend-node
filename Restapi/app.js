require("dotenv").config();
const express = require("express")
const app = express()
const port=process.env.PORT || 8080;
const routs=require('./routes')
const cors = require('cors');
const passport = require("passport");

const connectDb = require("./config/dbconfig")

const session = require("express-session")
async function startServer() {
    try {
      await connectDb();
    } catch (error) {
      console.error("Error starting server:", error);
    }
  }
  
  // Call the startServer function
  startServer();
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use("/ping",(req,res)=>{
    res.json({
      success:true,
      message:"Welcome to Finafid"
    })
  })
  // Set up session middleware
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


  
  app.use('/api/v1',routs)

app.listen(port,()=>{
console.log(`Server is running in port ${port}`)
})
