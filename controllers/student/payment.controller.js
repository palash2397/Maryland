import stripe from "../../utils/stripe/stripe.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Student from "../../models/student/student.js";
import UserSubscription from "../../models/subcription/userSubscription.js";
import BillingHistory from "../../models/billing/billingHistory.js";
import Joi from "joi";

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = "usd", description } = req.body;

    const schema = Joi.object({
      amount: Joi.number().required(),
      currency: Joi.string().default("usd"),
      description: Joi.string().optional(),
    });

    const { error } = schema.validate({ amount, currency, description });
    if (error) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, error.details[0].message));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // ✅ IMPORTANT
      },
      metadata: {
        userId: req.user?.id || "guest",
      },
      description: description || "Course payment",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
        Msg.DATA_FETCHED,
      ),
    );
  } catch (error) {
    console.error("Stripe payment error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const createCustomerHandle = async (req, res) => {
  try {
    const user = await Student.findById(req.user.id);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
    }
    if (user.stripeCustomerId) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            customer: {
              id: user.stripeCustomerId,
            },
          },
          Msg.CUSTOMER_FETCH_SUCCESS,
        ),
      );
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    user.stripeCustomerId = customer.id;
    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          customer,
        },
        Msg.CUSTOMER_CREATED,
      ),
    );
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const confirmPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: "pm_card_visa",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        },
        "Payment confirmed successfully",
      ),
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const stripeWebhookHandle = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  const toDateOrNull = (unixSeconds) => {
    if (typeof unixSeconds !== "number") return null;
    const d = new Date(unixSeconds * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        console.log("invoice.payment_succeeded", event);
        const invoice = event.data.object;

        console.log("invoice", invoice.payment_settings);
        // console.log("invoice", invoice.parent?.subscription_details.subscription);
        const subscriptionId =
          invoice.parent?.subscription_details.subscription;
        // console.log("subscriptionId", subscriptionId);
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        // console.log("sub", sub);

        const price = sub.items?.data?.[0]?.price;
        // console.log("items", sub.items.data[0].price.);
        const startDate = toDateOrNull(sub.current_period_start);
        const endDate = toDateOrNull(sub.current_period_end);

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          {
            status: "active",
            stripePriceId: price?.id,
            plan: price?.nickname || "pro",
            startDate: startDate,
            endDate: endDate,
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          },
          { upsert: true, new: true },
        );

        // console.log("userSubscription", userSubscription);

        const userSubscription = await UserSubscription.findOne({
          stripeSubscriptionId: subscriptionId,
        });
        if (!userSubscription) {
          return res
            .status(404)
            .json({ message: "User subscription not found" });
        }

        console.log("userSubscription", userSubscription);

        if (userSubscription) {
          await BillingHistory.create({
            userId: userSubscription.userId,
            subscriptionId: userSubscription._id,
            planId: userSubscription.planId,
            stripePaymentIntentId: userSubscription.paymentIntenId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            paidAt: new Date(invoice.created * 1000),
          });

          console.log("BillingHistory created");
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId =
          invoice.parent?.subscription_details.subscription;
        if (!subscriptionId) break;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          { status: "inactive" },
          { upsert: true },
        );

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const price = sub.items?.data?.[0]?.price;

        const startSeconds =
          sub.current_period_start ??
          sub.start_date ??
          sub.billing_cycle_anchor ??
          sub.created;

        const endSeconds = sub.current_period_end ?? sub.cancel_at ?? null;

        console.log("sub", sub);
        const startDate = toDateOrNull(startSeconds);
        const endDate = toDateOrNull(endSeconds);

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          {
            status: sub.status || "active",
            stripePriceId: price?.id,
            plan: price?.nickname || "pro",
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
            startDate: startDate,
            endDate: endDate,
          },
          { upsert: true, new: true },
        );

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { status: "cancelled", cancelAtPeriodEnd: false },
          { upsert: true },
        );

        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).send("Webhook handler failed");
  }
};

export const userBillingHistoryHandle = async (req, res) => {
  try {
    const history = await BillingHistory.find({
      userId: req.user.id,
    })
      .populate("planId", "name price interval")
      .sort({ paidAt: -1 })
      .lean();

    if (!history || history.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.BILLING_HISTORY_NOT_FOUND));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, history, Msg.BILLING_HISTORY_FETCHED));
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};
