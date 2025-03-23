const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Farmreg = require('../models/Farmreg');
const Workerreg = require('../models/Workerreg');
const Transaction = require("../models/Transaction");
const ChatBase = require('../models/ChatBase');
const JobPosting = require('../models/JobPosting')
const JobApplication = require('../models/JobApplication')

let currentToken = null;
// Farmer Signup logic
exports.signup = async (req, res) => {
  try {
    const { name, email, phoneNo, password } = req.body;

    // Check if the user already exists
    const existingUser = await Farmreg.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Farmreg({ name, email, phoneNo, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Farmer Login logic
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await Farmreg.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and return a JWT token
    const token = jwt.sign({ id: user._id, email: user.email, usertypeid: user.usertypeid }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    currentToken = token;
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

//Worker Signup Logic
exports.Workersignup = async (req, res) => {
  const { name, phoneNo, password } = req.body;

  try {
    // Validate input
    if (!name || !phoneNo || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if worker already exists
    const existingWorker = await Workerreg.findOne({ phoneNo });
    if (existingWorker) {
      return res.status(400).json({ message: 'Worker already registered with this phone number.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the worker
    const newWorker = new Workerreg({
      name,
      phoneNo,
      password: hashedPassword,
    });

    await newWorker.save();

    res.status(201).json({ message: 'Worker registered successfully!' });
  } catch (error) {
    console.error('Error during worker signup:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}
exports.Workerlogin = async (req, res) => {
  try {
    const { phoneNo, password } = req.body;

    // Check if user exists
    const user = await Workerreg.findOne({ phoneNo });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password Invalid ' });
    }

    // Create and return a JWT token
    const token = jwt.sign({ id: user._id, phoneNo: user.phoneNo }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log(token);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
}

exports.addTransaction = async (req, res) => {
  try {
    const token = currentToken;
    const decoded = jwt.decode(token);
    console.log("token is ", decoded);
    console.log("Decoded ID is ", decoded.id);

    const { transactionName, transactionType, amount, date } = req.body;

    if (!transactionName || !transactionType || !amount || !date) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newTransaction = new Transaction({ transactionName, transactionType, amount, date, CreatedBy: decoded.id, });
    await newTransaction.save();

    res.status(201).json({ message: "Transaction added successfully!" });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}
// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    const transactions = await Transaction.find({ CreatedBy: id });

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found for this user." });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Transaction.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
};

exports.dashboardData = async (req, res) => {
  try {
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;
    const { fromDate, toDate } = req.query;

    const startDate = fromDate ? new Date(fromDate) : new Date();
    startDate.setHours(0, 0, 0, 0); // Set to the start of the day (00:00:00)

    const endDate = toDate ? new Date(toDate) : new Date();
    endDate.setHours(23, 59, 59, 999); // Set to the end of the day (23:59:59)

    const topExpenses = await Transaction.aggregate([
      {
        $match: {
          CreatedBy: id,
          transactionType: 2,
          date: { $gte: startDate, $lt: endDate }, // Filter expenses by date range
        },
      },
      {
        $group: {
          _id: "$transactionName",
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const formattedExpenses = topExpenses.map((expense) => ({
      category: expense._id,
      amount: expense.totalAmount,
    }));

    const topIncome = await Transaction.aggregate([
      {
        $match: {
          CreatedBy: id,
          transactionType: 1,
          date: { $gte: startDate, $lt: endDate }, // Filter income by date range
        },
      },
      {
        $group: {
          _id: "$transactionName",
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const formattedIncome = topIncome.map((income) => ({
      category: income._id,
      amount: income.totalAmount,
    }));

    res.status(200).json({ topExpenses: formattedExpenses, topIncome: formattedIncome });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
};

// Get all admin users

exports.getAllAdminUsers = async (req, res) => {
  try {
    const token = currentToken;
    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;
    const usertypeid = decoded.usertypeid;
    console.log(decoded);
    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    let adminUsers = null;

    if (usertypeid == 0) {
      adminUsers = await Farmreg.find({ usertypeid: 1 });
    } else {
      adminUsers = await Farmreg.find({ usertypeid: 0 });
    }

    if (!adminUsers || adminUsers.length === 0) {
      return res.status(404).json({ message: "No admin users found." });
    }

    // Add unseen message count for each admin user
    const updatedAdminUsers = await Promise.all(
      adminUsers.map(async (user) => {
        const unseenCount = await ChatBase.countDocuments({
          ReceivedBy: id,  // Messages received by the logged-in user
          CreatedBy: user._id, // Messages sent by the admin user
          isSeen: 0, // Unseen messages
        });

        return { ...user.toObject(), unseenCount }; // Add unseen count to user object
      })
    );
    res.status(200).json(updatedAdminUsers);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


// Get all messages
exports.messages = async (req, res) => {
  try {
    const token = currentToken;
    const decoded = jwt.decode(token);
    const { id } = req.params;

    const messages = await ChatBase.find({
      $or: [
        { CreatedBy: decoded.id, ReceivedBy: id }, // Messages sent by logged-in user
        { CreatedBy: id, ReceivedBy: decoded.id }, // Messages received by logged-in user
      ],
    }).sort("createdAt");



    res.status(200).json(messages); // Return admin users instead of "transactions"
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.sendMessage = async (req, res) => {
  try {

    const token = currentToken;
    const decoded = jwt.decode(token);
    console.log(req.body);
    console.log(req.body.isImage);

    const { text } = req.body;
    const receiverId = req.params.id;
    const isImage = req.body.isImage

    // Validate input
    if (!receiverId || !text) {
      return res.status(400).json({ message: "Receiver ID and message text are required." });
    }

    // Save the message in the database
    const newMessage = new ChatBase({
      CreatedBy: decoded.id, // Sender
      ReceivedBy: receiverId, // Receiver
      meassage: text,
      isImage: isImage,
    });

    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.markMessagesAsSeen = async (req, res) => {
  try {
    const senderId = req.params.id;
    const token = currentToken;
    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const receiverId = decoded.id; // Logged-in user


    const messages = await ChatBase.find({
      CreatedBy: senderId,
      ReceivedBy: receiverId,
      isSeen: 0, // Only unseen messages
    }).sort("createdAt");


    if (messages.length === 0) {
      return res.status(200).json({ message: "No unseen messages to update." });
    }

    // Update only these specific messages
    await ChatBase.updateMany(
      { _id: { $in: messages.map((msg) => msg._id) } },
      { $set: { isSeen: 1 } }
    );



    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const token = currentToken;
    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;
    const usertypeid = decoded.usertypeid;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }


    res.status(200).json(usertypeid);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.postJob = async (req, res) => {
  try {
    const token = currentToken;
    const decoded = jwt.decode(token);
    console.log(decoded);
    
    const { jobTitle, jobType, amount, date, description } = req.body;

    if (!jobTitle || !jobType || !amount || !date || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newJobPosting = new JobPosting({ jobTitle, jobType, amount, date, description, CreatedBy: decoded.id, });
    await newJobPosting.save();

    res.status(201).json({ message: "Job Posted successfully!" });
  } catch (error) {
    console.error("Error adding Jobs:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}

exports.getJobPostings = async (req, res) => {
  try {
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    const jobPostings = await JobPosting.where("CreatedBy")
      .equals(id)
      .where("RecordStatus")
      .ne(80);
    if (jobPostings.length === 0) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    res.status(200).json(jobPostings);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.deleteJobPosting = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await JobPosting.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    res.status(200).json({ message: "Job posting deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting Job posting" });
  }
};

exports.getAllJobPostings = async (req, res) => {
  try {
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    // Fetch all job postings not created by the user
    const jobPostings = await JobPosting.find({ CreatedBy: { $ne: id } });

    if (jobPostings.length === 0) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    // Fetch job applications for these job postings
    const jobIds = jobPostings.map(job => job._id);
    const appliedPostings = await JobApplication.find({ JobID: { $in: jobIds } });
    const approvedJob = await JobApplication.where("JobID")
      .equals(jobIds)
      .where("Status")
      .equals(1);
      console.log("approvedJob",approvedJob);
    var countstatus = approvedJob.length > 0 ? 1 : 0;
    console.log("countstatus",countstatus);
    // Map job postings with application status
    const postingsWithStatus = jobPostings.map(job => {
      const application = appliedPostings.find(app => app.JobID.toString() === job._id.toString());
      return {
        ...job._doc,
        applicationStatus: application ? application.Status : null,// Default to null if no application exists
        countStatus: countstatus
      };
    });
    res.status(200).json(postingsWithStatus);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.decode(token);
    const userid = decoded.id;
    const newJobApplication = new JobApplication({
      JobID: jobId,      // Assign 'id' to 'JobID'
      UserID: userid, // Assign 'userid' to 'UserID'
      Status: 0,      // Default status (Applied)
      CreatedBy: userid, // Assign 'userid' to 'CreatedBy'
    });

    await newJobApplication.save();

    res.status(201).json({ message: "Job Posted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error applying for job" });
  }
};

exports.isApplicantAvailable = async (req, res) => {
  try {
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    // Fetch all job postings not created by the user
    const jobPostings = await JobPosting.find({ CreatedBy: { $in: id } });

    if (jobPostings.length === 0) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    // Fetch job applications for these job postings
    const jobIds = jobPostings.map(job => job._id);
    const appliedPostings = await JobApplication.find({ JobID: { $in: jobIds } });

    // Map job postings with application status
    const postingsWithStatus = jobPostings.map(job => {
      const application = appliedPostings.find(app => app.JobID.toString() === job._id.toString());
      return {
        ...job._doc,
        applicationStatus: application ? application.Status : null // Default to null if no application exists
      };
    });
    res.status(200).json(postingsWithStatus);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


exports.getAllApplicantList = async (req, res) => {
  try {
    const token = currentToken;
    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    if (!id) {
      return res.status(401).json({ message: "Invalid token. User ID not found." });
    }

    // Fetch all job postings created by the user
    const jobPostings = await JobPosting.find({ CreatedBy: id });
    if (!jobPostings.length) {
      return res.status(200).json([]);
    }

    // Get job IDs
    const jobIds = jobPostings.map(job => job._id);

    // Fetch applications for those jobs
    const listOfApplicants = await JobApplication.find({
      JobID: { $in: jobIds },
      Status: { $ne: 3 } // Exclude status 3
    });


    if (!listOfApplicants.length) {
      return res.status(200).json([]);
    }

    // Get unique applicant IDs
    const applicantIds = [...new Set(listOfApplicants.map(app => app.UserID))];

    // Fetch applicant details
    const applicantDetails = await Farmreg.find({ _id: { $in: applicantIds } })
      .select("name email phoneNo");

    // Convert applicant details to a map for quick lookup
    const applicantMap = applicantDetails.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Merge data into the required format
    const responseData = listOfApplicants.map((application, index) => {
      const applicant = applicantMap[application.UserID] || {};
      const job = jobPostings.find(j => j._id.toString() === application.JobID.toString());


      return {
        slNo: index + 1,
        jobID: job?._id || "Unknown",
        jobTitle: job?.jobTitle || "Unknown",
        jobType: job?.jobType || "Unknown",
        applicantName: applicant.name || "N/A",
        contactNumber: applicant.phoneNo || "N/A",
        applicantEmail: applicant.email || "N/A",
        applicantID: applicant._id,
        status: application.Status ?? 0,
      };
    });
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.approveAppliant = async (req, res) => {
  try {
    const id = req.params.id;
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.decode(token);
    const userid = decoded.id;
    await JobApplication.updateOne(
      { JobID: id },  // Find a single application with this JobID
      { $set: { Status: 1 } }
    );

    await JobPosting.updateOne(
      { _id: id },
      { $set: { RecordStatus: 80 } }
    );

    res.status(201).json({ message: "applicant approved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error approving  applicant" });
  }
};

exports.rejectAppliant = async (req, res) => {
  try {
    const id = req.params.id;
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.decode(token);
    const userid = decoded.id;
    await JobApplication.updateOne(
      { JobID: id },  // Find a single application with this JobID
      { $set: { Status: 2 } }
    );


    res.status(201).json({ message: "Applicant rejected successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error rejecting applicant" });
  }
};

exports.reliveAppliant = async (req, res) => {
  try {
    const id = req.params.id;
    const token = currentToken;

    if (!token) {
      return res.status(401).json({ message: "Token is missing." });
    }

    const decoded = jwt.decode(token);
    const userid = decoded.id;
    await JobApplication.updateOne(
      { JobID: id },  // Find a single application with this JobID
      { $set: { Status: 3 } }
    );
    await JobPosting.updateOne(
      { _id: id },
      { $set: { RecordStatus: 0 } }
    );

    res.status(201).json({ message: "Applicant releived successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error releiving applicant" });
  }
};

exports.getWorkHistory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Received User ID: ", id);

    const token = currentToken;
    const decoded = jwt.decode(token);

    // Fetch job applications with JobPosting and Farmreg details
    const applicantHistory = await JobApplication.find({
      UserID: id,
      Status: 3, // Completed applications
    })
      .populate({
        path: "JobID",
        model: JobPosting,
        select: "jobTitle jobType amount description CreatedBy",
      })
      .lean();

    console.log("Raw applicantHistory: ", applicantHistory);

    const formattedHistory = await Promise.all(
      applicantHistory.map(async (app) => {
        let farmDetails = { name: "Unknown", email: "Unknown", phoneNo: "Unknown" };
        
        if (app.JobID?.CreatedBy) {
          const farm = await Farmreg.findById(app.JobID.CreatedBy).select("name email phoneNo").lean();
          if (farm) {
            farmDetails = farm;
          }
        }

        return {
          _id: app._id,
          UserID: app.UserID,
          JobID: app.JobID?._id || null,
          Status: app.Status,
          DocumentURL: app.DocumentURL || "N/A",
          jobTitle: app.JobID?.jobTitle || "Unknown",
          jobType: app.JobID?.jobType || "Unknown",
          amount: app.JobID?.amount || 0,
          description: app.JobID?.description || "No description",
          jobCreatedBy: app.JobID?.CreatedBy || null,
          farmName: farmDetails.name,
          farmEmail: farmDetails.email,
          farmPhone: farmDetails.phoneNo,
        };
      })
    );

    console.log("Formatted applicant history: ", formattedHistory);
    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("Error fetching work history:", error);
    res.status(500).json({ message: "Error retrieving applicant history." });
  }
};
