import stripe from "../../utils/stripe/stripe.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
import Student from "../../models/student/student.js"
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
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    /* ---------------- PAYMENT SUCCESS ---------------- */
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

     console.log("Payment successful:", intent);

    //   const { userId, planId } = intent.metadata;
    // //  const paymentMethodId = intent.payment_method;

    //   if (!userId || !planId) {
    //     console.log("Missing metadata, skipping webhook processing");
    //     return res.status(200).send("Webhook received");
    //   }

    //   const plan = await SubscriptionPlan.findById(planId);
    //   if (!plan) {
    //     console.log("Plan not found:", planId);
    //     return res.status(200).send("Webhook received");
    //   }

      // // Create payment record
      // await Payment.findOneAndUpdate(
      //   { stripePaymentIntentId: intent.id },
      //   {
      //     user: userId,
      //     plan: planId,
      //     amount: intent.amount_received / 100,
      //     currency: intent.currency.toUpperCase(),
      //     status: "success",
      //   },
      //   { upsert: true, new: true },
      // );

      // // Create user subscription
      // const startDate = new Date();
      // const endDate = new Date(startDate);
      // endDate.setDate(endDate.getDate() + plan.durationDays);

      // console.log("start date -------->", startDate);
      // console.log("end date --------->", endDate);

      // await UserSubscriptionPlan.findOneAndUpdate(
      //   { user: userId },
      //   {
      //     plan: planId,
      //     startDate,
      //     endDate,
      //     status: "active",
      //   },
      //   { upsert: true, new: true },
      // );

      // await User.findByIdAndUpdate(userId, {
      //   hasActiveSubscription: true,
      // });

      console.log("Subscription activated for user:");
    }

    /* ---------------- PAYMENT FAILED ---------------- */
    if (event.type === "payment_intent.payment_failed") {
      // console.log("Payment failed:", event.data.object);
      // const { userId } = intent.metadata;
      const intent = event.data.object;

      // await Payment.findOneAndUpdate(
      //   { stripePaymentIntentId: intent.id },
      //   { status: "failed" },
      //   { upsert: true },
      // );
      // await User.findByIdAndUpdate(userId, {
      //   // defaultPaymentMethod: paymentMethodId,
      //   hasActiveSubscription: false,
      // });
    }

    return res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Stripe webhook DB error:", error);
    return res.status(500).send(new ApiResponse(500, {}, Msg.SERVER_ERROR));
  }
};




