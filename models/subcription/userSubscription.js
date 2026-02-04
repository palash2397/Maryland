import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },

    planId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: function(){
        return this.plan !== "free";
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive", "cancelled", "expired"],
      default: "inactive",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    paymentIntenId:{
      type: String,
      default: null,
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    stripeSubscriptionId: {
      type: String,
      default: null,
    },

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const UserSubscription = mongoose.model(
  "UserSubscription",
  userSubscriptionSchema
);
export default UserSubscription;
