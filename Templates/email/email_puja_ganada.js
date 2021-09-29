const subject_mail = "Ha sido el ganador de la subasta de hoy en NPL Brokers"

const message = (subbidArray) => {
  let message = `Querido usuario, ha sido usted el ganador de los siguientes lotes \n\n`
  subbidArray.forEach((subbid) => {
    message = message + `Dear User, \n\n` +
      "OTP for your email verification is : \n\n" +
      `${otp}\n\n` +
      "Esto es un email autogenerado. Por favor no responda a este email.\n\n" +
      "Gracias\n" +
      "NPL Brokers\n\n"
  })

  mmessage = message + "Esto es un email autogenerado. Por favor no responda a este email.\n\n" +
    "Gracias\n" +
    "NPL Brokers\n\n";
  return message;
}

module.exports = { subject_mail, message };