const Joi = require('joi');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validateRegistration = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(passwordPattern).required()
      .messages({
        'string.pattern.base': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required()
  });

  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    twoFactorToken: Joi.string().length(6).pattern(/^[0-9]+$/).optional()
  });

  return schema.validate(data);
};

const validatePasswordReset = (data) => {
  const schema = Joi.object({
    password: Joi.string().pattern(passwordPattern).required()
      .messages({
        'string.pattern.base': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Les mots de passe ne correspondent pas'
      })
  });

  return schema.validate(data);
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset
};
