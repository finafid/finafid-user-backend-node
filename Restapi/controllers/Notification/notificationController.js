const { sendNotification } = require("../../middlewares/sendNotification");
const sendAppNotification=async(req,res)=>{
    try {
        const { userId, title, body } = req.body;
        const response=await sendNotification(userId, title, body);
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