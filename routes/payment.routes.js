import { Router } from "express";
import {
  createPaymentIntent,
  confirmPaymentIntent,
  paymentWebhookHandle,
} from "../controllers/student/payment.controller.js";
import { auth } from "../middlewares/auth.js";
import bodyParser from "body-parser";

const paymentRouter = Router();

paymentRouter.post("/create-payment-intent", auth, createPaymentIntent);
paymentRouter.post(
  "/confirm-payment-intent/:paymentIntentId",
  auth,
  confirmPaymentIntent
);
paymentRouter.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  paymentWebhookHandle
);

export default paymentRouter;
