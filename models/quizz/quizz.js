import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
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

    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quest",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    questions: [
      {
        question: {
          type: String,
          required: true,
        },

        options: {
          A: { type: String, required: true },
          B: { type: String, required: true },
          C: { type: String, required: true },
          D: { type: String, required: true },
        },

        correctAnswer: {
          type: String,
          enum: ["A", "B", "C", "D"],
          required: true,
        },

        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "easy",
        },
      },
    ],

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;