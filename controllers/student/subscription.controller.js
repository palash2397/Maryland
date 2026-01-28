import Joi from "joi";
import Jwt from "jsonwebtoken";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import {
  generateRandomString,
  getExpirationTime,
  deleteOldImages,
} from "../../utils/helper.js";
import Teacher from "../../models/teacher/teacher.js";
import Video from "../../models/lesson/video.js";
import stripe from "../../utils/stripe/stripe.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

export const cancelSubscriptionHandle = async (req, res) => {
  try {
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
      status: "active",
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json(
        new ApiResponse(
          400,
          {},
         Msg.SUBSCRIPTION_NOT_FOUND
        )
      );
    }

    // 1️⃣ Cancel in Stripe (end of period)
    await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // 2️⃣ Update DB
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          validTill: subscription.endDate,
        },
        Msg.SUBSCRIPTION_CANCELLED_AT_PERIOD_END
      )
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error"));
  }
};
