import { db } from "./db";
import { 
  tenantSubscriptions, apiKeys, apiUsageHourly, rateLimitEvents,
  SUBSCRIPTION_TIERS, SubscriptionTierKey,
  TenantSubscription, ApiKey, InsertApiUsageHourly, InsertRateLimitEvent
} from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// In-memory rate limit tracking (for real-time limits)
// In production, use Redis for distributed rate limiting
interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, {
  perMinute: RateLimitWindow;
  perHour: RateLimitWindow;
  perDay: RateLimitWindow;
}> = new Map();

// Get or create rate limit windows for a key
function getRateLimitWindows(key: string) {
  const now = Date.now();
  let windows = rateLimitStore.get(key);
  
  if (!windows) {
    windows = {
      perMinute: { count: 0, resetAt: now + 60000 },
      perHour: { count: 0, resetAt: now + 3600000 },
      perDay: { count: 0, resetAt: now + 86400000 },
    };
    rateLimitStore.set(key, windows);
  }
  
  // Reset windows if expired
  if (now >= windows.perMinute.resetAt) {
    windows.perMinute = { count: 0, resetAt: now + 60000 };
  }
  if (now >= windows.perHour.resetAt) {
    windows.perHour = { count: 0, resetAt: now + 3600000 };
  }
  if (now >= windows.perDay.resetAt) {
    windows.perDay = { count: 0, resetAt: now + 86400000 };
  }
  
  return windows;
}

export class RateLimitService {
  // Get tenant subscription with rate limits
  async getTenantSubscription(tenantId: string): Promise<TenantSubscription | null> {
    const [subscription] = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);
    return subscription || null;
  }

  // Get rate limits for a tenant
  async getRateLimits(tenantId: string): Promise<{
    perMinute: number;
    perHour: number;
    perDay: number;
  }> {
    const subscription = await this.getTenantSubscription(tenantId);
    
    if (!subscription) {
      // Default to free tier
      return SUBSCRIPTION_TIERS.free.rateLimits;
    }

    const tier = subscription.tier as SubscriptionTierKey;
    const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
    
    // Check for custom rate limits (enterprise)
    return {
      perMinute: subscription.customRateLimitPerMinute || tierConfig.rateLimits.requestsPerMinute,
      perHour: subscription.customRateLimitPerHour || tierConfig.rateLimits.requestsPerHour,
      perDay: subscription.customRateLimitPerDay || tierConfig.rateLimits.requestsPerDay,
    };
  }

  // Check if request should be rate limited
  async checkRateLimit(
    tenantId: string,
    apiKeyId?: string | null,
    userId?: string | null
  ): Promise<{
    allowed: boolean;
    limitType?: string;
    limit?: number;
    current?: number;
    retryAfter?: number;
  }> {
    const limits = await this.getRateLimits(tenantId);
    const key = `${tenantId}:${apiKeyId || userId || 'anonymous'}`;
    const windows = getRateLimitWindows(key);
    const now = Date.now();

    // Check per-minute limit
    if (windows.perMinute.count >= limits.perMinute) {
      return {
        allowed: false,
        limitType: "per_minute",
        limit: limits.perMinute,
        current: windows.perMinute.count,
        retryAfter: Math.ceil((windows.perMinute.resetAt - now) / 1000),
      };
    }

    // Check per-hour limit
    if (windows.perHour.count >= limits.perHour) {
      return {
        allowed: false,
        limitType: "per_hour",
        limit: limits.perHour,
        current: windows.perHour.count,
        retryAfter: Math.ceil((windows.perHour.resetAt - now) / 1000),
      };
    }

    // Check per-day limit
    if (windows.perDay.count >= limits.perDay) {
      return {
        allowed: false,
        limitType: "per_day",
        limit: limits.perDay,
        current: windows.perDay.count,
        retryAfter: Math.ceil((windows.perDay.resetAt - now) / 1000),
      };
    }

    // Increment counters
    windows.perMinute.count++;
    windows.perHour.count++;
    windows.perDay.count++;

    return { allowed: true };
  }

  // Log rate limit event
  async logRateLimitEvent(data: InsertRateLimitEvent): Promise<void> {
    await db.insert(rateLimitEvents).values(data);
  }

  // Hash API key for storage
  hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  // Generate a new API key
  generateApiKey(environment: 'live' | 'test' = 'live'): { fullKey: string; prefix: string; lastFour: string } {
    const prefix = environment === 'live' ? 'sk_live_' : 'sk_test_';
    const randomPart = crypto.randomBytes(24).toString('base64url');
    const fullKey = `${prefix}${randomPart}`;
    return {
      fullKey,
      prefix: prefix.slice(0, 8),
      lastFour: randomPart.slice(-4),
    };
  }

  // Validate API key and return key data
  async validateApiKey(fullKey: string): Promise<ApiKey | null> {
    const keyHash = this.hashApiKey(fullKey);

    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true)
      ))
      .limit(1);

    if (!key) return null;

    // Check if expired
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: null, // Would be set from request
      })
      .where(eq(apiKeys.id, key.id));

    return key;
  }

  // Track API usage
  async trackUsage(data: {
    tenantId: string;
    apiKeyId?: string | null;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
  }): Promise<void> {
    const now = new Date();
    const hourTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    // Normalize endpoint (remove IDs for aggregation)
    const normalizedEndpoint = data.endpoint.replace(/\/[a-f0-9-]{36}/gi, '/:id');

    const isSuccess = data.statusCode >= 200 && data.statusCode < 400;
    const isError = data.statusCode >= 400 && data.statusCode < 500;
    const isRateLimited = data.statusCode === 429;

    // Upsert hourly usage record
    await db.execute(sql`
      INSERT INTO api_usage_hourly (
        tenant_id, api_key_id, hour_timestamp, endpoint, method,
        request_count, success_count, error_count, rate_limited_count, total_response_time_ms
      ) VALUES (
        ${data.tenantId}, ${data.apiKeyId || null}, ${hourTimestamp}, ${normalizedEndpoint}, ${data.method},
        1, ${isSuccess ? 1 : 0}, ${isError ? 1 : 0}, ${isRateLimited ? 1 : 0}, ${data.responseTimeMs}
      )
      ON CONFLICT (tenant_id, api_key_id, hour_timestamp, endpoint, method)
      DO UPDATE SET
        request_count = api_usage_hourly.request_count + 1,
        success_count = api_usage_hourly.success_count + ${isSuccess ? 1 : 0},
        error_count = api_usage_hourly.error_count + ${isError ? 1 : 0},
        rate_limited_count = api_usage_hourly.rate_limited_count + ${isRateLimited ? 1 : 0},
        total_response_time_ms = api_usage_hourly.total_response_time_ms + ${data.responseTimeMs}
    `);
  }

  // Get usage statistics for a tenant
  async getUsageStats(tenantId: string, days: number = 30): Promise<{
    totalRequests: number;
    totalSuccess: number;
    totalErrors: number;
    avgResponseTime: number;
    dailyUsage: Array<{ date: string; requests: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const hourlyData = await db
      .select({
        requestCount: sql<number>`SUM(request_count)`.as('requestCount'),
        successCount: sql<number>`SUM(success_count)`.as('successCount'),
        errorCount: sql<number>`SUM(error_count)`.as('errorCount'),
        totalResponseTime: sql<number>`SUM(total_response_time_ms)`.as('totalResponseTime'),
      })
      .from(apiUsageHourly)
      .where(and(
        eq(apiUsageHourly.tenantId, tenantId),
        gte(apiUsageHourly.hourTimestamp, startDate)
      ));

    const totals = hourlyData[0] || { requestCount: 0, successCount: 0, errorCount: 0, totalResponseTime: 0 };

    const dailyData = await db
      .select({
        date: sql<string>`DATE(hour_timestamp)`.as('date'),
        requests: sql<number>`SUM(request_count)`.as('requests'),
      })
      .from(apiUsageHourly)
      .where(and(
        eq(apiUsageHourly.tenantId, tenantId),
        gte(apiUsageHourly.hourTimestamp, startDate)
      ))
      .groupBy(sql`DATE(hour_timestamp)`)
      .orderBy(sql`DATE(hour_timestamp)`);

    return {
      totalRequests: totals.requestCount || 0,
      totalSuccess: totals.successCount || 0,
      totalErrors: totals.errorCount || 0,
      avgResponseTime: totals.requestCount > 0
        ? Math.round(totals.totalResponseTime / totals.requestCount)
        : 0,
      dailyUsage: dailyData.map(d => ({ date: d.date, requests: d.requests })),
    };
  }
}

export const rateLimitService = new RateLimitService();

// Middleware: Rate limiting for API requests
export function rateLimitMiddleware(options?: { skipAuth?: boolean }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startTime = Date.now();

      // Get tenant info from authenticated user or API key
      let tenantId: string | null = null;
      let apiKeyId: string | null = null;
      let userId: string | null = null;

      // Check for API key in Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer sk_')) {
        const apiKey = authHeader.slice(7);
        const keyData = await rateLimitService.validateApiKey(apiKey);

        if (!keyData) {
          return res.status(401).json({
            error: 'invalid_api_key',
            message: 'Invalid or revoked API key'
          });
        }

        tenantId = keyData.tenantId;
        apiKeyId = keyData.id;

        // Attach API key info to request
        (req as any).apiKey = keyData;
      } else if ((req as any).user?.claims?.sub) {
        // Use session authentication
        const user = await getUserFromRequest(req);
        if (user?.tenantId) {
          tenantId = user.tenantId;
          userId = user.id;
        }
      }

      if (!tenantId && !options?.skipAuth) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Authentication required'
        });
      }

      // Skip rate limiting if no tenant (public endpoints)
      if (!tenantId) {
        return next();
      }

      // Check rate limits
      const rateLimitResult = await rateLimitService.checkRateLimit(tenantId, apiKeyId, userId);

      // Add rate limit headers
      const limits = await rateLimitService.getRateLimits(tenantId);
      res.setHeader('X-RateLimit-Limit-Minute', limits.perMinute);
      res.setHeader('X-RateLimit-Limit-Hour', limits.perHour);
      res.setHeader('X-RateLimit-Limit-Day', limits.perDay);

      if (!rateLimitResult.allowed) {
        // Log rate limit event
        await rateLimitService.logRateLimitEvent({
          tenantId,
          apiKeyId,
          userId,
          endpoint: req.path,
          method: req.method,
          limitType: rateLimitResult.limitType!,
          limitValue: rateLimitResult.limit!,
          currentCount: rateLimitResult.current!,
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        });

        res.setHeader('Retry-After', rateLimitResult.retryAfter!);
        return res.status(429).json({
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`,
          limitType: rateLimitResult.limitType,
          limit: rateLimitResult.limit,
          retryAfter: rateLimitResult.retryAfter,
        });
      }

      // Track response time for usage analytics
      res.on('finish', async () => {
        const responseTime = Date.now() - startTime;
        await rateLimitService.trackUsage({
          tenantId,
          apiKeyId,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTimeMs: responseTime,
        });
      });

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next();
    }
  };
}

// Helper to get user from request (import from your auth setup)
async function getUserFromRequest(req: Request): Promise<{ id: string; tenantId: string | null } | null> {
  const userId = (req as any).user?.claims?.sub;
  if (!userId) return null;

  // Import storage dynamically to avoid circular deps
  const { storage } = await import('./storage');
  return storage.getUser(userId);
}

