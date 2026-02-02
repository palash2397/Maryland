import mongoose from "mongoose";


const rewardLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  type: {
    type: String, // lesson | quiz | quest | badge
  },
  title: String, // "Quest Winner"
  points: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const RewardLogs = mongoose.model("RewardLogs", rewardLogSchema)
export default RewardLogs
