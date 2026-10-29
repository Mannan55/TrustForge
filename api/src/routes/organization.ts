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

/**
 * POST /api/organization/domain-challenge
 * Generates an expiring cryptographic TXT record challenge for the tenant's domain.
 */
router.post('/organization/domain-challenge', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    res.status(400).json({ error: 'Valid domain name is required.', code: 'INVALID_DOMAIN' });
    return;
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
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

  durableStore.setDomainChallenge(cleanDomain, challengeData);

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
  if (!domain || typeof domain !== 'string') {
    res.status(400).json({ error: 'Valid domain name is required.', code: 'INVALID_DOMAIN' });
    return;
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const callerOrg = req.authContext!.orgId;

  const challenge = durableStore.getDomainChallenge(cleanDomain);
  if (!challenge) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: `No pending verification challenge found for domain '${cleanDomain}'. Please generate a challenge first.`,
    });
    return;
  }

  if (Date.now() > challenge.expiresAt) {
    res.status(400).json({
      verified: false,
      method: 'DNS TXT record',
      note: 'The verification challenge for this domain has expired. Please generate a new challenge.',
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
    const matched = flattened.some(rec => rec.includes(challenge.challenge) || rec.includes(challenge.recordValue));

    if (matched) {
      challenge.verified = true;
      challenge.verifiedAt = new Date().toISOString();
      durableStore.setDomainChallenge(cleanDomain, challenge);

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

  const patch = req.body;
  // Prevent tampering with verification status directly through update payload
  delete patch.domainVerified;
  delete patch.authorizationVerified;
  delete patch.id;

  const updatedOrg = {
    ...existingOrg,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  durableStore.setOrganization(callerOrg, updatedOrg);
  res.json(updatedOrg);
});

export default router;
