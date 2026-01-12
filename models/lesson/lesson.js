import mongoose from "mongoose";
const lessonSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    difficultyLevel: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: false,
      default: null
    },
    video: {
      type: String,
      required: false,
      default: null
    },
    videoLink: {
      type: String,
      required: false,
      default: null
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    }
  },
  {
    timestamps: true
  }
);
 const Lesson = mongoose.model("Lesson", lessonSchema);
 export default Lesson;