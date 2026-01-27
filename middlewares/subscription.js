import { ApiResponse } from "../utils/ApiResponse.js";
import { Msg } from "../utils/responseMsg.js";
import UserSubscription from "../models/subcription/userSubscription.js";

export const checkSubscription = async (req, res, next) => {
  try {
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
      status: "active",
    }).lean();

    if (!subscription) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.SUBSCRIPTION_ACTIVE_REQUIRED));
    }

    // Check expiry
    if (subscription.endDate && subscription.endDate < new Date()) {
      return res
        .status(403)
        .json(new ApiResponse(403, {}, Msg.SUBSCRIPTION_EXPIRED));
    }

    // Attach subscription to request (useful later)
    req.subscription = subscription;

    next();
  } catch (error) {
    console.error("Subscription check failed:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
