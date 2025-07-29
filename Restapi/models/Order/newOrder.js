// models/Order/orderSchema.js

const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

/**
 * Sub‐schema: each item in an order
 * (only a single reference to Variant, no separate productId)
 */
const OrderItemSchema = new Schema(
  {
    variantId: {
      type: Types.ObjectId,
      ref: "Variant",
      required: true
    },
    sku: {
      type: String,
      trim: true,
      default: ""
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    attributes: {
      // e.g. { color: "White", size: "M" }
      type: Schema.Types.Mixed,
      default: {}
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    requestedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

/**
 * Sub‐schema: an address (shipping or billing)
 */
const AddressSchema = new Schema(
  {
    fullName: { type: String, trim: true, required: true },
    phoneNumber: { type: String, trim: true, required: true },
    addressLine1: { type: String, trim: true, required: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true },
    postalCode: { type: String, trim: true, required: true },
    landmark: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

/**
 * Sub‐schema: payment details
 */
const PaymentInfoSchema = new Schema(
  {
    method: {
      type: String,
      trim: true,
      enum: ["COD", "Credit Card", "Debit Card", "UPI", "NetBanking", "Wallet", "PayU", "Other"],
      default: "Other"
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date,
      default: null
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null
    },
    paymentStatus: {
      type: String,
      trim: true,
      enum: ["Initiated", "Pending", "Completed", "Failed", "Refunded"],
      default: "Pending"
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  { _id: false }
);

/**
 * Sub‐schema: shipping info
 */
const ShippingInfoSchema = new Schema(
  {
    shippingCarrier: { type: String, trim: true, default: "" },
    trackingNumber: { type: String, trim: true, default: "" },
    shippingCost: { type: Number, default: 0, min: 0 },
    estimatedDelivery: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null }
  },
  { _id: false }
);

/**
 * Sub‐schema: refund details
 */
const RefundSchema = new Schema(
  {
    amount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date, default: null },
    reason: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

/**
 * Sub‐schema: status history entry
 */
const StatusHistoryItem = new Schema(
  {
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipping",
        "Delivered",
        "Canceled",
        "Returned",
        "Refunded",
        "Completed"
      ],
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

/**
 * Main Order schema
 */
const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
      // e.g. "FD20250603-000123"
    },
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true
    },
    cartId: {
      type: Types.ObjectId,
      ref: "Cart",
      default: null
    },

    orderItems: {
      type: [OrderItemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, "Order must have at least one item"]
    },

    pricing: {
      itemsPrice: { type: Number, required: true, min: 0 },
      taxPrice: { type: Number, required: true, min: 0 },
      shippingPrice: { type: Number, required: true, min: 0 },
      couponDiscount: { type: Number, required: true, min: 0 },
      discountPrice: { type: Number, required: true, min: 0 },
      utsavDiscount: { type: Number, required: true, min: 0 },
      rewardUsed: { type: Number, required: false, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 }
    },

    shippingAddress: {
      type: AddressSchema,
      required: true
    },

    billingAddress: {
      type: AddressSchema,
      default: null
    },

    paymentInfo: {
      type: PaymentInfoSchema,
      required: true
    },

    shippingInfo: {
      type: ShippingInfoSchema,
      default: () => ({})
    },

    orderStatus: {
      type: String,
      trim: true,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipping",
        "Delivered",
        "Canceled",
        "Returned",
        "Refunded",
        "Completed"
      ],
      default: "Pending"
    },

    statusHistory: {
      type: [StatusHistoryItem],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    refund: {
      type: RefundSchema,
      default: () => ({})
    },

    metadata: {
      ipAddress: { type: String, trim: true, default: "" },
      userAgent: { type: String, trim: true, default: "" },
      notes: { type: String, trim: true, default: "" },
      couponCode: { type: String, trim: true, default: "" },
      appliedWalletAmount: { type: Number, default: 0, min: 0 }
    },

    // Legacy‐style / reward fields
    utsavReward: {
      type: Number,
      default: 0,
      min: 0
    },
    basicReward: {
      type: Number,
      default: 0,
      min: 0
    },
    
    expectedDeliveryDate: {
      type: Date,
      default: null
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },

    invoicePath: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Index for quick lookup by orderNumber
OrderSchema.index({ orderNumber: 1 });

/**
 * Pre‐save hook: if new, push a “Pending” into statusHistory
 */
OrderSchema.pre("save", function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory.push({ status: this.orderStatus, updatedAt: new Date(), note: "" });
  }
  next();
});


module.exports = model("NewOrder", OrderSchema, "neworder");
