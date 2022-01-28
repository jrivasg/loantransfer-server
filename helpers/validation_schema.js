const Joi = require('@hapi/joi')

const authSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
}).unknown();

module.exports = {
  authSchema,
}
