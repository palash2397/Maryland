import { Router } from "express";
import studentRouter from "./student.routes.js";
import teacherRouter from "./teacher.routes.js";

const router = Router();



// Use student and teacher routes
router.use("/student", studentRouter);
router.use("/teacher", teacherRouter);

export default router;