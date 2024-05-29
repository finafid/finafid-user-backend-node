const axios = require("axios");

const API_BASE_URL = "https://apiv2.shiprocket.in/v1/external";
const EMAIL = "finafidtechnologies@gmail.com"; 
const PASSWORD = "Finasix@123#"; 

let token = null;

// Function to authenticate and get the token
async function authenticate() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    token = response.data.token;
    console.log("Authenticated successfully. Token:", token);
  } catch (error) {
    console.error("Error authenticating with Shiprocket:", error.message);
  }
}

// Function to get headers with the token
function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Example function to create an order
async function createOrder(orderData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/orders/create/adhoc`,
      orderData,
      {
        headers: getHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating order:", error.response.data);
  }
}

module.exports = {
  authenticate,
  createOrder,
};
