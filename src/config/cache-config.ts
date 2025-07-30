import apicache from 'apicache-plus';
import redisClient from './redis';

// Configure shared cache options
const cacheOptions = {
  redisClient: redisClient,
  trackPerformance: false,
  defaultDuration: '5 minutes',
  statusCodes: { include: [200] },
  headers: { 'cache-control': 'no-cache' }
};

// Create base middleware with shared options
const baseCache = apicache.options(cacheOptions);


export const cacheWithGroup = (duration: string, groupKey: string) => 
  baseCache.middleware(duration, (req: any) => req.apicacheGroup = groupKey);

// Export cache utilities
export const cacheClear = apicache.clear;
export const getCachePerformance = apicache.getPerformance; 

// Export reusable middleware configurations
export const cache = baseCache.middleware;