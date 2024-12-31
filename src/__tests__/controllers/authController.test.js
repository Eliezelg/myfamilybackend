const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { register, login, forgotPassword, verifyEmail } = require('../../controllers/authController');
const User = require('../../models/User');
const sgMail = require('@sendgrid/mail');

// Mock des dépendances
jest.mock('../../models/User');
jest.mock('@sendgrid/mail');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Mock des fonctions
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: '123',
        email: req.body.email,
        save: jest.fn()
      });
      jwt.sign.mockReturnValue('fake-token');
      sgMail.send.mockResolvedValue();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.any(String)
        })
      );
    });

    it('should return error if user already exists', async () => {
      User.findOne.mockResolvedValue({ id: '123' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Cet email est déjà utilisé'
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };
    });

    it('should successfully login a user', async () => {
      const mockUser = {
        id: '123',
        email: req.body.email,
        validatePassword: jest.fn().mockResolvedValue(true),
        twoFactorEnabled: false,
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('fake-token');

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          token: expect.any(String)
        })
      );
    });

    it('should fail with invalid credentials', async () => {
      User.findOne.mockResolvedValue({
        validatePassword: jest.fn().mockResolvedValue(false)
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Email ou mot de passe incorrect'
        })
      );
    });

    it('should require 2FA token if enabled', async () => {
      const mockUser = {
        id: '123',
        email: req.body.email,
        validatePassword: jest.fn().mockResolvedValue(true),
        twoFactorEnabled: true
      };

      User.findOne.mockResolvedValue(mockUser);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Code 2FA requis'
        })
      );
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com'
      };
    });

    it('should send reset password email', async () => {
      const mockUser = {
        id: '123',
        email: req.body.email,
        save: jest.fn()
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('reset-token');
      sgMail.send.mockResolvedValue();

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Email de réinitialisation envoyé'
        })
      );
    });

    it('should handle non-existent user', async () => {
      User.findOne.mockResolvedValue(null);

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Aucun compte associé à cet email'
        })
      );
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      req.params = {
        token: 'valid-token'
      };
    });

    it('should verify email successfully', async () => {
      const mockUser = {
        id: '123',
        save: jest.fn()
      };

      jwt.verify.mockReturnValue({ id: '123' });
      User.findByPk.mockResolvedValue(mockUser);

      await verifyEmail(req, res);

      expect(mockUser.isEmailVerified).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Email vérifié avec succès'
        })
      );
    });

    it('should handle invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: expect.any(String)
        })
      );
    });
  });
});
