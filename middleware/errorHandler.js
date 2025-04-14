const AppError = require("../utils/appError");

const handleEmailConnectionError = (err) =>
  new AppError(
    "There was an error connecting, please check your internet connection",
    408
  );

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
  } else {
    // if (err.code === "ESOCKET") {
    //   err = handleEmailConnectionError(err);
    // }

    prodErrorHandler(err, res);
  }
};

module.exports = globalErrorHandler;
