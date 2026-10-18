/**
 * SSRF and Network Security Guard for TrustForge Crawler.
 * Ensures the Playwright crawler only accesses public, safe HTTP/HTTPS destinations.
 */
import dns from 'node:dns/promises';
import { URL } from 'node:url';

interface ValidationResult {
  isValid: boolean;
  resolvedIp?: string;
  normalizedUrl?: string;
  error?: string;
}

// Private & reserved IPv4 blocks
const BLOCKED_IPV4_PREFIXES = [
  '0.',          // Current network (RFC 1122)
  '10.',         // Private RFC 1918
  '127.',        // Loopback RFC 1122
  '169.254.',    // Link-local / Cloud metadata RFC 3927
  '192.168.',    // Private RFC 1918
  '224.',        // Multicast
  '240.',        // Reserved
  '255.255.255.255',
];

function isBlockedIp(ip: string): boolean {
  // Check exact/prefix match for IPv4
  for (const prefix of BLOCKED_IPV4_PREFIXES) {
    if (ip.startsWith(prefix)) return true;
  }

  // 172.16.0.0/12
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }
  }

  // 100.64.0.0/10 Carrier-grade NAT
  if (ip.startsWith('100.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const secondOctet = parseInt(parts[1], 10);
      if (secondOctet >= 64 && secondOctet <= 127) return true;
    }
  }

  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd') || ip.toLowerCase().startsWith('fe80')) {
    return true;
  }

  return false;
}

export async function validateTargetUrl(rawUrl: string): Promise<ValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    let clean = rawUrl.trim();
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    parsed = new URL(clean);
  } catch {
    return { isValid: false, error: 'Malformed URL format.' };
  }

  // Only http and https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: `Unsupported protocol '${parsed.protocol}'. Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and cloud metadata domain names directly
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    return { isValid: false, error: `Access to internal host '${hostname}' is prohibited.` };
  }

  // Resolve DNS to verify IP
  try {
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { isValid: false, error: `Could not resolve hostname '${hostname}'.` };
    }

    for (const entry of lookup) {
      if (isBlockedIp(entry.address)) {
        return {
          isValid: false,
          resolvedIp: entry.address,
          error: `Host '${hostname}' resolves to blocked private/reserved IP: ${entry.address}`,
        };
      }
    }

    return {
      isValid: true,
      resolvedIp: lookup[0].address,
      normalizedUrl: parsed.toString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: `DNS resolution failed for '${hostname}': ${msg}` };
  }
}
