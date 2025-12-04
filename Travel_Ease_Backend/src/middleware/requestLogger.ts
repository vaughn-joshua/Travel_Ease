/**
 * Request Logger Middleware
 *
 * Logs HTTP requests with structured logging via Pino.
 * Captures method, path, status code, duration, and optional user context.
 *
 * Usage:
 *   import { requestLogger } from './middleware/requestLogger.js';
 *   app.use(requestLogger);
 */

import { Request, Response, NextFunction } from "express";
import { httpLogger } from "../lib/logger.js";
import { randomUUID } from "crypto";

// Slow request threshold in milliseconds
const SLOW_REQUEST_THRESHOLD = 1000;

/**
 * Request logging middleware with structured Pino logging
 * 
 * Logs:
 * - method: HTTP method (GET, POST, etc.)
 * - path: Request URL path
 * - status: HTTP status code
 * - duration: Response time in ms
 * - userId: Authenticated user ID (if available)
 * - requestId: Unique request identifier for tracing
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const requestId = randomUUID().slice(0, 8); // Short request ID
  const { method, originalUrl } = req;

  // Attach request ID to request object for downstream use
  (req as any).requestId = requestId;

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userId = req.user?.id;

    const logData = {
      requestId,
      method,
      path: originalUrl,
      status,
      duration,
      userId,
    };

    // Choose log level based on status code and duration
    if (status >= 500) {
      httpLogger.error(logData, "Request error");
    } else if (status >= 400) {
      httpLogger.warn(logData, "Request warning");
    } else if (duration > SLOW_REQUEST_THRESHOLD) {
      httpLogger.warn({ ...logData, slow: true }, "Slow request");
    } else {
      httpLogger.info(logData, "Request completed");
    }
  });

  next();
}

/**
 * Minimal request logger for high-traffic endpoints
 * Only logs errors and slow requests
 */
export function minimalRequestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Only log errors or slow requests
    if (status >= 500 || duration > SLOW_REQUEST_THRESHOLD) {
      httpLogger.warn({
        method: req.method,
        path: req.originalUrl,
        status,
        duration,
        userId: req.user?.id,
      }, status >= 500 ? "Request error" : "Slow request");
    }
  });

  next();
}

/**
 * Debug-level request logger (use for development)
 * Includes request body and headers in logs
 */
export function debugRequestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const requestId = randomUUID().slice(0, 8);
  
  // Log incoming request with body (sanitized)
  httpLogger.debug({
    requestId,
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    body: sanitizeBody(req.body),
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
    },
  }, "Incoming request");

  res.on("finish", () => {
    const duration = Date.now() - start;
    httpLogger.debug({
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration,
    }, "Request completed");
  });

  next();
}

/**
 * Sanitize request body for logging (remove sensitive fields)
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export default requestLogger;
