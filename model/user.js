const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema({
        like : Boolean, 
        comment : Boolean, 
        share : Boolean, 
        mentioned : Boolean,
        user : {
            type : Number,
            ref : 'User'
        }, 
        postId : {
            type : mongoose.Schema.Types.ObjectId ,
            required : [true, 'This post isn\'t available.']
        }
})

const userSchema = mongoose.Schema({
    _id : Number,
    name : {
        type : String,
        required : [true, 'Couldn\'t get name field.']
    },
    gender : String,
    dateOfBirth : Date,
    profilePicURL : String,
    profileCompleted : {
        type : Boolean,
        default : false
    },
    setting : {
        isPrivate : {
            type : Boolean,
            default : true
        }
    },
    createdAt : {
        type : Date,
        default : Date.now()
    },
    notifications : {
        count : { type : Number, default : 0 },
        desc : [notificationSchema]
    }    

})



module.exports = mongoose.model('User', userSchema);