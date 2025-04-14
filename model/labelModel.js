const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a label name"],
      trim: true,
      minlength: [1, "Label name must be at least 1 character"],
      maxlength: [50, "Label name must be at most 50 characters"],
    },
    color: {
      type: String,
      trim: true,
      default: "#000000",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a user"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Label", labelSchema);
