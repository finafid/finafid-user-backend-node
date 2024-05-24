const order = require("../../models/Order/orderSc");
const orderItems = require("../../models/Order/orderItem");
const user = require("../../models/auth/userSchema");
const Product = require("../../models/product/productSc");

const placeOrder = async (req, res) => {
  try {
    const newOrderItems = [];
    console.log(req.body.orderItem);
    req.body.orderItem.forEach((element) => {
      const newOrderItem = {
        productId: element.productId,
        itemQuantity: element.itemQuantity,
      };
      newOrderItems.push(newOrderItem);
    });
    console.log(newOrderItems);
   const totalPrices = await Promise.all(
     newOrderItems.map(async (orderItem) => {
       console.log(orderItem.productId);
       const priceOfItemDetails = await Product.findOne({
         _id: orderItem.productId,
       });
       console.log(priceOfItemDetails);
       const totalPrice = priceOfItemDetails.price * orderItem.itemQuantity;
       return totalPrice;
     })
   );
   const grandTotal = totalPrices.reduce((acc, price) => acc + price, 0);
    console.log(totalPrices);
    console.log(req.user._id);
    const newOrder = new order({
      orderItem: newOrderItems,
      userId: req.user._id,
      locality: req.body.locality,
      city: req.body.city,
      street: req.body.street,
      state: req.body.state,
      houseNumber: req.body.houseNumber,
      country: req.body.country,
      status: req.body.status,
      totalPrice: grandTotal,
    });
    await newOrder.save();
    return res.status(201).json({
      message: "successfully created",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + "Internal Server error",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderDetail = await order
      .findOne ({
        user: req.user._id,
      })
      .populate();

    if (!orderDetail) {
      return res.status(500).json({
        success: false,
        message: "No order till now",
      });
    }
    res.send(orderDetail);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + "  Internal server Error",
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const orderDetail = await order
      .findById({
        _id: req.params.orderId,
      })
      .populate("user");

    if (!orderDetail) {
      return res.status(500).json({
        success: false,
        message: "No order till now",
      });
    }
    res.send(orderDetail);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + " Internal server error",
    });
  }
};


const updateStatus = async (req, res) => {
  try {
    const orderDetail = await order
      .findByIdAndUpdate(
        {
          _id: req.param._id,
        },
        {
          status: req.body.status,
        }
      )
      .populate("user", "name");

    if (!orderDetail) {
      return res.status(500).json({
        success: false,
        message: "No order till now",
      });
    }
    res.send(orderDetail);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
};

module.exports = {
  placeOrder,
  getOrderDetails,
  getOrderById,
  updateStatus,
 
};
