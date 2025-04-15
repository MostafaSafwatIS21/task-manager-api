const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../model/userModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/sendEmail");

// @desc    Create a JWT token
const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
/**
 * @desc protect routes middleware
 */
exports.protect = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }
  // Verify token
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  // Check if user still exists
  const currentUser = await User.findById({ _id: decodedToken.id });

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }
  // Check if user changed password after the token was issued
  if (currentUser.passwordChangedAt) {
    const passwordChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passwordChangedTimestamp > decodedToken.iat) {
      res.clearCookie("token", { sameSite: "none", secure: true });
      return next(
        new AppError("User recently change his password, please login again.!")
      );
    }
  }
  req.user = currentUser;
  next();
});

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = createToken({ id: user._id });

  res.cookie("token", token).status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await User.findOne({ email });
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // Create token and send
  const token = createToken({ id: user._id });

  res.cookie("token", token).status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
/**
 * @desc    Logout user
 * @route   GET /api/v1/auth/logout
 * @access  Public
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res
    .clearCookie("token", { sameSite: "none", secure: true })
    .status(200)
    .json({
      status: "success",
      message: "Logged out successfully",
    });
});

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgotPassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide email", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with that email", 404));
  }
  // Generate reset token without hashing
  const resetToken = user.createPasswordResetToken();

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${
    req.protocol
  }://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}. If you didn't forget your password, please ignore this email!`;
  //send token to user email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });
  } catch (error) {
    user.passwordRestToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email", 500));
  }
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message,
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/v1/auth/resetPassword
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedCode = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordRestToken: hashedCode,
    passwordRestExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.newPassword;
  user.passwordRestToken = undefined;
  user.passwordRestExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save({
    validateBeforeSave: false,
  });

  res.status(200).json({
    status: "success",
    message: "Password reset successfully back to login",
    user,
  });
});

/**
 * @desc Get my profile
 * @route GET /api/v1/auth/getMe
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {});
/**
 * @desc Delete my account
 * @route DELETE /api/v1/auth/deleteMe
 * @access Private
 */

exports.deleteMe = asyncHandler(async (req, res, next) => {
  const currentPassword = req.body.password;
  // // this will be more step not important because we already have user in req.user and check if it updated  password or not
  // const user = await User.findById(req.user._id).select("+password");
  if (!currentPassword) {
    return next(new AppError("Please provide password", 400));
  }

  if (!(await req.user.correctPassword(currentPassword, req.user.password))) {
    return next(new AppError("Incorrect password", 401));
  }

  await User.findByIdAndDelete(req.user._id);
  res
    .clearCookie("token", { sameSite: "none", secure: true })
    .status(204)
    .json({
      status: "success",
      message: "Account deleted successfully",
    });
});
