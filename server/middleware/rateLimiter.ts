import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  private getKey(req: Request): string {
    // Use IP address and user agent for rate limiting key
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 1,
          resetTime: now + this.windowMs
        };
      } else {
        this.store[key].count++;
      }

      const remaining = Math.max(0, this.maxRequests - this.store[key].count);
      const resetTime = Math.ceil((this.store[key].resetTime - now) / 1000);

      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString()
      });

      if (this.store[key].count > this.maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
          retryAfter: resetTime
        });
        return;
      }

      next();
    };
  }
}

// Different rate limiters for different endpoints
export const generalRateLimit = new RateLimiter(60000, 100); // 100 requests per minute
export const predictionRateLimit = new RateLimiter(60000, 20); // 20 predictions per minute
export const authRateLimit = new RateLimiter(900000, 5); // 5 auth attempts per 15 minutes
export const apiRateLimit = new RateLimiter(60000, 1000); // 1000 API calls per minute