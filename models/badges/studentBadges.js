import mongoose from "mongoose";

const studentBadgeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true,
    },

    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudentBadge = mongoose.model("StudentBadge", studentBadgeSchema);
export default StudentBadge;
