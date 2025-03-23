const mongoose = require("mongoose");

// Define the schema
const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    jobType: {
      type: Number,
      required: true,
      enum: [1, 2], // 1 for Manual, 2 for Office
    },
    amount: {
      type: Number, // Supports high-precision decimal values
      required: true,
      min: 0, // Ensures amount cannot be negative
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
      },
    CreatedBy: {
      type: String,
      required: true,
      trim: true,
    },
    RecordStatus: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
const JobPosting = mongoose.model("JobPosting", jobSchema);
module.exports = JobPosting;
