import { Request, Response, NextFunction } from 'express';

export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;
  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, APIError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper - MUST BE EXPORTED
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
};

// Global error handler
export const errorHandler = (
  err: Error | APIError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: (err as any).errors
    });
  }
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
};
