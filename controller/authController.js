const User = require("../model/userModel");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Set up multer storage
const storage = multer.memoryStorage();
// Set up multer upload
const multerFilter = function (req, file, cb) {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({ storage, fileFilter: multerFilter });

// Middleware to handle image upload
exports.uploadUserPhoto = upload.single("image");
// Middleware to resize image
exports.resizeUserPhoto = asyncHandler(async (req, res, next) => {
  console.log(req.file);

  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  res.body.image = req.file.filename;
  console.log(req.file.filename);

  next();
});

const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

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
  // Generate reset token
  const resetToken = user.createPasswordResetToken();

  //send token to user email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message: `Your password reset token is: ${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/resetPassword/${resetToken}`,
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
    message: `Your password reset token is: ${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetPassword/${resetToken}`,
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
    .update(req.params.restCode)
    .digest("hex");

  const user = await User.findOne({
    passwordRestToken: hashedCode,
    passwordRestExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordRestToken = undefined;
  user.passwordRestExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password reset successfully back to login",
  });
});
