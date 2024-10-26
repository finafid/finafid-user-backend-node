const { sendSMS } = require("../../middlewares/message");
 const messageForUtsavMember=async(req,res)=>{
    try{
    const templateId = "1007298985861428740";
    const message ="CONGRATS!! Your FINAFID Utsav membership is active. Now enjoy special discounts and benefits anytime you shop at FINAFID";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    console.log(responseDetails.data
        
    )
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
    const message ="Exciting update! Your FINAFID Order has been Delivered.Enjoy your products.Thank you for shopping with FINAFID.";
    const responseDetails = await sendSMS(message, req.body.phoneNumber, templateId);
    console.log({data:responseDetails.data})
    return res.status(200).json(responseDetails.data)

    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error",
          });
    }
}
const messageForOrderOnTheWay=async(req,res)=>{
    try{
    const templateId = "1007355757063252363";
    const message =`Great news! Your FINAFID Order ${req.body.itemName} is on its way. Track it using app. Estimated delivery by 5-7 Days.`;
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
    const templateId = "1007653365827264540";
    const message =`Thank you for choosing FINAFID! Your order ${req.body.itemName} worth ${req.body.totalOrder} is confirmed. Stay tuned for shipment updates.`;
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