import { Router } from "express";

import {
  registerHandle,
  verifyAccountHandle,
  loginHandle,
  forgotPasswordHandle,
  verifyPasswordHandle,
  resetPasswordHandle,
  changePasswordHandle,
  
} from "../controllers/teacher/teacher.controller.js";
import { setUploadPath } from "../utils/helper.js";
import { auth } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";

const teacherRouter = Router();

teacherRouter.post(
  "/register",
  setUploadPath("teacher/certificates"),
  upload.single("certificate"),
  registerHandle
);
teacherRouter.get("/verify-account/:token", verifyAccountHandle);
teacherRouter.post("/login", loginHandle);
teacherRouter.post("/forgot-password", forgotPasswordHandle);
teacherRouter.get("/verify-password/:token", verifyPasswordHandle);
teacherRouter.post("/reset-password", resetPasswordHandle);
teacherRouter.put("/change-password", auth, changePasswordHandle);


export default teacherRouter;
