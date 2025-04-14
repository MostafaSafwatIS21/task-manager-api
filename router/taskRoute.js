const express = require("express");
const router = express.Router();
const {
  checkTaskOwnership,
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controller/taskController");
const {
  createTaskValidator,
  checkTaskIdValidator,
  updateTaskValidator,
} = require("../utils/validation/taskValidator");
const { protect } = require("../controller/authController");

router.use(protect);

router.route("/").post(createTaskValidator, createTask).get(getAllTasks);

const taskMiddleware = [checkTaskIdValidator, checkTaskOwnership];

router
  .route("/:id")
  .get(taskMiddleware, getTask)
  .patch(updateTaskValidator, checkTaskOwnership, updateTask)
  .delete(taskMiddleware, deleteTask);

module.exports = router;
