const express = require("express");

require("dotenv").config();

const app = express();
const dbConnection = require("./config/dbConnection");

dbConnection();

app.listen(process.env.PORT, () => {
  console.log(`Server Run on port ${process.env.PORT}`);
});
