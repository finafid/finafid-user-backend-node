const order = require("../../models/Order/orderSc");
const orderItems = require("../../models/Order/orderItem");
const user = require("../../models/auth/userSchema");
const Product = require("../../models/product/productSc");
const Address = require("../../models/Order/address");

const placeOrder = async (req, res) => {
  try {
    const newOrderItems = [];

    req.body.orderItem.forEach((element) => {
      const newOrderItem = {
        productId: element.productId,
        itemQuantity: element.itemQuantity,
      };
      newOrderItems.push(newOrderItem);
    });

    const totalPrices = await Promise.all(
      newOrderItems.map(async (orderItem) => {
        const priceOfItemDetails = await Product.findOne({
          _id: orderItem.productId,
        });

        const totalPrice = priceOfItemDetails.price * orderItem.itemQuantity;
        return totalPrice;
      })
    );

    const grandTotal = totalPrices.reduce((acc, price) => acc + price, 0);

    const newOrder = new order({
      orderItem: newOrderItems,
      userId: req.user._id,
      locality: req.body.locality,
      city: req.body.address.city,
      street: req.body.address.street,
      houseNumber: req.body.address.houseNumber,
      pinCode: req.body.address.pinCode,
      landMark: req.body.address.landMark,
      state: req.body.address.state,
      status: req.body.status,
      totalPrice: grandTotal,
    });
    await newOrder.save();
    console.log(newOrder);
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
      .find({
        userId: req.user._id,
      })
      .populate({
        path: "orderItem.productId",
        model: "Product",
      });

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
      .populate({
        path: "orderItem.productId",
        model: "Product",
      });
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
