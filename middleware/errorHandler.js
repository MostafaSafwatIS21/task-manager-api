const AppError = require("../utils/appError");

const handleEmailConnectionError = () =>
  new AppError(
    "There was an error connecting, please check your internet connection",
    408
  );

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const devErrorHandler = (err, res) => {
  if (res.headersSent) return;
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    err,
  });
};

const prodErrorHandler = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

const globalErrorHandler = (err, req, res, next) => {
  err.status = err.status || "error";
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    devErrorHandler(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.code === "ESOCKET") err = handleEmailConnectionError(err);
    if (err.name === "JsonWebTokenError") err = handleJWTError();
    if (err.name === "TokenExpireError") err = handleJWTExpiredError();

    prodErrorHandler(err, res);
  }
};

module.exports = globalErrorHandler;
