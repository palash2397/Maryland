import stripe from "../../utils/stripe/stripe.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Student from "../../models/student/student.js"
import UserSubscription from "../../models/subcription/userSubscription.js"
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
        Msg.DATA_FETCHED
      )
    );
  } catch (error) {
    console.error("Stripe payment error:", error);
    return res.status(500).json(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};

export const createCustomerHandle= async(req, res)=>{
  try {
    const user = await Student.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, Msg.USER_NOT_FOUND));
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
}

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
        "Payment confirmed successfully"
      )
    );
  } catch (error) {
    console.error("Error confirming payment:", error);
    return res.status(500).json(new ApiResponse(500, {}, error.message));
  }
};

export const stripeWebhookHandle = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      /**
       * ✅ MAIN SOURCE OF TRUTH FOR SUBSCRIPTIONS
       */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;

        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        // Get accurate subscription period + cancel_at_period_end + price
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const price = sub.items?.data?.[0]?.price;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          {
            status: "active",
            stripePriceId: price?.id,
            plan: price?.nickname || "pro",
            startDate: new Date(sub.current_period_start * 1000),
            endDate: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          { upsert: true, new: true }
        );

        break;
      }

      /**
       * ❌ PAYMENT FAILED
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: subscriptionId },
          { status: "inactive" },
          { upsert: true }
        );

        break;
      }

      /**
       * ✅ subscription updated (cancel_at_period_end, plan changes)
       */
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const price = sub.items?.data?.[0]?.price;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          {
            status: sub.status, // optional: map to your statuses if you want
            stripePriceId: price?.id,
            plan: price?.nickname || "pro",
            startDate: new Date(sub.current_period_start * 1000),
            endDate: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          { upsert: true }
        );

        break;
      }

      /**
       * 🛑 subscription ended
       */
      case "customer.subscription.deleted": {
        const sub = event.data.object;

        await UserSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { status: "cancelled" },
          { upsert: true }
        );

        break;
      }

      default:
        // keep this for debugging
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).send("Webhook handler failed");
  }
};



