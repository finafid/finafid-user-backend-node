const payment = ("../../models/payment/paymentSc")
const Razorpay = require('razorpay');


const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});
const paymentDetails = async (req, res) => {
    const { amount, currency = "INR", orderId } = req.body;
    try {
        receiptId='order_rcptid_' + Math.floor(Math.random() * 1000)
        const option = {
            amount: amount * 100,
            currency: currency,
            receipt:receiptId,
            payment_capture: 1
        }
        const response = await Razorpay.orders.create(option);
        console.log('Payment Initiated:', response);
        if(!response){
            return 
        }
        const newPaymentDetails = new payment({
            orderId: orderId,
            paymentId:receiptId, 
            amount: amount,
            currency: currency,
            status:response.status
        })
        await newPaymentDetails.save();
        res.send(newPaymentDetails)
        

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'error', err
        });
            
        
    }

}
const varifySigneture=async(req,res)=>{
    try{


    }catch(error) {
        return res.status(500).json({
            success: false,
            message: 'error', err
        });      
    }
}