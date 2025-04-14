const expressValidator = require("../../middleware/expressValidator");
const { body, check } = require("express-validator");
const Label = require("../../model/labelModel");

exports.createTaskValidator = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),

  body("status")
    .optional()
    .isIn(["pending", "in-progress", "completed"])
    .withMessage("Invalid status value"),

  body("dueDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid date format"),

  body("labels")
    .optional()
    .isArray()
    .withMessage("Labels must be an array of IDs")
    .custom(async (value, { req }) => {
      // check if each label ID is valid in label
      const labelCount = await Label.find({ user: req.user._id });
      const labelIds = labelCount.map((label) => label._id.toString());

      const invalidLabelIds = value.filter(
        (label) => !labelIds.includes(label)
      );

      if (invalidLabelIds.length) {
        throw new Error(`Invalid label IDs: ${invalidLabelIds.join(", ")}`);
      }
      return true;
    }),

  body("labels.*")
    .optional()
    .isMongoId()
    .withMessage("Each label must be a valid Mongo ID"),

  expressValidator,
];
exports.updateTaskValidator = [
  check("id")
    .notEmpty()
    .withMessage("Label ID is required")
    .isMongoId()
    .withMessage("Label ID must be a valid MongoDB ObjectId"),
  body("title")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be at most 500 characters"),

  body("status")
    .optional()
    .isIn(["pending", "in-progress", "completed"])
    .withMessage("Invalid status value"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority value"),

  body("dueDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid date format"),

  body("labels")
    .optional()
    .isArray()
    .withMessage("Labels must be an array of IDs")
    .custom(async (value, { req }) => {
      // check if each label ID is valid in label
      const labelCount = await Label.find({ user: req.user._id });
      const labelIds = labelCount.map((label) => label._id.toString());

      const invalidLabelIds = value.filter(
        (label) => !labelIds.includes(label)
      );

      if (invalidLabelIds.length) {
        throw new Error(`Invalid label IDs: ${invalidLabelIds.join(", ")}`);
      }
      return true;
    }),

  body("labels.*")
    .optional()
    .isMongoId()
    .withMessage("Each label must be a valid Mongo ID"),

  expressValidator,
];
exports.checkTaskIdValidator = [
  check("id")
    .notEmpty()
    .withMessage("Label ID is required")
    .isMongoId()
    .withMessage("Label ID must be a valid MongoDB ObjectId"),
  expressValidator,
];
