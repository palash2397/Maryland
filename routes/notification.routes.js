import { Router } from "express";
import { notifyUser } from "../utils/notifications/notify.js";
import { sendPushNotification } from "../utils/notifications/sendPush.js";

const notificationRouter = Router();

notificationRouter.post("/test-notification", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "FCM token required" });
  }

  const response = await sendPushNotification({
    token,
    title: "Test 🚀",
    body: "Notification from Postman",
  });

  console.log("🔥 Firebase response:", response);

  res.json({ success: true });
});

export default notificationRouter;
