import { Router } from "express";
import {
  registerHandle,
  verifyAccountHandle,
  loginHandle,
  forgotPasswordHandle,
  verifyPasswordHandle,
  resetPasswordHandle,
  updateProfileHandle,
  changePasswordHandle,
  profileHandle,
  allLessonsHandle,
  lessonByIdHandle,
  addTeacherReviewHandle,
  myTeacherReviewsHandle,
  updateTeacherReviewHandle,
  mySubscriptionHandle,
  lessonChaptersHandle
} from "../controllers/student/student.controller.js";

import { createSubscriptionCheckout } from "../controllers/admin/plan.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helper.js";
import {uploadProfileImage} from "../middlewares/s3upload.js";
import { upload } from "../middlewares/multer.js";

const studentRouter = Router();

studentRouter.post("/register", registerHandle);
studentRouter.get("/verify-account/:token", verifyAccountHandle);
studentRouter.post("/login", loginHandle);
studentRouter.post("/forgot-password", forgotPasswordHandle);
studentRouter.get("/verify-password/:token", verifyPasswordHandle);
studentRouter.post("/reset-password", resetPasswordHandle);
studentRouter.put("/profile/update", auth, uploadProfileImage, updateProfileHandle);
studentRouter.get("/profile", auth, profileHandle);
studentRouter.put("/change-password", auth, changePasswordHandle);

studentRouter.get("/lessons", auth, allLessonsHandle);
studentRouter.get("/lesson/:id", auth, lessonByIdHandle);

studentRouter.get("/lesson/chapters/:lessonId", auth, lessonChaptersHandle);

studentRouter.post("/teacher-review", auth, addTeacherReviewHandle);
studentRouter.get("/teacher-review/:id", auth, myTeacherReviewsHandle);
studentRouter.put("/teacher-review/:id", auth, updateTeacherReviewHandle);

studentRouter.get("/subscription", auth, mySubscriptionHandle);
studentRouter.post("/subscription/checkout/:id", auth, createSubscriptionCheckout);

export default studentRouter;
