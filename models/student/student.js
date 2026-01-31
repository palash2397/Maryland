import mongoose from "mongoose";
import bcrypt from "bcrypt";

const studentSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      maxlength: [50, "userName cannot be more than 50 characters"],
      required: false,
      default: null,
    },
    firstName: {
      type: String,
      required: [true, "firstName is required"],
      maxlength: [50, "firstName cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "lastName is required"],
      maxlength: [50, "lastName cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      trim: true, // This will automatically trim any whitespace
      default: null,
    },

    age: {
      type: Number,
      min: [0, "Age cannot be negative"],
      max: [120, "Age seems unrealistic"],
      default: null,
    },
    grade: {
      type: Number,
      default: null,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    coins: { type: Number, default: 0 },
    badges: [{ type: String }],

    googleId: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "student",
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    actToken: {
      type: String,
      default: null,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    linkExpireAt: {
      type: Date,
      default: null,
    },

    fcmToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
studentSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password
studentSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model("Student", studentSchema);
export default Student;
