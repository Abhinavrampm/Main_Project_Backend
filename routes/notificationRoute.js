
const express = require('express');
const router = express.Router();
const Farmreg = require('../models/Farmreg');
const EquipmentRental = require('../models/EquipmentRental');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to fetch all notifications for the user
// Route to fetch all notifications for the user
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const userId = req.user;
        const user = await Farmreg.findById(userId).populate({
            path: 'notifications.senderId', // Populate the senderId with name
            select: 'name', // Only include the name field
        }).populate({
            path: 'notifications.offerId',
            populate: { path: 'equipmentId', model: 'EquipmentRental' },
        });

        res.status(200).json({ notifications: user.notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.delete('/notifications/:notificationId', authMiddleware, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user;

        // Remove the notification
        await Farmreg.findByIdAndUpdate(userId, {
            $pull: { notifications: { _id: notificationId } }
        });

        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
