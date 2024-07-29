const cart = require("../../models/productBag/cartSc");
const wishList = require("../../models/productBag/wishListSc");
const User = require("../../models/auth/userSchema");
const ProductDetails = require("../../models/productBag/ProductDetails");

const addToWishlist = async (req, res) => {
  try {
    const userData = req.user;
    const { productId } = req.body;

    console.log(userData);
    const userDetails = await wishList.findOne({ UserId: userData._id });
    console.log(userDetails)
    if (!userDetails) {
      const newWishList = new wishList({
        UserId: userData._id,
        productIdList: [productId],
      });
      await newWishList.save();
      const productIdList=await newWishList.populate('productIdList')
    return res.status(200).json(productIdList)
    } else {
      if(userDetails.productIdList.includes(productId)===true){
        return res.status(200).json({
          success:false,
          message:"Item is already there"
        })
      }
      userDetails.productIdList.push(productId);
      await userDetails.save();
      const productIdList=await userDetails.populate('productIdList')
      return res.status(200).json(productIdList)
    }

    // return res.status(201).json({
    //   success: true,
    //   message: "Product added to wishlist successfully",
    // });
  } catch (error) {
    
    return res.status(500).json({
      success: false,
      message: error.message+" Internal server error",
    });
  }
};



const getTheWishlist = async (req, res) => {
  try {
    const userData = req.user;
    const userDetails = await wishList
      .findOne({
        UserId: userData._id,
      })
      .populate({
        path: "productIdList",
        populate: {
          path: "productGroup",
          model: "Product", 
        },
      });
     
    return res.status(200).json(userDetails);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const deleteFromWishlist = async (req, res) => {
  try {
    const userData = req.user;
    const { productId } = req.body;
    const userDetails = await wishList.findOne({
      UserId: userData._id,
    });
    
    if (!userDetails) {
      return res.status(500).json({
        success: false,
        message: "User wishlist is not there",
      });
    }
    if(userDetails.productIdList.includes(productId)===false){
      return res.status(200).json({
        success:false,
        message:"no such Item in wishList"
      })
    }
    const itemIndex = userDetails.productIdList.findIndex(
      (item) => item.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    userDetails.productIdList.splice(itemIndex, 1);
    
    await userDetails.save();

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });

    return res.status(201).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const addToCart = async (req, res) => {
    try {
      const { productId, itemQuantity = 1 } = req.body;
      const userCartDetails = await cart.findOne({ UserId: req.user._id });
  
      if (!userCartDetails) {
        // If the user does not have a cart, create a new cart with the product
        const newProductDetails = {
          productId,
          itemQuantity,
        };
  
        const newCart = new cart({
          UserId: req.user._id,
          cartItems: [newProductDetails],
        });
        await newCart.save();
        await newCart.populate("cartItems.productId");
  
        return res.status(200).json({
          products: newCart.cartItems,
          message: "Item added successfully",
        });
      } else {
        // Check if the product already exists in the cart
        const existingProductIndex = userCartDetails.cartItems.findIndex(
          (item) => item.productId.toString() === productId
        );
  
        if (existingProductIndex >= 0) {
          // If the product exists, update the quantity
          userCartDetails.cartItems[existingProductIndex].itemQuantity += itemQuantity;
        } else {
          // If the product does not exist, add it to the cart
          const newProductDetails = {
            productId,
            itemQuantity,
          };
          userCartDetails.cartItems.push(newProductDetails);
        }
  
        await userCartDetails.save();
        await userCartDetails.populate("cartItems.productId");
  
        return res.status(200).json({
          products: userCartDetails.cartItems,
          message: "Item added successfully",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message + " Internal server error",
      });
    }
  };
  
const getTheCart = async (req, res) => {
  try {
    const userData = req.user;
    const userCartDetails = await cart
      .findOne({ UserId: userData._id })
      .populate({
        path: "cartItems",
        populate: {
          path: "productId",
          populate: {
            path: "productGroup",
            model: "Product",
          },
        },
      });
     ;
      

    if (!userCartDetails) {
      return res.status(200).json({
        success: false,
        message: "Cart is empty",
      });
    }
    return res.status(200).json({
      success: true,
      cartItems: userCartDetails.cartItems,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};

const deleteFromCart = async (req, res) => {
    try {
      const { productId } = req.body;
      const userCartDetails = await cart.findOne({ UserId: req.user._id });
  
      if (!userCartDetails) {
        return res.status(404).json({
          success: false,
          message: "User cart is not found",
        });
      }
  
      const itemIndex = userCartDetails.cartItems.findIndex(
        (item) => item.productId.toString() === productId
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Product not found in cart",
        });
      }
  
      userCartDetails.cartItems.splice(itemIndex, 1);
      
      await userCartDetails.save();
  
      return res.status(200).json({
        success: true,
        message: "Deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message + " Internal server error",
      });
    }
  };
  const clearCart=async(req,res)=>{
    try{
        const userCartDetails = await cart.findOne({ UserId: req.user._id });
        if(!userCartDetails){
            return res.status(200).json({
                success: false,
                message:  " Cart is empty",
              });
        }
        const result = await cart.deleteOne({ UserId: req.user._id });
        return res.status(200).json({
            success: true,
            message: " Deleted Successfully",
          });

    }catch(error){
        return res.status(500).json({
            success: false,
            message: error.message + " Internal server error",
          });
    }
  }
  
module.exports = {
  addToWishlist,
  getTheWishlist,
  deleteFromWishlist,
  addToCart,
  getTheCart,
  deleteFromCart,
  clearCart
};
