const GiftCard=require('../../models/GiftCard/giftCard')
const User=require('../../models/auth/userSchema')
const Wallet=require('../../models/Wallet/wallet')

const createGiftCard = async (req, res) => {
    try {
        const customerId = await User.findOne({ _id: req.user._id });

        const { value, Recipient_Information: { name, email, phoneNumber } } = req.body;

        const code = req.user._id.toString() + "giftno" + Date.now;
        const Activation_Date = new Date();
        const Expiration_Date = new Date(Activation_Date);
        Expiration_Date.setDate(Expiration_Date.getDate() + 90);
        const walletDetails=await Wallet.findOne({
            userId:req.user._id
        })
        if(walletDetails.balance<value){
           return res
              .status(400)
              .json({ message: "Not enough amount in Wallet" });
        }
        walletDetails.balance = walletDetails.balance - value;
        await walletDetails.save();
        const newGiftCard = new GiftCard({
            Code: code,
            Value: value,
            Expiration_Date: Expiration_Date,
            Recipient_Information: {
                name: name,
                email: email,
                phoneNumber: phoneNumber
            },
            Issuer_Information: customerId,
            Activation_Date: Activation_Date,
            Additional_Metadata: null
        });
        await newGiftCard.save();
        res.status(200).json(
            {"message":"Successfully created giftcard",
            newGiftCard})
        

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error"
        });
    }
};
const getGiftCardDetails=async(req,res)=>{
    try{
        const giftCardId=req.params.giftCardId;
        const giftCardDetails=await GiftCard.findOne({
            _id:giftCardId
        })
        if(!giftCardDetails){
            res.status(400).json({
                success: false,
                message: "No gift card Present"
            });
        res.status(200).json(giftCardDetails)    ;
        }
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error"
        });
    }
}
const getGiftCardByUser=async(req,res)=>{
    try{
        const userDetails=await GiftCard.find({
            Issuer_Information:req.user._id
        })
        if(!userDetails){
            res.status(400).json({
                success: false,
                message: "No gift card Present"
            });
        }
        res.status(200).json(userDetails)  
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message + " Internal Server Error"
        });
    }
}
const redeemGiftcard=async(req,res)=>{
    try {
        const giftCardDetails=await GiftCard.findOne({
            code:req.body.code,
            status:"active"
        })
        if(!giftCardDetails){
            res.status(500).json({
        success: false,
        message: " Invalid Giftcard",
      });
        }
        const walletDetails=await Wallet.findOne({
            userId:req.user._id
        })
        walletDetails.balance = walletDetails.balance + giftCardDetails.Value;
        await walletDetails.save();
        res.status(500).json({
        success: true,
        message: "Giftcard reedemed successfully",})
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message + " Internal Server Error",
      });
    }
}

module.exports = {
  createGiftCard,
  getGiftCardDetails,
  getGiftCardByUser,
  redeemGiftcard,
};