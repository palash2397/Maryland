import { Router } from "express";
import {
  createPlanHandle,
  deletePlanHandle,
  updatePlanHandle,
  getPlansHandle,
  getPlanHandle,
  adminBillingHistoryHandle
} from "../controllers/admin/plan.controller.js";

import {
  allStudentHandle,
  studentHandle,
  changeAccountStatusHandle,
} from "../controllers/admin/admin.controller.js";

import {
  allTeacherHandle,
  teacherHandle,
  teacherAccountStatusHandle,
} from "../controllers/admin/teacher.controller.js";

import {
  contestDashboardHandle,
  subscriptionAnalyticsHandle,
} from "../controllers/admin/dashboard.controller.js";

import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.post("/create/plan", auth, isAdmin, createPlanHandle);
adminRouter.delete("/plan/:id", auth, isAdmin, deletePlanHandle);
adminRouter.put("/plan/:id", auth, isAdmin, updatePlanHandle);
adminRouter.get("/all/plans", auth, getPlansHandle);
adminRouter.get("/plan/:id", auth, getPlanHandle);

//STUDENT
adminRouter.get("/all/students", auth, isAdmin, allStudentHandle);
adminRouter.get("/student/:id", auth, isAdmin, studentHandle);
adminRouter.patch("/student/:id", auth, isAdmin, changeAccountStatusHandle);

//TEACHER
adminRouter.get("/all/teachers", auth, isAdmin, allTeacherHandle);
adminRouter.get("/teacher/:id", auth, isAdmin, teacherHandle);
adminRouter.patch("/teacher/:id", auth, isAdmin, teacherAccountStatusHandle);

// CONTEST DASHBOARD
adminRouter.get("/contest/dashboard", auth, isAdmin, contestDashboardHandle);


// SUBSCRIPTION ANALYTICS
adminRouter.get(
  "/subscription/analytics",
  auth,
  isAdmin,
  subscriptionAnalyticsHandle
);


// BILLING HISTORY
adminRouter.get(
  "/billing/history",
  auth,
  isAdmin,
  adminBillingHistoryHandle
);

export default adminRouter;
