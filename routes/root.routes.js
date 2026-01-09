import { Router } from "express";
import studentRouter from "./student.routes.js";
import teacherRouter from "./teacher.routes.js";
import lessonRouter from "./lesson.routes.js";

const router = Router();



// Use student and teacher routes
router.use("/student", studentRouter);
router.use("/teacher", teacherRouter);
router.use("/lesson", lessonRouter);
export default router;