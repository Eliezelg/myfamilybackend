const { validateRegistration, validateLogin, validatePasswordReset } = require('../../validators/userValidator');

describe('User Validators', () => {
  describe('validateRegistration', () => {
    it('should pass with valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = validateRegistration(validData);
      expect(error).toBeUndefined();
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = validateRegistration(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should fail with weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const { error } = validateRegistration(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should fail with missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const { error } = validateRegistration(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('validateLogin', () => {
    it('should pass with valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const { error } = validateLogin(validData);
      expect(error).toBeUndefined();
    });

    it('should fail with missing email', () => {
      const invalidData = {
        password: 'Password123!'
      };

      const { error } = validateLogin(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should fail with missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const { error } = validateLogin(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should fail with invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      const { error } = validateLogin(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });
  });

  describe('validatePasswordReset', () => {
    it('should pass with valid password reset data', () => {
      const validData = {
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const { error } = validatePasswordReset(validData);
      expect(error).toBeUndefined();
    });

    it('should fail with non-matching passwords', () => {
      const invalidData = {
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const { error } = validatePasswordReset(invalidData);
      expect(error).toBeDefined();
    });

    it('should fail with weak password', () => {
      const invalidData = {
        password: 'weak',
        confirmPassword: 'weak'
      };

      const { error } = validatePasswordReset(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should fail with missing confirmPassword', () => {
      const invalidData = {
        password: 'Password123!'
      };

      const { error } = validatePasswordReset(invalidData);
      expect(error).toBeDefined();
    });
  });
});
