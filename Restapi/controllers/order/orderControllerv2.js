const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../../models/Order/newOrder");
const Variant = require("../../models/product/Varient");
const Wallet = require("../../models/Wallet/wallet");
const WalletTransaction = require("../../models/Wallet/WalletTransaction");
const Reward = require("../../models/reward/Reward");
const RewardTransaction = require("../../models/reward/RewardTransaction");
const User = require("../../models/auth/userModel");
const MembershipPlan = require("../../models/Utsab/MembershipPlan");
const Referral = require("../../models/auth/referral");
const Transaction = require("../../models/payment/paymentSc");
const bcrypt = require("bcrypt");
const { calculateCartPricing } = require("../../services/pricingService");
const sendSms = require("./smsService");
const { sendOrderConfirmEmail } = require("./emailService");
const { generateAndUploadInvoice } = require("../../utils/invoiceGenerator");
const { getSocketInstance } = require("../../socket");


async function invoiceGenerate(order) {
  // Fetch user details if needed
  // (Assume getUserInfo is your async DB fetch; else, remove/refactor)
  // const user = await getUserInfo(order.userId);

  const invoiceData = {
    orderId: order.orderNumber,
    invoiceNumber: "INV-" + Math.random().toString().slice(2, 10),
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    customerName: order.shippingAddress.fullName,
    customerEmail: order.userId.email ?? "", // Not present in order object; add if available
    customerPhoneNumber: order.billingAddress.phoneNumber,
    customerBilling: `${order.billingAddress.addressLine1}${order.billingAddress.addressLine2 ? ', ' + order.billingAddress.addressLine2 : ''}, ${order.billingAddress.city}, ${order.billingAddress.state}, ${order.billingAddress.postalCode}`,
    customerShipping: `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}`,
    payment_method: order.paymentInfo.method,
    items: order.orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxPercent: item.taxPercent,
      price: item.sellingPrice,
    })),
    subtotal: order.pricing.itemsPrice,
    discount: order.pricing.discountPrice,
    gst: order.pricing.taxPrice,
    couponDiscount: order.pricing.couponDiscount,
    utsavDiscount: order.pricing.utsavDiscount,
    shipping: order.pricing.shippingPrice,
    total: order.pricing.totalPrice,
  };

  const fileName = await generateAndUploadInvoice(invoiceData); // Implement as needed
  order.invoicePath = fileName;

  // Save accordingly; if using Mongoose, do:
  if (typeof order.save === "function") {
    await order.save();
  } else {
    // Otherwise, update in your DB as needed
    // e.g., await db.orders.update({ _id: order._id }, { $set: { invoicePath: fileName } });
  }
}


const placeOrderv2 = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { paymentInfo } = req.body;


    if (paymentInfo.method === "Wallet") {

      const walletDoc = await Wallet.findOne({ userId }).session(session);
      if (!walletDoc) {
        throw new Error("No wallet found for this user.");
      }
      if (walletDoc.isPinRequired) {
        const providedPin = paymentInfo.walletPin;
        if (!providedPin || !/^\d{4}$/.test(providedPin)) {
          throw new Error("Wallet PIN is required and must be 4 digits.");
        }

        const isPinMatch = await bcrypt.compare(providedPin, walletDoc.pinHash);
        if (!isPinMatch) {
          throw new Error("Incorrect wallet PIN.");
        }
      }

    }



    const {
      cartItems,
      pricing,
      couponDiscount,
      rewardUsed,
      finalTotal,
      paymentMethods,
    } = await calculateCartPricing(
      userId,
      req.body.orderItems,
      (req.body.paymentInfo.couponCode || "").trim().toUpperCase(),
      Boolean(req.body.paymentInfo.useReward)
    );


    // 2) Deduct stock inside the SAME session/transaction
    for (const item of cartItems) {
      const variant = await Variant.findById(item.productId).session(session);
      variant.quantity -= item.itemQuantity;
      await variant.save({ session });
    }

    // 3) If paying by Wallet, deduct wallet balance (in same session)
    const { method } = req.body.paymentInfo;
    const providedPin = paymentInfo.walletPin;
    if (method === "Wallet") {

      const walletDoc = await Wallet.findOne({ userId }).session(session);
      if (!walletDoc || walletDoc.balance < finalTotal) {
        throw new Error("Insufficient wallet balance!");
      }
      walletDoc.balance -= finalTotal;
      const walletTx = new WalletTransaction({
        userId,
        type: "debit",
        transaction_message: "Balance used in Purchase",
        amount: finalTotal,
        date: Date.now(),
      });
      await walletTx.save({ session });
      walletDoc.transactions.push(walletTx._id);
      await walletDoc.save({ session });
    }

    // 4) Compute totalUtsavReward & totalBasicReward
    let totalUtsavReward = 0;
    let totalBasicReward = 0;
    for (const item of cartItems) {
      const variant = await Variant.findById(item.productId).session(session);
      totalUtsavReward += (variant.utsavReward || 0) * item.itemQuantity;
      totalBasicReward += (variant.basicReward || 0) * item.itemQuantity;
    }

    // 5) Fetch user's is_utsav flag
    const userDoc = await User.findById(userId).session(session);
    const isUtsavUser = Boolean(userDoc.is_utsav);

    // 6) Compute expected delivery
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 6);

    // 7) Build the new Order document
    const newOrder = new Order({
      orderNumber: `FD${Date.now().toString().slice(-6)}${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      userId,
      cartId: req.body.cartId || null,

      // transform cartItems → orderItems
      orderItems: cartItems.map((ci) => {
        const taxAmt = parseFloat(
          ((ci.sellingPrice * ci.itemQuantity) / (ci.taxPercent + 100) * ci.taxPercent).toFixed(2)
        );
        const subtotalLine = parseFloat(
          ((ci.sellingPrice * ci.itemQuantity) + taxAmt - (ci.unitPrice - ci.sellingPrice) * ci.itemQuantity).toFixed(2)
        );

        return {
          variantId: ci.productId,
          sku: ci.sku,      // or fill from actual variant.sku if preferred
          name: ci.name,               // fill if needed
          attributes: {},         // fill if needed
          quantity: ci.itemQuantity,
          unitPrice: ci.unitPrice,
          sellingPrice: ci.sellingPrice,
          discount: (ci.unitPrice - ci.sellingPrice) * ci.itemQuantity,
          taxPercent: ci.taxPercent,
          images: ci.images,             // optional from variant.images
          isActive: true,
          requestedQuantity: ci.itemQuantity,
        };
      }),

      pricing: {
        itemsPrice: pricing.subtotal,
        taxPrice: pricing.tax,
        shippingPrice: pricing.shippingCost,
        discountPrice: pricing.discount,
        couponDiscount: couponDiscount,
        utsavDiscount: pricing.utsavDiscount,
        rewardUsed: rewardUsed,
        totalPrice: finalTotal
      },

      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || req.body.shippingAddress,


      paymentInfo: {
        method,
        isPaid: method === "PayU" ? false : method !== "COD",
        paidAt: method === "COD" || method === "PayU" ? null : new Date(),
        transactionId: null, // fill after creating Transaction
        paymentStatus: method === "PayU" ? "Initiated" : method === "COD" ? "Pending" : "Completed",
        gatewayResponse: req.body.paymentInfo.gatewayResponse || null,
      },

      shippingInfo: {
        shippingCarrier: "",
        trackingNumber: "",
        shippingCost: pricing.shippingCost,
        estimatedDelivery: expectedDeliveryDate,
        shippedAt: null,
        deliveredAt: null,
      },

      orderStatus: "Pending",
      statusHistory: [],

      isActive: true,
      isDeleted: false,

      refund: { amount: 0, refundedAt: null, reason: "" },

      metadata: {
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
        notes: req.body.notes || "",
        couponCode: (req.body.paymentInfo.couponCode || "").trim().toUpperCase()
      },
      utsavReward: totalUtsavReward,
      basicReward: totalBasicReward,
      expectedDeliveryDate,
      shippingCost: pricing.shippingCost,
    });

    // 8) Save new Order (still in session)
    await newOrder.save({ session });

    // 9) Deduct reward points if used
    if (rewardUsed > 0) {
      const rewardDoc = await Reward.findOne({ userId }).session(session);
      if (!rewardDoc || rewardDoc.points < rewardUsed) {
        throw new Error("Insufficient reward points!");
      }
      rewardDoc.points -= rewardUsed;
      const rewardTx = new RewardTransaction({
        userId,
        type: "debit",
        transaction_message: "Points used in Purchase",
        points: rewardUsed,
        date: Date.now(),
      });
      await rewardTx.save({ session });
      rewardDoc.transactions.push(rewardTx._id);
      await rewardDoc.save({ session });
    }

    // 10) Create a Transaction record for payment/WALLET tracking
    const newTxn = new Transaction({
      orderId: newOrder._id,
      amount: finalTotal,
      currency: "INR",
      userId,
    });
    await newTxn.save({ session });


    // Attach transactionId to order
    newOrder.paymentInfo.transactionId = newTxn._id;
    await newOrder.save({ session });

    // 11) COMMIT the entire transaction (stock + wallet + order + reward + transaction)
    await session.commitTransaction();
    session.endSession();

    // 12) Push initial statusHistory entry (“Pending”)
    if (method === "COD"){
       await updateStatusDetails(newOrder._id, "Confirmed");
    } else {
       await updateStatusDetails(newOrder._id, "Pending");
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: newOrder,
      paymentMethods,
    });
  } catch (err) {
    // If anything threw, ABORT and roll back ALL stock/wallet/reward changes
    await session.abortTransaction();
    session.endSession();
    console.error("placeOrder v2 error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};


/**
 * updateStatus (with referral/utsav logic on “Completed”)
 */
const updateStatusv2 = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    const orderDoc = await Order.findById(orderId).populate({ path: "userId", model: "user" });
    if (!orderDoc) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    orderDoc.orderStatus = newStatus;
    orderDoc.statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      note: req.body.note || "",
    });
    await orderDoc.save();

    // Emit via Socket.io
    const io = getSocketInstance();
    io.emit("orderStatusUpdated", { orderId: orderDoc.orderNumber, status: newStatus });

    // Confirmed → send email/SMS
    if (newStatus === "Confirmed") {
      await sendOrderConfirmEmail(orderDoc, orderDoc.userId);

      const userData = await User.findOne({
        _id: orderDoc.userId._id,
        is_Active: true,
        blocking: false,
      });

      if (userData) {
        await sendSms("messageForOrderConfirmed", {
          phoneNumber: userData.phone,
          totalOrder: orderDoc.pricing.totalPrice,
          itemName: orderDoc.orderNumber.toString(),
        });
      }
    }

    // Shipping → invoice + SMS
    if (newStatus === "Shipping" || newStatus === "Shipped") {
      // Assuming you have an invoiceGenerate function defined elsewhere
      await invoiceGenerate(orderDoc);

      const userData = await User.findOne({
        _id: orderDoc.userId._id,
        is_Active: true,
        blocking: false,
      });

      if (userData) {
        await sendSms("messageForOrderOnTheWay", {
          phoneNumber: userData.phone,
          itemName: "",
        });
      }
    }

    // Delivered → mark deliveredAt + SMS
    if (newStatus === "Delivered") {
      orderDoc.shippingInfo.deliveredAt = new Date();
      await orderDoc.save();

      const userData = await User.findOne({
        _id: orderDoc.userId._id,
        is_Active: true,
        blocking: false,
      });

      if (userData) {
        await sendSms("messageForOrderDelivary", { phoneNumber: userData.phone });
      }
    }

    // Canceled → refund reward + restore stock
    if (newStatus === "Canceled") {
      if (orderDoc.rewardBalanceUsed > 0) {
        const rewardDoc = await Reward.findOne({ userId: orderDoc.userId });
        if (rewardDoc) {
          rewardDoc.points += orderDoc.rewardBalanceUsed;
          const refundRewardTx = new RewardTransaction({
            userId: orderDoc.userId,
            type: "credit",
            transaction_message: "Refund from canceled order",
            points: orderDoc.rewardBalanceUsed,
            date: Date.now(),
          });
          await refundRewardTx.save();
          rewardDoc.transactions.push(refundRewardTx._id);
          await rewardDoc.save();
        }
      }

      // restore stock (outside of transaction here—order is already in DB)
      await Promise.all(
        orderDoc.orderItems.map(async (item) => {
          await Variant.findByIdAndUpdate(
            item.variantId, // NOTE: your schema has `variantId` for orderItems, not productId
            { $inc: { quantity: item.quantity } },
            { new: true }
          );
        })
      );
    }

    // Completed → referral/utsav + credit basicReward
    if (newStatus === "Completed") {
      try {
        const userData = await User.findById(orderDoc.userId);
        const rewardDoc = await Reward.findOne({ userId: orderDoc.userId });
        const membershipPlan = await MembershipPlan.findOne({ identity: "PLAN_IDENTITY" });

        if (!userData || !rewardDoc || !membershipPlan) {
          return res.status(404).json({
            success: false,
            message: "Required details not found",
          });
        }

        // 1) Check Utsav membership qualification:
        const utsavTotalPrice = orderDoc.orderItems
          .filter((i) => i.variantId.isUtsav) // This assumes variantId is populated or a subdocument; if not, you'll need to populate or fetch product
          .reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);

        if (!userData.is_utsav && utsavTotalPrice >= membershipPlan.amount) {
          userData.is_utsav = true;
          await userData.save();
          await sendSms("messageForUtsavMember", { phoneNumber: userData.phone });
        } else if (
          !userData.is_utsav &&
          orderDoc.pricing.totalPrice >= 499 &&
          orderDoc.pricing.totalPrice <= 4998
        ) {
          // 2) Check referral for ₹49 reward
          const referralDoc = await Referral.findOne({ userId: orderDoc.userId });
          if (referralDoc && referralDoc.referred_by && !userData.firstOrderComplete) {
            const referrerReward = await Reward.findOne({ userId: referralDoc.referred_by });
            const referrer = await User.findById(referralDoc.referred_by);

            if (referrerReward && referrer && referrer.is_utsav) {
              referrerReward.points += 49;
              const refTx = new RewardTransaction({
                userId: referralDoc.referred_by,
                type: "credit",
                transaction_message: "Referral Reward for First Purchase",
                points: 49,
                date: Date.now(),
              });
              await refTx.save();
              referrerReward.transactions.push(refTx._id);
              await referrerReward.save();

              userData.firstOrderComplete = true;
              await userData.save();
            }
          }
        }

        // 3) Credit basicReward
        rewardDoc.points += orderDoc.basicReward;
        const basicRewardTx = new RewardTransaction({
          userId: orderDoc.userId,
          type: "credit",
          transaction_message: "Order Completion Reward",
          points: orderDoc.basicReward,
          date: Date.now(),
        });
        await basicRewardTx.save();
        rewardDoc.transactions.push(basicRewardTx._id);
        await rewardDoc.save();

        return res.status(200).json({
          success: true,
          message: "Rewards and referrals processed successfully",
        });
      } catch (subErr) {
        console.error("Error in referral/utsav logic:", subErr);
        return res.status(500).json({
          success: false,
          message: subErr.message || "Internal Server Error in referral logic",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${newStatus}"`,
      order: orderDoc,
    });
  } catch (err) {
    console.error("updateStatus error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

const updateNewStatusv2 = async (orderId, status) => {
  try {
    const newStatus = status;

    const orderDoc = await Order.findById(orderId).populate({ path: "userId", model: "user" });
    if (!orderDoc) {
      console.warn("Order not found:", orderId);
      return;
    }

    orderDoc.orderStatus = newStatus;
    orderDoc.statusHistory.push({
      status: newStatus,
      updatedAt: new Date(),
      note: "", // You can optionally pass `note` from the calling function if needed
    });
    await orderDoc.save();

    const io = getSocketInstance();
    io.emit("orderStatusUpdated", { orderId: orderDoc.orderNumber, status: newStatus });

    if (newStatus === "Confirmed") {
      await sendOrderConfirmEmail(orderDoc, orderDoc.userId);
      const userData = await User.findOne({ _id: orderDoc.userId._id, is_Active: true, blocking: false });
      if (userData) {
        await sendSms("messageForOrderConfirmed", {
          phoneNumber: userData.phone,
          totalOrder: orderDoc.pricing.totalPrice,
          itemName: orderDoc.orderNumber.toString(),
        });
      }
    }

    console.log(`Order ${orderId} status updated to "${newStatus}"`);
  } catch (err) {
    console.error("updateNewStatusv2 error:", err.message);
  }
};




/**
 * Push initial statusHistory entry (“Pending”) if none exists
 */
async function updateStatusDetails(orderId, status) {
  try {
    const orderDoc = await Order.findById(orderId);
    if (!orderDoc) return;
    if (!orderDoc.statusHistory || orderDoc.statusHistory.length === 0) {
      orderDoc.statusHistory = [{ status, updatedAt: new Date(), note: "" }];
      await orderDoc.save();
    }
  } catch (e) {
    console.error("updateStatusDetails error:", e);
  }
}


const getNewOrder = async (req, res) => {
  try {
    // Paging
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Filters
    const filters = {
      isDeleted: { $ne: true },
      userId: req.user._id
    };

    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) filters.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.createdAt.$lte = new Date(req.query.endDate);
    }
    if (req.query.status) filters.orderStatus = req.query.status;
    if (req.query.paymentMethod) filters["paymentInfo.method"] = req.query.paymentMethod;

    // Query orders with all items, but select only necessary fields
    const [orders, total] = await Promise.all([
      Order.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select(
          "_id orderNumber createdAt orderStatus pricing paymentInfo.method orderItems"
        )
        .lean(),
      Order.countDocuments(filters)
    ]);

    // For each order: Show first orderItem fields, and count others
    const formattedOrders = orders.map(order => {
      let firstItem = null, moreItemCount = 0;
      if (order.orderItems && order.orderItems.length > 0) {
        const item = order.orderItems[0];
        firstItem = {
          name: item.name,
          sku: item.sku,
          images: item.images || [],
        };
        moreItemCount = order.orderItems.length - 1;
      }
      return {
        id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        pricing: order.pricing,
        paymentInfo: { method: order.paymentInfo.method },
        firstItem,
        moreItemCount
      };
    });

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      orders: formattedOrders
    });

  } catch (err) {
    console.error("getNewOrder error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  }
};


// GET /api/orders/:orderId
const getOrderDetailsID = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,        // Only own orders!
      isDeleted: { $ne: true }
    })
      .populate('userId', 'fullName email') // can remove, since user = self
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};
const getOrderDetailsByAdmin = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({
      _id: orderId,     
      isDeleted: { $ne: true }
    })
      .populate('userId', 'fullName email') // can remove, since user = self
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

// POST /api/orders/:orderId/cancel
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find & check order status
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Only allow cancel if not already shipping, shipped, delivered, cancelled, etc.
    if (
      ["Shipping", "Delivered", "Canceled", "Returned", "Refunded", "Completed"]
        .includes(order.orderStatus)
    ) {
      return res.status(400).json({ success: false, message: "This order cannot be cancelled." });
    }

    // Update status
    order.orderStatus = "Canceled";
    order.statusHistory.push({
      status: "Canceled", updatedAt: new Date(), note: req.body.note || "Cancelled by user."
    });
    await order.save();

    res.status(200).json({ success: true, message: "Order cancelled.", orderStatus: order.orderStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

// PUT /api/orders/:orderId/address
const requestAddressChange = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const newAddress = req.body.shippingAddress;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
      isDeleted: { $ne: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Allow change only before Shipping state (do not allow after "Shipping" or later)
    if (["Shipping", "Delivered", "Canceled", "Returned", "Refunded", "Completed"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Address change not allowed after order is shipped."
      });
    }

    order.shippingAddress = newAddress;
    order.statusHistory.push({
      status: order.orderStatus,
      updatedAt: new Date(),
      note: "[User] requested address change."
    });
    await order.save();

    res.status(200).json({ success: true, message: "Shipping address updated.", shippingAddress: order.shippingAddress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

// PUT /api/orders/:orderId/payment-status
const updatePaymentStatus = async (req, res) => {
  try {
    // Defensive: ensure auth context
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user context missing' });
    }

    const orderId = req.params.orderId;
    const { isPaid, paymentStatus, paidAt, gatewayResponse, method } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,         // Only the user's order!
      isDeleted: { $ne: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Update payment info
    if (typeof isPaid === "boolean") order.paymentInfo.isPaid = isPaid;
    if (paymentStatus) order.paymentInfo.paymentStatus = paymentStatus;
    if (paidAt) order.paymentInfo.paidAt = new Date(paidAt);
    if (gatewayResponse !== undefined) order.paymentInfo.gatewayResponse = gatewayResponse;
    if (order.paymentInfo.method === "COD" && method && method !== "COD") {
      order.paymentInfo.method = method;
    }
    await order.save();

    res.status(200).json({ success: true, message: "Payment status updated.", paymentInfo: order.paymentInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};


async function adminGetOrders(req, res) {
  try {
    // 1. Parse pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // 2. Build filters
    const filters = { isDeleted: { $ne: true } };

    // Date range filter (createdAt)
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) filters.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filters.createdAt.$lte = new Date(req.query.endDate);
    }

    // Status filter: allow comma separated or array
    if (req.query.status) {
      const statuses = Array.isArray(req.query.status)
        ? req.query.status
        : req.query.status.split(",").map(s => s.trim());
      if (statuses.length)
        filters.orderStatus = { $in: statuses };
    }

    // By order number (exact match)
    if (req.query.orderNumber)
      filters.orderNumber = req.query.orderNumber;

    // By userId (optional: string or ObjectId)
    if (req.query.userId) {
      try {
        filters.userId = mongoose.Types.ObjectId(req.query.userId);
      } catch (_) {
        return res.status(400).json({ success: false, message: "Invalid userId" });
      }
    }

    // Additional filter: paymentMethod
    if (req.query.paymentMethod)
      filters["paymentInfo.method"] = req.query.paymentMethod;

    // 3. Query total count and page
    const [orders, total] = await Promise.all([
      Order.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email phone") // Optionally populate
        .select(
          "_id orderNumber createdAt orderStatus pricing.paymentInfo pricing.totalPrice "
          + "userId paymentInfo.method orderItems"
        )
        .lean(),
      Order.countDocuments(filters)
    ]);

    // 4. Optionally, count by status for dashboard
    const statusEnum = [
      "Pending","Confirmed","Processing","Shipping","Delivered",
      "Canceled","Returned","Refunded","Completed"
    ];
    const countsByStatus = await Order.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);
    const statusStats = {};
    statusEnum.forEach(sts => {
      statusStats[sts] = (countsByStatus.find(d => d._id === sts) || {}).count || 0;
    });

    // 5. Response structure
    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: statusStats,
      orders: orders.map(o => ({
        id: o._id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        orderStatus: o.orderStatus,
        totalPrice: o.pricing?.totalPrice,
        paymentMethod: o.paymentInfo?.method,
        user: o.userId
          ? { id: o.userId._id, name: o.userId.fullName, email: o.userId.email, phone: o.userId.phone }
          : null,
        firstItem: o.orderItems && o.orderItems[0]
          ? {
              name: o.orderItems[0].name,
              sku: o.orderItems[0].sku,
              images: o.orderItems[0].images || [],
            }
          : null,
        moreItemCount: o.orderItems ? o.orderItems.length - 1 : 0,
      }))
    });

  } catch (err) {
    console.error("adminGetOrders error:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
}





module.exports = {
  placeOrderv2,
  updateStatusv2,
  getNewOrder,
  getOrderDetailsID,
  cancelOrder,
  requestAddressChange,
  updatePaymentStatus,
  updateNewStatusv2,
  adminGetOrders,
  getOrderDetailsByAdmin
};
