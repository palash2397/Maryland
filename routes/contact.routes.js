import { Router } from "express";
import { contactUsHandle } from "../controllers/student/contact.controller.js";

const contactRouter = Router();

contactRouter.post("/contact", contactUsHandle);

export default contactRouter;
