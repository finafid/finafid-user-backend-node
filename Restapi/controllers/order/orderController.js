const order = require("../../models/Order/orderSc");
const orderStatus = require("../../models/Order/OrderStatus");
const Wallet = require("../../models/Wallet/wallet");
const { authenticate, createOrder } = require("../../controllers/order/socket"); // Adjust the path to your Shiprocket module
const GetAndBuy = require("../../models/Coupons/But_and_get");
const User = require("../../models/auth/userSchema");
const Variant = require("../../models/product/Varient");
const MemberShipPlan = require("../../models/Utsab/MembershipPlan");
const referral = require("../../models/auth/referral");
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
    let totalUtsavReward = 0;
    for (const element of newOrderItems) {
      const variantDetails = await Variant.findById(element.productId);
      totalUtsavReward += variantDetails.utsavReward * element.itemQuantity;
    }
    let totalBasicReward = 0;
    for (const element of newOrderItems) {
      const variantDetails = await Variant.findById(element.productId);
      totalBasicReward += variantDetails.basicReward * element.itemQuantity;
    }

    // Check for deals
    // const deal = await GetAndBuy.findOne({
    //   products: { $in: newOrderItems.map((item) => item.productId) },
    //   status: true, // Only active deals
    // });

    // let discount = 0;

    // for (const orderItem of newOrderItems) {
    //   const productDetails = await Variant.findById(orderItem.productId);

    //   if (deal) {
    //     if (
    //       deal.dealType === "BUY_ONE_GET_ONE" &&
    //       orderItem.itemQuantity >= 2
    //     ) {
    //       discount += productDetails.unitPrice; // For every 2 items, 1 is free
    //     } else if (
    //       deal.dealType === "BUY_TWO_GET_ONE" &&
    //       orderItem.itemQuantity >= 3
    //     ) {
    //       discount += productDetails.unitPrice; // For every 3 items, 1 is free
    //     } else if (deal.dealType === "CUSTOM") {
    //       // Implement custom deal logic here if necessary
    //     }
    //   }
    // }
    const userData = await User.findById(req.user._id);

    const newOrder = new order({
      orderItem: newOrderItems,
      userId: req.user._id,
      address: req.body.address,
      status: req.body.status,
      totalPrice: req.body.total,
      discount: req.body.discount,
      subtotal: req.body.subtotal,
      tax: req.body.tax,
      payment_method: req.body.payment_method,
      utsavReward: totalUtsavReward,
      basicReward: totalBasicReward,

      // is_utsab: userData.is_utsab
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
      //shiprocketResponse,
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
          },
        },
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
        populate: {
          path: "productGroup",
          model: "Product",
        },
      })
      .populate("userId");
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
          _id: req.params.orderId,
        },
        {
          status: req.body.status,
        }
      )
      .populate("userId");
    if (req.body.status == "Completed") {
      const walletDetails = await Wallet.findOne({
        userId: orderDetail.userId,
      });
  
      const userData = await User.findById(orderDetail.userId);
       console.log({ userData: userData });
      const referralDetails = await referral.findOne({
        userId: orderDetail.userId,
      });
      console.log({ referralDetails: referralDetails });
      const planDetails = await MemberShipPlan.findOne({
          identity: "PLAN_IDENTITY",
        });
      
        const referredUserData=await User.findById(referralDetails.referred_by);
        console.log({ referredUserData: referredUserData });
        if (referralDetails && referralDetails.referred_user &&referredUserData.is_utsav==true) {
          const walletDetailsOfReferredUser = await Wallet.findOneAndUpdate({
            userId: referralDetails.referred_by,
          });
       if (userData.is_utsav == false) {
         walletDetailsOfReferredUser.balance =
           walletDetailsOfReferredUser.balance + planDetails.reward;
         await walletDetailsOfReferredUser.save();
         userData.firstOrderComplete = true;
         await userData.save();
       }}
          if (userData.is_utsav == true) {
          walletDetailsOfReferredUser.balance =
            walletDetailsOfReferredUser.balance + orderDetail.utsavReward;
          await walletDetailsOfReferredUser.save();
        }
     
        walletDetails.balance = walletDetails.balance + orderDetail.basicReward;
        await walletDetails.save();
      }
      if (!orderDetail) {
        return res.status(500).json({
          success: false,
          message: "No order till now",
        });
      }
      const statusDetails = await orderStatus.findOne({
        orderId: req.params.orderId,
      });
      const newStatusDetails = {
        status: req.body.status,
        date: Date.now(),
      };
      if (!statusDetails) {
        const newStatus = new orderStatus({
          orderStatusDetails: [newStatusDetails],
          orderId: req.params.orderId,
        });
        await newStatus.save();
        return res.status(200).json({
          success: true,
          orderDetail,
        });
      }
      statusDetails.orderStatusDetails.push(newStatusDetails);
      await statusDetails.save();
      return res.status(200).json({
        success: true,
        orderDetail,
      });
    }
   catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message + "internal server error",
    });
  }
};
const getOrderByStatus = async (req, res) => {
  try {
    const orderDetails = await order.find({
      status: req.body.status,
    });
    if (!orderDetails) {
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
      message: error.message + "internal server error",
    });
  }
};
const getAllOrder = async (req, res) => {
  try {
    // Get query parameters for filtering and pagination
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;

    // Create a date filter object if startDate and endDate are provided
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to the endDate to include the entire day
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Fetch all orders first with the date filter applied
    const allOrders = await order
      .find(dateFilter)
      .populate("userId")
      .populate({
        path: "orderItem.productId",
        model: "Variant",
        populate: {
          path: "productGroup",
          model: "Product",
        },
      });

    // Calculate status counts
    const statusCount = {};
    const statusList = [
      "Pending",
      "Confirmed",
      "Shipping",
      "Out For delivery",
      "Delivered",
      "Returned",
      "Canceled",
      "Completed",
    ];

    statusList.forEach((status) => {
      const filteredOrderList = allOrders.filter(
        (order) => order.status === status
      );
      statusCount[status] = filteredOrderList.length;
    });

    console.log(statusCount);

    // Apply status filter
    let filteredOrders = allOrders;
    if (status) {
      filteredOrders = allOrders.filter((order) => order.status === status);
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));

    // Calculate total pages
    const totalOrders = filteredOrders.length;
    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,
      orderDetails: paginatedOrders,
      totalOrders,
      totalPages,
      currentPage: page,
      statusCount,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message + " internal server error",
    });
  }
};

const editOrder = async (req, res) => {
  try {
    const orderDetails = await order.findOne({
      _id: req.params.orderId,
    })((orderDetails.locality = req.body.locality));
    orderDetails.city = req.body.address.city;
    orderDetails.street = req.body.address.street;
    orderDetails.houseNumber = req.body.address.houseNumber;
    orderDetails.pinCode = req.body.address.pinCode;
    orderDetails.landMark = req.body.address.landMark;
    orderDetails.state = req.body.address.state;
    orderDetails.status = req.body.status;
    orderDetails.totalPrice = req.body.total;
    orderDetails.discount = req.body.discount;
    orderDetails.subtotal = req.body.subtotal;
    orderDetails.tax = req.body.tax;
    orderDetails.payment_method = req.body.payment_method;
    orderDetails.payment_complete = req.body.payment_complete;
    await orderDetails.save();
    return res.status(500).json({
      success: true,
      message: "updated succesfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: error.message + "internal server error",
    });
  }
};
const orderStatusDetails = async (req, res) => {
  try {
    const statusDetails = await orderStatus.findOne({
      orderId: req.params.orderId,
    });
    if (!statusDetails) {
      return res.status(500).json({
        success: false,
        message: "internal server error",
      });
    }
    return res.status(200).json({
      success: true,
      statusDetails,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message + "internal server error",
    });
  }
};

module.exports = {
  placeOrder,
  getOrderDetails,
  getOrderById,
  updateStatus,
  getOrderByStatus,
  getAllOrder,
  editOrder,
  orderStatusDetails,
};
