import mongoose from "mongoose";

const billingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    stripePaymentIntentId: {
      type: String,
      required: true,
    },

    stripeInvoiceId: {
      type: String,
      default: null,
    },

    amount: {
      type: Number, // in smallest currency unit
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["paid", "failed", "refunded"],
      default: "paid",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const BillingHistory = mongoose.model(
  "BillingHistory",
  billingHistorySchema
);

export default BillingHistory;
