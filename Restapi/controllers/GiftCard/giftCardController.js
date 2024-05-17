const GiftCard=require('../../models/GiftCard/giftCard')
const User=require('../../models/auth/userSchema')

const createGiftCard = async (req, res) => {
    try {
        const customerId = await User.findOne({ _id: req.user._id });

        const { value, Recipient_Information: { name, email, mobile } } = req.body;

        const code = req.user._id.toString() + "giftno" + Date.now;
        const Activation_Date = new Date();
        const Expiration_Date = new Date(currentDate);
        Expiration_Date.setDate(Expiration_Date.getDate() + 90);

        const newGiftCard = new GiftCard({
            code: code,
            value: value,
            Expiration_Date: Expiration_Date,
            Recipient_Information: {
                name: name,
                email: email,
                mobile: mobile
            },
            Issuer_Information: customerId,
            Activation_Date: Activation_Date,
            Additional_Metadata: null
        });
        await newGiftCard.save();
        res.status(200).json(newGiftCard)
        

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
        const userDetails=await User.find({
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

module.exports={
    createGiftCard,
    getGiftCardDetails,
    getGiftCardByUser
}