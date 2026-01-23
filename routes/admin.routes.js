import { Router } from "express";
import { createPlanHandle } from "../controllers/admin/admin.controller.js";
import { auth, isAdmin } from "../middlewares/auth.js";


const adminRouter = Router();

adminRouter.post("/create/plan", auth, isAdmin, createPlanHandle);

export default adminRouter;