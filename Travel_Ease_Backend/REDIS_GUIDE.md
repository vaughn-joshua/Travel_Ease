# Redis Integration Guide

This document covers the Redis caching and rate limiting features in the TravelEase backend.

## Overview

Redis is used for:
1. **API Response Caching** - Cache expensive database queries for faster response times
2. **Rate Limiting** - Prevent abuse of login and registration endpoints
3. **Distributed State** - Share cache across multiple backend instances (if scaled)

The system is designed to **gracefully degrade** - if Redis is unavailable, the app falls back to in-memory caching and rate limiting.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Enable/disable Redis (auto-enabled if REDIS_URL or REDIS_HOST is set)
REDIS_ENABLED=true

# Option 1: Full connection URL (recommended for production)
REDIS_URL=redis://localhost:6379/0

# Option 2: Individual parameters (alternative to REDIS_URL)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your-password
# REDIS_DB=0
```

### Docker Setup

The `deploy/docker-compose.nginx.yml` includes a Redis service. To start:

```bash
docker compose -f deploy/docker-compose.nginx.yml up -d
```

### Local Development

For local development, you can run Redis via Docker:

```bash
# Start Redis
docker run -d --name travelease-redis -p 6379:6379 redis:7-alpine

# Or disable Redis entirely
REDIS_ENABLED=false npm run dev
```

## Cached Endpoints

The following endpoints use Redis caching:

| Endpoint | Cache Key Pattern | TTL | Description |
|----------|------------------|-----|-------------|
| `GET /api/blogs/overview` | `blogs:overview` | 60s | Blog homepage data |
| `GET /api/blogs/featured` | `blogs:featured` | 120s | Featured blog posts |
| `GET /api/business/travel_spots` | `business:travel_spots:<params>` | 60s | Travel spots listing |
| `GET /api/travel_plan/public_plans` | `travel_plans:public:<params>` | 30s | Public travel plans |

### Cache Headers

All cached endpoints return an `X-Cache` header:
- `X-Cache: HIT:redis` - Served from Redis cache
- `X-Cache: HIT:memory` - Served from in-memory cache (fallback)
- `X-Cache: MISS` - Fresh data from database

## Rate Limited Endpoints

| Endpoint | Limit | Window | Description |
|----------|-------|--------|-------------|
| `POST /api/user/login` | 5 requests | 60 seconds | Prevent brute force attacks |
| `POST /api/user/register` | 3 requests | 1 hour | Prevent spam registrations |

### Rate Limit Headers

Rate limited endpoints return these headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds to wait (only when limit exceeded)

## Testing Checklist

### 1. Connectivity Test

**Verify Redis connection:**

```bash
# Start the backend and check logs
npm run dev

# Expected log output (with Redis):
# [Redis] Connected successfully
# [Redis] Ready to accept commands

# Expected log output (without Redis):
# [Redis] Disabled via configuration...
# OR
# [Redis] No connection configuration found...
```

**Check health endpoint:**

```bash
curl http://localhost:3001/api/health
```

### 2. Cache Behavior Test

**Test cache miss (first request):**

```bash
# First request - should be cache miss
curl -i http://localhost:3001/api/blogs/overview

# Look for: X-Cache: MISS
# Response should include: "fromCache": false
```

**Test cache hit (second request):**

```bash
# Second request within TTL - should be cache hit
curl -i http://localhost:3001/api/blogs/overview

# Look for: X-Cache: HIT:redis (or HIT:memory if Redis unavailable)
# Response should include: "fromCache": true
```

**Test cache expiration:**

```bash
# Wait for TTL to expire (60 seconds for blogs/overview)
sleep 65

# Request should be cache miss again
curl -i http://localhost:3001/api/blogs/overview
# Look for: X-Cache: MISS
```

### 3. Fallback Behavior Test

**Test graceful degradation:**

```bash
# Stop Redis
docker stop travelease-redis

# Request should still work (using in-memory cache)
curl -i http://localhost:3001/api/blogs/overview

# Look for: X-Cache: MISS (first request)
# Then: X-Cache: HIT:memory (subsequent requests)

# Check logs for warning:
# [Redis] Connection error: ...

# Restart Redis
docker start travelease-redis
```

### 4. Rate Limiting Test

**Test login rate limiting:**

```bash
# Make 5 login attempts (should succeed)
for i in {1..5}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3001/api/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 6th attempt should return 429
curl -i -X POST http://localhost:3001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Expected response:
# HTTP/1.1 429 Too Many Requests
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 0
# Retry-After: XX
# {"error":"Too Many Requests","message":"Too many login attempts...","retryAfter":XX}
```

**Test registration rate limiting:**

```bash
# Similar test but with 3 requests per hour limit
# (Not practical to test full window, just verify headers are present)
curl -i -X POST http://localhost:3001/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","first_name":"Test","last_name":"User"}'

# Check for rate limit headers in response
```

### 5. Cache Invalidation Test

**Test cache invalidation on write:**

```bash
# 1. Get cached blogs
curl http://localhost:3001/api/blogs/overview

# 2. Create a new blog (requires auth token)
curl -X POST http://localhost:3001/api/blogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","excerpt":"Test","content":"Test","coverImageUrl":"http://example.com/img.jpg","category":"Tips","readingMinutes":5,"author":"Test"}'

# 3. Get blogs again - should be fresh (cache invalidated)
curl -i http://localhost:3001/api/blogs/overview
# Look for: X-Cache: MISS
```

## Using Redis CLI

Connect to Redis for debugging:

```bash
# Connect to local Redis
redis-cli

# Or via Docker
docker exec -it travelease-redis redis-cli

# Useful commands:
KEYS *                    # List all keys
KEYS blogs:*              # List blog cache keys
GET blogs:overview        # Get cached value
TTL blogs:overview        # Check remaining TTL
DEL blogs:overview        # Delete specific key
FLUSHDB                   # Clear all keys (use with caution)
```

## Programmatic Cache Control

### Clear specific cache:

```typescript
import { invalidateCache } from './src/lib/cache.js';

// Clear single key
await invalidateCache('blogs:overview');
```

### Clear cache by pattern:

```typescript
import { invalidateCachePattern } from './src/lib/cache.js';

// Clear all blog caches
await invalidateCachePattern('blogs:');

// Clear all business caches
await invalidateCachePattern('business:');

// Clear all travel plan caches
await invalidateCachePattern('travel_plans:');
```

### Force refresh (bypass cache):

```typescript
import { cacheResult, buildCacheKey } from './src/lib/cache.js';

const { data } = await cacheResult({
  key: buildCacheKey('blogs', 'overview'),
  ttl: 60,
  forceRefresh: true,  // Skip cache read, still writes to cache
  fetchFn: () => fetchFromDB()
});
```

## Monitoring

### Check cache stats:

```typescript
import { getCacheStats } from './src/lib/cache.js';

const stats = getCacheStats();
console.log(stats);
// { memory: { size: 42, maxSize: 1000 }, redisAvailable: true }
```

### Check Redis status:

```typescript
import { getRedisStatus, isRedisAvailable } from './src/lib/redisClient.js';

console.log('Redis available:', isRedisAvailable());
console.log('Redis status:', getRedisStatus()); // 'connected', 'connecting', 'error', 'disconnected'
```

## Troubleshooting

### Redis won't connect

1. Check if Redis is running: `docker ps | grep redis`
2. Check connection string: Ensure `REDIS_URL` or `REDIS_HOST` is correct
3. Check firewall: Ensure port 6379 is accessible
4. Check logs: Look for `[Redis] Connection error:` messages

### Cache not working

1. Check `REDIS_ENABLED` is `true` (or not set to `false`)
2. Check `X-Cache` header in responses
3. Check Redis CLI: `KEYS *` to see if keys are being created
4. Check TTL: `TTL <key>` to see if keys are expiring correctly

### Rate limiting not working

1. Check if requests are from different IPs (rate limiting is per-IP)
2. Check Redis connection (fallback to in-memory works per-process only)
3. Check rate limit headers in response

## Performance Tuning

### Cache TTL Guidelines

- **Frequently changing data** (public plans): 30 seconds
- **Moderately changing data** (blog overview): 60 seconds
- **Rarely changing data** (categories): 5 minutes
- **Static data** (config): 1 hour or more

### Redis Memory

The Docker setup limits Redis to 128MB with LRU eviction:

```
--maxmemory 128mb --maxmemory-policy allkeys-lru
```

Adjust in `docker-compose.nginx.yml` if needed.

### In-Memory Cache

The in-memory fallback cache is limited to 1000 entries with LRU eviction. Adjust in `src/lib/cache.ts` if needed.

