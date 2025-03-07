const mongoose = require("mongoose");

// Define the schema
const chatSchema = new mongoose.Schema(
    {
        meassage: {
            type: String,
            required: true,
            trim: true,
        },
        isSeen: {
            type: Number,
            default: 0,
        },

        CreatedBy: {
            type: String,
            required: true,
            trim: true,
        },
        ReceivedBy: {
            type: String,
            required: true,
            trim: true,
        },
        isImage: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Create and export the model
const ChatBase = mongoose.model("ChatBase", chatSchema);
module.exports = ChatBase;
