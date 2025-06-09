import { JwtService } from '../../src/features/users/services/jwt.service';
import { UnauthorizedError } from '../../src/utils/errors/api-error';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken for mocking

jest.mock('jsonwebtoken'); // Mock jsonwebtoken

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret';
    jwtService = new JwtService();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  it('should verify a valid token', () => {
    const payload = { role: 'user', email: 'example@ucr.ac.cr', uuid: '12345678' };
    const token = 'validToken';

    // Mock jwt.verify to return the payload
    (jwt.verify as jest.Mock).mockImplementation((token, secret) => {
      if (token === 'validToken' && secret === 'testsecret') {
        return payload;
      }
      throw new Error('Invalid token');
    });

    const decoded = jwtService.verifyToken(token);
    expect(decoded).toMatchObject(payload); // Verify relevant properties
  });

  it('should throw UnauthorizedError for an invalid token', () => {
    const token = 'invalidToken';

    // Mock jwt.verify to throw an error
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => jwtService.verifyToken(token)).toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError for an expired token', () => {
    const token = 'expiredToken';

    // Mock jwt.verify to throw a TokenExpiredError
    (jwt.verify as jest.Mock).mockImplementation(() => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    expect(() => jwtService.verifyToken(token)).toThrow(UnauthorizedError);
  });
});