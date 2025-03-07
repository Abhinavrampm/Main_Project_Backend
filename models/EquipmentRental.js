// models/EquipmentRental.js
const mongoose = require('mongoose');

const equipmentRentalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imagePath: { type: String, required: true },
    price: { type: Number, required: true },
    rateType: { type: String, enum: ['day', 'week'], required: true },
    condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor'], required: true },
    available: { type: Boolean, default: true },
    returnDate: { type: Date }, // Date when the equipment becomes available again
    location: {
        type: String,
        enum: [
            "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", 
            "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", 
            "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
        ],
        required: true
    }, // Location field
    userName: { type: String, required: true }, // Name of the user
    createdAt: { type: Date, default: Date.now },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmreg', required: true },
});

const EquipmentRental = mongoose.model('EquipmentRental', equipmentRentalSchema);
module.exports = EquipmentRental;
