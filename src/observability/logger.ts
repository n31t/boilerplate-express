import { NextFunction, Request, Response } from 'express';
import * as winston from 'winston';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';

// Use require for winston-daily-rotate-file to avoid TypeScript import issues
const DailyRotateFile = require('winston-daily-rotate-file');

const serviceName = 'call-service';

// Extend Request type to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

// Custom log levels (optional - you can use winston defaults)
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  }
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Custom format for better error serialization
const errorFormat = winston.format((info: any) => {
  if (info instanceof Error) {
    // Create a new object with Error properties
    const errorInfo = {
      level: 'error',
      message: info.message,
      stack: info.stack,
      timestamp: new Date().toISOString(),
    };
    return errorInfo;
  }
  
  if (info.error instanceof Error) {
    info.error = {
      message: info.error.message,
      stack: info.error.stack,
      name: info.error.name,
    };
  }
  
  return info;
});

// Environment-specific configuration
const isProduction = config.NODE_ENV === 'production';
const isDevelopment = config.NODE_ENV === 'development';
const logLevel = config.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// File transport configuration for errors
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  handleExceptions: true,
  handleRejections: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    errorFormat(),
    winston.format.json()
  ),
});

// File transport configuration for all logs
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp(),
    errorFormat(),
    winston.format.json()
  ),
});

// File transport for HTTP requests
const httpFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const correlation = correlationId ? `[${correlationId}] ` : '';
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level}: ${correlation}${message}${metaStr}`;
  })
);

// Production console format (less verbose)
const productionConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  level: logLevel,
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    errorFormat(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: { 
    service: serviceName,
    environment: config.NODE_ENV,
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : productionConsoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  exitOnError: false,
});

// Add file transports only in production or when explicitly enabled
if (isProduction || config.ENABLE_FILE_LOGGING === 'true') {
  winstonLogger.add(errorFileTransport);
  winstonLogger.add(combinedFileTransport);
  winstonLogger.add(httpFileTransport);
}

// Enhanced application-level logger with correlation ID support
export const log = {
  info: (message: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.info(message, { ...meta, correlationId });
  },
  
  error: (message: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.error(message, { ...meta, correlationId });
  },
  
  warn: (message: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.warn(message, { ...meta, correlationId });
  },
  
  debug: (message: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.debug(message, { ...meta, correlationId });
  },
  
  http: (message: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.http(message, { ...meta, correlationId });
  },
  
  // Structured logging methods
  performance: (operation: string, duration: number, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.info(`Performance: ${operation}`, {
      ...meta,
      operation,
      duration,
      correlationId,
      type: 'performance'
    });
  },
  
  security: (event: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.warn(`Security: ${event}`, {
      ...meta,
      event,
      correlationId,
      type: 'security'
    });
  },
  
  audit: (action: string, userId?: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.info(`Audit: ${action}`, {
      ...meta,
      action,
      userId,
      correlationId,
      type: 'audit'
    });
  },
  
  // Error logging with stack trace
  exception: (error: Error, context?: string, meta: Record<string, any> = {}, correlationId?: string) => {
    winstonLogger.error(`Exception${context ? ` in ${context}` : ''}`, {
      ...meta,
      error,
      context,
      correlationId,
      type: 'exception'
    });
  }
};

// Correlation ID middleware
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  res.set('x-correlation-id', req.correlationId);
  next();
};

// Enhanced Express middleware logger with better performance tracking
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const startTime = new Date();
  
  // Log incoming request
  log.http(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    headers: {
      'content-type': req.get('content-type'),
      'content-length': req.get('content-length'),
      'authorization': req.get('authorization') ? '[REDACTED]' : undefined,
    },
    query: req.query,
    timestamp: startTime.toISOString(),
  }, req.correlationId);
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    const endTime = new Date();
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length'),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
    
    // Determine log level based on status code and duration
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    let message = `Request Completed: ${req.method} ${req.originalUrl}`;
    
    if (res.statusCode >= 500) {
      logLevel = 'error';
      message = `Request Failed: ${req.method} ${req.originalUrl}`;
    } else if (res.statusCode >= 400) {
      logLevel = 'warn';
      message = `Request Warning: ${req.method} ${req.originalUrl}`;
    } else if (duration > 4000) { // Slow request (>1s)
      logLevel = 'warn';
      message = `Slow Request: ${req.method} ${req.originalUrl}`;
    }
    
    log[logLevel](message, logData, req.correlationId);
    
    // Log performance metrics for slow requests
    if (duration > 500) {
      log.performance(`${req.method} ${req.originalUrl}`, duration, {
        statusCode: res.statusCode,
        slow: true,
      }, req.correlationId);
    }
  });
  
  res.on('error', (error: Error) => {
    log.exception(error, `Response error for ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
    }, req.correlationId);
  });
  
  next();
};

// Health check for logger
export const loggerHealth = () => {
  try {
    log.debug('Logger health check');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Graceful shutdown
export const shutdownLogger = () => {
  return new Promise<void>((resolve) => {
    winstonLogger.end(() => {
      resolve();
    });
  });
};

// Export the winston instance for advanced usage
export { winstonLogger };

// Legacy export for backward compatibility
export const logger = requestLogger;
