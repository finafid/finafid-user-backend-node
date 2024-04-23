const cart=require("../../models/productBag/cartSc")
const wishList=require("../../models/productBag/wishListSc")
const User=require("../../models/auth/userSchema")



const addToWishlist = async (req, res) => {
    try {
        const userData = req.user;
        const { productId } = req.body;

        console.log(userData);
        let userDetails = await wishList.findOne({ User: userData._id });

        if (!userDetails) {
           
            const newWishList = new wishList({
                User: userData._id,
                Product: [productId]
            });
            await newWishList.save();
        } else {          
            userDetails.Product.push(productId);
            await userDetails.save();
        }

        return res.status(201).json({
            success: true,
            message: 'Product added to wishlist successfully'
        });
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = addToWishlist;



const getTheWishlist=async(req,res)=>{
try{
    const userData = req.user;
    const userDetails=await wishList.find({
        User:userData._id
    }).lean().exec();
    return res.status(200).json(userDetails);  
}catch (error) {
    return res.status(500).json({
        success: false,
        message: error.message+' Internal server error'
    });
} 
}

const deleteFromWishlist=async(req,res)=>{
    try{
        const userData = req.user;    
        const {productId}=req.body;
        const userDetails=wishList.findOne({
        User:userData._id   
    })
    if(!userDetails){
        return res.status(500).json({
            success: false,
            message: 'User wishlist is not there'
        });
    }
    userDetails.products.pop(productId);
    await userDetails.save();
    
    return res.status(201).json({
        success:true,
        message:'WishList added successfully'
    })
        
    }catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message+' Internal server error'
        });
    } 
    }



const addToCart=async(req,res)=>{
    try{
        const userData = req.user;    
        const {productId}=req.body;
        const userDetails=cart.findOne({
        user:userData._id,
  
    })
    if(!userDetails){
        const newCart = new cart({
            User: userData._id,
            Product: [productId]
        });
        await newCart.save();
    }
    userDetails.products.push(productId);
    await userDetails.save();
    
    return res.status(201).json({
        success:true,
        message:'WishList added successfully'
    })
            
    }catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } 
}      
const getTheCart=async(req,res)=>{
    try{
    const userData = req.user;
    const userDetails=await cart.find({
        User:userData._id
    }).lean().exec();
    return res.status(200).json(userDetails);  
                
    }catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
     } 
}

const deleteFromCart=async(req,res)=>{
try{
    const userData = req.user;    
    const {productId}=req.body;
    const userDetails=cart.findOne({
    User:userData._id   
})
if(!userDetails){
    return res.status(500).json({
        success: false,
        message: 'User wishlist is not there'
    });
}
userDetails.products.pop(productId);
await userDetails.save();         
                    
    }catch (error) {
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
    } 
}            
module.exports={addToWishlist,
    getTheWishlist,
    deleteFromWishlist,
    addToCart,
    getTheCart,
    deleteFromCart
}