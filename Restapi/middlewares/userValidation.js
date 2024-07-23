const joi = require("joi");
const userRegistrationValidation = (req, res, next) => {
  const schema = joi.object({
    fullName: joi
      .string()
      .min(3)
      .max(100)
      .pattern(new RegExp("^[a-zA-Z ]*$"))
      .required(),
    email: joi.string().email().required(),
    password: joi
      .string()
      .min(8)
      .pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+\\-=[\\]{};:'\"|,.<>/?]*$"))
      .required(),
    phone: joi.number().min(10).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.message,
      success: false,
    });
  }
  next();
};
const userLoginValidation = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi
      .string()
      .min(8)
      .pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+\\-=[\\]{};:'\"|,.<>/?]*$"))
      .required(),
    fcmToken: joi.string(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Bad Request",
      error,
    });
  }
  next();
};
const emailVarification = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Bad Request",
      error,
    });
  }
  next();
};
const otpVarification = (req, res, next) => {
  const schema = joi.object({
    otp: joi.number().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Bad Request",
      error,
    });
  }
  next();
};
const passwordVarification = (req, res, next) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi
      .string()
      .min(8)
      .pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+\\-=[\\]{};:'\"|,.<>/?]*$"))
      .required(),
  });
  console.log(req.body.email, req.body.password);
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Bad Request",
    });
  }
  next();
};

module.exports = {
  userRegistrationValidation,
  userLoginValidation,
  emailVarification,
  passwordVarification,
  otpVarification,
};
