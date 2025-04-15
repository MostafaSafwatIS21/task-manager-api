const express = require("express");
const cookies = require("cookie-parser");
const globalError = require("./middleware/errorHandler");

const authRoute = require("./router/authRoute");
const taskRoute = require("./router/taskRoute");
const labelRoute = require("./router/labelRoute");

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
app.use("/api/v1/tasks", taskRoute);
app.use("/api/v1/labels", labelRoute);

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

// Handle error outside express

process.on("unhandledRejection", (err) => {
  console.log("unhandledRejection", err);
  server.close(() => {
    console.error("Shutting down..!");
    process.exit(1);
  });
});
