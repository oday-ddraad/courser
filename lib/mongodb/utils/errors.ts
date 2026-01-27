/**
 * Custom MongoDB error handling utilities
 */

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends DatabaseError {
  constructor(field: string) {
    super(`${field} already exists`, 'DUPLICATE_ERROR');
    this.name = 'DuplicateError';
  }
}

/**
 * Handle MongoDB errors and convert to user-friendly messages
 */
export function handleMongoError(error: any): never {
  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern)[0];
    throw new DuplicateError(field);
  }
  
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    throw new ValidationError(messages.join(', '));
  }
  
  throw new DatabaseError(error.message || 'Database operation failed');
}
