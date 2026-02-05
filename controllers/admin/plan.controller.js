import Joi from "joi";
import stripe from "../../utils/stripe/stripe.js";

import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import BillingHistory from "../../models/billing/billingHistory.js";
import Plan from "../../models/plan/plan.js";

import { getSignedFileUrl } from "../../utils/s3SignedUrl.js";

const createStripePriceForPlan = async (plan) => {
  // 1. Create product
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.title,
  });

  // 2. Create price
  const price = await stripe.prices.create({
    unit_amount: Math.round(plan.price * 100), // USD -> cents
    currency: "usd",
    recurring: { interval: plan.interval },
    product: product.id,
  });

  return price.id;
};

export const createPlanHandle = async (req, res) => {
  try {
    const { name, title, price, duration, features, interval, description } =
      req.body;
    const planSchema = Joi.object({
      name: Joi.string().required(),
      title: Joi.string().required(),
      price: Joi.number().required(),
      duration: Joi.number().required(),
      interval: Joi.string().valid("month", "year", "lifetime").required(),
      features: Joi.array().items(Joi.string()).required(),
      description: Joi.string().required(),
    });

    const { error } = planSchema.validate({
      name,
      title,
      price,
      duration,
      interval,
      features,
      description,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await Plan.create({
      name,
      title,
      price,
      duration,
      interval,
      features,
      description,
    });

    if (plan.price > 0) {
      const stripePriceId = await createStripePriceForPlan(plan);
      plan.stripePriceId = stripePriceId;
      await plan.save();
    }

    console.log("Plan created:", plan);

    return res.status(201).json(new ApiResponse(201, plan, Msg.DATA_ADDED));
  } catch (error) {
    console.error("Error creating plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getPlansHandle = async (req, res) => {
  try {
    const plans = await Plan.find();
    if (!plans || plans.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plans, Msg.PLAN_LIST));
  } catch (error) {
    console.error("Error getting plans:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const getPlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, plan, Msg.PLAN_DETAIL));
  } catch (error) {
    console.error("Error getting plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const deletePlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const Schema = Joi.object({
      id: Joi.string().required(),
    });
    const { error } = Schema.validate({ id });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, {}, Msg.PLAN_DELETE));
  } catch (error) {
    console.error("Error deleting plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const updatePlanHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, interval, features, description } = req.body;
    const Schema = Joi.object({
      name: Joi.string().optional(),
      price: Joi.number().optional(),
      interval: Joi.string().optional(),
      features: Joi.array().optional(),
      description: Joi.string().optional(),
    });
    const { error } = Schema.validate({
      name,
      price,
      interval,
      features,
      description,
    });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.PLAN_NOT_FOUND));
    }

    plan.name = name || plan.name;
    plan.price = price || plan.price;
    plan.interval = interval || plan.interval;
    plan.features = features || plan.features;
    plan.description = description || plan.description;

    await plan.save();
    return res.status(200).json(new ApiResponse(200, plan, Msg.PLAN_UPDATE));
  } catch (error) {
    console.error("Error updating plan:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const createSubscriptionCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findOne({ _id: id, isActive: true });
    if (!plan || !plan.stripePriceId) {
      return res.status(400).json(new ApiResponse(400, {}, Msg.PLAN_NOT_FOUND));
    }

    let subscription = await UserSubscription.findOne({
      userId: req.user.id,
    });

    let customerId = subscription?.stripeCustomerId;
    console.log("customerId", customerId);
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
      });
      customerId = customer.id;
    }

    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const paymentIntent = stripeSubscription.latest_invoice.payment_intent;

    await UserSubscription.updateOne(
      { userId: req.user.id },
      {
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        planId: id,
        paymentIntenId: paymentIntent.id,
      },
      { upsert: true },
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clientSecret: paymentIntent.client_secret,
          paymentId: paymentIntent.id, // ✅ added
          subscriptionId: stripeSubscription.id, // optional but useful
        },
        Msg.SUBSCRIPTION_CREATED,
      ),
    );
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const adminBillingHistoryHandle = async (req, res) => {
  try {
    const history = await BillingHistory.find()

      .populate("userId", "firstName lastName email avatar")
      .populate("planId", "name")
      .sort({ paidAt: -1 })
      .limit(100)
      .lean();

      console.log(history)


     const formattedHistory = await Promise.all(history.map(async (item) => {
      console.log(item.userId.avatar)
      return {
        ...item,
        userId: {
          name: `${item.userId.firstName} ${item.userId.lastName}`,
          email: item.userId.email,
          avatar: item.userId.avatar ? await getSignedFileUrl(item.userId.avatar) : `${process.env.DEFAULT_PROFILE_PIC}`,
        },
      };
     }));
    return res
      .status(200)
      .json(new ApiResponse(200, formattedHistory, Msg.BILLING_HISTORY_FETCHED));
  } catch (error) {
    console.error("Billing history error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const billHandle = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await BillingHistory.findById(id)
      .populate("userId", "firstName lastName email avatar")
      .populate("planId", "name");
    if (!bill) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.BILLING_HISTORY_NOT_FOUND));
    }
    return res.status(200).json(new ApiResponse(200, bill, Msg.BILLING_HISTORY_FETCHED));
  } catch (error) {
    console.error("Billing history error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
