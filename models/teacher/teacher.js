import mongoose from "mongoose";
import bcrypt from "bcrypt";

const TeacherSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },

    highestQualification: {
      type: String,
      required: true,
    },
    totalExperienceYears: {
      type: Number,
      required: true,
      min: 0,
    },

    subjectsYouTeach: {
      type: [String],
      required: true,
    },
    gradesYouTeach: {
      type: [String],
      required: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    certificate: {
      key: {
        type: String,
        default: null,
      },
      url: {
        type: String,
        default: null,
      },
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    actToken: {
      type: String,
    },
    linkExpireAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
TeacherSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password
TeacherSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Teacher = mongoose.model("Teacher", TeacherSchema);
export default Teacher;
