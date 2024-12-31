const jwt = require('jsonwebtoken');
const { protect } = require('../../middlewares/auth');
const User = require('../../models/User');

// Mock des dépendances
jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should pass if token is valid and user exists', async () => {
    const mockUser = {
      id: 'user123',
      isEmailVerified: true
    };

    req.headers.authorization = 'Bearer valid-token';
    jwt.verify.mockReturnValue({ id: mockUser.id });
    User.findByPk.mockResolvedValue(mockUser);

    await protect(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('should fail if no token is provided', async () => {
    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Invalid token');
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Token invalide. Veuillez vous reconnecter.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if token is expired', async () => {
    req.headers.authorization = 'Bearer expired-token';
    jwt.verify.mockImplementation(() => {
      throw new jwt.TokenExpiredError('Token expired');
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Votre session a expiré. Veuillez vous reconnecter.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if user does not exist', async () => {
    req.headers.authorization = 'Bearer valid-token';
    jwt.verify.mockReturnValue({ id: 'non-existent-user' });
    User.findByPk.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'L\'utilisateur associé à ce token n\'existe plus.'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if email is not verified', async () => {
    const mockUser = {
      id: 'user123',
      isEmailVerified: false
    };

    req.headers.authorization = 'Bearer valid-token';
    jwt.verify.mockReturnValue({ id: mockUser.id });
    User.findByPk.mockResolvedValue(mockUser);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Veuillez vérifier votre email avant d\'accéder à cette ressource.'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
