const subject_mail = "OTP: For Email Verification"



const message = (otp) =>{
     return (
       `Dear User, \n\n` +
       "OTP for your email verification is : \n\n" +
       `${otp}\n\n` +
       "Esto es un email autogenerado. Por favor no responda a este email.\n\n" +
       "Gracias\n" +
       "NPL Brokers\n\n"
     );
}

module.exports={subject_mail, message};