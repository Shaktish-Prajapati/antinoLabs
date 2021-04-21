const otpGenerator = require('otp-generator');

const createOtp = (length,specialChars)=>{
    const otp = otpGenerator.generate(length,{specialChars: specialChars});
    return otp;
}

module.exports = {createOtp}