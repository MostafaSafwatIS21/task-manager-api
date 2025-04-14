const express = require("express");
const router = express.Router();
const {
  checkLabelOwnership,
  createLabel,
  getAllLabels,
  getLabel,
  updateLabel,
  deleteLabel,
} = require("../controller/labelController");
const { protect } = require("../controller/authController");
const {
  checkLabelIdValidator,
  createLabelValidator,
} = require("../utils/validation/labelValidator");

router.use(protect);

router.route("/").post(createLabelValidator, createLabel).get(getAllLabels);

const labelMiddleware = [checkLabelIdValidator, checkLabelOwnership];

router
  .route("/:id")
  .get(labelMiddleware, getLabel)
  .put(labelMiddleware, updateLabel)
  .delete(labelMiddleware, deleteLabel);

module.exports = router;
