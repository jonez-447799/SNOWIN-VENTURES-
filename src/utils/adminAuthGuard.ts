/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Timing-Safe Admin Key Guard & Pre-Publish Production Readiness Engine (Phase 8).
 * Uses SHA-256 hashing + crypto.timingSafeEqual for constant-time admin key verification.
 */

import crypto from 'crypto';

export const DEFAULT_DEV_ADMIN_KEY = 'operationalyst-local-dev-key';

export interface AdminKeyVerificationResult {
  authenticated: boolean;
  authorized: boolean;
  isDefaultDevKey: boolean;
  customAdminKeyConfigured: boolean;
}

/**
 * Constant-time comparison between two strings by hashing both with SHA-256
 * (producing fixed 32-byte Buffers) and calling crypto.timingSafeEqual.
 */
export function constantTimeSha256Equal(expected: string, provided: string): boolean {
  const expectedBuf = crypto.createHash('sha256').update(expected, 'utf8').digest();
  const providedBuf = crypto.createHash('sha256').update(provided, 'utf8').digest();
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Verifies a provided admin key in constant time using crypto.createHash('sha256')
 * and crypto.timingSafeEqual(expectedBuf, providedBuf).
 * Preserves backward compatibility with operationalyst-local-dev-key in local/preview mode.
 */
export function verifyAdminKey(
  providedKey: unknown,
  options?: {
    configuredEnvKey?: string;
    nodeEnv?: string;
  }
): AdminKeyVerificationResult {
  const envKeyRaw =
    options?.configuredEnvKey !== undefined
      ? options.configuredEnvKey
      : process.env.ADMIN_ACCESS_KEY;
  const customKey = typeof envKeyRaw === 'string' ? envKeyRaw.trim() : '';
  const customAdminKeyConfigured = customKey.length > 0;
  const expectedKey = customAdminKeyConfigured ? customKey : DEFAULT_DEV_ADMIN_KEY;

  if (typeof providedKey !== 'string') {
    return {
      authenticated: false,
      authorized: false,
      isDefaultDevKey: !customAdminKeyConfigured,
      customAdminKeyConfigured,
    };
  }

  const trimmedProvided = providedKey.trim();
  if (trimmedProvided.length === 0) {
    return {
      authenticated: false,
      authorized: false,
      isDefaultDevKey: !customAdminKeyConfigured,
      customAdminKeyConfigured,
    };
  }

  const matchesExpected = constantTimeSha256Equal(expectedKey, trimmedProvided);
  const matchesDevFallback =
    (options?.nodeEnv ?? process.env.NODE_ENV) !== 'production' &&
    constantTimeSha256Equal(DEFAULT_DEV_ADMIN_KEY, trimmedProvided);

  const authenticated = matchesExpected || matchesDevFallback;
  const isDefaultDevKey = !customAdminKeyConfigured || matchesDevFallback;

  return {
    authenticated,
    authorized: authenticated,
    isDefaultDevKey,
    customAdminKeyConfigured,
  };
}
