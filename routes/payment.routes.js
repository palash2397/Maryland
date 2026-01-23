import { Router } from "express";
import {
  createPaymentIntent,
  confirmPaymentIntent,
  

} from "../controllers/student/payment.controller.js";
import { auth } from "../middlewares/auth.js";


const paymentRouter = Router();

paymentRouter.post("/create-payment-intent", auth, createPaymentIntent);
paymentRouter.post(
  "/confirm-payment-intent/:paymentIntentId",
  auth,
  confirmPaymentIntent
);


export default paymentRouter;
