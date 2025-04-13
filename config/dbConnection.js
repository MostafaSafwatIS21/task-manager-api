const mongoose = require("mongoose");

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI).then((conn) => {
    console.log(`database connection success ${conn.connection.host}`);
  });
};
module.exports = connectDB;
