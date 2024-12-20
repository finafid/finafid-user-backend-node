const order = require("../../models/Order/orderSc");
const orderStatus = require("../../models/Order/OrderStatus");
const Wallet = require("../../models/Wallet/wallet");
const { authenticate, createOrder } = require("../../controllers/order/socket"); // Adjust the path to your Shiprocket module
const GetAndBuy = require("../../models/Coupons/But_and_get");
const User = require("../../models/auth/userSchema");
const Variant = require("../../models/product/Varient");
const MemberShipPlan = require("../../models/Utsab/MembershipPlan");
const referral = require("../../models/auth/referral");
const Transaction = require("../../models/payment/paymentSc");
const walletTransaction = require("../../models/Wallet/WalletTransaction");
const mongoose = require("mongoose");
const fs = require("fs");
const sendSms = require("./smsService");
const sendOrderConfirmationEmail = require("./emailService");
const path = require("path");
const { getSocketInstance } = require("../../socket");
const ObjectId = mongoose.Types.ObjectId;
const {
  sendMail,
  oneMinuteExpiry,
  threeMinuteExpiry,
} = require("../../utils/mailer");
const placeOrder = async (req, res) => {
  try {
    const newOrderItems = [];

    for (const element of req.body.orderItem) {
      const variantDetails = await Variant.findById(element.productId);
      const newOrderItem = {
        productId: element.productId,
        itemQuantity: element.itemQuantity,
        unitPrice: variantDetails.unitPrice,
        sellingPrice: variantDetails.sellingPrice,
        utsavPrice: variantDetails.utsavPrice,
        discount: variantDetails.unitPrice - variantDetails.sellingPrice,
      };
      newOrderItems.push(newOrderItem);
    }
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

    const userData = await User.findById(req.user._id);
     // console.log(req.body);
    const newDate = new Date(); // Create a new Date object
    newDate.setDate(newDate.getDate() + 6); // Add 6 days to the current date

    const expectedDeliveryDate = newDate; // This will store the updated date

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
      is_utsab: userData.is_utsav,
      walletBalanceUsed: req.body.walletBalanceUsed,
      couponDiscount: req.body.couponDiscount,
      utsavDiscount: req.body.utsavDiscount,
      expectedDeliveryDate: expectedDeliveryDate,
      shippingCost: req.body.shippingCost,
    });
    if (req.body.walletBalanceUsed > 0) {
      const walletDetails = await Wallet.findOne({
        userId: req.user._id,
      });
      walletDetails.balance =
        walletDetails.balance - req.body.walletBalanceUsed;
      const newWalletTransaction = new walletTransaction({
        userId: req.user._id,
        type: "debit",
        transaction_message: "Balance used in Purchase",
        amount: req.body.walletBalanceUsed,
        date: Date.now(),
      });
       // console.log(newWalletTransaction);
      await newWalletTransaction.save();
      walletDetails.transactions.push(newWalletTransaction);
      await walletDetails.save();
       // console.log(walletDetails);
    }
    await newOrder.save();
     // console.log(newOrder);
    const newTransaction = new Transaction({
      orderId: newOrder._id,
      amount: req.body.total,
      currency: "INR",
      userId: req.user._id,
    });
    await newTransaction.save();
    newOrder.transactionId = newTransaction._id;
    await newOrder.save();
     // console.log({ newOrder: newOrder });
    await updateStatusDetails(newOrder._id);
    if (req.body.status === "Confirmed") {
      // Simulate the request to updateStatus
      const updateReq = {
        params: { orderId: newOrder._id },
        body: { status: "Confirmed" },
      };

      // Temporarily store the response from updateStatus
      const updateRes = {
        status: (statusCode) => ({
          json: (data) => ({ statusCode, data }),
        }),
      };

      const updateStatusResponse = await updateStatus(updateReq, updateRes);

      // Check if updateStatus has returned an error response
      if (updateStatusResponse?.statusCode >= 400) {
        return res
          .status(updateStatusResponse.statusCode)
          .json(updateStatusResponse.data);
      }
    }
    return res.status(201).json({
      message: "Successfully created order and Shiprocket order",
      newOrder,
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
        $and: [
          { userId: req.user._id },
          {
            $or: [
              { payment_complete: true },
              { payment_method: { $in: ["COD", "Wallet"] } },
            ],
          },
        ],
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
      })
      .sort({ createdAt: -1 });
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
    return res.send(orderDetail);
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
    const userData = await User.findById(orderDetail.userId);
    const io = getSocketInstance();
    io.emit("orderStatusUpdated", {
      orderId: orderDetail._id,
      status: req.body.status,
    });
    if (req.body.status == "Confirmed") {
      await sendOrderConfirmationEmail(orderDetail, userData);
    }
    if (req.body.status == "Shipping") {
      await invoiceGenerate(orderDetail);
      const userData = await User.findOne({
        _id: orderDetail.userId,
        is_Active: true,
        blocking: false,
      });
      if (!userData) {
        return res.status(400).json({ message: "No user Found" });
      }
      await sendSms("messageForOrderOnTheWay", {
        phoneNumber: userData.phone,
        itemName: "",
      });
    }

    if (req.body.status == "Confirmed") {
      const userData = await User.findOne({
        _id: orderDetail.userId,
        is_Active: true,
        blocking: false,
      });
      if (!userData) {
        return res.status(400).json({ message: "No user Found" });
      }
      await sendSms("messageForOrderConfirmed", {
        phoneNumber: userData.phone,
        totalOrder: orderDetail.totalPrice,
        itemName: req.params.orderId,
      });
      await orderStatusConfirmed(orderDetail);
    }
    if (req.body.status == "Delivered") {
      const userData = await User.findOne({
        _id: orderDetail.userId,
        is_Active: true,
        blocking: false,
      });
      if (!userData) {
        return res.status(400).json({ message: "No user Found" });
      }
      await sendSms("messageForOrderDelivary", { phoneNumber: userData.phone });
    }
    if (req.body.status == "Canceled") {
      if (orderDetail.walletBalanceUsed >= 0) {
        await orderStatusCanceled(orderDetail);
      }
    }
    if (req.body.status == "Completed") {
      try {
        
         // console.log(orderDetail.userId._id);
        const walletDetails = await Wallet.findOne({
          userId: new ObjectId(orderDetail.userId._id),
        });

        const planDetails = await MemberShipPlan.findOne({
          identity: "PLAN_IDENTITY",
        });

        const userData = await User.findOne({
          _id: orderDetail.userId,
          is_Active: true,
          blocking: false,
        });

        if (!walletDetails || !planDetails || !userData) {
          return res.status(404).json({
            message: "Required details not found",
            success: false,
          });
        }
        const utsavTotalPrice = orderDetail.orderItem
        .filter(item => item.productId.isUtsav)
        .reduce((total, item) => total + item.productId.sellingPrice * item.itemQuantity, 0);
  
        if (
          userData.is_utsav === false &&
          utsavTotalPrice >= planDetails.amount
        ) {
          userData.is_utsav = true;
          await userData.save();
          await sendSms("messageForUtsavMember", { phoneNumber: userData.phone });
        } else if (userData.is_utsav === false &&
          orderDetail.totalPrice >= 499 &&
          orderDetail.totalPrice <= 4998
        ) {
          // Check if user was referred and it is the first purchase
          const referralDetails = await referral.findOne({
            userId: orderDetail.userId,
          });
           // console.log({ referralDetails });

          if (referralDetails && referralDetails.referred_by) {
            const referredUserData = await User.findById(
              referralDetails.referred_by
            );
             // console.log({ referredUserData });

            if (
              referredUserData &&
              referredUserData.is_utsav === true &&
              userData.firstOrderComplete === false && 
              orderDetail.status !== "Completed"
            ) {
              // Reward ₹49 to the referrer
              let walletDetailsOfReferredUser = await Wallet.findOne({
                userId: referralDetails.referred_by,
              });

              if (walletDetailsOfReferredUser) {
                walletDetailsOfReferredUser.balance += 49;
                const newWalletTransaction = new walletTransaction({
                  userId: referralDetails.referred_by,
                  type: "credit",
                  transaction_message: "Referral Reward for First Purchase",
                  amount: 49,
                  date: Date.now(),
                });
                 // console.log(newWalletTransaction);
                await newWalletTransaction.save();
                walletDetailsOfReferredUser.transactions.push(
                  newWalletTransaction
                );
                await walletDetailsOfReferredUser.save();

                // Mark user's first order as complete
                userData.firstOrderComplete = true;
                await userData.save();
              }
            }
          }
        }

            const referralDetails = await referral.findOne({
              userId: orderDetail.userId,
            });
             // console.log({ referralDetails });
            if (referralDetails && referralDetails.referred_by) {
              const referredUserData = await User.findById(
                referralDetails.referred_by
              );
               // console.log({ referredUserData });

              if (referredUserData && referredUserData.is_utsav === true) {
                let walletDetailsOfReferredUser = await Wallet.findOne({
                  userId: referralDetails.referred_by,
                });
                if (
                  walletDetailsOfReferredUser &&
                  userData.firstOrderComplete == false
                ) {
                   // console.log({ walletDetailsOfReferredUser });

                  // Update referred user's wallet balance
                  walletDetailsOfReferredUser.balance += planDetails.reward;
                  const newWalletTransaction = new walletTransaction({
                    userId: referralDetails.referred_by,
                    type: "credit",
                    transaction_message: "Referral Reward",
                    amount: planDetails.reward,
                    date: Date.now(),
                  });
                   // console.log(newWalletTransaction);
                  await newWalletTransaction.save();
                  walletDetailsOfReferredUser.transactions.push(
                    newWalletTransaction
                  );
                  await walletDetailsOfReferredUser.save();
                  userData.firstOrderComplete = true;
                  await userData.save();
                } else if (
                  walletDetailsOfReferredUser &&
                  userData.firstOrderComplete == true &&
                  userData.is_utsav === true
                ) {
                  walletDetailsOfReferredUser.balance += orderDetail.utsavReward;
                  const newWalletTransaction = new walletTransaction({
                    userId: referralDetails.referred_by,
                    type: "credit",
                    transaction_message: "Referral Reward",
                    amount: orderDetail.utsavReward,
                    date: Date.now(),
                  });
                  await newWalletTransaction.save();
                  walletDetailsOfReferredUser.transactions.push(
                    newWalletTransaction
                  );
                  await walletDetailsOfReferredUser.save();
                }
              }
            }
            // Add basic reward to the user's wallet
            walletDetails.balance += orderDetail.basicReward;
            const newWalletTransaction = new walletTransaction({
              userId: userData._id,
              type: "credit",
              transaction_message: "Referral Reward",
              amount: orderDetail.basicReward,
              date: Date.now(),
            });
            await newWalletTransaction.save();
            walletDetails.transactions.push(newWalletTransaction);
            await walletDetails.save();
            return res.status(200).json({
              message: "Rewards processed successfully",
              success: true,
            });
          } catch (err) {
            console.error("Error processing rewards:", err.message);
            return res.status(500).json({
              message: "Internal server error",
              success: false,
              error: err.message,
            });
          }
        }
        async function orderStatusCanceled(OrderDetails) {
          try {
            const walletDetails = await Wallet.findOne({
              userId: OrderDetails.userId,
            });
             // console.log(walletDetails);
            walletDetails.balance =
              walletDetails.balance + OrderDetails.walletBalanceUsed;
            await walletDetails.save();
            const statusDetails = await orderStatus.findOne({
              orderId: OrderDetails._id,
            });
            if (statusDetails.orderStatusDetails) {
            }
            const newWalletTransaction = new walletTransaction({
              userId: OrderDetails.userId,
              type: "credit",
              transaction_message: "Refund From purchase",
              amount: OrderDetails.walletBalanceUsed,
              date: Date.now(),
            });
            await newWalletTransaction.save();
            walletDetails.transactions.push(newWalletTransaction);
            await walletDetails.save();
            await Promise.all(
              OrderDetails.orderItem.map(async (item) => {
                const productId = item.productId;
                const quantityToReduce = item.itemQuantity;

                await Variant.findByIdAndUpdate(
                  productId,
                  { $inc: { quantity: + quantityToReduce } },
                  { new: true }
                );
              })
            );
          } catch (err) {
            console.error("Error processing rewards:", err.message);
            return res.status(500).json({
              message: "Internal server error",
              success: false,
              error: err.message,
            });
          }
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
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message + "internal server error",
        });
      }
    };

    module.exports = updateStatus;
    async function orderStatusConfirmed(orderDetails) {
      try {
        await Promise.all(
          orderDetails.orderItem.map(async (item) => {
            const productId = item.productId;
            const quantityToReduce = item.itemQuantity;

            await Variant.findByIdAndUpdate(
              productId,
              { $inc: { quantity: -quantityToReduce } },
              { new: true }
            );
          })
        );
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error.message + "internal server error",
        });
      }
    }
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
        const { status, page = 1, limit = 10, startDate, endDate, search } = req.query;
    
        // Create a date filter object if startDate and endDate are provided
        let dateFilter = {};
        if (startDate || endDate) {
          dateFilter.createdAt = {};
          if (startDate) {
            dateFilter.createdAt.$gte = new Date(startDate);
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include the entire endDate
            dateFilter.createdAt.$lte = end;
          }
        }
    
        // Build search filter if 'search' query is provided
        let searchFilter = {};
        if (search) {
          const regex = new RegExp(search, "i"); // Case-insensitive search
          searchFilter = {
            $or: [
              { orderId: { $regex: regex } }, // Assuming `orderId` is the field you want to search
              { "userId.name": { $regex: regex } }, // Search by user name, if relevant
              { "userId.email": { $regex: regex } }, // Or by email
            ],
          };
        }
    
        // Fetch all orders with filters applied
        const allOrders = await order
          .find({
            $and: [
              dateFilter,
              searchFilter, // Add search filter here
              {
                $or: [
                  { payment_complete: { $in: [true, false] } },
                  { payment_method: { $in: ["COD", "Wallet"] } },
                ],
              },
            ],
          })
          .populate("userId")
          .populate({
            path: "orderItem.productId",
            model: "Variant",
            populate: {
              path: "productGroup",
              model: "Product",
            },
          })
          .sort({ createdAt: -1 });
    
        // Initialize status counts
        const statusCount = {};
        let totalIncome = 0;
        let totalSales = 0;
    
        // Define status list and count orders per status
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
    
        // Count orders by status
        statusList.forEach((status) => {
          statusCount[status] = allOrders.filter(
            (order) => order.status === status
          ).length;
        });
    
        // Calculate total income only for "Completed" orders
        allOrders.forEach((order) => {
          if (order.status === "Completed") {
            totalIncome += order.totalPrice || 0;
          }
    
          order.orderItem.forEach((item) => {
            if (order.status === "Completed") {
              totalSales += item.itemQuantity || 0; // Sum itemQuantity for sales
            }
          });
        });
    
        // Apply status filter if specified
        let filteredOrders = allOrders;
        if (status) {
          filteredOrders = allOrders.filter((order) => order.status === status);
        }
    
        // Calculate pagination values
        const skip = (page - 1) * limit;
        const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));
    
        // Calculate total pages for pagination
        const totalOrders = filteredOrders.length;
        const totalPages = Math.ceil(totalOrders / limit);
    
        // Return response with paginated orders, status count, and total income
        return res.status(200).json({
          success: true,
          orderDetails: paginatedOrders, // Paginated orders
          totalOrders, // Total count of filtered orders (before pagination)
          totalPages, // Total number of pages
          currentPage: page, // Current page number
          statusCount, // Status count
          totalIncome, // Total income from completed orders
          totalSales, // Total sales from completed orders
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: `${err.message} internal server error`,
        });
      }
    };
    

    const getSalesPercentageByCategory = async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        // Date filter
        let dateFilter = {};
        if (startDate || endDate) {
          dateFilter.createdAt = {};
          if (startDate) {
            dateFilter.createdAt.$gte = new Date(startDate);
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include the entire endDate
            dateFilter.createdAt.$lte = end;
          }
        }

        // Fetch orders with populated productTypeId names
        const orders = await order.find(dateFilter).populate({
          path: "orderItem.productId",
          model: "Variant",
          populate: {
            path: "productGroup",
            model: "Product",
            populate: {
              path: "productTypeId",
              select: "name",
            },
          },
        });

        // Calculate total product sales by category
        const categorySales = {};

        orders.forEach((order) => {
          order.orderItem.forEach((item) => {
            const productTypeName =
              item.productId?.productGroup?.productTypeId?.name;
            const quantitySold = item.itemQuantity || 0; // Default to 0 if quantity is undefined

            if (productTypeName) {
              if (!categorySales[productTypeName]) {
                categorySales[productTypeName] = 0;
              }
              categorySales[productTypeName] += quantitySold;
            }
          });
        });

        // Calculate total quantity and prepare data
        const totalQuantitySold = Object.values(categorySales).reduce(
          (sum, count) => sum + count,
          0
        );

        const categorySalesData = Object.keys(categorySales).map((category) => ({
          category,
          product_sold: categorySales[category],
          percentage: ((categorySales[category] / totalQuantitySold) * 100).toFixed(
            2
          ),
        }));

        return res.status(200).json({
          success: true,
          data: categorySalesData,
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: `${err.message} - internal server error`,
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
        orderDetails.walletBalanceUsed = req.body.walletBalanceUsed;
        await orderDetails.save();
        return res.status(500).json({
          success: true,
          message: "updated successfully",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: err.message + " internal server error",
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
    async function updateStatusDetails(orderId, status = "Pending") {
      const statusDetails = await orderStatus.findOne({
        orderId,
      });
      const newStatusDetails = {
        status: status,
        date: Date.now(),
      };
      if (!statusDetails) {
        const newStatus = new orderStatus({
          orderStatusDetails: [newStatusDetails],
          orderId,
        });
         // console.log({ newStatus: newStatus });
        await newStatus.save();
      }
      if (statusDetails) {
        statusDetails.orderStatusDetails.push(newStatusDetails);
        await statusDetails.save();
      }
    }
    const cancelDelivery = async (req, res) => {
      try {
        const orderDetails = await order.findById(req.params.orderId);
        if (!orderDetails) {
          return res.status(400).json({
            success: false,
            message: "No order found",
          });
        }
        orderDetails.status = "Canceled";
        await orderDetails.save();
        return res.status(200).json({
          success: true,
          message: "Order cancelled successful",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: err.message + " internal server error",
        });
      }
    };
    const setDeliveryDate = async (req, res) => {
      try {
        const orderDetails = await order.findById(req.param.orderId);
        if (!orderDetails) {
          return res.status(400).json({
            success: false,
            message: "No order found",
          });
        }
        orderDetails.expectedDeliveryDate = req.body.date;
        await orderDetails.save();
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: err.message + " internal server error",
        });
      }
    };
    const { generateAndUploadInvoice } = require("../../utils/invoiceGenerator");
    async function invoiceGenerate(orderDetails) {
       // console.log({ orderDetails: orderDetails });
      const invoiceData = {
        invoiceNumber: "INVOICE" + Math.random().toString().slice(2, 10),
        date: new Date().toISOString().split("T")[0], // Formatted as YYYY-MM-DD
        customerName: orderDetails.userId.fullName,
        customerEmail: orderDetails.userId.email,
        customerPhoneNumber: orderDetails.userId.phone,
        customerAddress: `${orderDetails.address.locality}, ${orderDetails.address.city}, ${orderDetails.address.state}, ${orderDetails.address.pinCode}`,
        payment_method: orderDetails.payment_method,
        items: orderDetails.orderItem.map((item) => ({
          name: item.productId.productGroup.name,
          quantity: item.itemQuantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          price: item.sellingPrice,
        })),

        subtotal: orderDetails.subtotal,
        discount: orderDetails.discount,
        gst: orderDetails.tax,
        couponDiscount: orderDetails.couponDiscount,
        utsavDiscount: orderDetails.utsavDiscount,
        shipping: orderDetails.shippingCost,
        total: orderDetails.totalPrice,
      };
       // console.log({ invoiceData: invoiceData });
      const fileName = await generateAndUploadInvoice(invoiceData);
      const invoiceLink = fileName;
       // console.log({ invoiceLink: invoiceLink });
      orderDetails.invoicePath = invoiceLink;
      await orderDetails.save();

       // console.log(`Invoice generated and uploaded successfully: ${invoiceLink}`);
    }

    const downloadInvoice = async (req, res) => {
      try {
        const orderDetails = await order.findById(req.params.orderId);
         // console.log(orderDetails.invoicePath);
        if (!orderDetails || orderDetails.invoicePath == "false") {
          return res.status(400).json({
            message: " No order details",
          });
        }
        return res.status(200).json({ invoicePath: orderDetails.invoicePath });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: err.message + " internal server error",
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
      updateStatusDetails,
      setDeliveryDate,
      cancelDelivery,
      downloadInvoice,
      getSalesPercentageByCategory,
    };
