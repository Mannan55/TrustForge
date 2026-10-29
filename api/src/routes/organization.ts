/**
 * Organization Profile, Domain Challenge & DNS Verification Routes for TrustForge API.
 * Provides authentic, server-side cryptographic challenge generation, DNS TXT verification,
 * and tenant-scoped organization settings persistence.
 */
import { Router, Request, Response } from 'express';
import dns from 'node:dns';
import crypto from 'node:crypto';
import { requireAuth } from '../middleware/authMiddleware.js';
import { durableStore } from '../database/durableStore.js';

const router = Router();

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

function normalizeAndValidateDomain(rawDomain: any): { valid: boolean; domain: string; error?: string } {
  if (!rawDomain || typeof rawDomain !== 'string') {
    return { valid: false, domain: '', error: 'Domain must be a non-empty string.' };
  }
  const clean = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  if (!clean || clean.length > 253 || !DOMAIN_REGEX.test(clean)) {
    return {
      valid: false,
      domain: clean,
      error: `Invalid canonical domain format: '${rawDomain}'. Must be a valid DNS hostname (e.g., 'technova.in').`,
    };
  }
  return { valid: true, domain: clean };
}


/**
 * POST /api/organization/domain-challenge
 * Generates an expiring cryptographic TXT record challenge for the tenant's domain.
 */
router.post('/organization/domain-challenge', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  const validation = normalizeAndValidateDomain(domain);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error, code: 'INVALID_DOMAIN_FORMAT' });
    return;
  }

  const cleanDomain = validation.domain;
  const callerOrg = req.authContext!.orgId;

  const challengeHex = crypto.randomBytes(16).toString('hex');
  const recordValue = `trustforge-verification=${challengeHex}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const challengeData = {
    domain: cleanDomain,
    challenge: challengeHex,
    recordValue,
    orgId: callerOrg,
    expiresAt,
    verified: false,
    createdAt: new Date().toISOString(),
  };

  durableStore.setDomainChallenge(cleanDomain, challengeData, callerOrg);

  res.json({
    domain: cleanDomain,
    challengeRecord: recordValue,
    challengeExpiresAt: new Date(expiresAt).toISOString(),
    method: 'DNS TXT record',
    note: `Please create a TXT record for ${cleanDomain} with value: "${recordValue}". Record expires in 24 hours.`,
  });
});

/**
 * POST /api/organization/verify-domain
 * Performs authentic DNS TXT record resolution to verify domain representation authority.
 */
router.post('/organization/verify-domain', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  const validation = normalizeAndValidateDomain(domain);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error, code: 'INVALID_DOMAIN_FORMAT' });
    return;
  }

  const cleanDomain = validation.domain;
  const callerOrg = req.authContext!.orgId;

  const challenge = durableStore.getDomainChallenge(cleanDomain, callerOrg);
  if (!challenge) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: `No pending verification challenge found for domain '${cleanDomain}'. Please generate a challenge first.`,
      code: 'CHALLENGE_NOT_FOUND',
    });
    return;
  }

  // Check domain match
  if (challenge.domain !== cleanDomain) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: `Challenge domain mismatch: expected '${challenge.domain}', got '${cleanDomain}'.`,
      code: 'DOMAIN_MISMATCH',
    });
    return;
  }

  // Reject already verified / consumed challenges
  if (challenge.verified) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: 'The verification challenge for this domain has already been consumed. Please generate a new challenge.',
      code: 'CHALLENGE_ALREADY_USED',
    });
    return;
  }

  // Reject expired challenges
  if (Date.now() > challenge.expiresAt) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: 'The verification challenge for this domain has expired. Please generate a new challenge.',
      code: 'CHALLENGE_EXPIRED',
    });
    return;
  }

  // Check tenant ownership of the challenge
  if (challenge.orgId !== callerOrg && req.authContext!.role !== 'Super Admin') {
    res.status(403).json({
      verified: false,
      error: 'You are not authorized to verify this domain.',
      code: 'FORBIDDEN',
    });
    return;
  }

  try {
    const records = await dns.promises.resolveTxt(cleanDomain);
    const flattened = records.map(r => r.join(''));
    // Strict exact match only: reject substring matches
    const expectedValue = challenge.recordValue;
    // Only the complete, server-issued TXT record is valid. A bare challenge hex
    // string must never count as proof of domain control.
    const matched = flattened.some(rec => rec === expectedValue);

    if (matched) {
      challenge.verified = true;
      challenge.verifiedAt = new Date().toISOString();
      durableStore.setDomainChallenge(cleanDomain, challenge, callerOrg);

      // Update tenant organization
      const existingOrg = durableStore.getOrganization(callerOrg) || {};
      const updatedOrg = {
        ...existingOrg,
        primaryDomain: cleanDomain,
        domainVerified: true,
        authorizationVerified: true,
        verifiedAt: new Date().toISOString(),
      };
      durableStore.setOrganization(callerOrg, updatedOrg);

      res.json({
        verified: true,
        method: 'DNS TXT record',
        challengeRecord: challenge.recordValue,
        note: `Domain ownership and representation authority cryptographically verified via DNS TXT record for ${cleanDomain}.`,
      });
      return;
    }

    res.json({
      verified: false,
      method: 'DNS TXT record',
      challengeRecord: challenge.recordValue,
      challengeExpiresAt: new Date(challenge.expiresAt).toISOString(),
      note: `TXT record not found or does not match challenge. Current records do not contain "${challenge.recordValue}". Please allow DNS propagation and try again.`,
    });
  } catch (err: any) {
    // DNS resolution failure (e.g. NXDOMAIN, ENOTFOUND, NODATA)
    res.json({
      verified: false,
      method: 'DNS TXT record',
      challengeRecord: challenge.recordValue,
      challengeExpiresAt: new Date(challenge.expiresAt).toISOString(),
      note: `DNS resolution failed for ${cleanDomain} (${err.code || err.message}). Please verify that DNS records have propagated and try again.`,
    });
  }
});

/**
 * GET /api/organization
 * Returns the authenticated tenant's persisted organization profile.
 */
router.get('/organization', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const callerOrg = req.authContext!.orgId;
  const org = durableStore.getOrganization(callerOrg);

  if (!org) {
    // Sane initial state based on user session
    const user = durableStore.getUser(req.authContext!.userId);
    const initialOrg = {
      id: callerOrg,
      legalName: user?.org_name || 'My Organization',
      displayName: user?.org_name || 'My Organization',
      gstin: '',
      cin: '',
      primaryDomain: '',
      industry: 'Technology',
      companySize: '11-50 employees',
      registeredAddress: '',
      grievanceOfficer: user?.name || '',
      grievanceEmail: user?.email || '',
      domainVerified: false,
      authorizationVerified: false,
      gstinVerified: false,
      created_at: new Date().toISOString(),
    };
    durableStore.setOrganization(callerOrg, initialOrg);
    res.json(initialOrg);
    return;
  }

  res.json(org);
});

/**
 * PUT /api/organization
 * Updates and persists the tenant's organization profile.
 */
router.put('/organization', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const callerOrg = req.authContext!.orgId;
  const callerRole = req.authContext!.role;

  if (callerRole === 'Viewer') {
    res.status(403).json({ error: 'Viewers are not permitted to modify organization settings.', code: 'FORBIDDEN' });
    return;
  }

  const existingOrg = durableStore.getOrganization(callerOrg) || {
    id: callerOrg,
    created_at: new Date().toISOString(),
  };

  // Only editable profile fields may be persisted. Never allow clients to
  // assign scores, research results, verification timestamps or tenant IDs.
  // The onboarding form may still submit server-owned flags; ignore them.
  const requestBody = req.body;
  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    res.status(400).json({ error: 'Organization patch must be an object.', code: 'INVALID_ORGANIZATION_PATCH' });
    return;
  }
  const editableFields = [
    'legalName', 'displayName', 'cin', 'gstin', 'primaryDomain',
    'industry', 'companySize', 'registeredAddress',
    'grievanceOfficer', 'grievanceEmail',
  ] as const;
  const patch: Record<string, string> = {};
  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(requestBody, field)) {
      if (typeof requestBody[field] !== 'string') {
        res.status(400).json({ error: `Field '${field}' must be a string.`, code: 'INVALID_ORGANIZATION_FIELD' });
        return;
      }
      patch[field] = requestBody[field];
    }
  }

  const domainChanged = patch.primaryDomain !== undefined && patch.primaryDomain !== existingOrg.primaryDomain;
  if (domainChanged && existingOrg.primaryDomain) {
    durableStore.invalidateDomainChallenge(existingOrg.primaryDomain, callerOrg);
  }
  const gstinChanged = patch.gstin !== undefined && patch.gstin !== existingOrg.gstin;

  const updatedOrg = {
    ...existingOrg,
    ...patch,
    domainVerified: domainChanged ? false : (existingOrg.domainVerified ?? false),
    authorizationVerified: domainChanged ? false : (existingOrg.authorizationVerified ?? false),
    gstinVerified: gstinChanged ? false : (existingOrg.gstinVerified ?? false),
    updated_at: new Date().toISOString(),
  };

  durableStore.setOrganization(callerOrg, updatedOrg);
  res.json(updatedOrg);
});

export default router;
