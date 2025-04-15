const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Task = require("../model/taskModel");
const AppError = require("../utils/appError");
const Label = require("../model/labelModel");

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
  const queryObj = { ...req.query };

  //1) pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  //2) filtering
  const excludeFields = ["limit", "page", "sort", "fields", "search", "labels"];
  excludeFields.forEach((field) => delete queryObj[field]);

  const query = { user: req.user._id, ...queryObj };
  let labels = "";

  if (req.query.labels) {
    labels = await Label.findOne({ name: req.query.labels });
    query.labels = labels._id;
  }

  //3) search

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const tasks = await Task.find(query)
    .populate({ path: "labels", select: "name color" })
    .skip(skip)
    .limit(limit);

  // console.log(tasks[1].labels);

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
    { new: true, runValidators: true }
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
/**
 * @desc Group by labels
 * @route GET /api/v1/tasks/groupByLabels
 * @Private logged in users
 */

exports.groupByLabels = asyncHandler(async (req, res, next) => {
  const groupedTasks = await Task.aggregate([
    { $unwind: "$labels" },

    {
      $group: {
        _id: "$labels",
        labelName: { $first: "$labels" },
        tasks: {
          $push: {
            _id: "$_id",
            title: "$title",
            description: "$description",
            status: "$status",
            priority: "$priority",
            dueDate: "$dueDate",
            createdAt: "$createdAt",
          },
        },
        taskCount: { $sum: 1 },
      },
    },

    {
      $lookup: {
        from: "labels",
        localField: "_id",
        foreignField: "_id",
        as: "labelDetails",
      },
    },

    { $unwind: "$labelDetails" },

    {
      $project: {
        _id: 0,
        label: {
          _id: "$labelDetails._id",
          name: "$labelDetails.name",
          color: "$labelDetails.color",
        },
        tasks: 1,
        taskCount: 1,
      },
    },

    { $sort: { "label.name": 1 } },
  ]);

  res.status(200).json({
    status: "success",
    count: groupedTasks.length,
    data: groupedTasks,
  });
});

/**
 * @desc Generate Task links
 * @route  /api/v1/tasks/generateTaskLink
 * @access only owner can generate
 */

exports.generateTaskLink = asyncHandler(async (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("Task Id is missing", 400));
  }
  const task = await Task.findById(req.params.id);
  let taskLink = "";

  if (task.shareId) {
    taskLink = task.shareId;
  } else {
    taskLink = crypto.randomBytes(32).toString("hex");
    task.shareId = taskLink;
    await task.save();
  }
  let link = `${req.protocol}://${req.get("host")}/api/v1/tasks/share/${taskLink}`;

  res.status(201).json({
    status: "success",
    sharedLink: link,
  });
});

/**
 * @desc Get Task by link
 * @route  /api/v1/tasks/share/:taskLink
 * @access users that had link
 */

exports.sharedTask = asyncHandler(async (req, res, next) => {
  if (!req.params.taskLink) {
    return next(new AppError("Task link is missing", 400));
  }
  const task = await Task.findOne({ shareId: req.params.taskLink })
    .populate([
      {
        path: "labels",
        select: "name color -_id",
      },
      { path: "user", select: "name email image -_id" },
    ])
    .select("-_id -__V -shareId");
  if (!task) {
    return next(new AppError("Task link is invalid ", 400));
  }

  res.status(200).json({
    status: "success",
    task,
  });
});
