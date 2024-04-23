require("dotenv").config();
const express = require("express")
const app = express()
const port=process.env.PORT || 8080;
const routs=require('./routes')

const connectdb = require("./config/dbconfig")
async function startServer() {
    try {
      await connectdb();
    } catch (error) {
      console.error("Error starting server:", error);
    }
  }
  
  // Call the startServer function
  startServer();
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }));
  // app.use("/",(req,res)=>{
  //   res.json({
  //     success:true,
  //     message:"Welcom to finafid"
  //   })
  // })
  app.use('/api/v1',routs)

app.listen(port,()=>{
console.log(`Server is running in port ${port}`)
})
