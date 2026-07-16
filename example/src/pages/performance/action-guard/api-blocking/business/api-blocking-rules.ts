export interface ApiCallRecord {
  id: string;
  endpoint: string;
  timestamp: number;
  status: 'success' | 'blocked' | 'error' | 'pending';
  responseTime?: number;
  method: string;
  reason?: string;
}

export interface BlockingMetrics {
  totalRequests: number;
  successfulRequests: number;
  blockedRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  successRate: number;
  blockingEfficiency: number;
  currentLoadLevel: 'low' | 'medium' | 'high';
}

export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  currentWindow: number;
  requestsInWindow: number;
}

export interface ApiEndpoint {
  path: string;
  method: string;
  category: string;
  load: 'low' | 'medium' | 'high';
}

export const apiEndpoints: ApiEndpoint[] = [
  { path: '/api/users', method: 'GET', category: 'Users', load: 'high' },
  { path: '/api/posts', method: 'GET', category: 'Content', load: 'medium' },
  { path: '/api/comments', method: 'POST', category: 'Content', load: 'low' },
  { path: '/api/profile', method: 'PUT', category: 'Users', load: 'medium' },
  { path: '/api/settings', method: 'PATCH', category: 'Config', load: 'low' },
  {
    path: '/api/analytics',
    method: 'GET',
    category: 'Analytics',
    load: 'high',
  },
  {
    path: '/api/notifications',
    method: 'GET',
    category: 'System',
    load: 'medium',
  },
  { path: '/api/upload', method: 'POST', category: 'File', load: 'high' },
];

export function createInitialBlockingMetrics(): BlockingMetrics {
  return {
    totalRequests: 0,
    successfulRequests: 0,
    blockedRequests: 0,
    errorRequests: 0,
    averageResponseTime: 0,
    successRate: 100,
    blockingEfficiency: 0,
    currentLoadLevel: 'low',
  };
}

export function createInitialRateLimitConfig(
  now = Date.now()
): RateLimitConfig {
  return {
    enabled: true,
    maxRequests: 5,
    windowMs: 10000,
    currentWindow: getWindowStart(now, 10000),
    requestsInWindow: 0,
  };
}

export function getWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

export function isBlockingActive(
  isBlocked: boolean,
  blockEndTime: number | null,
  now = Date.now()
): boolean {
  return isBlocked && blockEndTime != null && now < blockEndTime;
}

export function normalizeRateLimit(
  rateLimit: RateLimitConfig,
  now = Date.now()
): RateLimitConfig {
  const currentWindow = getWindowStart(now, rateLimit.windowMs);

  if (currentWindow === rateLimit.currentWindow) {
    return rateLimit;
  }

  return {
    ...rateLimit,
    currentWindow,
    requestsInWindow: 0,
  };
}

export function isRateLimited(
  rateLimit: RateLimitConfig,
  now = Date.now()
): boolean {
  const normalizedRateLimit = normalizeRateLimit(rateLimit, now);
  return (
    normalizedRateLimit.enabled &&
    normalizedRateLimit.requestsInWindow >= normalizedRateLimit.maxRequests
  );
}

export function incrementRateLimit(
  rateLimit: RateLimitConfig,
  now = Date.now()
): RateLimitConfig {
  const normalizedRateLimit = normalizeRateLimit(rateLimit, now);

  if (!normalizedRateLimit.enabled) {
    return normalizedRateLimit;
  }

  return {
    ...normalizedRateLimit,
    requestsInWindow: normalizedRateLimit.requestsInWindow + 1,
  };
}

export function appendApiCall(
  records: ApiCallRecord[],
  record: ApiCallRecord
): ApiCallRecord[] {
  return [record, ...records].slice(0, 50);
}

export function updateApiCall(
  records: ApiCallRecord[],
  callId: string,
  update: Partial<ApiCallRecord>
): ApiCallRecord[] {
  return records.map((record) =>
    record.id === callId ? { ...record, ...update } : record
  );
}

export function recordSuccessfulRequest(
  metrics: BlockingMetrics,
  responseTime: number
): BlockingMetrics {
  const totalRequests = metrics.totalRequests + 1;
  const successfulRequests = metrics.successfulRequests + 1;

  return {
    ...metrics,
    totalRequests,
    successfulRequests,
    averageResponseTime:
      (metrics.averageResponseTime * metrics.totalRequests + responseTime) /
      totalRequests,
    successRate: (successfulRequests / totalRequests) * 100,
    currentLoadLevel:
      responseTime > 600 ? 'high' : responseTime > 400 ? 'medium' : 'low',
  };
}

export function recordBlockedRequest(
  metrics: BlockingMetrics
): BlockingMetrics {
  const totalRequests = metrics.totalRequests + 1;
  const blockedRequests = metrics.blockedRequests + 1;

  return {
    ...metrics,
    totalRequests,
    blockedRequests,
    blockingEfficiency: (blockedRequests / totalRequests) * 100,
  };
}

export function recordErroredRequest(
  metrics: BlockingMetrics
): BlockingMetrics {
  return {
    ...metrics,
    totalRequests: metrics.totalRequests + 1,
    errorRequests: metrics.errorRequests + 1,
  };
}
