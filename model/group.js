const mongoose = require('mongoose');

const grpSchema = mongoose.Schema({
    socketId:{
        type:String,
        require: true
    },
    GroupName:{
        type: String,
        require: true
    },
    Groups:{
        type: String,
        require: true
    },
    Users:[{
        username:{
            type: String,
            require: true
        },
        userId:{
            type:String,
            require: true
        }
    }],
    messages:[{
        sender:{
            type: String,
            require: true
        },        
        message:{
            type: String,
            require: true
        },
        time:{
            type:String,
            require: true   
        }
    }]
})

module.exports = mongoose.model('Groups',grpSchema,"Groups");