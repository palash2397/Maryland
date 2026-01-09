import mongoose from "mongoose";

const questSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    rewardPoints: {
      type: Number,
      required: true,
      min: 0,
    },

    numberOfTasks: {
      type: Number,
      required: true,
      min: 1,
    },

    timeLimit: {
      type: Number, // minutes
      required: true,
      min: 1,
    },

    // Attach content
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    thumbnail: {
      key: {
        type: String,
        default: null,
      },
      url: {
        type: String,
        default: null,
      },
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Quest = mongoose.model("Quest", questSchema);
export default Quest;
