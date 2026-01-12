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
  updateTeacherReviewHandle
} from "../controllers/student/student.controller.js";
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

studentRouter.post("/teacher-review", auth, addTeacherReviewHandle);
studentRouter.get("/teacher-review/:id", auth, myTeacherReviewsHandle);
studentRouter.put("/teacher-review/:id", auth, updateTeacherReviewHandle);

export default studentRouter;
