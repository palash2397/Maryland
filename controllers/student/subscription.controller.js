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
      return res
        .status(400)
        .json(new ApiResponse(400, {}, Msg.SUBSCRIPTION_NOT_FOUND));
    }

    // 1️⃣ Cancel in Stripe (end of billing period)
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    // console.log("Stripe subscription:", stripeSubscription);
    // console.log("Current period end:", new Date(stripeSubscription.current_period_end * 1000));

    subscription.cancelAtPeriodEnd = true;
    subscription.startDate = new Date(
      stripeSubscription.current_period_start * 1000,
    );
    subscription.endDate = new Date(
      stripeSubscription.current_period_end * 1000,
    );
    await subscription.save();
    console.log("Subscription:", subscription);

    await subscription.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          validTill: subscription.endDate,
        },
        Msg.SUBSCRIPTION_CANCELLED_AT_PERIOD_END,
      ),
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};



export const upgradeSubscriptionHandle = async (req, res) => {
  try {
    const { planId } = req.body;

    // 1️⃣ Fetch new plan
    const newPlan = await Plan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!newPlan || !newPlan.stripePriceId) {
      return res.status(400).json(
        new ApiResponse(400, {}, "Invalid plan")
      );
    }

    // 2️⃣ Fetch current subscription
    const subscription = await UserSubscription.findOne({
      userId: req.user.id,
      status: "active",
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json(
        new ApiResponse(400, {}, "No active subscription found")
      );
    }

    // 3️⃣ Fetch Stripe subscription
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    const currentItemId = stripeSub.items.data[0].id;

    // 4️⃣ Update subscription price (upgrade)
    const updatedSub = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentItemId,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: "create_prorations",
        expand: ["latest_invoice.payment_intent"],
      }
    );

    // ⚠️ DB update happens via webhook
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clientSecret:
            updatedSub.latest_invoice?.payment_intent?.client_secret || null,
        },
        "Subscription upgrade initiated"
      )
    );
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Server error"));
  }
};
