// controllers/webhookController.js
const { verifyPayUSignature } = require("../../utils/verifyPayUSignature");

const PAYU_SECRET_KEY = process.env.PAYU_SECRET_KEY;

exports.handleWebhook = (req, res) => {
  const signature = req.headers["x-pay-signature"];

  if (!verifyPayUSignature(req.body, signature, PAYU_SECRET_KEY)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  // Handle different events from PayU
  const event = req.body.event;

  switch (event) {
    case "payment_success":
       // console.log("Payment successful:", req.body);
      // Process the successful payment here
      break;
    case "payment_failure":
       // console.log("Payment failed:", req.body);
      // Handle payment failure here
      break;
    case "refund_success":
       // console.log("Refund successful:", req.body);
      // Process the refund here
      break;
    default:
       // console.log("Unhandled event type:", event);
  }

  res.status(200).json({ success: true, message: "Webhook received" });
};
