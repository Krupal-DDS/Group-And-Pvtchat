const mongoose = require('mongoose')

MessageSchema = mongoose.Schema({
    token:{
        type: String,
        require: true
    },
    messages: [{
        sender :{
            type : String,
            require: true        
        },
        receiver :{
            type: String,
            require: true
        },
        message:{
            type: String,
            require: true
        }
    }]
})

module.exports = mongoose.model("PvtMsgs",MessageSchema,"PvtMsgs");

