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
  lessonChaptersHandle,
  playChapterHandle,
} from "../controllers/student/student.controller.js";

import { quizzByQuestIdHandle } from "../controllers/teacher/lesson.controller.js";
import {
  startQuestHandle,
  allQuestHandle,
  currentQuestQuestionHandle,
  submitQuestAnswerHandle,
} from "../controllers/student/contest.controller.js";

import { cancelSubscriptionHandle } from "../controllers/student/subscription.controller.js";

import { createSubscriptionCheckout } from "../controllers/admin/plan.controller.js";
import { auth } from "../middlewares/auth.js";
import { checkSubscription } from "../middlewares/subscription.js";
import {
  leaderboardHandle,
  leaderboardSummaryHandle,
} from "../controllers/student/leaderBoard.controller.js";

import { uploadProfileImage } from "../middlewares/s3upload.js";

const studentRouter = Router();

studentRouter.post("/register", registerHandle);
studentRouter.get("/verify-account/:token", verifyAccountHandle);
studentRouter.post("/login", loginHandle);
studentRouter.post("/forgot-password", forgotPasswordHandle);
studentRouter.get("/verify-password/:token", verifyPasswordHandle);
studentRouter.post("/reset-password", resetPasswordHandle);
studentRouter.put(
  "/profile/update",
  auth,
  uploadProfileImage,
  updateProfileHandle,
);
studentRouter.get("/profile", auth, profileHandle);
studentRouter.put("/change-password", auth, changePasswordHandle);

studentRouter.get("/lessons", auth, allLessonsHandle);
studentRouter.get("/lesson/:id", auth, lessonByIdHandle);

studentRouter.get("/lesson/chapters/:lessonId", auth, lessonChaptersHandle);
studentRouter.get("/lesson/chapter/play/:chapterId", auth, playChapterHandle);

studentRouter.post("/teacher-review", auth, addTeacherReviewHandle);
studentRouter.get("/teacher-review/:id", auth, myTeacherReviewsHandle);
studentRouter.put("/teacher-review/:id", auth, updateTeacherReviewHandle);

studentRouter.get("/subscription", auth, mySubscriptionHandle);
studentRouter.post(
  "/subscription/checkout/:id",
  auth,
  createSubscriptionCheckout,
);
studentRouter.put("/subscription/cancel", auth, cancelSubscriptionHandle);

studentRouter.get("/quest/:id", auth, checkSubscription, quizzByQuestIdHandle);
studentRouter.get("/quests", auth, checkSubscription, allQuestHandle);

studentRouter.post(
  "/quest/start/:questId",
  auth,
  checkSubscription,
  startQuestHandle,
);
studentRouter.get(
  "/quest/question/:questId",
  auth,
  checkSubscription,
  currentQuestQuestionHandle,
);

studentRouter.post(
  "/quest/answer/submit",
  auth,
  checkSubscription,
  submitQuestAnswerHandle,
);

studentRouter.get("/quizz/leaderboard", auth, checkSubscription, leaderboardHandle);
studentRouter.get("/quizz/leaderboard/summary", auth, checkSubscription, leaderboardSummaryHandle);
export default studentRouter;
