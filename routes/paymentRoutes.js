// routes/payments.js
const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create-intent", authMiddleware, paymentsController.createPaymentIntent);

// Stripe Webhook (no auth, raw body required)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentsController.handleWebhook
);

module.exports = router;
