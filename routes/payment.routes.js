import { Router } from "express";
import {
  createPaymentIntent,
  confirmPaymentIntent,
  userBillingHistoryHandle

} from "../controllers/student/payment.controller.js";
import { auth } from "../middlewares/auth.js";


const paymentRouter = Router();

paymentRouter.post("/create-payment-intent", auth, createPaymentIntent);
paymentRouter.post(
  "/confirm-payment-intent/:paymentIntentId",
  auth,
  confirmPaymentIntent
);

paymentRouter.get("/billing-history", auth, userBillingHistoryHandle);


export default paymentRouter;
