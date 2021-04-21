const User = require('../models/usersModel');
const ForgetPassword = require('../models/forgetPasswordModel');
const Product = require('../models/productsModel');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const {createOtp} = require('../helper/credentialToken');
const {sendEmail} = require('../helper/sendEmail');

/**
 * @desc        Register user 
 * @Endpoint    Post @/api/users/
 * @access      Public
 */
const registerUser = async(req,res)=>{
    try {
        const {
            name,
            email,
            password,
            passwordVerify,
        } = req.body;

        if(!email || !password || !passwordVerify) throw "Provide all fields!";

        if(password !== passwordVerify) throw "Make sure password match with confirm password field!";

        if(password.length < 8) throw "Password length should not be less than 8 characters!";

        const existingUser = await User.findOne({email});
        if(existingUser) throw "Email-id already taken!"

        // Hashing password

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password,salt);

        // store data in DB

        const newUser = await new User({
            name,
            email,
            passwordHash,
        });

        const savedUser = await newUser.save(newUser);

        if (savedUser) {
            // if user created successfully then create TOKEN for user
            const token = jwt.sign({
                user:savedUser._id
            },process.env.JWT_SECRETE);

            return res.cookie('token',token,{
                maxAge: 7200000, // 2Hrs. maxAge in millisecond
                httpOnly:true
            }).send();
        }else{
            throw "Some error occured during Loging...";
        }


    } catch (error) {
        console.log(error);
        return res.status(500).json({'errormessage':`Error createUser ${error}`});
    }
}

/**
 * @desc        Login user 
 * @Endpoint    Post @/api/users/login
 * @access      Public
 */
const loginUser = async(req,res)=>{
    try {
        const {email, password} = req.body;
        
        if (!email || !password) throw 'Check credentials!';

        const isUserExist = await User.findOne({email});

        if(!isUserExist) throw new 'User not exist with entered email.';

        const isMatch = await bcrypt.compare(password,isUserExist.passwordHash);

        if (!isMatch) throw 'Check credentials!';
        
        // Token
        const token = jwt.sign({
            user:isUserExist._id
        },process.env.JWT_SECRETE);

        // Assign token to http cookies
        return res.cookie('token',token,{
            maxAge: 7200000, // 2Hrs. maxAge in millisecond
            httpOnly:true,
        }).json({'message':'Logged In'});

    } catch (error) {
        return res.status(500).json({'errormessage':`loginUser ${error}`})
    }
}

/**
 * @desc        Update User Profile 
 * @Endpoint    POST @/api/users/updateUser
 * @access      Auth user
 */
const updateUserProfile = async(req,res)=>{
    try {
        const {name, email, phone}=req.body 
        if (!name && !email && !phone) throw 'Enter fields...';

        const user = await User.findById({_id:req.user});
        if(!user) throw 'Unauthorized!';

        // Updating Data
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        const isUserSaved = user.save();

        if (!isUserSaved) throw 'Some error occured during updation...';

        return res.status(200).json({'message':'Profile updated...'});

    } catch (error) {
        return res.status(500).json({'errormessage':`updateUserProfile ${error}`})
    }
}

/**
 * @desc        Update password of user 
 * @Endpoint    POST @/api/users/updatePassword
 * @access      Auth user
 */
const updateUserPassword = async(req,res)=>{
    try {
        const user = await User.findById({_id:req.user});

        if (!user) throw new 'Trying to perform unauthorized activity!'

        // matching existing password
        const isMatch = await bcrypt.compare(req.body.existingPassword,user.passwordHash);
        if (!isMatch) throw new 'Enter existing password correctly.'

        //salt and bcrypt password
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(req.body.newPassword, salt);

        // store new password
        user.passwordHash = passwordHash

        const updatePassword = await user.save();

        if (!updatePassword) throw new 'Password does not change, Try again later.'

        return res.status(200).json({'message':'Password updated successfully!'});
    } catch (error) {
        return res.status(500).json({'errormessage':`updateUserPassword ${error}`})
    }
}

/**
 * @desc        Forget password 
 * @Endpoint    Post @/api/users/forgetPassword
 * @access      Public
 */
const userForgetPassword = async(req,res)=>{
    try {

        if(req.cookies.token) throw 'You are logged in, cannot make this request';

        const {email} = req.body;

        const user = await User.findOne({email});

        if (!user) throw 'Email does not exist!';

        const otp = createOtp(6,false); //parameters: 1-> length of OTP, 2-> specialChars: boolean

        // store email in ForgetPassword Model
        const store = await new ForgetPassword({
            email:user.email,
            otp,
            user:user._id
        });

        const storeOTP = await store.save(store);
        if (!storeOTP) throw 'Some error occured in OTP store!';

        // send email -> inside helper folder
        sendEmail(otp);

        return res.cookie('email',user.email).status(200).json({'success':true,'message':`Email send to you!`});

    } catch (error) {
        return res.status(500).json({'errormessage':`userForgetPassword ${error}`});
    }
}

/**
 * @desc        Reset password 
 * @Endpoint    Post @/api/users/resetPassword
 * @access      Token access
 */
const resetForgetPassword = async(req,res)=>{
    try {
        if(req.cookies.token) throw 'You are logged in, cannot make this request';
        // look for email
        const email = req.cookies.email;
        if(!email) throw 'You refresh the page or reopen the  tab, please reapply to reset the password';

        // destructure to otp and password
        const {otp, password, passwordVerify} = req.body

        if(!otp || !password || !passwordVerify) throw 'Enter all required fields.'

        if(password !== passwordVerify) throw 'Make sure your password match.'
    
        // find user using email
        const user = await User.findOne({email});
        const fp = await ForgetPassword.findOne({otp})

        if(!fp) throw 'OTP does not exist!';

        const isMatch = await bcrypt.compare(password,user.passwordHash);
        if(isMatch) throw 'You cannot set your previous password as new password, Enter new password!';
    
        if(user.email === fp.email){
            // update password of user
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash(password,salt);
            user.passwordHash = passwordHash;
            await user.save();

            // delete the document from forget password using email
            await ForgetPassword.deleteMany({user:user._id});

            // delete cookie email and other token
            return res.cookie('email','',{
                expires: new Date(0) // Date(0) means it set to 1/Jan/1970 00:00:00 hr.
            }).json({'success':true,'message':'password reset successfully'});

        }else{
            throw 'OTP does not match, try again!';
        }

    } catch (error) {
        return res.status(500).json({'errormessage':`resetForgetPassword ${error}`});
    }
}

/**
 * @desc        Logout User 
 * @Endpoint    Get @/api/users/logout
 * @access      Auth User
 */
const logoutUser = async(req,res)=>{
    try {
        return res.cookie('token','',{
            httpOnly:true,
            expires: new Date(0) // Date(0) means it set to 1/Jan/1970 00:00:00 hr.
        },process.env.JWT_SECRETE).json({'message':'Logged out successfully!'});
    } catch (error) {
        return res.status(500).json({'errormessage':`Server response error: ${error}`});
    }
}

/**
 * @desc        Delete user
 * @Endpoint    DELETE @/api/users/logout
 * @access      Delete User and their sub-documents
 */

const deleteMyAccount = async(req,res)=>{
    try {
        if(!req.cookies.token) throw new 'Trying to access something not allowed!';

        //Delete all the other sub-document related to user
        const subdocumnetDelete = await Product.deleteMany({user:req.user});

        if(!subdocumnetDelete) throw new 'Something wrong happen try later...'

        const isDeleted = await User.findOneAndDelete({_id:req.user});

        if (!isDeleted) throw new 'Account not deleted yet!';

        return res.status(200)
        .cookie('token','',{
            httpOnly:true,
            expires: new Date(0) // Date(0) means its set to 1/Jan/1970 00:00:00 hr.
        },process.env.JWT_SECRETE).json({'message':'Your Account deleted!'});

    } catch (error) {
        return res.status(500).json({'errormessage':`Server response error: ${error}`});
    }
}

module.exports = {registerUser, 
    loginUser, 
    logoutUser, 
    deleteMyAccount, 
    updateUserPassword, 
    updateUserProfile, 
    userForgetPassword,
    resetForgetPassword,
}