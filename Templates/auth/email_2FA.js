const subject_mail = "Codigo de confirmación inicio de sesión"



const message = (otp) =>{
    return `Querido usuario, \n\n` 
    + 'Codigo de verificación : \n\n'
    + `${otp}\n\n`
    + 'Esto es un email autogenerado. Por favor no responda a este email.\n\n'
    + 'Gracias\n'
    + 'NPL Brokers\n\n'
}

module.exports = {subject_mail, message};