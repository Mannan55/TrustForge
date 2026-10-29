/**
 * Multi-Tenant Authentication & Server-Side Authorization Middleware.
 * Enforces strict tenant isolation, prevents IDOR vulnerabilities,
 * and eliminates reliance on client-supplied organization identifiers.
 */
import { Request, Response, NextFunction } from 'express';
import { db } from '../database/supabaseClient.js';
import { authService } from '../services/authService.js';
import { durableStore } from '../database/durableStore.js';

export interface AuthContext {
  userId: string;
  email: string;
  orgId: string;
  role: 'Owner' | 'Admin' | 'Compliance Officer' | 'Auditor' | 'Viewer' | 'Super Admin';
  isAuthenticated: boolean;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];

  // 1. Explicit Anonymous Caller Header
  if (req.headers['x-anonymous'] === 'true' || authHeader === 'Bearer anonymous' || authHeader === 'Bearer anon') {
    req.authContext = {
      userId: 'anonymous_user',
      email: '',
      orgId: '',
      role: 'Viewer',
      isAuthenticated: false,
    };
    return next();
  }

  // 2. Reject unauthenticated header spoofing (P0-1 fix):
  // Plain x-org-id / x-user-role headers without cryptographically verified session token MUST NOT grant authenticated access.

  // 3. Bearer Token Resolution
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();

    // Check signed HMAC-SHA256 session token
    const session = authService.verifyToken(token);
    if (session) {
      // Dynamic role & organization verification from durable store
      const liveUser = durableStore.getUser(session.userId);
      if (liveUser && (liveUser as any).is_disabled) {
        res.status(401).json({ error: 'User account has been disabled.', code: 'UNAUTHORIZED' });
        return;
      }
      const effectiveRole = liveUser ? liveUser.role : session.role;
      const effectiveOrg = liveUser ? liveUser.org_id : session.orgId;
      req.authContext = {
        userId: session.userId,
        email: liveUser?.email || session.email,
        orgId: effectiveOrg,
        role: effectiveRole,
        isAuthenticated: true,
      };
      return next();
    }

    // Try validating with Supabase Auth if client is active
    const client = db.getClient();
    if (client) {
      try {
        const { data, error } = await client.auth.getUser(token);
        if (!error && data?.user) {
          const email = data.user.email || '';
          const { data: memberData } = await client
            .from('organisation_memberships')
            .select('organisation_id, role')
            .eq('user_id', data.user.id)
            .maybeSingle();

                    if (!memberData || !memberData.organisation_id) {
            // P0-4 FIX: Reject authenticated status if user has no active organization membership
            // Zero fallback to another tenant or elevated privileges
            req.authContext = {
              userId: data.user.id,
              email,
              orgId: '',
              role: 'Viewer',
              isAuthenticated: false,
            };
            return next();
          }

          req.authContext = {
            userId: data.user.id,
            email,
            orgId: memberData.organisation_id,
            role: memberData.role || 'Viewer',
            isAuthenticated: true,
          };
          return next();
        }
      } catch {
        // Fall through to unverified
      }
    }

    // If a bearer token was provided but failed verification:
    req.authContext = {
      userId: 'unverified_user',
      email: '',
      orgId: '',
      role: 'Viewer',
      isAuthenticated: false,
    };
    return next();
  }

  // 4. Default: Unauthenticated Visitor / Anonymous
  // Eliminates P0-1 automatic demo identity assumption
  req.authContext = {
    userId: 'anonymous_user',
    email: '',
    orgId: '',
    role: 'Viewer',
    isAuthenticated: false,
  };
  return next();
}

/**
 * Guard: Requires an authenticated user session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authContext || !req.authContext.isAuthenticated || !req.authContext.orgId) {
    res.status(401).json({
      error: 'Authentication required. Valid tenant session or bearer token required.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

/**
 * Helper: Validates that the caller has permission to access the requested organization resource.
 * Prevents IDOR (Insecure Direct Object Reference) vulnerabilities.
 */
export function validateTenantAccess(resourceOrgId: string | undefined | null, req: Request, res: Response): boolean {
  const caller = req.authContext;

  // Unauthenticated / anonymous
  if (!caller || !caller.isAuthenticated || !caller.orgId) {
    res.status(401).json({
      error: 'Authentication required to access private organisation records.',
      code: 'UNAUTHORIZED',
    });
    return false;
  }

  // Super Admin can access all tenants
  if (caller.role === 'Super Admin') {
    return true;
  }

  // Missing resource orgId on a private record or cross-tenant mismatch
  if (!resourceOrgId || resourceOrgId !== caller.orgId) {
    res.status(403).json({
      error: 'Access denied: Cross-organisation access violation. You do not have permission to access records belonging to another organisation.',
      code: 'CROSS_ORGANISATION_ACCESS_DENIED',
      caller_organisation: caller.orgId,
      requested_organisation: resourceOrgId || 'unknown',
    });
    return false;
  }

  return true;
}
