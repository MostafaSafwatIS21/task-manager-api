const express = require("express");
const AppError = require("./utils/appError");
const cookies = require("cookie-parser");
const globalError = require("./middleware/errorHandler");

const authRoute = require("./router/authRoute");

require("dotenv").config();

const app = express();
const dbConnection = require("./config/dbConnection");
// database connection
dbConnection();

// body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// cookie parser
app.use(cookies());

app.use("/api/v1/auth", authRoute);

// app.all("*", (req, res, next) => {
//   res.status(404).json({
//     status: "fail",
//     message: `Can't find ${req.originalUrl} on this server!`,
//   });
// });

app.use(globalError);
app.listen(process.env.PORT, () => {
  console.log(`Server Run on port ${process.env.PORT}`);
});
