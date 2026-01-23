import stripe from "../../utils/stripe/stripe.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Msg } from "../../utils/responseMsg.js";
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

export const paymentWebhookHandle = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ WEBHOOK SIGNATURE VERIFICATION FAILED");
    console.log(err.message);

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ WEBHOOK RECEIVED:", event.type);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        console.log("✅ PAYMENT SUCCESS");
        console.log("PaymentIntent ID:", paymentIntent.id);
        console.log("Amount:", paymentIntent.amount);
        console.log("Currency:", paymentIntent.currency);

        // 👉 TODO:
        // 1. Save payment in DB
        // 2. Grant course / subscription access
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        console.log("❌ PAYMENT FAILED");
        console.log("PaymentIntent ID:", paymentIntent.id);
        console.log("Reason:", paymentIntent.last_payment_error?.message);

        // 👉 TODO: mark payment failed
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object;

        console.log("⚠️ PAYMENT CANCELED");
        console.log("PaymentIntent ID:", paymentIntent.id);

        // 👉 TODO: cleanup pending records
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;

        console.log("🔁 PAYMENT REFUNDED");
        console.log("Charge ID:", charge.id);
        console.log("Amount Refunded:", charge.amount_refunded);

        // 👉 TODO: revoke access / update DB
        break;
      }

      default:
        console.log("⚠️ Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.log("❌ WEBHOOK HANDLER ERROR");
    console.log(error.message);
    res.status(500).send("Webhook handler failed");
  }
};

