import { Router } from "express";

import {
  registerHandle,
  verifyAccountHandle,
  loginHandle,
  forgotPasswordHandle,
  verifyPasswordHandle,
  resetPasswordHandle,
  changePasswordHandle,
  myProfileHandle,
  dashboardHandle,
  updateProfileHandle,
} from "../controllers/teacher/teacher.controller.js";
import { setUploadPath } from "../utils/helper.js";
import { auth } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";
import { uploadCertificate, uploadAvatarImage } from "../middlewares/s3upload.js";

const teacherRouter = Router();

teacherRouter.post(
  "/register",
  uploadCertificate,
  registerHandle
);
teacherRouter.get("/verify-account/:token", verifyAccountHandle);
teacherRouter.post("/login", loginHandle);
teacherRouter.post("/forgot-password", forgotPasswordHandle);
teacherRouter.get("/verify-password/:token", verifyPasswordHandle);
teacherRouter.post("/reset-password", resetPasswordHandle);
teacherRouter.put("/change-password", auth, changePasswordHandle);
teacherRouter.get("/my-profile", auth, myProfileHandle);
teacherRouter.get("/dashboard", auth, dashboardHandle);
teacherRouter.patch("/profile/update", auth, uploadAvatarImage, updateProfileHandle);


export default teacherRouter;
