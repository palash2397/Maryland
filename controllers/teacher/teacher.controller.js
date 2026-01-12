import Joi from "joi";
import Jwt from "jsonwebtoken";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import {
  generateRandomString,
  getExpirationTime,
  setUploadPath,
  deleteFile,
} from "../../utils/helper.js";
import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import {
  sendVerificationMail,
  sendForgotPasswordMail,
} from "../../utils/email.js";
import Teacher from "../../models/teacher/teacher.js";
import Student from "../../models/student/student.js";
import Lesson from "../../models/lesson/lesson.js";
import Quiz from "../../models/quizz/quizz.js";
import Quest from "../../models/quest/quest.js";

export const registerHandle = async (req, res) => {
  let certificatePath = null;

  if (req.file) {
    certificatePath = {
      key: req.file.key,
      url: req.file.location,
    };
  }
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      mobileNumber,
      highestQualification,
      totalExperienceYears,
      subjectsYouTeach,
      gradesYouTeach,
      gender,
      dob,
      city,
      state,
      country,
    } = req.body;

    console.log("Request body:", req.body);

    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      mobileNumber: Joi.string().required(),
      highestQualification: Joi.string().required(),
      totalExperienceYears: Joi.number().min(0).required(),
      subjectsYouTeach: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .required(),
      gradesYouTeach: Joi.alternatives()
        .try(Joi.string(), Joi.array().items(Joi.string()))
        .required(),
      gender: Joi.string().valid("Male", "Female", "other").required(),
      dob: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }
    console.log("req.file:", req.file);

    const existingStudent = await Teacher.findOne({
      $or: [{ email }, { mobileNumber }],
    });

    if (existingStudent) {
      if (existingStudent.isVerified) {
        return res.status(400).json(new ApiResponse(400, {}, Msg.USER_EXISTS));
      }

      // Generate new token and expiration
      const newToken = await generateRandomString(10);
      const newExpiration = getExpirationTime();

      // Will be hashed by pre-save hook
      existingStudent.actToken = newToken;
      existingStudent.linkExpireAt = newExpiration;

      await existingStudent.save();

      // Resend verification email
      await sendVerificationMail(firstName, email, newToken, "teacher");

      return res
        .status(200)
        .json(new ApiResponse(200, {}, Msg.EMAIL_VERIFICATION_SENT));
    }

    const token = await generateRandomString(10);
    const linkExpireAt = getExpirationTime();

    // Create new teacher
    const newTeacher = new Teacher({
      firstName,
      lastName,
      email,
      password,
      highestQualification,
      totalExperienceYears,
      subjectsYouTeach,
      mobileNumber,
      gradesYouTeach,
      gender,
      dateOfBirth: dob,
      certificate: certificatePath,
      city,
      state,
      country,
      actToken: token,
      linkExpireAt,
    });

    await newTeacher.save();

    await sendVerificationMail(firstName, email, token, "teacher");

    return res
      .status(201)
      .json(new ApiResponse(201, {}, Msg.EMAIL_VERIFICATION_SENT));
  } catch (error) {
    console.error("Error in teacher registration:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const verifyAccountHandle = async (req, res) => {
  try {
    const { token } = req.params;

    const teacher = await Teacher.findOne({
      actToken: token,
      linkExpireAt: { $gt: new Date() },
    });

    if (!teacher) {
      const expiredStudent = await Teacher.findOne({ actToken: token });
      if (expiredStudent) {
        expiredStudent.actToken = undefined;
        expiredStudent.linkExpireAt = undefined;
        await expiredStudent.save();
      }
      return res.render("linkExpired", {
        message: "Link has expired. Please request a new verification link.",
      });
    }

    // Mark account as verified
    teacher.isVerified = true;
    teacher.actToken = null;
    teacher.linkExpireAt = null;

    await teacher.save();

    return res.render("success", {
      name: teacher.firstName,
    });
  } catch (error) {
    console.error("Error in verifyAccount:", error);
    return res.status(500).render("linkExpired", {
      message: "An error occurred during verification. Please try again.",
    });
  }
};

export const loginHandle = async (req, res) => {
  try {
    const { email, password } = req.body;
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Teacher.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    console.log("user --->", user);
    if (!user)
      return res.status(400).json(new ApiResponse(400, {}, Msg.USER_NOT_FOUND));

    if (!user.isVerified)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USER_NOT_VERIFIED));

    if (!user.isActive)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.ACCOUNT_DEACTIVATED));

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    console.log("ispasswordcorrect --->", isPasswordCorrect);
    if (!isPasswordCorrect)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.INVALID_CREDENTIALS));
    const token = Jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userData = {
      userId: user._id,

      email: user.email,

      isVerified: user.isVerified,
      isActive: user.isActive,
      token: token,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, userData, Msg.LOGIN_SUCCESS));
  } catch (error) {
    console.log(`Error while logging in user:`, error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const forgotPasswordHandle = async (req, res) => {
  try {
    const { email } = req.body;

    const schema = Joi.object({
      email: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Teacher.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    // Generate reset token
    const resetToken = await generateRandomString(10);
    user.passwordResetToken = resetToken;
    user.linkExpireAt = getExpirationTime(); // 1 hour

    await user.save();

    // Send reset email
    await sendForgotPasswordMail(
      user.firstName,
      user.email,
      user.passwordResetToken,
      "teacher"
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, Msg.EMAIL_RESET_PASSWORD_LINK_SENT));
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const verifyPasswordHandle = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token)
      return res.status(400).json(new ApiResponse(400, {}, `Invalid link`));

    const user = await Teacher.findOne({ passwordResetToken: token });
    if (user) {
      if (user.linkExpireAt < new Date()) {
        return res.render("linkExpired", {
          msg: `Link expired, please request a new one`,
        });
      }
      res.render("forgotPasswordTeacher", {
        msg: "",
        vertoken: user.passwordResetToken,
      });
    } else {
      res.render("forgotPasswordTeacher", { msg: `Invalid link` });
    }
  } catch (error) {
    console.error(`Error verifying password:`, error);
    res.render("error", { msg: `Invalid link` });
  }
};

export const resetPasswordHandle = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    const schema = Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    // Find parent by activation token
    const user = await Teacher.findOne({ passwordResetToken: token });
    if (!user)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    user.password = newPassword;
    user.passwordResetToken = null;
    user.linkExpireAt = null;

    await user.save();

    res.render("passwordSuccess", { msg: `Password changed successfully` });
  } catch (error) {
    console.error(`Error changing password:`, error);
    res.render(`error`, { msg: `Invalid link` });
  }
};

export const changePasswordHandle = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const schema = Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Teacher.findById(req.user.id);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    if (oldPassword == newPassword) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, Msg.ENTERED_OLD_PASSWORD));
    }

    const isPasswordValid = await await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.PASSWORD_OLD_INCORRECT));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, Msg.PASSWORD_CHANGED));
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myProfileHandle = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id)
      .select("-password -__v -passwordResetToken -linkExpireAt -actToken -createdAt -updatedAt")
      .lean(); 
    if (!teacher) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }
    // Get counts
    const studentCount = await Student.countDocuments();
    const lessonCount = await Lesson.countDocuments({ teacherId: req.user.id });
    const quizCount = await Quiz.countDocuments({ teacherId: req.user.id });
    const questCount = await Quest.countDocuments({ teacherId: req.user.id });
    // Handle certificate URL
    let certificateUrl = null;
    if (teacher.certificate?.key) {
      certificateUrl = await getSignedFileUrl(teacher.certificate.key);
    }
    // Create response object
    const response = {
      ...teacher,
      certificate: certificateUrl ? { key: certificateUrl } : null,
      studentCount,
      lessonCount,
      quizCount,
      questCount
    };
    return res.status(200).json(new ApiResponse(200, response, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error getting teacher:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
export const dashboardHandle = async (req, res) => {
  try {
    const studentCount = await Student.countDocuments();

    const lessonCount = await Lesson.countDocuments({ teacherId: req.user.id });
    const quizCount = await Quiz.countDocuments({ teacherId: req.user.id });
    const questCount = await Quest.countDocuments({ teacherId: req.user.id });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { studentCount, lessonCount, quizCount, questCount },
          Msg.DATA_FETCHED
        )
      );
  } catch (error) {
    console.error("Error getting teacher:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
