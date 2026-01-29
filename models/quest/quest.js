import mongoose from "mongoose";

// const questSchema = new mongoose.Schema(
//   {
//     teacherId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Teacher",
//       required: true,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       required: true,
//     },

//     difficulty: {
//       type: String,
//       enum: ["easy", "medium", "hard"],
//       default: "easy",
//     },

//     rewardPoints: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     numberOfTasks: {
//       type: Number,
//       required: true,
//       min: 1,
//     },

//     timeLimit: {
//       type: Number, // minutes
//       required: true,
//       min: 1,
//     },

//     // Attach content
//     lessonId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Lesson",
//       default: null,
//     },

//     quizId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Quiz",
//       default: null,
//     },

//     thumbnail: {
//       key: {
//         type: String,
//         default: null,
//       },
//       url: {
//         type: String,
//         default: null,
//       },
//     },

//     isPublished: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );



const questSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    // Basic info
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    questType: {
      type: String,
      default: "solo",
    },

    targetGrade: {
      type: String, // e.g. "Grade 3"
      required: true,
    },

    ageGroup: {
      type: String, // e.g. "8-9"
      required: true,
    },

    // Difficulty settings
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },

    timeLimit: {
      type: Number, // minutes
      required: true,
    },

    maxAttempts: {
      type: Number,
      default: 1,
    },

    questionCount: {
      type: Number,
      required: true,
    },

    passingScore: {
      type: Number, // percentage
      required: true,
    },

    // Rewards
    rewards: {
      xpPoints: {
        type: Number,
        default: 0,
      },
      coins: {
        type: Number,
        default: 0,
      },
      badge: {
        type: String,
        default: null,
      },
      bonusCondition: {
        type: String,
        default: null,
      },
    },

    // Prerequisites
    prerequisites: {
      lessons: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
        },
      ],
      minimumScore: {
        type: Number, // %
        default: 0,
      },
    },

    // Attachments
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },


    thumbnail: {
      type: String,
      default: null,
    },

    // Visibility
    isPublished: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    leaderboardEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


const Quest = mongoose.model("Quest", questSchema);
export default Quest;
