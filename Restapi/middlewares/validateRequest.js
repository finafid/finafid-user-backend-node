// middlewares/validateRequest.js

const Joi = require("joi"); // if you need Joi here; not strictly required in this middleware file

/**
 * validateRequest:
 *   Wraps a Joi schema so that incoming req.body is validated.
 *   If validation fails, respond with 400 and the first error message.
 *   Otherwise, replace req.body with the validated value and call next().
 *
 * @param {Joi.ObjectSchema} schema
 */
module.exports = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
    });
    if (error) {
      // Send back the first validation error message
      return res.status(400).json({ message: error.details[0].message });
    }
    // Replace req.body with the sanitized, coerced value
    req.body = value;
    next();
  };
};
