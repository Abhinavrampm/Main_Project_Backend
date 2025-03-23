const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware')
const Farmreg = require('../models/Farmreg');
const Workerreg = require('../models/Workerreg');
// Farmer Signup route
router.post('/signup', authController.signup);

// Farmer Login route
router.post('/login', authController.login);
//Worker signup route
router.post('/Workersignup',authController.Workersignup);
//Worker login route
router.post('/Workerlogin',authController.Workerlogin);
router.post('/addTransaction',authController.addTransaction);
router.get('/getTransactions',authController.getTransactions);
router.delete('/deleteTransaction/:id', authController.deleteTransaction);
router.get('/dashboardData',authController.dashboardData);
router.get('/getAllAdminUsers',authController.getAllAdminUsers);
router.get('/messages/:id', authController.messages);
router.post('/sendMessage/:id', authController.sendMessage);
router.post('/markMessagesAsSeen/:id', authController.markMessagesAsSeen);
router.get('/getUserDetails', authController.getUserDetails);
router.post('/postJob',authController.postJob);
router.get('/getJobPostings',authController.getJobPostings);
router.delete('/deleteJobPosting/:id', authController.deleteJobPosting);
router.get('/getAllJobPostings',authController.getAllJobPostings);
router.post('/applyForJob/:id', authController.applyForJob);
router.get('/isApplicantAvailable',authController.isApplicantAvailable);
router.get('/getAllApplicantList',authController.getAllApplicantList);
router.post('/approveAppliant/:id', authController.approveAppliant);
router.post('/rejectAppliant/:id', authController.approveAppliant);
router.post('/reliveAppliant/:id', authController.reliveAppliant);
router.get('/getWorkHistory/:id',authController.getWorkHistory);



 //Get the logged-in user's profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Find the user based on the ID from the auth token
        const user = await Farmreg.findById(req.user);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the user's name and email
        res.json({
            name: user.name
        });
    } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
