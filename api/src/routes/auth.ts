/**
 * Authentication and User Session Routes for TrustForge API.
 * Provides cryptographically verified login, signup, session inspection, and logout.
 */
import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticates user credentials and issues a signed session token.
 */
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.', code: 'INVALID_CREDENTIALS' });
    return;
  }

  try {
    const result = authService.login(email, password);
    res.json({
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        orgId: result.user.org_id,
        orgName: result.user.org_name,
        role: result.user.role,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    res.status(401).json({ error: msg, code: 'AUTH_FAILED' });
  }
});

/**
 * POST /api/auth/signup
 * Registers a new organization owner or auditor with server-verified credentials.
 */
router.post('/auth/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, orgName } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Name, email, and password are required.', code: 'MISSING_FIELDS' });
    return;
  }

  try {
    const result = authService.signup(email, password, name, orgName, 'Owner');
    res.status(201).json({
      token: result.token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        orgId: result.user.org_id,
        orgName: result.user.org_name,
        role: result.user.role,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ error: msg, code: 'SIGNUP_FAILED' });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated session user and tenant profile.
 */
router.get('/auth/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const caller = req.authContext!;
  res.json({
    user: {
      id: caller.userId,
      email: caller.email,
      orgId: caller.orgId,
      role: caller.role,
    },
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/auth/logout', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    authService.revokeToken(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
