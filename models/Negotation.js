
const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EquipmentRental',
        required: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmreg', // reference to the User schema for the farmer making the request
        required: true,
    },
    offerPrice: {
        type: Number,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Negotiation = mongoose.model('Negotiation', negotiationSchema);
module.exports = Negotiation;
