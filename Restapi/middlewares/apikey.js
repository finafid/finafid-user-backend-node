
require("dotenv").config();

const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
    // console.log(apiKey);
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid API key",
    });
  }
};

module.exports = {apiKeyMiddleware};
