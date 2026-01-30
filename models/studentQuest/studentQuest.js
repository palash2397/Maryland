import mongoose from "mongoose";

const studentQuestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quest",
      required: true,
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    status: {
      type: String,
      enum: ["notStarted", "inProgress", "completed", "failed"],
      default: "notStarted",
    },

    currentQuestionIndex: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    attempts: {
      type: Number,
      default: 1,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const StudentQuest = mongoose.model("StudentQuest", studentQuestSchema);
export default StudentQuest;
