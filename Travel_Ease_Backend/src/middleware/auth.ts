import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { prisma, executeWithRetry } from '../lib/prismaHelpers.js';

// Test mode uses local JWT for testing without Supabase
const isTestMode = process.env.NODE_ENV === 'test';
const JWT_SECRET = process.env.JWT_SECRET;

interface JwtPayload {
  id: number;
  email?: string;
}

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const expectedApiKey = process.env.API_KEY;
  if (!expectedApiKey) {
    return res.status(500).json({
      error: 'API key not configured'
    });
  }
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: 'Invalid or missing API key'
    });
  }
  next();
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Test mode: use local JWT verification
    if (isTestMode && JWT_SECRET) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      const user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { user_id: decoded.id }
        })
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user = { 
        id: user.user_id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      };
      return next();
    }

    // Production: require Supabase configuration
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ 
        error: 'Authentication service unavailable',
        details: 'Supabase is not configured.'
      });
    }

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin!.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Find or create linked user profile
    let user = await executeWithRetry(() =>
      prisma.user.findFirst({ where: { auth_id: data.user.id } })
    );

    if (!user) {
      const meta = data.user.user_metadata || {};
      const email = data.user.email;
      const fallbackName = email ? email.split('@')[0] : 'User';

      const first_name =
        meta.first_name ||
        meta.firstName ||
        meta.given_name ||
        fallbackName ||
        'User';
      const last_name = meta.last_name || meta.lastName || meta.family_name || '';
      const contact_no = meta.contact_no || meta.phone || meta.phone_number || null;

      try {
        user = await executeWithRetry(() =>
          prisma.user.create({
            data: {
              auth_id: data.user.id,
              email: email || '',
              first_name,
              last_name: last_name || 'User',
              contact_no
            }
          })
        );
      } catch (createError: unknown) {
        // Handle race condition where another request created the user
        const prismaError = createError as { code?: string };
        if (prismaError.code === 'P2002') {
          user = await executeWithRetry(() =>
            prisma.user.findFirst({ where: { auth_id: data.user.id } })
          );
        } else {
          throw createError;
        }
      }
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to create or find user' });
    }

    req.user = { 
      id: user.user_id, 
      auth_id: data.user.id, 
      email: data.user.email || '',
      first_name: user.first_name,
      last_name: user.last_name
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

