// controllers/paymentsController.js
const Stripe = require('stripe');
const PackPurchase = require('../models/PackPurchase');
const { PACKAGES } = require('../config/packages');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create PaymentIntent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { package: pkgKey } = req.body;
    const user = req.user;

    if (!PACKAGES[pkgKey]) {
      return res.status(400).json({ success: false, message: 'Invalid package' });
    }

    const pkg = PACKAGES[pkgKey];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pkg.price * 100),
      currency: 'usd',
      metadata: {
        userId: user._id.toString(),
        package: pkgKey,
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });

  } catch (err) {
    console.error("Stripe Create Intent ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Stripe Webhook
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // IMPORTANT!
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Payment Successful
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { userId, package: pkgKey } = paymentIntent.metadata;

    const pkg = PACKAGES[pkgKey];
    if (!pkg) {
      console.error("❌ Invalid package in webhook:", pkgKey);
      return res.json({ received: true });
    }

    try {
      // Create a purchase request (admin approval required)
      // Idempotent via unique index on (gateway, transactionId)
      await PackPurchase.create({
        user: userId,
        packageKey: pkgKey,
        gateway: 'stripe',
        transactionId: paymentIntent.id,
        amount: pkg.price,
        currency: paymentIntent.currency || 'usd',
        credits: pkg.credits,
        freePlayers: pkg.freePlayers,
        status: 'pending'
      });
      console.log(`✅ Stripe purchase recorded (pending approval). userId=${userId} package=${pkgKey}`);
    } catch (err) {
      // Ignore duplicate errors (webhook retry)
      if (err && err.code === 11000) {
        console.log("ℹ️ Duplicate webhook purchase ignored:", paymentIntent.id);
      } else {
        console.error("❌ Error recording purchase:", err);
      }
    }
  }

  return res.json({ received: true });
};
