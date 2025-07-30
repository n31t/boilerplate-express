import { Response } from 'express';
import { NotFoundError, ValidationError, AuthorizationError, ApiError, NoReviewsFoundError } from './errors';
import { log } from '../observability/logger';

/**
 * Centralized error handler for Express responses
 * @param error Error object thrown in the application
 * @param res Express Response object
 */
export const handleApiError = (error: Error, res: Response): void => {
    log.error(`Error: ${error.message}`, error as any);
    
    // Handle specific error types
    if (error instanceof NotFoundError) {
        res.status(404).json({ 
            status: 'error',
            code: 404,
            message: error.message 
        });
        return;
    }
    
    if (error instanceof ValidationError) {
        res.status(400).json({ 
            status: 'error',
            code: 400,
            message: error.message 
        });
        return;
    }

    if (error instanceof AuthorizationError) {
        res.status(403).json({ 
            status: 'error',
            code: 403,
            message: error.message 
        });
        return;
    }

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({ 
            status: 'error',
            code: error.statusCode,
            message: error.message 
        });
        return;
    }
    
    if (error instanceof NoReviewsFoundError) {
        res.status(404).json({ 
            status: 'error',
            code: 404,
            message: error.message 
        });
        return;
    }
    
    // For unexpected errors
    res.status(500).json({ 
        status: 'error',
        code: 500,
        message: 'An internal server error occurred',
        detail: error.message 
    });
};

/**
 * Create standardized success response
 * @param res Express Response object
 * @param data Data to be returned in the response
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccessResponse = (res: Response, data: any, statusCode: number = 200): void => {
    res.status(statusCode).json({
        status: 'success',
        data
    });
}; 