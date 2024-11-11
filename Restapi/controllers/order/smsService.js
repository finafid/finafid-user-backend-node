const fetch = require("node-fetch");

async function sendSms(endpoint, payload) {
  try {
    const response = await fetch(`https://finafid.co.in/api/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("SMS sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw new Error("Failed to send SMS");
  }
}

module.exports = sendSms;
