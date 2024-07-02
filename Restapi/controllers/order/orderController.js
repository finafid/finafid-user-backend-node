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

    // const totalPrices = await Promise.all(
    //   newOrderItems.map(async (orderItem) => {
    //     const priceOfItemDetails = await Variant.findOne({
    //       _id: orderItem.productId,
    //     });

    //     const totalPrice =
    //       priceOfItemDetails.unitPrice * orderItem.itemQuantity;
    //     return totalPrice;
    //   })
    // );

    // const grandTotal = totalPrices.reduce((acc, price) => acc + price, 0);

    // const totalDiscount = await Promise.all(
    //   newOrderItems.map(async (orderItem) => {
    //     const priceOfItemDetails = await Variant.findOne({
    //       _id: orderItem.productId,
    //     });

    //     const totalDiscount =
    //       (priceOfItemDetails.unitPrice - priceOfItemDetails.sellingPrice) *
    //       orderItem.itemQuantity;
    //     return totalDiscount;
    //   })
    // );

    // const grandDiscount = totalDiscount.reduce((acc, price) => acc + price, 0);
    //   const totalUtsabDiscount = await Promise.all(
    //     newOrderItems.map(async (orderItem) => {
    //       const priceOfItemDetails = await Variant.findOne({
    //         _id: orderItem.productId,
    //       });

    //       let totalUtsabDiscount=0; 
    //       if(priceOfItemDetails.isUtsav===true)
    //         {totalUtsabDiscount =
    //           (priceOfItemDetails.sellingPrice -
    //             priceOfItemDetails.utsabPrice) *
    //           orderItem.itemQuantity;}
    //       return totalUtsabDiscount;
    //     })
    //   );

    //   const grandUtsabDiscount = totalUtsabDiscount.reduce(
    //     (acc, price) => acc + price,
    //     0
    //   );

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
      totalPrice: req.body.total,
      discount: req.body.discount,
      subtotal: req.body.subtotal,
      tax: req.body.tax,
      payment_method: req.body.payment_method,
      
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
const getOrderByStatus=async(req,res)=>{
  try {
    const orderDetails=await order.find({
      status:req.body.status
    })
    if(!orderDetails){
      return res.status(500).json({
        success: false,
        message: "No order",        
      });
    }
    return res.status(200).json({
      success: true,
      orderDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
}
const getAllOrder = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const { status,  page = 1, limit = 10 } = req.query;

    // Create a filter object based on query parameters
    let filter = {};
    if (status) {
      filter.status = status;
    }


    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Find and count documents based on the filter and pagination values
    const orderDetails = await order
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit));
    const totalOrders = await order.countDocuments(filter);

    return res.status(200).json({
      success: true,
      orderDetails,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
};
const editOrder=async(req,res)=>{
  try {
    const orderDetails=await order.findOne({
      _id:req.params.orderId
    })
    (orderDetails.locality = req.body.locality);
    (orderDetails.city = req.body.address.city);
    (orderDetails.street = req.body.address.street);
    (orderDetails.houseNumber = req.body.address.houseNumber);
    (orderDetails.pinCode = req.body.address.pinCode);
    (orderDetails.landMark = req.body.address.landMark);
    (orderDetails.state = req.body.address.state);
    (orderDetails.status = req.body.status);
    (orderDetails.totalPrice = req.body.total);
    (orderDetails.discount = req.body.discount);
    (orderDetails.subtotal = req.body.subtotal);
    (orderDetails.tax = req.body.tax);
    (orderDetails.payment_method = req.body.payment_method);
    (orderDetails.payment_complete=req.body.payment_complete);
    await orderDetails.save()
     return res.status(500).json({
       success: true,
       message: "updated succesfully"
     });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "error",
      err,
    });
  }
}
module.exports = {
  placeOrder,
  getOrderDetails,
  getOrderById,
  updateStatus,
  getOrderByStatus,
  getAllOrder,
  editOrder
};
