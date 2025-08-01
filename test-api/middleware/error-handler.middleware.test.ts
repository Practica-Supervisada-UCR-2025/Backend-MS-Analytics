import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import { ApiError } from '../../src/utils/errors/api-error';
import { ValidationError } from 'yup';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    // Mock console.error
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should handle Yup validation errors', () => {
    const validationError = new ValidationError('Validation failed', ['Field is required'], '');
    
    errorHandler(
      validationError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Validation Error',
      details: validationError.errors,
    });
  });

  it('should handle ApiError with details', () => {
    const apiError = new ApiError(404, 'Not Found', ['Invalid ID provided']);
    
    errorHandler(
      apiError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Not Found',
      details: ['Invalid ID provided'],
    });
  });

  it('should handle Unauthorized Error with details for 401 status', () => {
    const apiError = new ApiError(401, 'Unauthorized', ['Invalid token']);
    
    errorHandler(
      apiError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Unauthorized',
      details: ['Invalid token']
    });
  });

  it('should handle unknown errors in development mode', () => {
    process.env.NODE_ENV = 'development';
    const unknownError = new Error('Something went wrong');
    
    errorHandler(
      unknownError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      details: 'Something went wrong',
    });
  });

  it('should handle unknown errors in production mode without exposing details', () => {
    process.env.NODE_ENV = 'production';
    const unknownError = new Error('Something went wrong');
    
    errorHandler(
      unknownError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      details: undefined,
    });
  });
});