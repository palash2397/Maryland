import { Router } from "express";
import {
  createPlanHandle,
  deletePlanHandle,
  updatePlanHandle,
  getPlansHandle,
  getPlanHandle,
} from "../controllers/admin/plan.controller.js";
import { auth, isAdmin } from "../middlewares/auth.js";

const adminRouter = Router();

adminRouter.post("/create/plan", auth, isAdmin, createPlanHandle);
adminRouter.delete("/plan/:id", auth, isAdmin, deletePlanHandle);
adminRouter.put("/plan/:id", auth, isAdmin, updatePlanHandle);
adminRouter.get("/all/plans", auth, getPlansHandle);
adminRouter.get("/plan/:id", auth, getPlanHandle);

export default adminRouter;
