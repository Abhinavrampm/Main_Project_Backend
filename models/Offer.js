// models/Offer.js
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    renterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmreg', required: true },
    equipmentId : { type:mongoose.Schema.Types.ObjectId,ref:'EquipmentRental',required:true},
    rentalDays: { type: Number, required: true }, // Number of rental days or weeks requested
    message: { type: String, required: true },
    status: { type: String, enum: ['requested', 'accepted', 'rejected', 'pending'], default: 'requested' },
    createdAt: { type: Date, default: Date.now },
});

const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;
