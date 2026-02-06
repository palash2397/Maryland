import { Router } from "express";
import { contactUsHandle } from "../controllers/student/contact.controller.js";

const contactRouter = Router();



contactRouter.post("/message", contactUsHandle);
export default contactRouter;
