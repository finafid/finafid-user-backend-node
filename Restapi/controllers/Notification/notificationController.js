const { image } = require("pdfkit");
const { sendNotification } = require("../../middlewares/sendNotification");
const sendAppNotification=async(req,res)=>{
    try {
        const { userId, title, body,imageurl,url } = req.body;
        const response=await sendNotification(userId, title, body,imageurl,url);
        res.status(200).json({ message: response });
    } catch (error) {
      res
        .status(500)
        .json({ message: error.message + " Internal Server Error" });
    }
}
module.exports = {
  sendAppNotification,
};