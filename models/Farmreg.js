const mongoose = require('mongoose');

// Define the notification schema
const notificationSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    read: {
        type: Boolean,
        default: false, // Whether the notification has been read
    },
    equipmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EquipmentRental', // Reference to the equipment listing
    },
    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer', // Reference to the offer (used in "offer" notifications)
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmreg', // Reference to the user who sent the offer/request
    },
    notificationType: {
        type: String,
        enum: ['offer', 'request'],
 // Specifies if it's an "offer" or "request" notification
    }
});

// Define the user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNo: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/, // Ensures only 10 digits
    },
    password: {
        type: String,
        required: true,
    },
    usertypeid: {
        type: Number,
        default: 0, // Default value set to 0
    },
    notifications: [notificationSchema]
});

const Farmreg = mongoose.model('Farmreg', userSchema);
module.exports = Farmreg;