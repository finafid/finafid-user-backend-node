// utils/validationSchemas.js
const Joi = require("joi");

exports.buyNowSchema = Joi.object({
  variantId: Joi.string()
    .hex()
    .length(24)            // must be a valid MongoDB ObjectId
    .required(),
  quantity: Joi.number()
    .integer()
    .min(1)
    .default(1),           // default to 1 if not provided
  couponCode: Joi.string()
    .trim()
    .uppercase()
    .optional()
    .allow(""),          // allow empty string if no coupon   
   usereward: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional()
    .default(false)         // allow empty string if no coupon
});
