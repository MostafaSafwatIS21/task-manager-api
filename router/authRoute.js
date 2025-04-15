const express = require("express");

const router = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  deleteMe,
  protect,
} = require("../controller/authController");

const {
  registerValidator,
  resetPasswordValidator,
} = require("../utils/validation/authValidator");

router.post("/register", registerValidator, register);
router.post("/login", login);
router.post("/logout", logout);

// forget password routes
router.post("/forgotPassword", forgotPassword);

router.put("/resetPassword/:resetToken", resetPasswordValidator, resetPassword);

router.delete("/deleteMe", protect, deleteMe);

module.exports = router;
