const axios = require("axios");
async function sendSMS(message, phoneNumber, templateId) {
  const url = "https://digimate.airtel.in:44111/BulkPush/InstantJsonPush";
  const requestBody = {
    keyword: "DEMO",
    timeStamp: "27102031163530",
    dataSet: [
      {
        UNIQUE_ID: "735694wew",
        MESSAGE: message,
        OA: "FINAFD",
        MSISDN: phoneNumber,
        CHANNEL: "SMS",
        CAMPAIGN_NAME: "finafid_ht",
        CIRCLE_NAME: "DLT_SERVICE_IMPLICT",
        USER_NAME: "finafid_siht1",
        DLT_TM_ID: "1001096933494158",
        DLT_CT_ID: templateId,
        DLT_PE_ID: "1001685962367956539",
        LANG_ID: "0",
      },
    ],
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("SMS sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}
module.exports = {
  sendSMS,
};
