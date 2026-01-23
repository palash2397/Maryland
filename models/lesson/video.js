import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    duration: {
      type: Number, // minutes
      required: true,
    },

    accessType: {
      type: String,
      enum: ["free","pro", "premium"],
      default: "free",
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },

    order: {
      type: Number, // chapter order inside lesson
      default: 0,
    },

    accessType: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    requiredPlan: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model("Video", videoSchema);
export default Video;
