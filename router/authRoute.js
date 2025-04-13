const express = require("express");
const router = express.Router();
const {
  register,
  uploadUserPhoto,
  resizeUserPhoto,
  login,
  logout,
  forgotPassword,
  resetPassword,
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

router.post("/resetPassword/:restCode", resetPasswordValidator, resetPassword);

module.exports = router;
