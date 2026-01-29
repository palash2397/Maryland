import Joi from "joi";
import Jwt from "jsonwebtoken";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";

import {
  generateRandomString,
  getExpirationTime,
  deleteOldImages,
} from "../../utils/helper.js";
import Teacher from "../../models/teacher/teacher.js";
import Video from "../../models/lesson/video.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";
import {
  sendVerificationMail,
  sendForgotPasswordMail,
} from "../../utils/email.js";

import Student from "../../models/student/student.js";
import Lesson from "../../models/lesson/lesson.js";
import TeacherReview from "../../models/review/review.js";

export const registerHandle = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    const schema = Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "string.required": "Password is required",
      }),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Passwords do not match",
        }),
    });
    const { error } = schema.validate(req.body);

    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    // Check if user already exists
    const existingStudent = await Student.findOne({ email });

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
      await sendVerificationMail(firstName, email, newToken, "student");

      return res
        .status(200)
        .json(new ApiResponse(200, {}, Msg.EMAIL_VERIFICATION_SENT));
    }

    // If user doesn't exist, create new user
    const token = await generateRandomString(10);
    const linkExpireAt = getExpirationTime();

    const newStudent = new Student({
      firstName,
      lastName,
      email,
      password,
      actToken: token,
      linkExpireAt,
    });

    await newStudent.save();

    // Send verification email
    await sendVerificationMail(firstName, email, token, "student");

    console.log("Verification email sent successfully");

    await UserSubscription.create({
      userId: newStudent._id,
      plan: "free",
      status: "active",
      startDate: new Date(),
      endDate: null,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, {}, Msg.EMAIL_VERIFICATION_SENT));
  } catch (error) {
    console.error("Error in registerHandle:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const verifyAccountHandle = async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({
      actToken: token,
      linkExpireAt: { $gt: new Date() },
    });

    if (!student) {
      const expiredStudent = await Student.findOne({ actToken: token });
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
    student.isVerified = true;
    student.actToken = null;
    student.linkExpireAt = null;

    await student.save();

    return res.render("success", {
      name: student.firstName,
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

    const user = await Student.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
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
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    const userData = {
      userId: user._id,

      email: user.email,
      role: user.role,
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

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    // Generate reset token
    const resetToken = await generateRandomString(10);
    student.passwordResetToken = resetToken;
    student.linkExpireAt = getExpirationTime(); // 1 hour

    await student.save();

    // Send reset email
    await sendForgotPasswordMail(
      student.firstName,
      student.email,
      student.passwordResetToken,
      "student",
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

    const student = await Student.findOne({ passwordResetToken: token });
    if (student) {
      if (student.linkExpireAt < new Date()) {
        return res.render("linkExpired", {
          msg: `Link expired, please request a new one`,
        });
      }
      res.render("forgotPasswordStudent", {
        msg: "",
        vertoken: student.passwordResetToken,
      });
    } else {
      res.render("forgotPasswordStudent", { msg: `Invalid link` });
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
    const student = await Student.findOne({ passwordResetToken: token });
    if (!student)
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));

    student.password = newPassword;
    student.passwordResetToken = null;
    student.linkExpireAt = null;

    await student.save();

    res.render("passwordSuccess", { msg: `Password changed successfully` });
  } catch (error) {
    console.error(`Error changing password:`, error);
    res.render(`error`, { msg: `Invalid link` });
  }
};

export const updateProfileHandle = async (req, res) => {
  let profileImage = req.file?.key || null;
  try {
    const { firstName, lastName, userName, mobileNumber, age, gender, grade } =
      req.body;
    const schema = Joi.object({
      firstName: Joi.string().optional(),
      userName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      mobileNumber: Joi.string().optional(),
      age: Joi.number().optional(),
      gender: Joi.string().valid("Male", "Female", "Other").optional(),
      grade: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));

    const user = await Student.findById(req.user.id);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }
    let existingUserName;
    if (userName) {
      existingUserName = await Student.findOne({
        userName: userName,
        _id: { $ne: req.user.id },
      });
    }

    if (existingUserName) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.USERNAME_EXISTS));
    }

    // Update student fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    user.phone = mobileNumber || user.phone;
    user.age = age || user.age;
    user.userName = userName || user.userName;
    user.gender = gender || user.gender;
    user.grade = grade || user.grade;
    user.avatar = profileImage || user.avatar;

    await user.save();

    res.status(200).json(new ApiResponse(200, user, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const profileHandle = async (req, res) => {
  try {
    const user = await Student.findById(req.user.id).select(
      "-password -googleId -provider -createdAt -updatedAt -__v -actToken -linkExpireAt -passwordResetToken",
    );

    console.log(`user --------->`, user);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    user.avatar = user.avatar ? await getSignedFileUrl(user.avatar) : null;

    console.log(`user jprofile success --------->`);
    res.status(200).json(new ApiResponse(200, user, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
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

    const user = await Student.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    if (oldPassword == newPassword) {
      return res
        .status(401)
        .json(new ApiResponse(401, {}, Msg.ENTERED_OLD_PASSWORD));
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    console.log(`isPasswordValid --------->`, isPasswordValid);
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

export const allLessonsHandle = async (req, res) => {
  try {
    const lessons = await Lesson.find({ status: "published" })
      .populate("teacherId", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    const lessonsWithThumbs = await Promise.all(
      lessons.map(async (lesson) => {
        const count = await Video.countDocuments({ lessonId: lesson._id });
        return {
          ...lesson,
          thumbnail: lesson.thumbnail
            ? await getSignedFileUrl(lesson.thumbnail)
            : null,
          chapterCount: count,
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, lessonsWithThumbs, Msg.LESSON_FETCHED));
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const lessonChaptersHandle = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const schema = Joi.object({
      lessonId: Joi.string().required(),
    });

    const { error } = schema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const chapters = await Video.find({
      lessonId,
      status: "published",
    })
      .select("title duration accessType order thumbnail")
      .sort({ order: 1 })
      .lean();

    if (!chapters || chapters.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.CHAPTER_NOT_FOUND));
    }

    // 2. Fetch user's subscription once
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
      status: "active",
    }).lean();

    const hasActiveSubscription =
      subscription &&
      (!subscription.endDate || subscription.endDate >= new Date());

    const formattedChapters = await Promise.all(
      chapters.map(async (chapter) => {
        const signedThumb = chapter.thumbnail
          ? await getSignedFileUrl(chapter.thumbnail)
          : null;

        // FREE
        if (chapter.accessType === "free") {
          return {
            ...chapter,
            thumbnail: signedThumb,
            isLocked: false,
            requiresSubscription: false,
          };
        }

        // NO SUBSCRIPTION
        if (!hasActiveSubscription) {
          return {
            ...chapter,
            thumbnail: signedThumb,
            isLocked: true,
            requiresSubscription: true,
          };
        }

        // HAS SUBSCRIPTION
        return {
          ...chapter,
          thumbnail: signedThumb,
          isLocked: false,
          requiresSubscription: false,
        };
      }),
    );

    return res
      .status(200)
      .json(new ApiResponse(200, formattedChapters, Msg.LESSON_FETCHED));
  } catch (error) {
    console.error("Get lesson chapters error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const lessonByIdHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findOne({
      _id: id,
      status: "published",
    }).lean();
    if (!lesson) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }
    lesson.video = lesson.video ? await getSignedFileUrl(lesson.video) : null;
    lesson.thumbnail = lesson.thumbnail
      ? await getSignedFileUrl(lesson.thumbnail)
      : null;
    return res.status(200).json(new ApiResponse(200, lesson, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const playChapterHandle = async (req, res) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Video.findOne({
      _id: chapterId,
      status: "published",
    }).lean();

    if (!chapter) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Chapter not found"));
    }

    // ✅ FREE chapter → allow everyone
    if (chapter.accessType === "free") {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { videoUrl: await getSignedFileUrl(chapter.videoUrl) },
            Msg.DATA_FETCHED,
          ),
        );
    }

    // 🔒 PAID chapter → subscription required
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
      status: "active",
    }).lean();

    if (!subscription) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.SUBSCRIPTION_ACTIVE_REQUIRED));
    }

    // ⏰ Expiry check (reuse your logic)
    if (subscription.endDate && subscription.endDate < new Date()) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.SUBSCRIPTION_EXPIRED));
    }

    // 📊 Plan comparison
    const PLAN_ORDER = {
      free: 0,
      pro: 1,
      premium: 2,
    };

    if (PLAN_ORDER[subscription.plan] < PLAN_ORDER[chapter.accessType]) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.SUBSCRIPTION_PLAN_REQUIRED));
    }

    // ✅ All checks passed
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videoUrl: await getSignedFileUrl(chapter.videoUrl) },
          Msg.DATA_FETCHED,
        ),
      );
  } catch (error) {
    console.error("Play chapter error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const addTeacherReviewHandle = async (req, res) => {
  try {
    const { teacherId, rating, review } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }

    const existingReview = await TeacherReview.findOne({
      teacherId,
      studentId: req.user.id,
    });

    if (existingReview) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.DATA_ALREADY_EXISTS));
    }

    await TeacherReview.create({
      teacherId,
      studentId: req.user.id,
      rating,
      review,
    });

    return res.status(201).json(new ApiResponse(201, {}, Msg.DATA_ADDED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const myTeacherReviewsHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      id: Joi.string().required(),
    });
    const { error } = schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }
    const reviews = await TeacherReview.find({
      teacherId: id,
      studentId: req.user.id,
    }).populate("studentId", "firstName lastName avatar");

    const updatedReviews = await Promise.all(
      reviews.map(async (review) => {
        review.studentId.avatar = review.studentId.avatar
          ? await getSignedFileUrl(review.studentId.avatar)
          : `${process.env.DEFAULT_PROFILE_PIC}`;
        return review;
      }),
    );
    return res
      .status(200)
      .json(new ApiResponse(200, updatedReviews, Msg.DATA_FETCHED));
  } catch (error) {
    console.error("Error fetching teacher reviews:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updateTeacherReviewHandle = async (req, res) => {
  try {
    const { id, rating, review } = req.body;
    const schema = Joi.object({
      id: Joi.string().required(),
      rating: Joi.number().optional(),
      review: Joi.string().optional(),
    });
    const { error } = schema.validate({ id, rating, review });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const data = await TeacherReview.findOne({
      _id: id,
      studentId: req.user.id,
    });
    if (!data) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.DATA_NOT_FOUND));
    }

    data.rating = rating || data.rating;
    data.review = review || data.review;
    await data.save();

    return res.status(200).json(new ApiResponse(200, data, Msg.DATA_UPDATED));
  } catch (error) {
    console.error("Error updating teacher review:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const mySubscriptionHandle = async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
    }).lean();

    // ✅ No subscription → Free plan
    if (!subscription) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            plan: "free",
            status: "active",
            validTill: null,
            cancelAtPeriodEnd: false,
            canAccessPaidContent: false,
          },
          Msg.SUBSCRIPTION_NOT_FOUND,
        ),
      );
    }

    // ✅ Check expiry
    const isExpired = subscription.endDate && subscription.endDate < new Date();

    const isActive = subscription.status === "active" && !isExpired;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          plan: subscription.plan,
          status: isExpired ? "expired" : subscription.status,
          validTill: subscription.endDate,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canAccessPaidContent: isActive,
        },
        Msg.SUBSCRIPTION_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
