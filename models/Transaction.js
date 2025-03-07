const mongoose = require("mongoose");

// Define the schema
const transactionSchema = new mongoose.Schema(
  {
    transactionName: {
      type: String,
      required: true,
      trim: true,
    },
    transactionType: {
      type: Number,
      required: true,
      enum: [1, 2], // 1 for Income, 2 for Expense
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
const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
