const mongoose = require('mongoose');
const productSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        default:null
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:String,
        default:null
    },
    uploaded_by:{
        type:mongoose.Schema.Types.ObjectID,
        required:true,
        ref:'User'
    }
},
{timestamps:true});


const Product = mongoose.model('Product',productSchema);

module.exports = Product;