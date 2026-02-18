import { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../types/index.js";

/**
 * Middleware to require users to have one of the specified roles
 * @param allowedRoles - Array of roles that are allowed
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!user.role || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware to require users to be the owner of a resource or have one of the specified roles
 * @param ownerIdField - The field in req.params that contains the owner user ID (e.g., "userId")
 * @param allowedRoles - Array of roles that bypass the ownership check
 */
export const requireOwnerOrRole = (ownerIdField: string, ...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const ownerId = parseInt(req.params[ownerIdField], 10);
    const isOwner = !isNaN(ownerId) && ownerId === user.id;
    const hasRole = user.role && allowedRoles.includes(user.role);

    if (!isOwner && !hasRole) {
      return res.status(403).json({
        error: "Insufficient permissions",
        message: "You must be the owner of this resource or have one of the required roles",
      });
    }

    next();
  };
};
