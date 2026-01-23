import { Router } from "express";
import {
  createPlanHandle,
  deletePlanHandle,
  updatePlanHandle,
  getPlansHandle,
  getPlanHandle,
} from "../controllers/admin/admin.controller.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.post("/create/plan", auth, isAdmin, createPlanHandle);
adminRouter.delete("/delete/plan/:id", auth, isAdmin, deletePlanHandle);
adminRouter.put("/update/plan/:id", auth, isAdmin, updatePlanHandle);
adminRouter.get("/get/plans", auth, isAdmin, getPlansHandle);
adminRouter.get("/get/plan/:id", auth, isAdmin, getPlanHandle);

export default adminRouter;
