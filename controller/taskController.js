const Task = require("../model/taskModel");
const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");

/** Check task ownership  middleware*/
exports.checkTaskOwnership = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError("No task found with that ID", 404));
  }
  // Check if the task belongs to the user
  if (task.user.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }

  next();
});

/**
 * * @desc Create a new task
 * * @route POST /api/v1/tasks
 * * @access Private
 */

exports.createTask = asyncHandler(async (req, res, next) => {
  req.body.user = req.user._id;

  let task = await Task.create(req.body);
  task = await task.populate({ path: "labels", select: "name color" });
  res.status(201).json({
    status: "success",
    data: {
      task,
    },
  });
});

/**
 * * @desc Get all tasks
 * * @route GET /api/v1/tasks
 * * @access Private only for the user who created the task
 */
exports.getAllTasks = asyncHandler(async (req, res, next) => {
  //1) pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  //2) filtering

  //3) search
  const search = req.query.search || "";

  const tasks = await Task.find({
    user: req.user._id,
    $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ],
  })
    .populate({ path: "labels", select: "name color" })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    page,
    results: tasks.length,
    data: {
      tasks,
    },
  });
});

/**
 * * @desc Get a single task
 * * @route GET /api/v1/tasks/:id
 * * @access Private only for the user who created the task
 */
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate({
    path: "labels",
    select: "name color",
  });

  if (!task) {
    return next(new AppError("No task found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

/**
 * * @desc Update a task
 * * @route PATCH /api/v1/tasks/:id
 * * @access Private only for the user who created the task
 */

exports.updateTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      dueDate: req.body.dueDate,
      labels: req.body.labels,
      priority: req.body.priority,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate({ path: "labels", select: "name color" });
  if (!task) {
    return next(new AppError("No task found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

/**
 * * @desc Delete a task
 * * @route DELETE /api/v1/tasks/:id
 * * @access Private only for the user who created the task
 */
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    return next(new AppError("No task found with that ID", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**@todo Filter tasks by status, due-date, priority, label, etc and Group tasks by labels */
