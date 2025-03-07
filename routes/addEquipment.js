const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware')
const EquipmentRental = require('../models/EquipmentRental');
const Farmreg = require('../models/Farmreg');
const router = express.Router();
const Offer = require('../models/Offer');
// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to an "uploads" directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Name file with timestamp
    },
});

// Multer middleware
const upload = multer({ storage: storage });

// Route to add equipment with image upload
// Route to add equipment with image upload
router.post('/add', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        // Check if image file exists in the request
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        // Check if required fields are present
        console.log(req.user);
        const { name, description, price, rateType, condition, location, userName } = req.body;
        console.log(req.body);
        
        if (!name || !description || !price || !rateType || !condition || !location || !userName) {
            return res.status(400).json({ error: 'Please provide all required fields.' });
        }
        
        // Create a new EquipmentRental document
        const newEquipment = new EquipmentRental({
            name,
            description,
            imagePath: req.file.path, // Store image file path
            price,
            rateType,
            condition,
            location,
            userName,
            ownerId: req.user, // Retrieved from auth middleware
        });

        // Save the equipment to the database
        await newEquipment.save();
        res.status(201).json({ message: 'Equipment added successfully!' });
    } catch (error) {
        console.error('Error in /add route:', error); // Logs for easier debugging
        res.status(500).json({ error: 'Failed to add equipment' });
    }
});



// Route to fetch all equipment
router.get('/', authMiddleware, async (req, res) => {
    try {
        const equipmentList = await EquipmentRental.find({ ownerId: { $ne: req.user } }); // Exclude user's own items
        res.status(200).json(equipmentList);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: 'Failed to fetch equipment' });
    }
});


// Route to fetch equipment uploaded by the logged-in user
router.get('/my-uploads', authMiddleware, async (req, res) => {
    try {
        const userId = req.user; // Get user ID from the authenticated request
        const myEquipment = await EquipmentRental.find({ ownerId: userId });
        res.status(200).json(myEquipment);
    } catch (error) {
        console.error('Error fetching user uploads:', error);
        res.status(500).json({ error: 'Failed to fetch user uploads' });
    }
});

// Route to delete an equipment item
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const equipmentId = req.params.id;
        const deletedItem = await EquipmentRental.findOneAndDelete({ _id: equipmentId, ownerId: req.user });
        if (!deletedItem) return res.status(404).json({ message: 'Item not found or unauthorized' });

        res.status(200).json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});

router.post('/offer/:equipmentId', authMiddleware, async (req, res) => {
    const { equipmentId } = req.params;
    const { rentalDays, message } = req.body;
    const renterId = req.user;

    try {
        const equipment = await EquipmentRental.findById(equipmentId);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
        const newOffer = new Offer({ renterId, equipmentId, rentalDays, message, status: 'requested' });
        await newOffer.save();

        // Notify owner with type 'offer'
        const owner = await Farmreg.findById(equipment.ownerId);
        if (owner) {
            owner.notifications.push({
                message,
                notificationType: 'offer',
                equipmentId,
                senderId: renterId,
                offerId: newOffer._id,
            });
            await owner.save();
        }

        // Notify renter with type 'request'
        const renter = await Farmreg.findById(renterId);
        if (renter) {
            renter.notifications.push({
                message: `Your request for ${equipment.name} has been sent to the owner.`,
                notificationType: 'request',
                equipmentId,
                offerId: newOffer._id,
            });
            await renter.save();
        }

        res.status(201).json({ message: 'Offer created and notifications sent', offerId: newOffer._id });
    } catch (error) {
        res.status(500).json({ message: 'Error creating offer', error });
    }
});
//accept offer route
router.post('/accept-offer/:equipmentId/:offerId', authMiddleware, async (req, res) => {
    const { equipmentId, offerId } = req.params;
    try {
        const offer = await Offer.findById(offerId).populate('renterId equipmentId');
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        // Update offer status to accepted
        offer.status = 'accepted';
        await offer.save();

        // Update equipment availability status
        const equipment = await EquipmentRental.findById(equipmentId);
        if (equipment) {
            equipment.available = false;
            equipment.returnDate = new Date(Date.now() + offer.rentalDays * 24 * 60 * 60 * 1000);
            await equipment.save();
        }

        // Create a notification for the renter
        const renter = await Farmreg.findById(offer.renterId);
        if (renter) {
            renter.notifications.push({
                message: `Your request for ${offer.equipmentId.name} has been accepted.`,
                notificationType: 'request', // Sets type as request for Our Requests section
                equipmentId: offer.equipmentId._id,
                offerId: offer._id
            });
            await renter.save();
        }

        // Remove the owner's notification for this offer, if required
        const owner = await Farmreg.findById(equipment.ownerId);
        if (owner) {
            owner.notifications = owner.notifications.filter(notif => notif.offerId.toString() !== offerId);
            await owner.save();
        }

        res.status(200).json({ message: 'Offer accepted and renter notified' });
    } catch (error) {
        console.error('Error accepting offer:', error);
        res.status(500).json({ error: 'Failed to accept offer' });
    }
});

// Route to reject an offer
router.post('/reject-offer/:equipmentId/:offerId', authMiddleware, async (req, res) => {
    const { equipmentId, offerId } = req.params;
    try {
        const equipment = await EquipmentRental.findById(equipmentId);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        const offer = await Offer.findById(offerId).populate('renterId equipmentId');
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        // Update offer status to rejected
        offer.status = 'rejected';
        await offer.save();

        // Create a notification for the renter
        const renter = await Farmreg.findById(offer.renterId);
        if (renter) {
            renter.notifications.push({
                message: `Your request for ${offer.equipmentId.name} has been rejected.`,
                notificationType: 'request', // Sets type as request for Our Requests section
                equipmentId: offer.equipmentId._id,
                offerId: offer._id
            });
            await renter.save();
        }

        // Remove the owner's notification for this offer, if required
        const owner = await Farmreg.findById(offer.equipmentId.ownerId);
        if (owner) {
            owner.notifications = owner.notifications.filter(notif => notif.offerId.toString() !== offerId);
            await owner.save();
        }

        res.status(200).json({ message: 'Offer rejected and renter notified' });
    } catch (error) {
        console.error('Error rejecting offer:', error);
        res.status(500).json({ error: 'Failed to reject offer' });
    }
});



module.exports = router;
