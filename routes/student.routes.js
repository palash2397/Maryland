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
  profileHandle
} from "../controllers/student/student.controller.js";
import { auth } from "../middlewares/auth.js";
import { setUploadPath } from "../utils/helper.js";
import { upload } from "../middlewares/multer.js";

const studentRouter = Router();

studentRouter.post("/register", registerHandle);
studentRouter.get("/verify-account/:token", verifyAccountHandle);
studentRouter.post("/login", loginHandle);
studentRouter.post("/forgot-password", forgotPasswordHandle);
studentRouter.get("/verify-password/:token", verifyPasswordHandle);
studentRouter.post("/reset-password", resetPasswordHandle);
studentRouter.put("/profile/update", auth, setUploadPath("students/profile"), upload.single("avatar"), updateProfileHandle);
studentRouter.get("/profile", auth, profileHandle);
studentRouter.put("/change-password", auth, changePasswordHandle);

export default studentRouter;
