const express = require('express')
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    deleteMyAccount,
    updateUserPassword,
    updateUserProfile,
    userForgetPassword,
    resetForgetPassword
} = require('../controllers/userController.js');

const {authAdmin,authUser}= require('../middleware/auth')

//PUBLIC
router.post('/',registerUser);
router.post('/login',loginUser);
router.post('/forget',userForgetPassword);

// Token access
router.post('/resetPassword',resetForgetPassword)

//USER AUTH
router.post('/updatePassword',authUser,updateUserPassword);
router.post('/updateProfile',authUser,updateUserProfile);
router.delete('/delete',authUser,deleteMyAccount);
router.get('/logout',authUser,logoutUser);


module.exports = router;