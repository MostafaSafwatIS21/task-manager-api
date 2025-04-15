const { check } = require("express-validator");
const expressValidator = require("../../middleware/expressValidator");

exports.registerValidator = [
  check("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isString()
    .withMessage("Email must be a string")
    .isEmail()
    .withMessage("Must be a valid email")
    .isLength({ min: 2 })
    .withMessage("Email must be at least 2 characters long"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .isLength({ min: 6 })
    .withMessage("Confirm Password must be at least 6 characters long")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
  check("image").optional(),
  expressValidator,
];
exports.resetPasswordValidator = [
  check("resetToken")
    .notEmpty()
    .withMessage("Reset code is required")
    .isString()
    .withMessage("Reset code must be a string"),

  check("newPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .isLength({ min: 6 })
    .withMessage("Confirm Password must be at least 6 characters long")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
  expressValidator,
];
