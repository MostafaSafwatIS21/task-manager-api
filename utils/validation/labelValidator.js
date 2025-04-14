const expressValidator = require("../../middleware/expressValidator");
const { check } = require("express-validator");

exports.createLabelValidator = [
  check("name")
    .notEmpty()
    .withMessage("Label name is required")
    .isString()
    .withMessage("Label name must be a string")
    .isLength({ min: 1 })
    .withMessage("Label name must be at least 1 character long"),
  expressValidator,
];
exports.checkLabelIdValidator = [
  check("id")
    .notEmpty()
    .withMessage("Label ID is required")
    .isMongoId()
    .withMessage("Label ID must be a valid MongoDB ObjectId"),
  expressValidator,
];
