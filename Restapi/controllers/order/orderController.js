const order = require("../../models/Order/orderSc");
const orderItems = require("../../models/Order/orderItem");
const user = require("../../models/auth/userSchema");
const Variant = require("../../models/product/Varient");

const { authenticate, createOrder } = require("../../controllers/order/socket"); // Adjust the path to your Shiprocket module

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
        const priceOfItemDetails = await Variant.findOne({
          _id: orderItem.productId,
        });

        const totalPrice =
          priceOfItemDetails.unitPrice * orderItem.itemQuantity;
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

    // // Authenticate with Shiprocket
    // await authenticate();
    // const userDetails=await User.findOne({
    //   _id:req.user.id
    // })
    // // Prepare order data for Shiprocket
    // const shiprocketOrderData = {
    //   order_id: newOrder._id,
    //   order_date: new Date().toISOString(),
    //   pickup_location: "Default Pickup Location", // Change this as per your configuration
    //   billing_customer_name: userDetails.fullName,

    //   billing_address: req.body.address.street,
    //   billing_city: req.body.address.city,
    //   billing_pincode: req.body.address.pinCode,
    //   billing_state: req.body.address.state,
    //   billing_country: "India", // Adjust based on your requirements
    //   billing_email: req.user.email,
    //   billing_phone: req.user.phone,
    //   shipping_is_billing: true, // Adjust if shipping address is different
    //   order_items: newOrderItems.map((item) => ({
    //     name: "Product Name", // Fetch actual product name from database
    //     sku: item.productId,
    //     units: item.itemQuantity,
    //     selling_price: item.unitPrice, // Fetch actual unit price from database
    //     discount: "", // If any
    //     tax: "", // If any
    //     hsn: "", // If any
    //   })),
    //   payment_method: "Prepaid", // Change as per your configuration
    //   sub_total: grandTotal,
    //   length: 10, // Adjust based on your product dimensions
    //   breadth: 10, // Adjust based on your product dimensions
    //   height: 10, // Adjust based on your product dimensions
    //   weight: 1, // Adjust based on your product weight
    // };

    // // Create order in Shiprocket
    // const shiprocketResponse = await createOrder(shiprocketOrderData);
    // console.log("Shiprocket Order Response:", shiprocketResponse);

    return res.status(201).json({
      message: "Successfully created order and Shiprocket order",
      newOrder,
      shiprocketResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message + " Internal Server Error",
    });
  }
};

module.exports = placeOrder;


const getOrderDetails = async (req, res) => {
  try {
    const orderDetail = await order
      .find({
        userId: req.user._id,
      })
      .populate({
        path: "orderItem",
        populate: {
          path: "productId",
          model: "Variant",
        populate: {
          path: "productGroup",
          model: "Product",
        }},
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
        model: "Variant",
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
