const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    phone:{
        type:String,
        default:null
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    passwordHash:{
        type:String,
        required:true,
    }
},
{timestamps:true});


const User = mongoose.model('User',userSchema);

module.exports = User;