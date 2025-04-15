const asyncHandler = require("express-async-handler");
const Label = require("../model/labelModel");
const AppError = require("../utils/appError");

/** Check label ownership  middleware*/
exports.checkLabelOwnership = asyncHandler(async (req, res, next) => {
  const label = await Label.findById(req.params.id);
  if (!label) {
    return next(new AppError("No label found with that ID", 404));
  }
  // Check if the label belongs to the user
  if (label.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  next();
});

/**
 * * @desc Create a new label
 * * @route POST /api/v1/labels
 * * @access Private
 */

exports.createLabel = asyncHandler(async (req, res, next) => {
  req.body.user = req.user._id;

  const label = await Label.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      label,
    },
  });
});

/**
 * * @desc Get all labels
 * * @route GET /api/v1/labels
 * * @access Private only for the user who created the label
 */
exports.getAllLabels = asyncHandler(async (req, res, next) => {
  const labels = await Label.find({ user: req.user._id }).select("-__v -user");

  res.status(200).json({
    status: "success",
    results: labels.length,
    data: {
      labels,
    },
  });
});

/**
 * * @desc Get a single label
 * * @route GET /api/v1/labels/:id
 * * @access Private only for the user who created the label
 */
exports.getLabel = asyncHandler(async (req, res, next) => {
  const label = await Label.findById(req.params.id).select("-__v -user");

  if (!label) {
    return next(new AppError("No label found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      label,
    },
  });
});

/**
 * * @desc Update a label
 * * @route PATCH /api/v1/labels/:id
 * * @access Private only for the user who created the label
 */
exports.updateLabel = asyncHandler(async (req, res, next) => {
  const label = await Label.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, color: req.body.color },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!label) {
    return next(new AppError("No label found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      label,
    },
  });
});

/**
 * * @desc Delete a label
 * * @route DELETE /api/v1/labels/:id
 * * @access Private only for the user who created the label
 */
exports.deleteLabel = asyncHandler(async (req, res, next) => {
  const label = await Label.findByIdAndDelete(req.params.id);

  if (!label) {
    return next(new AppError("No label found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
