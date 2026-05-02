import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { ApplicationError } from '../../application/errors/application-error';

export async function assertSafeRemoteImageUrl(url: URL): Promise<void> {
  if (url.protocol !== 'https:') {
    throw new ApplicationError(
      'REMOTE_IMAGE_PROTOCOL_BLOCKED',
      'Remote images must use HTTPS.',
      { url: url.toString() },
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new ApplicationError(
      'REMOTE_IMAGE_HOST_BLOCKED',
      'Remote image host is not allowed.',
      { hostname },
    );
  }

  if (isIP(hostname)) {
    assertPublicIpAddress(hostname);
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  for (const address of addresses) {
    assertPublicIpAddress(address.address);
  }
}

export function assertPublicIpAddress(address: string): void {
  if (isPrivateOrReservedIp(address)) {
    throw new ApplicationError(
      'REMOTE_IMAGE_NETWORK_BLOCKED',
      'Remote image resolves to a private or reserved network.',
      { address },
    );
  }
}

export function isPrivateOrReservedIp(address: string): boolean {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80') ||
      normalized.startsWith('::ffff:127.') ||
      normalized.startsWith('::ffff:10.') ||
      normalized.startsWith('::ffff:192.168.') ||
      normalized === '169.254.169.254'
    );
  }

  const octets = address.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return true;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19))
  );
}
