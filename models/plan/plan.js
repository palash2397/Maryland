import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true, // e.g. "Pro Monthly"
    },

    price: {
      type: Number,
      required: true, // 0, 299, 499
    },

    currency: {
      type: String,
      default: "USD",
    },

    interval: {
      type: String,
      enum: ["month", "year", "lifetime"],
      default: "month",
    },

    features: {
      type: [String],
      default: [],
    },

    stripePriceId: {
      type: String,
      default: null, 
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
