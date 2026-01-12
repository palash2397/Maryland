import mongoose from "mongoose";

const teacherReviewSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    review: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ One student can review a teacher only once
teacherReviewSchema.index(
  { teacherId: 1, studentId: 1 },
  { unique: true }
);

const TeacherReview = mongoose.model("TeacherReview", teacherReviewSchema);
export default TeacherReview;
