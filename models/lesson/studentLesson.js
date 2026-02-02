import mongoose from "mongoose";

const studentLessonSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },

    completedVideos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    progress: {
      type: Number, // percentage (0–100)
      default: 0,
    },

    rewarded: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["inProgress", "completed"],
      default: "inProgress",
    },

    lastVideoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
  },
  { timestamps: true }
);

const StudentLessonProgress = await mongoose.model(
  "StudentLessonProgress",
  studentLessonSchema
);

export default StudentLessonProgress;
