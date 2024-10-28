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
const path = require("path");
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
    console.log(req.body);
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
      console.log(newWalletTransaction);
      await newWalletTransaction.save();
      walletDetails.transactions.push(newWalletTransaction);
      await walletDetails.save();
      console.log(walletDetails);
    }
    await newOrder.save();
    console.log(newOrder);
    const newTransaction = new Transaction({
      orderId: newOrder._id,
      amount: req.body.total,
      currency: "INR",
      userId: req.user._id,
    });
    await newTransaction.save();
    newOrder.transactionId = newTransaction._id;
    await newOrder.save();
    console.log({ newOrder: newOrder });
    await updateStatusDetails(newOrder._id);
    if (req.body.status == "Confirmed") {
      const updateReq = {
        params: { orderId: newOrder._id },
        body: { status: "Confirmed" },
      };
      try {
         await updateStatus(updateReq, res);
        
          return res.status(201).json({
            message: "Successfully created order and Shiprocket order",
            newOrder,
            success: true,
          });
      } catch (error) {
        res.status(500).json({
          message: "Failed To Create Order",
          success: false,
        });
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
    if (req.body.status == "Confirmed") {
      try {
        // Load the HTML template
        const templatePath = path.join(__dirname, "orderconfirm.html");
        const htmlTemplate = await fs.promises.readFile(templatePath, "utf8");

        // Replace placeholders with actual order details
        const orderItemsHTML = orderDetail.orderItem
          .map(
            (item) =>
              `<tr>
                      <td align="left" valign="top" style="padding: 16px 0px 8px 16px;">
                       <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                         <td>
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                           <tr>
                            <td valign="top">
                             <table class="" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                               <th valign="top" style="font-weight: normal; text-align: left;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                 <tr>
                                  <td class="pc-w620-spacing-0-16-20-0" valign="top" style="padding: 0px 20px 0px 0px;">
                                   <img src="${item?.productId?.images[0]}" class="pc-w620-width-64 pc-w620-height-64" width="100" height="104" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width:100px; height:104px; border: 0;" />
                                  </td>
                                 </tr>
                                </table>
                               </th>
                               <th valign="top" style="font-weight: normal; text-align: left;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                 <tr>
                                  <td>
                                   <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                     <td valign="top">
                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                       <tr>
                                        <th align="left" valign="top" style="font-weight: normal; text-align: left; padding: 0px 0px 4px 0px;">
                                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                          <tr>
                                           <td valign="top" align="left" style="padding: 9px 0px 0px 0px;">
                                            <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-26" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; font-variant-ligatures: normal; color: #001942; text-align: left; text-align-last: left;">
                                             <div><span>${item.productId.name}</span>
                                             </div>
                                            </div>
                                           </td>
                                          </tr>
                                         </table>
                                        </th>
                                       </tr>
                                       
                                       <tr>
                                        <th align="left" valign="top" style="font-weight: normal; text-align: left;">
                                         <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                          <tr>
                                           <td valign="top" align="left">
                                            <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #53627a; text-align: left; text-align-last: left;">
                                             <div><span>Qty: ${item.itemQuantity}</span>
                                             </div>
                                            </div>
                                           </td>
                                          </tr>
                                         </table>
                                        </th>
                                       </tr>
                                      </table>
                                     </td>
                                    </tr>
                                   </table>
                                  </td>
                                 </tr>
                                </table>
                               </th>
                              </tr>
                             </table>
                            </td>
                           </tr>
                          </table>
                         </td>
                        </tr>
                       </table>
                      </td>
                      <td align="right" valign="top" style="padding: 24px 16px 24px 16px;">
                       <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                        <tr>
                         <td valign="top" align="right">
                          <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-20" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; font-variant-ligatures: normal; color: #001942; text-align: right; text-align-last: right;">
                           <div><span style="color: #001942;">${item?.productId?.sellingPrice}</span>
                           </div>
                          </div>
                         </td>
                        </tr>
                       </table>
                      </td>
                     </tr>`
          )
          .join("");

        let emailHTML = htmlTemplate
          .replace("{{customerName}}", orderDetail.address.customerName)
          .replace("{{orderId}}", orderDetail._id)
          .replace("{{orderItems}}", orderItemsHTML)
          .replace("{{subtotal}}", orderDetail.subtotal)
          .replace("{{discount}}", orderDetail.discount)
          .replace("{{utsavDiscount}}", orderDetail.utsavDiscount)
          .replace("{{couponDiscount}}", orderDetail.couponDiscount)
          .replace("{{tax}}", orderDetail.tax.toFixed(2))
          .replace("{{shippingCost}}", orderDetail.shippingCost)
          .replace(
            "{{address}}",
            orderDetail.address.locality +
              orderDetail.address.state +
              orderDetail.address.pinCode
          )

          .replace("{{receiverName}}", orderDetail.address.receiverName)
          .replace("{{receiverPhone}}", orderDetail.address.receiverPhone)
          .replace("{{_id}}", orderDetail._id)
          .replace("{{totalPrice}}", orderDetail.totalPrice);

        // Use your sendMail function to send the email
        await sendMail(userData.email, "Order Confirmation", emailHTML);
        console.log("Order confirmation email sent");
      } catch (error) {
        console.error("Error sending order confirmation email:", error);
      }
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
      const response = await fetch(
        "https://finafid.co.in/api/v1/messageForOrderOnTheWay",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber: userData.phone, itemName: "" }),
        }
      );
      const data = await response.json();
      console.log(data);
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
      const response = await fetch(
        "https://finafid.co.in/api/v1/messageForOrderConfirmed",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: userData.phone,
            total: orderDetail.total,
            itemName: "",
          }),
        }
      );
      const data = await response.json();
      console.log(data);
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
      const response = await fetch(
        "https://finafid.co.in/api/v1/messageForOrderDelivary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: userData.phone,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
      return data;
    }
    if (req.body.status == "Canceled") {
      if (orderDetail.walletBalanceUsed >= 0) {
        await orderStatusCanceled(orderDetail);
      }
    }
    if (req.body.status == "Completed") {
      try {
        console.log(orderDetail.userId._id);
        const walletDetails = await Wallet.findOne({
          userId: new ObjectId(orderDetail.userId._id),
        });
        console.log({ walletDetails });

        const planDetails = await MemberShipPlan.findOne({
          identity: "PLAN_IDENTITY",
        });
        console.log({ planDetails });

        const userData = await User.findOne({
          _id: orderDetail.userId,
          is_Active: true,
          blocking: false,
        });
        console.log({ userData });

        if (!walletDetails || !planDetails || !userData) {
          return res.status(404).json({
            message: "Required details not found",
            success: false,
          });
        }
        if (
          userData.is_utsav === false &&
          orderDetail.totalPrice >= planDetails.amount
        ) {
          userData.is_utsav = true;
          await userData.save();

          const response = await fetch(
            "https://finafid.co.in/api/v1/messageForUtsavMember",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ phoneNumber: userData.phone }),
            }
          );
          const data = await response.json();
          console.log(data);
          return data;
        }

        const referralDetails = await referral.findOne({
          userId: orderDetail.userId,
        });
        console.log({ referralDetails });
        if (referralDetails && referralDetails.referred_by) {
          const referredUserData = await User.findById(
            referralDetails.referred_by
          );
          console.log({ referredUserData });

          if (referredUserData && referredUserData.is_utsav === true) {
            let walletDetailsOfReferredUser = await Wallet.findOne({
              userId: referralDetails.referred_by,
            });
            if (
              walletDetailsOfReferredUser &&
              userData.firstOrderComplete == false
            ) {
              console.log({ walletDetailsOfReferredUser });

              // Update referred user's wallet balance
              walletDetailsOfReferredUser.balance += planDetails.reward;
              const newWalletTransaction = new walletTransaction({
                userId: referralDetails.referred_by,
                type: "credit",
                transaction_message: "Referral Reward",
                amount: planDetails.reward,
                date: Date.now(),
              });
              console.log(newWalletTransaction);
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
        console.log(walletDetails);
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
              { $inc: { quantity: +quantityToReduce } },
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
      .find({
        $and: [
          dateFilter,
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
    console.log({ newStatus: newStatus });
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
  console.log({ orderDetails: orderDetails });
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
  console.log({ invoiceData: invoiceData });
  const fileName = await generateAndUploadInvoice(invoiceData);
  const invoiceLink =
    "https://d2w5oj0jmt3sl6.cloudfront.net/invoices/" + fileName;
  console.log({ invoiceLink: invoiceLink });
  orderDetails.invoicePath = invoiceLink;
  await orderDetails.save();

  console.log(`Invoice generated and uploaded successfully: ${invoiceLink}`);
}

const downloadInvoice = async (req, res) => {
  try {
    const orderDetails = await order.findById(req.params.orderId);
    console.log(orderDetails.invoicePath);
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
};
