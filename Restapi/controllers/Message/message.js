const { sendSMS } = require("../../middlewares/message");
 const messageForUtsavMember=async(req,res)=>{
    try{
    const templateId = "1007328752894505628";
    const message ="Your FINAFID Order has been Delivered. Enjoy your products. Thank you for shopping with FINAFID";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    console.log(responseDetails.data)
    return res.status(200).json(responseDetails.data)
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error",
          });
    }
}
const messageForOrderDelivary=async(req,res)=>{
    try{
        const templateId = "1007328752894505628";
    const message ="Your FINAFID Order has been Delivered. Enjoy your products. Thank you for shopping with FINAFID";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    return res.status(200).json({message:"Send successfully"})

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error",
          });
    }
}
const messageForOrderOnTheWay=async(req,res)=>{
    try{
        const templateId = "1007328752894505628";
    const message ="Your FINAFID Order has been Delivered. Enjoy your products. Thank you for shopping with FINAFID";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    return res.status(200).json({message:"Send successfully"})

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error",
          });
    }
}
const messageForOrderConfirmed=async(req,res)=>{
    try{

        const templateId = "1007328752894505628";
    const message ="Your FINAFID Order has been Delivered. Enjoy your products. Thank you for shopping with FINAFID";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    return res.status(200).json({message:"Send successfully"})
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error",
          });
    }
}
module.exports={
    messageForUtsavMember,
    messageForOrderDelivary,
    messageForOrderOnTheWay,
    messageForOrderConfirmed,
}