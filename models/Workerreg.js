const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true,
    },
    phoneNo : {
        type:Number,
        required:true,
        match: /^[0-9]{10}$/,
    },
    password : {
        type:String,
        required:true,
    }
});

const Workerreg = mongoose.model('Workerreg',workerSchema);
module.exports = Workerreg;