/**
 * Secure Authentication & Identity Service for TrustForge.
 * Implements PBKDF2 password hashing, HMAC-SHA256 session token generation and verification,
 * user registration, organization binding, and tenant-scoped session management.
 */
import crypto from 'node:crypto';
import { durableStore } from '../database/durableStore.js';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  org_id: string;
  org_name?: string;
  role: 'Owner' | 'Admin' | 'Compliance Officer' | 'Auditor' | 'Viewer' | 'Super Admin';
  password_hash: string;
  salt: string;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  orgId: string;
  orgName?: string;
  role: 'Owner' | 'Admin' | 'Compliance Officer' | 'Auditor' | 'Viewer' | 'Super Admin';
  name: string;
  iat: number;
  exp: number;
}

const AUTH_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'trustforge_session_secret_2026_dpdp_audit_secure_token';
const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export class AuthService {
  constructor() {
    this.seedDefaultUsersIfEmpty();
  }

  /**
   * Hashes a password using standard PBKDF2 with salt.
   */
  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  /**
   * Generates a random cryptographic salt.
   */
  public generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Signs a session payload using HMAC-SHA256.
   */
  public createToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: SessionPayload = {
      ...payload,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    };
    const payloadEncoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadEncoded)
      .digest('base64url');
    return `tf_tok_${payloadEncoded}.${signature}`;
  }

  /**
   * Verifies and extracts a session payload from a token.
   */
  public verifyToken(token: string): SessionPayload | null {
    if (!token || !token.startsWith('tf_tok_')) {
      return null;
    }

    const raw = token.slice(7);
    const parts = raw.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payloadEncoded, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadEncoded)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf-8')) as SessionPayload;
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expired token
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates user with email and password.
   */
  public login(email: string, password: string): { token: string; user: Omit<UserRecord, 'password_hash' | 'salt'> } {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const user = durableStore.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const computedHash = this.hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      throw new Error('Invalid email or password.');
    }

    const token = this.createToken({
      userId: user.id,
      email: user.email,
      orgId: user.org_id,
      orgName: user.org_name,
      role: user.role,
      name: user.name,
    });

    const { password_hash, salt, ...safeUser } = user;
    return { token, user: safeUser };
  }

  /**
   * Registers a new user and organization.
   */
  public signup(
    email: string,
    password: string,
    name: string,
    orgName?: string,
    role: UserRecord['role'] = 'Owner'
  ): { token: string; user: Omit<UserRecord, 'password_hash' | 'salt'> } {
    if (!email || !password || !name) {
      throw new Error('Name, email, and password are required.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const existing = durableStore.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = this.generateSalt();
    const password_hash = this.hashPassword(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: UserRecord = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      org_id: orgId,
      org_name: (orgName || `${name.trim()}'s Organization`).trim(),
      role,
      password_hash,
      salt,
      created_at: new Date().toISOString(),
    };

    durableStore.setUser(userId, newUser);

    const token = this.createToken({
      userId: newUser.id,
      email: newUser.email,
      orgId: newUser.org_id,
      orgName: newUser.org_name,
      role: newUser.role,
      name: newUser.name,
    });

    const { password_hash: _, salt: __, ...safeUser } = newUser;
    return { token, user: safeUser };
  }

  /**
   * Seeds default demo and test accounts into the durable store if not present.
   */
  public seedDefaultUsersIfEmpty(): void {
    const defaults = [
      {
        id: 'usr_rajesh',
        email: 'rajesh@technova.in',
        name: 'Rajesh Kumar',
        org_id: 'org_technova',
        org_name: 'TechNova Solutions Private Limited',
        role: 'Owner' as const,
        plainPassword: 'DemoPassword123!',
      },
      {
        id: 'usr_admin',
        email: 'admin@trustforge.in',
        name: 'Platform Administrator',
        org_id: 'org_default',
        org_name: 'TrustForge Platform Administration',
        role: 'Super Admin' as const,
        plainPassword: 'AdminSecret2026!',
      },
      {
        id: 'usr_competitor',
        email: 'compliance@competitor.com',
        name: 'Competitor Compliance Officer',
        org_id: 'org_competitor',
        org_name: 'Competitor Systems Inc',
        role: 'Owner' as const,
        plainPassword: 'CompetitorPass123!',
      },
      {
        id: 'usr_priya',
        email: 'priya@example.com',
        name: 'Priya Sharma',
        org_id: 'org_priya',
        org_name: 'Priya Personal Advisory',
        role: 'Owner' as const,
        plainPassword: 'PersonalPass123!',
      },
    ];

    for (const def of defaults) {
      if (!durableStore.getUser(def.id) && !durableStore.getUserByEmail(def.email)) {
        const salt = this.generateSalt();
        const hash = this.hashPassword(def.plainPassword, salt);
        durableStore.setUser(def.id, {
          id: def.id,
          email: def.email,
          name: def.name,
          org_id: def.org_id,
          org_name: def.org_name,
          role: def.role,
          password_hash: hash,
          salt,
          created_at: new Date().toISOString(),
        });
      }
    }
  }
}

export const authService = new AuthService();
