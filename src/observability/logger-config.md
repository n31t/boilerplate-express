# Professional Winston Logger Documentation

## Overview

This enhanced Winston logger provides enterprise-grade logging capabilities with correlation tracking, structured logging, and comprehensive monitoring features.

## Features

### ✅ Core Features
- **Correlation ID tracking** - Trace requests across your application
- **Environment-specific configuration** - Different settings for dev/prod
- **File rotation** - Automatic log file management with daily rotation
- **Structured logging** - Consistent, queryable log formats
- **Performance monitoring** - Track slow requests and operations
- **Security logging** - Track authentication and security events
- **Audit trails** - Compliance-ready audit logging
- **Error handling** - Comprehensive exception tracking
- **Graceful shutdown** - Proper log cleanup on app termination

### 🏷️ Log Levels
- `error` - System errors and exceptions
- `warn` - Warning conditions and slow requests
- `info` - General application flow
- `http` - HTTP request/response logging
- `debug` - Detailed debugging information

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Application Environment
NODE_ENV=development  # or 'production'

# Logger Configuration
LOG_LEVEL=debug       # error|warn|info|http|debug
ENABLE_FILE_LOGGING=false  # Force file logging in development

# Application Metadata
npm_package_version=1.0.0
```

## File Structure

When file logging is enabled (production or `ENABLE_FILE_LOGGING=true`):

```
logs/
├── error-YYYY-MM-DD.log      # Error logs only
├── combined-YYYY-MM-DD.log   # All logs
└── http-YYYY-MM-DD.log       # HTTP request logs
```

## Usage Examples

### Basic Logging
```typescript
import { log } from './logger';

log.info('User logged in', { userId: 'user123' });
log.error('Database connection failed', { error: error.message });
log.debug('Processing data', { recordCount: 150 });
```

### With Correlation ID (in Express middleware)
```typescript
log.info('Processing request', { action: 'getUserData' }, req.correlationId);
```

### Structured Logging Methods

#### Performance Monitoring
```typescript
const start = Date.now();
// ... operation ...
const duration = Date.now() - start;

log.performance('DATABASE_QUERY', duration, {
  query: 'SELECT * FROM users',
  recordCount: 100
}, req.correlationId);
```

#### Security Events
```typescript
log.security('FAILED_LOGIN_ATTEMPT', {
  ip: req.ip,
  username: '[REDACTED]',
  reason: 'Invalid password'
}, req.correlationId);
```

#### Audit Trails
```typescript
log.audit('USER_UPDATED', userId, {
  changes: ['email', 'profile'],
  updatedBy: currentUserId
}, req.correlationId);
```

#### Exception Handling
```typescript
try {
  // risky operation
} catch (error) {
  log.exception(error, 'Payment processing failed', {
    orderId: 'order_123',
    amount: 99.99
  }, req.correlationId);
}
```

## Express Integration

### Setup Middleware
```typescript
import express from 'express';
import { correlationMiddleware, requestLogger } from './logger';

const app = express();

// Apply correlation middleware FIRST
app.use(correlationMiddleware);

// Then apply request logger
app.use(requestLogger);

// Your other middleware...
app.use(express.json());
```

### Error Handler
```typescript
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.exception(error, 'Unhandled application error', {
    url: req.originalUrl,
    method: req.method,
  }, req.correlationId);
  
  res.status(500).json({ error: 'Internal server error' });
});
```

## Correlation ID Tracking

Correlation IDs help trace requests through your application:

1. **Automatic generation** - Each request gets a unique UUID
2. **Header support** - Use `x-correlation-id` header to pass existing IDs
3. **Response headers** - Correlation ID is returned in response headers
4. **Cross-service tracking** - Pass correlation IDs to external services

```typescript
// Manual correlation ID usage
const correlationId = req.correlationId;
await externalService.call(data, { 
  headers: { 'x-correlation-id': correlationId } 
});
```

## Log Formats

### Development (Console)
```
2024-01-15 10:30:45 info: [req-123] User created successfully
{
  "userId": "user_456",
  "email": "[REDACTED]"
}
```

### Production (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User created successfully",
  "correlationId": "req-123",
  "userId": "user_456",
  "email": "[REDACTED]",
  "service": "call-service",
  "environment": "production",
  "version": "1.0.0"
}
```

## Health Monitoring

```typescript
import { loggerHealth } from './logger';

app.get('/health', (req, res) => {
  const health = loggerHealth();
  res.json(health);
});
```

## Graceful Shutdown

```typescript
import { shutdownLogger } from './logger';

process.on('SIGTERM', async () => {
  log.info('Shutting down gracefully...');
  await shutdownLogger();
  process.exit(0);
});
```

## Security Best Practices

### Data Redaction
Always redact sensitive information:

```typescript
log.info('User login attempt', {
  username: username ? '[REDACTED]' : undefined,
  email: email ? '[REDACTED]' : undefined,
  hasPassword: !!password,
  ip: req.ip
});
```

### Recommended Redaction Patterns
- Passwords: `'[REDACTED]'`
- Emails: `'[REDACTED]'` or `email.replace(/(.{2}).*(@.*)/, '$1***$2')`
- Credit cards: `'[REDACTED]'`
- API keys: `'[REDACTED]'`
- Personal data: `'[REDACTED]'` or hash

## Performance Considerations

### Automatic Slow Request Detection
- Requests > 1000ms are logged as warnings
- Requests > 500ms get performance logs
- High-precision timing using `process.hrtime.bigint()`

### File Rotation Settings
- **Max file size**: 20MB
- **Error logs retention**: 14 days
- **Combined logs retention**: 7 days
- **HTTP logs retention**: 7 days

## Monitoring & Alerting

Set up alerts based on log patterns:

```bash
# Error rate spike
grep '"level":"error"' logs/combined-*.log | wc -l

# Slow requests
grep '"slow":true' logs/combined-*.log

# Security events
grep '"type":"security"' logs/combined-*.log
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate `LOG_LEVEL` (info or warn)
- [ ] Ensure log directory permissions
- [ ] Set up log aggregation (ELK, Fluentd, etc.)
- [ ] Configure alerts for error patterns
- [ ] Test correlation ID propagation
- [ ] Verify log retention policies
- [ ] Test graceful shutdown logging

## Integration with External Systems

### Log Aggregation
The JSON format works seamlessly with:
- **Elasticsearch** via Filebeat/Logstash
- **Splunk** via Universal Forwarder
- **CloudWatch** via AWS CloudWatch Agent
- **Datadog** via Datadog Agent

### Example Filebeat Configuration
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /app/logs/combined-*.log
  json:
    keys_under_root: true
    message_key: message
```

This logger provides enterprise-grade logging capabilities while remaining developer-friendly and production-ready. 