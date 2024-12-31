const Joi = require('joi');

const validateChild = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().iso().max('now').required(),
    gender: Joi.string().valid('M', 'F').optional(),
    photo: Joi.string().uri().optional(),
    notes: Joi.string().max(500).optional()
  });

  return schema.validate(data);
};

module.exports = {
  validateChild
};
