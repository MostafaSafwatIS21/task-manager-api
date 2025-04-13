const { validationResult } = require("express-validator");

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    res.status(400).json({
      error: errors.array(),
    });
  }
  next();
};

module.exports = validatorMiddleware;
