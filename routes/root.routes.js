import { Router } from "express";
import studentRouter from "./student.routes.js";
import teacherRouter from "./teacher.routes.js";
import lessonRouter from "./lesson.routes.js";
import notificationRouter from "./notification.routes.js";
import paymentRouter from "./payment.routes.js";
import adminRouter from "./admin.routes.js";

const router = Router();



// Use student and teacher routes
router.use("/student", studentRouter);
router.use("/teacher", teacherRouter);
router.use("/lesson", lessonRouter);
router.use("/notification", notificationRouter);
router.use("/payment", paymentRouter);
router.use("/admin", adminRouter);
export default router;