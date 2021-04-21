const jwt = require('jsonwebtoken')
const User = require('../models/usersModel');

const authUser = (req,res,next)=>{
    try {
        const token = req.cookies.token;

        if(!token){
            // return res.status(401).json({'errormessage':"Authentication Failed!"});
            throw "Unauthorized";
        }
        const verified = jwt.verify(token,process.env.JWT_SECRETE);

        req.user = verified.user;

        // proceed after authentication
        next();

    } catch (error) {
        return res.status(401).json({'errormessage':`authUser ${error.message}`});
    }
}

const authAdmin = async(req,res,next)=>{
    try {
        const token = req.cookies.token;

        if(!token){
            // return res.status(401).json({'errormessage':"Authentication Failed!"});
            throw "Unauthorized";
        }
        const verified = jwt.verify(token,process.env.JWT_SECRETE);

        const admin = await User.findOne({_id:verified.user});
        if(!admin.isAdmin) throw 'You are unauthorized!';

        req.user = verified.user;

        // proceed after authentication
        next();
    } catch (error) {
        return res.status(401).json({"errorMessage":`authAdmin ${error}`});
    }
}

module.exports = {authUser, authAdmin};