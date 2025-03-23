const mongoose = require("mongoose");

// Define the schema
const jobappSchema = new mongoose.Schema(
  {
    JobID: {
      type: String,
      required: true,
      trim: true,
    },
    UserID: {
      type: String,
      required: true,
      trim: true,
    },
    DocumentURL: {
      type: String,
      required: false,
      trim: true,
    },
    Status: {
      type: Number,
      default: 0,//Applied
    },
    CreatedBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const JobApplication = mongoose.model("JobApplication", jobappSchema);
module.exports = JobApplication;
