const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Order = require("../../models/Order/newOrder");
const Variant = require("../../models/product/Varient");
const Wallet = require("../../models/Wallet/wallet");
const WalletTransaction = require("../../models/Wallet/WalletTransaction");
const Reward = require("../../models/reward/Reward");
const RewardTransaction = require("../../models/reward/RewardTransaction");
const User = require("../../models/auth/userSchema");
const MembershipPlan = require("../../models/Utsab/MembershipPlan");
const Referral = require("../../models/auth/referral");
const Transaction = require("../../models/payment/paymentSc");
const bcrypt = require("bcrypt");
const { calculateCartPricing } = require("../../services/pricingService");
const sendSms = require("./smsService");
const sendOrderConfirmationEmail = require("./emailService");
const { generateAndUploadInvoice } = require("../../utils/invoiceGenerator");
const { getSocketInstance } = require("../../socket");
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
        totalPrice: finalTotal,
        rewardBalanceUsed: rewardUsed,
        couponDiscount: couponDiscount,
      },

      shippingAddress: req.body.shippingAddress,
      billingAddress: req.body.billingAddress || null,

      paymentInfo: {
        method,
        isPaid: method !== "COD",
        paidAt: method === "COD" ? null : new Date(),
        transactionId: null,      // fill after creating Transaction
        paymentStatus: method === "COD" ? "Pending" : "Completed",
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
    await updateStatusDetails(newOrder._id, "Pending");

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
    const orderId = req.body.orderId;
    const newStatus = req.body.status;

    const orderDoc = await Order.findById(orderId).populate("userId");
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
    io.emit("orderStatusUpdated", { orderId: orderDoc._id, status: newStatus });

    // Confirmed → send email/SMS
    if (newStatus === "Confirmed") {
      await sendOrderConfirmationEmail(orderDoc, orderDoc.userId);

      const userData = await User.findOne({
        _id: orderDoc.userId._id,
        is_Active: true,
        blocking: false,
      });
      if (userData) {
        await sendSms("messageForOrderConfirmed", {
          phoneNumber: userData.phone,
          totalOrder: orderDoc.pricing.totalPrice,
          itemName: orderDoc._id.toString(),
        });
      }
    }

    // Shipping → invoice + SMS
    if (newStatus === "Shipping" || newStatus === "Shipped") {
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
            item.productId,
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
          .filter((i) => i.productId.isUtsav)
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


/**
 * Push initial statusHistory entry (“Pending”) if none exists
 */
async function updateStatusDetails(orderId, status = "Pending") {
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


module.exports = {
  placeOrderv2,
  updateStatusv2,
};
