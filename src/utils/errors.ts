/**
 * Custom error classes for application-wide error handling
 */

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class ApiError extends Error {
    statusCode: number;
    
    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

export class NoReviewsFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoReviewsFoundError';
    }
}

// Add other custom error types as needed 