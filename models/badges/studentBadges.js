import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true, // e.g. FIRST_QUEST
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    icon: {
      type: String, // s3 key or static icon name
      default: null,
    },

    type: {
      type: String,
      enum: ["quest", "level"],
      required: true,
    },

    conditionValue: {
      type: Number,
      required: true, // e.g. 1 quest, level 3
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Badge = mongoose.model("Badge", badgeSchema);
export default Badge;
