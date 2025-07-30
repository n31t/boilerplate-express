import Redis from 'ioredis';
import { log } from '../observability/logger';
import { config } from './config';

const redisUrl = config.REDIS_URL;
log.info(`Connecting to Redis at ${redisUrl}`);

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  },
});

redisConnection.on('error', (error) => {
  log.error('Redis connection error:', error);
});

redisConnection.on('connect', () => {
  log.info('Successfully connected to Redis');
});

export default redisConnection;