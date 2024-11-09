const crypto = require("crypto");

function verifyPayUSignature(body, signature, secretKey) {
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(JSON.stringify(body))
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = { verifyPayUSignature };
